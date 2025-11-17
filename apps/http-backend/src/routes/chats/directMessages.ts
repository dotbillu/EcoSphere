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

// GET DM history (FOR PAGINATION / LOADING OLD MESSAGES)
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

// --- POST DM (REMOVED) ---
// This logic is now handled by the ws-backend

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



router.delete("/message/:messageId", async (req, res) => {
  res
    .status(405)
    .json({ message: "Delete method now handled by WebSocket server" });
});

export default router;
