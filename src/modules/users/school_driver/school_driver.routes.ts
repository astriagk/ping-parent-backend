import { Router } from "express";

import { verifyAdminToken } from "@shared/middlewares";

import {
  assignDriverToSchool,
  getSchoolDriverDetails,
  getSchoolDrivers,
  removeDriverFromSchool,
} from "./school_driver.controller";

const router = Router();

// 01: Get all drivers for school (school admin)
router.get("/:schoolId", verifyAdminToken, getSchoolDrivers);

// 02: Assign driver to school (school admin)
router.post("/assign", verifyAdminToken, assignDriverToSchool);

// 03: Remove driver from school (school admin)
router.post("/:driverId/remove", verifyAdminToken, removeDriverFromSchool);

// 04: Get driver details (school admin)
router.get("/:driverId/details", verifyAdminToken, getSchoolDriverDetails);

export default router;
