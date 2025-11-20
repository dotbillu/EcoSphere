import { Router } from "express";
import allPostsRoutes from "./all";
import followingPostsRoutes from "./following";

import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();
router.use(allPostsRoutes);
router.use(followingPostsRoutes);

export default router;
