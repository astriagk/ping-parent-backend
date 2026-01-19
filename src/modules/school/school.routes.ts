import { Router } from "express";

import {
  validate,
  verifyAdminToken,
  verifyToken_Middleware,
} from "@shared/middlewares";

import {
  createSchool,
  deleteSchool,
  getAllSchools,
  getSchool,
  updateSchool,
} from "./school.controller";
import { createSchoolSchema, updateSchoolSchema } from "./school.validation";

const router = Router();

// Public routes - Read operations (all authenticated users)
router.use(verifyToken_Middleware);

// 01. Get All Schools
router.get("/", getAllSchools);

// 02. Get School Details
router.get("/:school_id", getSchool);

// Admin routes - School CRUD operations (admin only)
// 03. Create School (Admin)
router.post(
  "/admin",
  verifyAdminToken,
  validate(createSchoolSchema),
  createSchool,
);

// 04. Update School (Admin)
router.put(
  "/admin/:school_id",
  verifyAdminToken,
  validate(updateSchoolSchema),
  updateSchool,
);

// 05. Delete School (Admin)
router.delete("/admin/:school_id", verifyAdminToken, deleteSchool);

export default router;
