
import { Router } from "express";
import groupMessages from "./groupMessages";
import directMessages from "./directMessages";
import reactions from "./reactions";

import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.use("/room", groupMessages); 
router.use("/dm", directMessages);
router.use("/reaction", reactions);

export default router;
