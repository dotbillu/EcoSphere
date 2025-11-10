import { Router } from "express";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

const reactionSelect = {
  id: true,
  emoji: true,
  user: {
    select: { id: true, username: true, name: true, image: true },
  },
};

const senderSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
};

// --- GET Group Messages for a Room (Paginated) ---
router.get("/room/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 30;

  try {
    const rId = parseInt(roomId);
    if (isNaN(rId)) {
      return res.status(400).json({ message: "Invalid Room ID" });
    }

    const messages = await prisma.groupMessage.findMany({
      where: { roomId: rId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        sender: { select: senderSelect },
        reactions: { select: reactionSelect },
      },
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error("Error fetching group messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- POST a new Group Message ---
router.post("/room/:roomId/message", async (req, res) => {
  const { roomId } = req.params;
  const { senderId, content } = req.body;

  if (!senderId || !content) {
    return res
      .status(400)
      .json({ message: "senderId and content are required" });
  }

  try {
    const rId = parseInt(roomId);
    const sId = parseInt(senderId);
    if (isNaN(rId) || isNaN(sId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const newMessage = await prisma.groupMessage.create({
      data: {
        content,
        roomId: rId,
        senderId: sId,
      },
      include: {
        sender: { select: senderSelect },
        reactions: true,
      },
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error sending group message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- GET DM Conversation History (Paginated) ---
router.get("/dm/:otherUserId", async (req, res) => {
  const { otherUserId } = req.params;
  const { currentUserId, skip, take } = req.query;

  const skipNum = parseInt(skip as string) || 0;
  const takeNum = parseInt(take as string) || 30;
  const oId = parseInt(otherUserId);
  const cId = parseInt(currentUserId as string);

  if (isNaN(oId) || isNaN(cId)) {
    return res
      .status(400)
      .json({ message: "Invalid user IDs (otherUserId or currentUserId)" });
  }

  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: cId, recipientId: oId },
          { senderId: oId, recipientId: cId },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip: skipNum,
      take: takeNum,
      include: {
        sender: { select: senderSelect },
        reactions: { select: reactionSelect },
      },
    });

    res.json(messages.reverse());
  } catch (err) {
    console.error("Error fetching DM history:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- POST a new Direct Message ---
router.post("/dm", async (req, res) => {
  const { senderId, recipientId, content } = req.body;

  if (!senderId || !recipientId || !content) {
    return res
      .status(400)
      .json({ message: "senderId, recipientId, and content are required" });
  }

  try {
    const sId = parseInt(senderId);
    const rId = parseInt(recipientId);
    if (isNaN(sId) || isNaN(rId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const newMessage = await prisma.directMessage.create({
      data: {
        content,
        senderId: sId,
        recipientId: rId,
      },
      include: {
        sender: { select: senderSelect },
        reactions: true,
      },
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error sending direct message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- GET DM "Inbox" (List of users you've chatted with) ---
router.get("/dm/conversations/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const uId = parseInt(userId);
    if (isNaN(uId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const sentTo = await prisma.directMessage.findMany({
      where: { senderId: uId },
      distinct: ["recipientId"],
      select: { recipient: true },
    });

    const receivedFrom = await prisma.directMessage.findMany({
      where: { recipientId: uId },
      distinct: ["senderId"],
      select: { sender: true },
    });

    const userMap = new Map();
    sentTo.forEach((msg) => userMap.set(msg.recipient.id, msg.recipient));
    receivedFrom.forEach((msg) => userMap.set(msg.sender.id, msg.sender));

    if (userMap.size === 0) {
      return res.json([]);
    }

    const allUsers = Array.from(userMap.values());
    const allUserIds = Array.from(userMap.keys());

    const lastMessages: any[] = await prisma.$queryRaw`
      SELECT 
        DISTINCT ON (conversation_id)
        id,
        content,
        "createdAt",
        "senderId",
        "recipientId",
        CASE 
          WHEN "senderId" = ${uId} THEN "recipientId"
          ELSE "senderId"
        END AS conversation_id
      FROM "DirectMessage"
      WHERE ("senderId" = ${uId} AND "recipientId" IN (${Prisma.join(allUserIds)}))
         OR ("recipientId" = ${uId} AND "senderId" IN (${Prisma.join(allUserIds)}))
      ORDER BY conversation_id, "createdAt" DESC
    `;

    const conversations = allUsers.map((user) => {
      const lastMsg = lastMessages.find(
        (m) => m.conversation_id === user.id,
      );

      return {
        ...user,
        lastMessage: lastMsg ? lastMsg.content : null,
        lastMessageTimestamp: lastMsg ? lastMsg.createdAt : null,
      };
    });

    conversations.sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1;
      if (!b.lastMessageTimestamp) return -1;
      return (
        new Date(b.lastMessageTimestamp).getTime() -
        new Date(a.lastMessageTimestamp).getTime()
      );
    });

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching DM conversations:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- DELETE a Group Message ---
router.delete("/group/message/:messageId", async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  try {
    const mId = parseInt(messageId);
    const uId = parseInt(userId);

    if (isNaN(mId) || isNaN(uId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const message = await prisma.groupMessage.findUnique({
      where: { id: mId },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId !== uId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own messages" });
    }

    await prisma.reaction.deleteMany({
      where: { groupMessageId: mId },
    });
    await prisma.groupMessage.delete({
      where: { id: mId },
    });

    res.status(200).json({ message: "Group message deleted" });
  } catch (err) {
    console.error("Error deleting group message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- DELETE a Direct Message ---
router.delete("/dm/message/:messageId", async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  try {
    const mId = parseInt(messageId);
    const uId = parseInt(userId);

    if (isNaN(mId) || isNaN(uId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const message = await prisma.directMessage.findUnique({
      where: { id: mId },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId !== uId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only delete your own messages" });
    }

    await prisma.reaction.deleteMany({
      where: { directMessageId: mId },
    });
    await prisma.directMessage.delete({
      where: { id: mId },
    });

    res.status(200).json({ message: "Direct message deleted" });
  } catch (err) {
    console.error("Error deleting direct message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- POST a Reaction ---
router.post("/reaction", async (req, res) => {
  const { userId, emoji, groupMessageId, directMessageId } = req.body;

  if (!userId || !emoji || (!groupMessageId && !directMessageId)) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const uId = parseInt(userId);
  const gmId = groupMessageId ? parseInt(groupMessageId) : undefined;
  const dmId = directMessageId ? parseInt(directMessageId) : undefined;

  try {
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: uId,
        emoji,
        groupMessageId: gmId,
        directMessageId: dmId,
      },
    });

    if (existingReaction) {
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
      return res
        .status(200)
        .json({ message: "Reaction removed", reactionId: existingReaction.id });
    } else {
      const newReaction = await prisma.reaction.create({
        data: {
          userId: uId,
          emoji,
          groupMessageId: gmId,
          directMessageId: dmId,
        },
        select: reactionSelect,
      });
      return res.status(201).json(newReaction);
    }
  } catch (err: any) {
    console.error("Error toggling reaction:", err);
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Reaction conflict, please try again." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
