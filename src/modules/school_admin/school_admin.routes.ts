import { Router } from "express";

import { validate, verifyAdminToken } from "@shared/middlewares";

import {
  changeSchoolAdminPassword,
  deactivateSchoolAdmin,
  getCurrentSchoolAdmin,
  getSchoolAdmins,
  loginSchoolAdmin,
  registerSchoolAdmin,
  updateSchoolAdmin,
} from "./school_admin.controller";
import {
  changePasswordValidation,
  loginSchoolAdminValidation,
  registerSchoolAdminValidation,
  updateSchoolAdminValidation,
} from "./school_admin.validation";

const router = Router();

// 01: Register new school admin (no auth required)
router.post(
  "/register",
  validate(registerSchoolAdminValidation),
  registerSchoolAdmin,
);

// 02: Login school admin (no auth required)
router.post("/login", validate(loginSchoolAdminValidation), loginSchoolAdmin);

// 03: Get current admin profile (auth required)
router.get("/me", verifyAdminToken, getCurrentSchoolAdmin);

// 04: Update admin profile (auth required)
router.patch(
  "/update",
  validate(updateSchoolAdminValidation),
  verifyAdminToken,
  updateSchoolAdmin,
);

// 05: Change password (auth required)
router.post(
  "/change-password",
  validate(changePasswordValidation),
  verifyAdminToken,
  changeSchoolAdminPassword,
);

// 06: Get all admins for school (admin/school_admin only)
router.get("/:schoolId", verifyAdminToken, getSchoolAdmins);

// 07: Deactivate admin (admin only)
router.post("/:adminId/deactivate", verifyAdminToken, deactivateSchoolAdmin);

export default router;
