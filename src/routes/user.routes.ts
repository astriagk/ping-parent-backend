import { Router } from "express";
import { postUser, getAllUsers } from "../controllers/user.controller";

const router = Router();

router.post("/users", postUser);
router.get("/users", getAllUsers);

export default router;
