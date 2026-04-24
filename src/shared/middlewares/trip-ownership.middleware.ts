import { NextFunction, Request, Response } from "express";

import { tripStudentRepository } from "@modules/trips/trip_student/trip_student.repository";
import { parentRepository } from "@modules/users/parent/parent.repository";
import { studentRepository } from "@modules/users/student/student.repository";
import { ERROR_MESSAGES, HTTP_STATUS } from "@shared/constants";

/**
 * Middleware that verifies a parent's student is on the requested trip.
 * Only enforced for parent-role users. Drivers pass through freely.
 * Must be applied AFTER verifyToken_Middleware (requires req.user).
 */
export const verifyParentTripAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      });
      return;
    }

    // Only enforce for parent role — drivers own their trips
    if (user.role !== "parent") {
      next();
      return;
    }

    const { tripId } = req.params as Record<string, string>;
    if (!tripId) {
      next();
      return;
    }

    // Get parent's students
    const parent = await parentRepository.findByUserId(user.userId);
    if (!parent) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.COMMON.FORBIDDEN,
      });
      return;
    }

    const students = await studentRepository.findByParentId(String(parent._id));
    const studentIds = students.map((s) => String(s._id));

    if (studentIds.length === 0) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.COMMON.FORBIDDEN,
      });
      return;
    }

    // Check if any of the parent's students are on this trip
    const tripStudents = await tripStudentRepository.findByTripId(tripId);
    const hasAccess = tripStudents.some((ts) =>
      studentIds.includes(ts.student_id),
    );

    if (!hasAccess) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.COMMON.FORBIDDEN,
      });
      return;
    }

    next();
  } catch {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Failed to verify trip access",
    });
  }
};
