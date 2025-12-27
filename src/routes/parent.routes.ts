import { Router } from "express";

import {
  getAddress,
  getProfile,
  updateAddress,
  updateProfile,
} from "@controllers/parent.controller";
import { verifyParentToken } from "@middlewares";

const router = Router();

router.get("/parent/profile", verifyParentToken, getProfile);
router.put("/parent/profile", verifyParentToken, updateProfile);
router.get("/parent/address", verifyParentToken, getAddress);
router.put("/parent/address", verifyParentToken, updateAddress);

export default router;
