import { Router } from "express";

import {
  getAddress,
  getProfile,
  updateAddress,
  updateProfile,
} from "@controllers/parent.controller";
import { verifyParentToken } from "@middlewares";

const router = Router();

// 01. Get Parent Profile
router.get("/profile", verifyParentToken, getProfile);

// 02. Update Parent Profile
router.put("/profile", verifyParentToken, updateProfile);

// 03. Get Parent Address
router.get("/address", verifyParentToken, getAddress);

// 04. Update Parent Address
router.put("/address", verifyParentToken, updateAddress);

export default router;
