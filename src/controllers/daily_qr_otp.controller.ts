import { Request, Response } from "express";

import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "@constants";
import { ApiError, asyncHandler } from "@middlewares";
import {
  generateQrOtp as generateQrOtpService,
  getQrOtpByStudentAndTrip,
  verifyQrOtp as verifyQrOtpService,
} from "@services/daily_qr_otp.service";

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
 * Get QR/OTP by student and trip
 * GET /daily-qr-otp/student/:studentId/trip/:tripId
 */
export const getQrOtp = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, tripId } = req.params;

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
 * Verify QR code or OTP
 * POST /daily-qr-otp/verify
 */
export const verifyQrOtp = asyncHandler(async (req: Request, res: Response) => {
  const { qr_code, otp_code } = req.body;

  const verifiedQrOtp = await verifyQrOtpService(qr_code, otp_code);

  return res.json({
    success: true,
    data: verifiedQrOtp,
    message: SUCCESS_MESSAGES.DAILY_QR_OTP.VERIFIED_SUCCESSFULLY,
  });
});
