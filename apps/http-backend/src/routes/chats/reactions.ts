import { Router } from "express";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// --- POST Reaction (REMOVED) ---
// This logic is now handled by the ws-backend

router.post("/", async (req, res) => {
  res
    .status(405)
    .json({ message: "Reactions are now handled by WebSocket server" });
});

export default router;
