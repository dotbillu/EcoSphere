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

// GET Group Message History (for pagination)
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

    res.json(messages.reverse()); // Keep .reverse() for chronological order on frontend
  } catch (err) {
    console.error("Error fetching group messages:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- POST route (REMOVED) ---
// This logic is now handled by the ws-backend via 'group:send' event

// --- DELETE route (REMOVED) ---
// This logic is now handled by the ws-backend via 'message:delete' event

export default router;
