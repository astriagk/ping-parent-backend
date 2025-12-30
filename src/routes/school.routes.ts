import { Router } from "express";

import {
  createSchool,
  deleteSchool,
  getAllSchools,
  getSchool,
  updateSchool,
} from "@controllers/school.controller";
import {
  validate,
  verifyAdminToken,
  verifyToken_Middleware,
} from "@middlewares";
import {
  createSchoolSchema,
  updateSchoolSchema,
} from "@validations/school.validation";

const router = Router();

// Admin routes - School CRUD operations (admin only)
router.post(
  "/admin",
  verifyAdminToken,
  validate(createSchoolSchema),
  createSchool,
);
router.put(
  "/admin/:school_id",
  verifyAdminToken,
  validate(updateSchoolSchema),
  updateSchool,
);
router.delete("/admin/:school_id", verifyAdminToken, deleteSchool);

// Public routes - Read operations (all authenticated users)
router.use(verifyToken_Middleware);

router.get("/", getAllSchools);
router.get("/:school_id", getSchool);

export default router;
