import { Router } from "express";

import {
  createSchool,
  deleteSchool,
  getAllSchools,
  getSchool,
  updateSchool,
} from "@controllers/school.controller";
import { validate, verifyToken_Middleware } from "@middlewares";
import {
  createSchoolSchema,
  updateSchoolSchema,
} from "@validations/school.validation";

const router = Router();

// All routes require authentication
router.use(verifyToken_Middleware);

// School CRUD operations
router.post("/", validate(createSchoolSchema), createSchool);
router.get("/", getAllSchools);
router.get("/:id", getSchool);
router.put("/:id", validate(updateSchoolSchema), updateSchool);
router.delete("/:id", deleteSchool);

export default router;
