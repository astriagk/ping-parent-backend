import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  generateQrOtp as generateQrOtpService,
  getQrOtpByParentAndTrip as getQrOtpByParentAndTripService,
  getQrOtpByParentForStudent,
  getQrOtpByStudentAndTrip,
  verifyAndRecordAttendance as verifyAndRecordAttendanceService,
  verifyQrOtp as verifyQrOtpService,
} from "./daily_qr_otp.service";

// NOTE: Exports WITHOUT "Controller" suffix

/**
 * Generate QR code and OTP for a student's trip
 * POST /daily-qr-otp/generate
 */
export const generateQrOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const { student_id, trip_id, trip_type } = req.body;

    const qrOtp = await generateQrOtpService(student_id, trip_id, trip_type);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: qrOtp,
      message: SUCCESS_MESSAGES.DAILY_QR_OTP.GENERATED_SUCCESSFULLY,
    });
  },
);

/**
 * Get QR/OTP by student and trip (any authenticated user)
 * GET /daily-qr-otp/student/:studentId/trip/:tripId
 */
export const getQrOtp = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, tripId } = req.params as Record<string, string>;

  const qrOtp = await getQrOtpByStudentAndTrip(studentId, tripId);

  if (!qrOtp) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DAILY_QR_OTP.NOT_FOUND,
    );
  }

  return res.json({
    success: true,
    data: qrOtp,
    message: SUCCESS_MESSAGES.DAILY_QR_OTP.FETCHED_SUCCESSFULLY,
  });
});

/**
 * Get QR/OTP for parent (parent-only, with permission check)
 * GET /daily-qr-otp/parent/student/:studentId/trip/:tripId
 */
export const getQrOtpForParent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { studentId, tripId } = req.params as Record<string, string>;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      );
    }

    const qrOtp = await getQrOtpByParentForStudent(userId, studentId, tripId);

    if (!qrOtp) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DAILY_QR_OTP.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: qrOtp,
      message: SUCCESS_MESSAGES.DAILY_QR_OTP.FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get QR/OTP for parent by trip (parent sees their OTP for a trip)
 * GET /daily-qr-otp/parent/trip/:tripId
 */
export const getParentOtpForTrip = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { tripId } = req.params as Record<string, string>;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      );
    }

    const qrOtp = await getQrOtpByParentAndTripService(userId, tripId);

    if (!qrOtp) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DAILY_QR_OTP.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: qrOtp,
      message: SUCCESS_MESSAGES.DAILY_QR_OTP.FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Verify QR code or OTP - returns list of students covered
 * POST /daily-qr-otp/verify
 */
export const verifyQrOtp = asyncHandler(async (req: Request, res: Response) => {
  const { parent_id, trip_id, qr_code, otp_code } = req.body;

  const verifiedQrOtp = await verifyQrOtpService(
    parent_id,
    trip_id,
    qr_code,
    otp_code,
  );

  return res.json({
    success: true,
    data: verifiedQrOtp,
    message: SUCCESS_MESSAGES.DAILY_QR_OTP.VERIFIED_SUCCESSFULLY,
  });
});

/**
 * Verify and record attendance - marks which students are present/absent
 * POST /daily-qr-otp/verify-attendance
 */
export const verifyAndRecordAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      parent_id,
      trip_id,
      otp_code,
      qr_code,
      verified_student_ids,
      absent_student_ids,
    } = req.body;

    const result = await verifyAndRecordAttendanceService(
      parent_id,
      trip_id,
      otp_code,
      qr_code,
      verified_student_ids,
      absent_student_ids,
    );

    return res.json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.DAILY_QR_OTP.VERIFIED_SUCCESSFULLY,
    });
  },
);
