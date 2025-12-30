import { WithId } from "mongodb";
import QRCode from "qrcode";

import {
  AlphabetType,
  ERROR_MESSAGES,
  HTTP_STATUS,
  TripType,
  UniqueCodeTypes,
} from "@constants";
import { ApiError } from "@middlewares";
import { DailyQrOtp } from "@models/daily_qr_otp.type";
import { dailyQrOtpRepository } from "@repositories/daily_qr_otp.repository";
import { generateUniqueCode } from "@utils";

/**
 * Generate a 6-digit OTP code
 */
const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate QR code and OTP for a student's trip
 */
export const generateQrOtp = async (
  studentId: string,
  tripId: string,
  tripType: TripType,
): Promise<WithId<DailyQrOtp>> => {
  // Check if QR/OTP already exists for this student and trip
  const existingQrOtp = await dailyQrOtpRepository.findByStudentAndTrip(
    studentId,
    tripId,
  );

  if (existingQrOtp) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.DAILY_QR_OTP.ALREADY_EXISTS,
    );
  }

  // Generate OTP code
  const otpCode = generateOtpCode();

  // Generate unique QR code identifier using generateUniqueCode
  const qrCodeId = generateUniqueCode(UniqueCodeTypes.DAILY_QR_OTP, {
    length: 32,
    alphabetType: AlphabetType.Alphanumeric,
  });

  // Create QR code data object
  const qrCodeData = {
    qr_code_id: qrCodeId,
    student_id: studentId,
    trip_id: tripId,
    trip_type: tripType,
    otp_code: otpCode,
  };

  // Generate QR code string (base64 data URL)
  const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrCodeData));

  // Set validity period (e.g., valid for 24 hours)
  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + 24);

  const dailyQrOtpData: DailyQrOtp = {
    qr_otp_id: generateUniqueCode(UniqueCodeTypes.DAILY_QR_OTP),
    student_id: studentId,
    trip_id: tripId,
    qr_code: qrCodeString,
    otp_code: otpCode,
    trip_type: tripType,
    valid_from: validFrom,
    valid_until: validUntil,
    is_used: false,
    created_at: new Date(),
  };

  return await dailyQrOtpRepository.create(dailyQrOtpData);
};

/**
 * Get QR/OTP by student and trip
 */
export const getQrOtpByStudentAndTrip = async (
  studentId: string,
  tripId: string,
): Promise<WithId<DailyQrOtp> | null> => {
  return await dailyQrOtpRepository.findByStudentAndTrip(studentId, tripId);
};

/**
 * Get all QR/OTPs for a trip
 */
export const getQrOtpsByTripId = async (
  tripId: string,
): Promise<WithId<DailyQrOtp>[]> => {
  return await dailyQrOtpRepository.findByTripId(tripId);
};

/**
 * Get all QR/OTPs for a student
 */
export const getQrOtpsByStudentId = async (
  studentId: string,
): Promise<WithId<DailyQrOtp>[]> => {
  return await dailyQrOtpRepository.findByStudentId(studentId);
};

/**
 * Verify QR code or OTP
 */
export const verifyQrOtp = async (
  qrCode?: string,
  otpCode?: string,
): Promise<WithId<DailyQrOtp>> => {
  // Find the QR/OTP record
  const qrOtpRecord = await dailyQrOtpRepository.findValidQrOtp(
    qrCode,
    otpCode,
  );

  if (!qrOtpRecord) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
    );
  }

  const now = new Date();

  // Check if already used
  if (qrOtpRecord.is_used) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DAILY_QR_OTP.ALREADY_USED,
    );
  }

  // Check validity period
  if (now < qrOtpRecord.valid_from) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DAILY_QR_OTP.NOT_VALID_YET,
    );
  }

  if (now > qrOtpRecord.valid_until) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DAILY_QR_OTP.EXPIRED,
    );
  }

  // Mark as used
  const updatedRecord = await dailyQrOtpRepository.updateById(
    qrOtpRecord._id.toString(),
    {
      $set: {
        is_used: true,
        used_at: now,
      },
    },
  );

  if (!updatedRecord) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.DAILY_QR_OTP.FAILED_TO_GENERATE,
    );
  }

  return updatedRecord;
};
