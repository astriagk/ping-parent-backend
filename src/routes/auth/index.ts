import { Router } from "express";

import loginRouter from "./login.routes";
import registerRouter from "./register.routes";

const router = Router();

/**
 * AUTH GATEWAY — Public endpoints (no auth required)
 * OTP send/verify, login, token verification, logout
 */
router.use("/", registerRouter);
router.use("/", loginRouter);

export default router;
