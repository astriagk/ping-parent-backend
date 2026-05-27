import { Router } from "express";

const router = Router();

router.get("/ping", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
