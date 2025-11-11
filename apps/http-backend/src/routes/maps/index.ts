import { Router } from "express";
import roomRouter from "./room";
import gigRouter from "./gig";

import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.use(roomRouter);
router.use(gigRouter);

export default router;
