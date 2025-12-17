import { Router } from "express";
import { verifyAuthToken } from "../controllers/auth.controller";

const router = Router();

router.get("/auth/verify-token", verifyAuthToken);

export default router;
