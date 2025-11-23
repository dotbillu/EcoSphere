import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
require("dotenv").config();

const prisma = new PrismaClient();
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.WS_PORT || 8000;

const senderSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
  isOnline: true,
  lastSeen: true,
};

const reactionSelect = {
  id: true,
  emoji: true,
  user: { select: senderSelect },
};

const messageInclude = {
  sender: { select: senderSelect },
  reactions: { select: reactionSelect },
};

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

io.on("connection", (socket: AuthenticatedSocket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("authenticate", async (userId: string) => {
    try {
      if (!userId) return;
      socket.userId = userId;
      socket.join(userId);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
        select: senderSelect,
      });

      const userRooms = await prisma.mapRoom.findMany({
        where: { members: { some: { id: userId } } },
        select: { id: true },
      });
      userRooms.forEach((room: any) => {
        socket.to(room.id).emit("user:status", user);
      });

      console.log(`User ${userId} authenticated and set as online`);
    } catch (err: any) {
      console.error("Authentication error:", err);
    }
  });

  socket.on("join:rooms", (roomIds: string[]) => {
    console.log(`User ${socket.id} joining rooms:`, roomIds);
    roomIds.forEach((id: string) => socket.join(id));
  });

  socket.on(
    "dm:send",
    async (data: {
      senderId: string;
      recipientId: string;
      content: string;
      tempId: string;
    }) => {
      try {
        const msg = await prisma.directMessage.create({
          data: {
            senderId: data.senderId,
            recipientId: data.recipientId,
            content: data.content,
          },
          include: messageInclude,
        });

        socket.emit("dm:confirm", { tempId: data.tempId, message: msg });
        socket.to(data.recipientId).emit("dm:receive", msg);
      } catch (err: any) {
        console.error("Error sending DM:", err);
      }
    },
  );

  socket.on(
    "group:send",
    async (data: {
      senderId: string;
      roomId: string;
      content: string;
      tempId: string;
    }) => {
      try {
        const msg = await prisma.groupMessage.create({
          data: {
            senderId: data.senderId,
            roomId: data.roomId,
            content: data.content,
          },
          include: messageInclude,
        });

        io.to(data.roomId).emit("group:receive", {
          tempId: data.tempId,
          message: msg,
        });
      } catch (err: any) {
        console.error("Error sending group message:", err);
      }
    },
  );

  socket.on(
    "reaction:toggle",
    async (data: {
      userId: string;
      emoji: string;
      groupMessageId?: string;
      directMessageId?: string;
    }) => {
      try {
        const { userId, emoji, groupMessageId, directMessageId } = data;

        const existing = await prisma.reaction.findFirst({
          where: {
            userId: userId,
            emoji,
            groupMessageId: groupMessageId ? groupMessageId : undefined,
            directMessageId: directMessageId ? directMessageId : undefined,
          },
        });

        let savedReaction: any;
        let action: "added" | "removed" = "added";
        let messageId: string;
        let conversationId: string | undefined;

        if (existing) {
          await prisma.reaction.delete({ where: { id: existing.id } });
          action = "removed";
          savedReaction = existing;
          messageId = (groupMessageId || directMessageId)!;
        } else {
          savedReaction = await prisma.reaction.create({
            data: {
              userId: userId,
              emoji,
              groupMessageId: groupMessageId ? groupMessageId : undefined,
              directMessageId: directMessageId ? directMessageId : undefined,
            },
            select: reactionSelect,
          });
          action = "added";
          messageId = (groupMessageId || directMessageId)!;
        }

        if (groupMessageId) {
          const msg = await prisma.groupMessage.findUnique({
            where: { id: groupMessageId },
          });
          if (msg) conversationId = msg.roomId;
        } else {
          const msg = await prisma.directMessage.findUnique({
            where: { id: directMessageId },
          });
          if (msg) {
            io.to(msg.senderId).emit("reaction:update", {
              action,
              reaction: savedReaction,
              messageId,
            });
            io.to(msg.recipientId).emit("reaction:update", {
              action,
              reaction: savedReaction,
              messageId,
            });
            return;
          }
        }

        if (conversationId) {
          io.to(conversationId).emit("reaction:update", {
            action,
            reaction: savedReaction,
            messageId,
          });
        }
      } catch (err: any) {
        console.error("Error toggling reaction:", err);
      }
    },
  );

  socket.on(
    "message:delete",
    async (data: {
      userId: string;
      messageId: string;
      messageType: "dm" | "group";
    }) => {
      try {
        const { userId, messageId, messageType } = data;
        let conversationId: string;
        let recipientId: string | null = null;

        if (messageType === "dm") {
          const msg = await prisma.directMessage.findUnique({
            where: { id: messageId },
          });
          if (!msg || msg.senderId !== userId) return;

          await prisma.directMessage.delete({ where: { id: msg.id } });
          conversationId = msg.senderId;
          recipientId = msg.recipientId;
        } else {
          const msg = await prisma.groupMessage.findUnique({
            where: { id: messageId },
          });
          if (!msg || msg.senderId !== userId) return;

          await prisma.groupMessage.delete({ where: { id: msg.id } });
          conversationId = msg.roomId;
        }

        io.to(conversationId).emit("message:deleted", messageId);
        if (recipientId) {
          io.to(recipientId).emit("message:deleted", messageId);
        }
      } catch (err: any) {
        console.error("Error deleting message:", err);
      }
    },
  );

  socket.on(
    "typing:start",
    (data: {
      conversationId: string;
      isGroup: boolean;
      senderName: string;
    }) => {
      if (data.isGroup) {
        socket.to(data.conversationId).emit("user:typing", {
          conversationId: data.conversationId,
          name: data.senderName,
        });
      } else {
        socket.to(data.conversationId).emit("user:typing", {
          conversationId: socket.userId,
          name: data.senderName,
        });
      }
    },
  );

  socket.on(
    "typing:stop",
    (data: { conversationId: string; isGroup: boolean }) => {
      if (data.isGroup) {
        socket
          .to(data.conversationId)
          .emit("user:stopped-typing", { conversationId: data.conversationId });
      } else {
        socket
          .to(data.conversationId)
          .emit("user:stopped-typing", { conversationId: socket.userId });
      }
    },
  );

  socket.on("disconnect", async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.userId) {
      try {
        const user = await prisma.user.update({
          where: { id: socket.userId },
          data: { isOnline: false, lastSeen: new Date() },
          select: senderSelect,
        });

        const userRooms = await prisma.mapRoom.findMany({
          where: { members: { some: { id: socket.userId } } },
          select: { id: true },
        });

        userRooms.forEach((room: any) => {
          socket.to(room.id).emit("user:status", user);
        });
        console.log(`User ${socket.userId} set as offline`);
      } catch (err: any) {
        console.error("Error on disconnect:", err);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`WS server running on http://localhost:${PORT}`);
});
