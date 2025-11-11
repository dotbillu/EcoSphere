import { Router } from "express";
import { prisma } from "@lib/prisma";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

const senderSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
};
const reactionSelect = {
  id: true,
  emoji: true,
  user: { select: senderSelect },
};

// GET DM history
router.get("/:otherUserId", async (req, res) => {
  const { otherUserId } = req.params;
  const { currentUserId, skip, take } = req.query;

  if (!currentUserId) {
    return res.status(400).json({ message: "currentUserId is required" });
  }

  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          {
            senderId: currentUserId as string,
            recipientId: otherUserId,
          },
          {
            senderId: otherUserId,
            recipientId: currentUserId as string,
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip: parseInt(skip as string) || 0,
      take: parseInt(take as string) || 10,
      include: {
        sender: { select: senderSelect },
        reactions: { select: reactionSelect },
      },
    });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching DM:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST DM
router.post("/", async (req, res) => {
  const { senderId, recipientId, content } = req.body;
  if (!senderId || !recipientId || !content)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const msg = await prisma.directMessage.create({
      data: {
        senderId: senderId, 
        recipientId: recipientId, 
        content,
      },
      include: { sender: { select: senderSelect }, reactions: true },
    });
    res.status(201).json(msg);
  } catch (err) {
    console.error("Error sending DM:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- GET DM "Inbox" (List of users you've chatted with) ---
router.get("/conversations/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const uId = userId;
    if (!uId) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: uId }, { recipientId: uId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: senderSelect },
        recipient: { select: senderSelect },
      },
    });

    const conversations = new Map<string, any>(); 

    for (const message of messages) {
      const otherUser =
        message.senderId === uId ? message.recipient : message.sender;

      if (otherUser && !conversations.has(otherUser.id)) {
        conversations.set(otherUser.id, {
          ...otherUser,
          lastMessage: message.content,
          lastMessageTimestamp: message.createdAt,
        });
      }
    }

    res.json(Array.from(conversations.values()));
  } catch (err) {
    console.error("Error fetching DM conversations:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE DM
router.delete("/message/:messageId", async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body; 

  if (!userId) {
    return res.status(400).json({ message: "userId is required in body" });
  }

  try {
    const msg = await prisma.directMessage.findUnique({
      where: { id: messageId }, 
    });
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.senderId !== userId) 
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });

    await prisma.directMessage.delete({ where: { id: msg.id } });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Error deleting DM:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
