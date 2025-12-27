import { Router } from "express";

import {
  getAddress,
  getProfile,
  updateAddress,
  updateProfile,
} from "@controllers/parent.controller";
import { verifyParentToken } from "@middlewares";

const router = Router();

router.get("/profile", verifyParentToken, getProfile);
router.put("/profile", verifyParentToken, updateProfile);
router.get("/address", verifyParentToken, getAddress);
router.put("/address", verifyParentToken, updateAddress);

export default router;
