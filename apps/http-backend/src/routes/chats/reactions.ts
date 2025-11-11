import { Router } from "express";
import { prisma } from "@lib/prisma";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

const reactionSelect = {
  id: true,
  emoji: true,
  user: { select: { id: true, username: true, name: true, image: true } },
};

router.post("/", async (req, res) => {
  const { userId, emoji, groupMessageId, directMessageId } = req.body;

  if (!userId || !emoji || (!groupMessageId && !directMessageId))
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const existing = await prisma.reaction.findFirst({
      where: {
        userId: userId,
        emoji,
        groupMessageId: groupMessageId ? groupMessageId : undefined,
        directMessageId: directMessageId ? directMessageId : undefined,
      },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return res.json({ message: "Reaction removed" });
    }

    const reaction = await prisma.reaction.create({
      data: {
        userId: userId,
        emoji,
        groupMessageId: groupMessageId ? groupMessageId : undefined,
        directMessageId: directMessageId ? directMessageId : undefined,
      },
      select: reactionSelect,
    });

    res.status(201).json(reaction);
  } catch (err) {
    console.error("Error toggling reaction:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
