import { Router } from "express";
import { postPing, getAllPings } from "../controllers/ping.controller";

const router = Router();

router.post("/ping", postPing);
router.get("/ping", getAllPings);

export default router;
