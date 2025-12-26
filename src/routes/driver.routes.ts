import { Router } from "express";

import {
  createDocuments,
  createProfile,
  getAddress,
  getDocuments,
  getProfile,
  updateDocuments,
  updateProfile,
  upsertAddress,
} from "@controllers/driver.controller";
import { verifyDriverToken } from "@middleware/auth";

const router = Router();

// Profile routes
router.get("/driver/profile", verifyDriverToken, getProfile);
router.post("/driver/profile", verifyDriverToken, createProfile);
router.put("/driver/profile", verifyDriverToken, updateProfile);

// Address routes
router.get("/driver/address", verifyDriverToken, getAddress);
router.post("/driver/address", verifyDriverToken, upsertAddress);

// Document routes
router.get("/driver/documents", verifyDriverToken, getDocuments);
router.post("/driver/documents", verifyDriverToken, createDocuments);
router.put("/driver/documents", verifyDriverToken, updateDocuments);

export default router;
