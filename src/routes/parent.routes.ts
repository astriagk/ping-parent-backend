import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getStudents,
  getTodayTrips,
  getNotifications,
  getTripLiveLocationController,
  getStudentDetail,
  callParent,
} from "../controllers/parent.controller";
import { verifyParentToken, verifyToken_Middleware } from "../middleware/auth";

const router = Router();

router.get("/parent/profile", verifyParentToken, getProfile);

router.put("/parent/profile", verifyParentToken, updateProfile);

router.get("/parent/students", verifyParentToken, getStudents);

router.get("/parent/students/:studentId", verifyParentToken, getStudentDetail);

router.get(
  "/parent/students/:studentId/trips/today",
  verifyParentToken,
  getTodayTrips
);

router.post(
  "/parent/students/:studentId/call-parent",
  verifyToken_Middleware,
  callParent
);

router.get("/parent/notifications", verifyParentToken, getNotifications);

router.get(
  "/parent/trips/:tripId/live-location",
  verifyParentToken,
  getTripLiveLocationController
);

export default router;
