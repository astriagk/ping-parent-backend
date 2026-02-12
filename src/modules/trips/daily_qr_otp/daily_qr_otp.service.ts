import { WithId } from "mongodb";
import QRCode from "qrcode";

import { getDB } from "@shared/config";
import {
  AlphabetType,
  DAILY_QR_OTP_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  STUDENTS_COLLECTION,
  TripType,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

import { dailyQrOtpRepository } from "./daily_qr_otp.repository";
import { DailyQrOtp } from "./daily_qr_otp.type";

/**
 * Generate a 4-digit OTP code
 */
const generateOtpCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Student info with parent mapping for OTP generation
 */
interface StudentWithParent {
  student_id: string;
  parent_id: string;
}

/**
 * Get parent_id for each student from the students collection
 */
const getStudentsWithParents = async (
  studentIds: string[],
): Promise<StudentWithParent[]> => {
  const db = await getDB();
  const students = await db
    .collection(STUDENTS_COLLECTION)
    .find({ student_id: { $in: studentIds } })
    .project({ student_id: 1, parent_id: 1 })
    .toArray();

  return students.map((s) => ({
    student_id: s.student_id,
    parent_id: s.parent_id,
  }));
};

/**
 * Group students by parent_id
 */
const groupStudentsByParent = (
  students: StudentWithParent[],
): Map<string, string[]> => {
  const grouped = new Map<string, string[]>();

  for (const student of students) {
    const parentId = student.parent_id;
    if (!grouped.has(parentId)) {
      grouped.set(parentId, []);
    }
    grouped.get(parentId)!.push(student.student_id);
  }

  return grouped;
};

/**
 * Generate QR/OTP data for a parent group (one OTP for all children of same parent)
 */
const generateParentGroupQrOtpData = async (
  parentId: string,
  studentIds: string[],
  tripId: string,
  tripType: TripType,
): Promise<DailyQrOtp> => {
  // Generate OTP code
  const otpCode = generateOtpCode();

  // Generate unique QR code identifier
  const qrCodeId = generateUniqueCode(UniqueCodeTypes.DAILY_QR_OTP, {
    length: 32,
    alphabetType: AlphabetType.Alphanumeric,
  });

  // Create QR code data object with parent and all student IDs
  const qrCodeData = {
    qr_code_id: qrCodeId,
    parent_id: parentId,
    student_ids: studentIds,
    trip_id: tripId,
    trip_type: tripType,
    otp_code: otpCode,
  };

  // Generate QR code string (base64 data URL)
  const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrCodeData));

  // Set validity period (valid for 24 hours)
  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + 24);

  return {
    qr_otp_id: generateUniqueCode(UniqueCodeTypes.DAILY_QR_OTP),
    parent_id: parentId,
    student_ids: studentIds,
    trip_id: tripId,
    qr_code: qrCodeString,
    otp_code: otpCode,
    trip_type: tripType,
    valid_from: validFrom,
    valid_until: validUntil,
    is_used: false,
    created_at: new Date(),
  };
};

/**
 * Bulk generate QR/OTP for multiple students in a single trip
 * Groups students by parent_id - ONE OTP per parent covering all their children
 * Uses Promise.all for parallel QR generation and insertMany for single DB operation
 */
export const generateBulkQrOtp = async (
  studentIds: string[],
  tripId: string,
  tripType: TripType,
): Promise<void> => {
  if (studentIds.length === 0) {
    return;
  }

  const db = await getDB();

  // Get parent_id for each student
  const studentsWithParents = await getStudentsWithParents(studentIds);

  // Group students by parent
  const parentGroups = groupStudentsByParent(studentsWithParents);

  // Generate QR/OTP for each parent group in parallel
  const qrOtpDataPromises: Promise<DailyQrOtp>[] = [];
  for (const [parentId, groupStudentIds] of parentGroups.entries()) {
    qrOtpDataPromises.push(
      generateParentGroupQrOtpData(parentId, groupStudentIds, tripId, tripType),
    );
  }

  const qrOtpDataArray = await Promise.all(qrOtpDataPromises);

  // Insert all in a single operation
  await db.collection(DAILY_QR_OTP_COLLECTION).insertMany(qrOtpDataArray);
};

/**
 * Helper function to get parent_id from user_id
 * This is needed to verify parent ownership of a student
 */
const getParentIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    return null;
  }

  return String(parent._id);
};

/**
 * Helper function to verify that a parent owns a student
 */
const verifyParentOwnsStudent = async (
  userId: string,
  studentId: string,
): Promise<boolean> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    return false;
  }

  const db = await getDB();
  const student = await db
    .collection(STUDENTS_COLLECTION)
    .findOne({ student_id: studentId, parent_id: parentId });

  return !!student;
};

/**
 * Generate QR code and OTP for a parent's children in a trip
 * This creates a single OTP for all children of the parent in the specified trip
 */
export const generateQrOtp = async (
  studentId: string,
  tripId: string,
  tripType: TripType,
): Promise<WithId<DailyQrOtp>> => {
  const db = await getDB();

  // Get the student's parent_id
  const student = await db
    .collection(STUDENTS_COLLECTION)
    .findOne({ student_id: studentId });

  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.STUDENT.NOT_FOUND);
  }

  const parentId = student.parent_id;

  // Check if QR/OTP already exists for this parent and trip
  const existingQrOtp = await dailyQrOtpRepository.findByParentAndTrip(
    parentId,
    tripId,
  );

  if (existingQrOtp) {
    // If exists and student is already included, return existing
    if (existingQrOtp.student_ids.includes(studentId)) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.DAILY_QR_OTP.ALREADY_EXISTS,
      );
    }
    // Add student to existing OTP
    const updatedRecord = await dailyQrOtpRepository.updateById(
      existingQrOtp._id.toString(),
      { $push: { student_ids: studentId } },
    );
    return updatedRecord!;
  }

  // Generate new OTP for this parent
  const qrOtpData = await generateParentGroupQrOtpData(
    parentId,
    [studentId],
    tripId,
    tripType,
  );

  return await dailyQrOtpRepository.create(qrOtpData);
};

/**
 * Get QR/OTP by student and trip (any authenticated user)
 */
export const getQrOtpByStudentAndTrip = async (
  studentId: string,
  tripId: string,
): Promise<WithId<DailyQrOtp> | null> => {
  return await dailyQrOtpRepository.findByStudentAndTrip(studentId, tripId);
};

/**
 * Get QR/OTP by parent for their student's trip (parent-only)
 * Verifies that the parent owns the student before returning QR/OTP
 */
export const getQrOtpByParentForStudent = async (
  userId: string,
  studentId: string,
  tripId: string,
): Promise<WithId<DailyQrOtp> | null> => {
  // Verify that parent owns this student
  const ownsStudent = await verifyParentOwnsStudent(userId, studentId);

  if (!ownsStudent) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.COMMON.UNAUTHORIZED,
    );
  }

  // Return QR/OTP if it exists
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
 * Get QR/OTP by parent for a trip
 */
export const getQrOtpByParentAndTrip = async (
  userId: string,
  tripId: string,
): Promise<WithId<DailyQrOtp> | null> => {
  const parentId = await getParentIdByUserId(userId);
  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await dailyQrOtpRepository.findByParentAndTrip(parentId, tripId);
};

/**
 * Verify QR code or OTP - returns the OTP record with all students covered
 * Does NOT mark as used - use verifyAndRecordAttendance for that
 * Uses parent_id + trip_id for optimized indexed lookup
 * In dev environment, OTP "1111" will bypass verification
 */
export const verifyQrOtp = async (
  parentId: string,
  tripId: string,
  qrCode?: string,
  otpCode?: string,
): Promise<WithId<DailyQrOtp>> => {
  const db = await getDB();
  const now = new Date();

  // DEV BYPASS: Accept "1111" as valid OTP in development environment
  if (process.env.NODE_ENV === "dev" && otpCode === "1111") {
    const devRecord = await db.collection(DAILY_QR_OTP_COLLECTION).findOne({
      parent_id: parentId,
      trip_id: tripId,
    });

    if (devRecord) {
      return devRecord as unknown as WithId<DailyQrOtp>;
    }
  }

  // Build optimized query using parent_id + trip_id (indexed)
  const query: any = {
    parent_id: parentId,
    trip_id: tripId,
    is_used: false,
    valid_from: { $lte: now },
    valid_until: { $gte: now },
  };

  if (otpCode) {
    query.otp_code = otpCode;
  } else if (qrCode) {
    query.qr_code = qrCode;
  } else {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
    );
  }

  const qrOtpRecord = await db
    .collection(DAILY_QR_OTP_COLLECTION)
    .findOne(query);

  if (!qrOtpRecord) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
    );
  }

  // Return the record - driver app will show list of students
  return qrOtpRecord as unknown as WithId<DailyQrOtp>;
};

/**
 * Verify OTP and record which students are present/absent
 * This is the main verification endpoint for pickup/drop
 * Uses parent_id + trip_id for optimized indexed lookup
 * In dev environment, OTP "1111" will bypass verification
 */
export const verifyAndRecordAttendance = async (
  parentId: string,
  tripId: string,
  otpCode?: string,
  qrCode?: string,
  verifiedStudentIds?: string[],
  absentStudentIds?: string[],
): Promise<WithId<DailyQrOtp>> => {
  const db = await getDB();
  const now = new Date();

  // DEV BYPASS: Accept "1111" as valid OTP in development environment
  const isDevBypass = process.env.NODE_ENV === "dev" && otpCode === "1111";

  // Find valid OTP using parent_id + trip_id (indexed)
  const query: any = {
    parent_id: parentId,
    trip_id: tripId,
  };

  // Only add validity checks if not dev bypass
  if (!isDevBypass) {
    query.is_used = false;
    query.valid_from = { $lte: now };
    query.valid_until = { $gte: now };

    if (otpCode) {
      query.otp_code = otpCode;
    } else if (qrCode) {
      query.qr_code = qrCode;
    } else {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
      );
    }
  }

  const qrOtpRecord = await db
    .collection(DAILY_QR_OTP_COLLECTION)
    .findOne(query);

  if (!qrOtpRecord) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
    );
  }

  // Validate that verified/absent students belong to this OTP
  const allStudentIds = qrOtpRecord.student_ids as string[];
  const validVerified = (verifiedStudentIds || []).filter((id) =>
    allStudentIds.includes(id),
  );
  const validAbsent = (absentStudentIds || []).filter((id) =>
    allStudentIds.includes(id),
  );

  // Update the record
  const updateResult = await db
    .collection(DAILY_QR_OTP_COLLECTION)
    .findOneAndUpdate(
      { _id: qrOtpRecord._id },
      {
        $set: {
          is_used: true,
          used_at: now,
          verified_student_ids: validVerified,
          absent_student_ids: validAbsent,
        },
      },
      { returnDocument: "after" },
    );

  if (!updateResult) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.DAILY_QR_OTP.FAILED_TO_GENERATE,
    );
  }

  return updateResult as unknown as WithId<DailyQrOtp>;
};
