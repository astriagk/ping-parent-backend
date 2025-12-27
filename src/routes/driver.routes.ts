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
import { verifyDriverToken } from "@middlewares";

const router = Router();

// Profile routes
router.get("/profile", verifyDriverToken, getProfile);
router.post("/profile", verifyDriverToken, createProfile);
router.put("/profile", verifyDriverToken, updateProfile);

// Address routes
router.get("/address", verifyDriverToken, getAddress);
router.post("/address", verifyDriverToken, upsertAddress);

// Document routes
router.get("/documents", verifyDriverToken, getDocuments);
router.post("/documents", verifyDriverToken, createDocuments);
router.put("/documents", verifyDriverToken, updateDocuments);

export default router;
