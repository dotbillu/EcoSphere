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

// NOTE: The base path is now simply /:roomId/messages to match the frontend fix
// Frontend URL: /chat/f44de52b-a2b7-43b1-8c2a-636fff6867ea/messages
// Backend Route (Mounted under /chat): /:roomId/messages
router.get("/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;
  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 30;

  try {
    const messages = await prisma.groupMessage.findMany({
      where: { roomId: roomId },
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

router.post("/:roomId/message", async (req, res) => {
  const { roomId } = req.params;
  const { senderId, content } = req.body;
  if (!senderId || !content)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const message = await prisma.groupMessage.create({
      data: {
        roomId: roomId,
        senderId: senderId,
        content,
      },
      include: { sender: { select: senderSelect }, reactions: true },
    });
    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending group message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// NOTE: This route needs to be specific enough not to conflict with the above routes
// Using a pattern like /message/:messageId is common.
router.delete("/message/:messageId", async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required in body" });
  }

  try {
    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.senderId !== userId)
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });

    await prisma.groupMessage.delete({ where: { id: message.id } });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
