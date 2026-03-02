import { ObjectId, WithId } from "mongodb";

import { NotificationDispatcher } from "@modules/notification/notification.dispatcher";
import { getDB } from "@shared/config";
import {
  AttendanceStatus,
  DAILY_QR_OTP_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  PickupStatus,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  TripType,
  USERS_COLLECTION,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { logger } from "@shared/utils";

import { tripStudentRepository } from "./trip_student.repository";
import {
  TripStudent,
  TripStudentWithDetails,
  TripStudentsGroupedByParent,
} from "./trip_student.type";

/**
 * Get trip student record by ID
 */
export const getTripStudentById = async (
  id: string,
): Promise<WithId<TripStudent> | null> => {
  return await tripStudentRepository.findById(id);
};

/**
 * Helper function to verify OTP/QR code before recording pickup/drop
 * Now uses parent-grouped OTP - checks if student is in the OTP's student_ids array
 * In dev environment, OTP "1111" will bypass verification
 */
const verifyOtpBeforeRecording = async (
  studentId: string,
  tripId: string,
  otpCode?: string,
  qrCode?: string,
): Promise<boolean> => {
  // DEV BYPASS: Accept "1111" as valid OTP in development environment
  if (process.env.NODE_ENV === "dev" && otpCode === "1111") {
    return true;
  }

  // If neither OTP nor QR code provided, not required
  if (!otpCode && !qrCode) {
    return true;
  }

  const db = await getDB();
  const now = new Date();

  // First, get the student's parent_id
  const student = await db
    .collection(STUDENTS_COLLECTION)
    .findOne({ _id: new ObjectId(studentId) });

  if (!student) {
    return false;
  }

  // Build query to find valid QR/OTP record for this parent
  const query: any = {
    parent_id: student.parent_id,
    trip_id: tripId,
    student_ids: studentId, // Must include this student
    is_used: false, // Not yet used
    valid_from: { $lte: now }, // Within validity period
    valid_until: { $gte: now },
  };

  if (otpCode) {
    query.otp_code = otpCode;
  } else if (qrCode) {
    query.qr_code = qrCode;
  }

  const validQrOtp = await db
    .collection(DAILY_QR_OTP_COLLECTION)
    .findOne(query);

  if (!validQrOtp) {
    return false;
  }

  // Add this student to verified_student_ids instead of marking the whole OTP as used
  // This allows other siblings to still be verified with the same OTP
  const verifiedStudentIds = validQrOtp.verified_student_ids || [];
  if (!verifiedStudentIds.includes(studentId)) {
    verifiedStudentIds.push(studentId);
  }

  // Check if all students have been verified - then mark OTP as fully used
  const allStudentsVerified = (validQrOtp.student_ids as string[]).every(
    (id: string) =>
      verifiedStudentIds.includes(id) ||
      (validQrOtp.absent_student_ids || []).includes(id),
  );

  await db.collection(DAILY_QR_OTP_COLLECTION).updateOne(
    { _id: validQrOtp._id },
    {
      $set: {
        verified_student_ids: verifiedStudentIds,
        ...(allStudentsVerified ? { is_used: true, used_at: now } : {}),
      },
    },
  );

  return true;
};

/**
 * Get all trip students for a specific trip
 */
export const getTripStudentsByTripId = async (
  tripId: string,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByTripId(tripId);
};

/**
 * Get all trip students for a specific trip ordered by sequence
 */
export const getTripStudentsByTripIdOrdered = async (
  tripId: string,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByTripIdOrderedBySequence(tripId);
};

/**
 * Get trip students with student details for driver selection screen
 * Returns student name, photo, class, section for driver to select present/absent students
 * Used before school-point and pickup-point endpoints
 */
export const getTripStudentsWithDetails = async (
  tripId: string,
): Promise<TripStudentWithDetails[]> => {
  const db = await getDB();

  const result = await db
    .collection(TRIP_STUDENTS_COLLECTION)
    .aggregate<TripStudentWithDetails>([
      // Stage 1: Match students for this trip
      {
        $match: { trip_id: tripId },
      },
      // Stage 2: Lookup student details (student_id stored as string, students._id is ObjectId)
      {
        $lookup: {
          from: STUDENTS_COLLECTION,
          let: { studentId: { $toObjectId: "$student_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
          as: "studentDetails",
        },
      },
      // Stage 3: Unwind student details
      {
        $unwind: {
          path: "$studentDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      // Stage 4: Lookup parent details
      {
        $lookup: {
          from: PARENTS_COLLECTION,
          let: { parentId: { $toObjectId: "$studentDetails.parent_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$parentId"] } } }],
          as: "parentDetails",
        },
      },
      // Stage 5: Unwind parent details (preserve if no match found)
      {
        $unwind: {
          path: "$parentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 6: Lookup user details for phone number
      {
        $lookup: {
          from: USERS_COLLECTION,
          let: { userId: { $toObjectId: "$parentDetails.user_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
          as: "userDetails",
        },
      },
      // Stage 7: Unwind user details (preserve if no match found)
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 8: Sort by sequence order
      {
        $sort: { sequence_order: 1 },
      },
      // Stage 9: Project to TripStudentWithDetails format
      {
        $project: {
          _id: 0,
          trip_student_id: { $toString: "$_id" },
          trip_id: "$trip_id",
          student_id: "$student_id",
          sequence_order: "$sequence_order",
          attendance_status: "$attendance_status",
          pickup_status: "$pickup_status",
          // Student details
          student_name: "$studentDetails.student_name",
          student_photo_url: "$studentDetails.photo_url",
          student_class: "$studentDetails.class",
          student_section: "$studentDetails.section",
          student_roll_number: "$studentDetails.roll_number",
          student_gender: "$studentDetails.gender",
          // Parent details
          parent_id: "$studentDetails.parent_id",
          parent_name: "$parentDetails.name",
          parent_phone_number: "$userDetails.phone_number",
          parent_photo_url: "$parentDetails.photo_url",
        },
      },
    ])
    .toArray();

  return result;
};

/**
 * Get trip students grouped by parent for driver selection screen
 * One parent can have multiple children (siblings) in the same trip
 * Returns parent info with array of their students
 */
export const getTripStudentsGroupedByParent = async (
  tripId: string,
): Promise<TripStudentsGroupedByParent[]> => {
  const db = await getDB();

  const result = await db
    .collection(TRIP_STUDENTS_COLLECTION)
    .aggregate<TripStudentsGroupedByParent>([
      // Stage 1: Match students for this trip
      {
        $match: { trip_id: tripId },
      },
      // Stage 2: Lookup student details (student_id stored as string, students._id is ObjectId)
      {
        $lookup: {
          from: STUDENTS_COLLECTION,
          let: { studentId: { $toObjectId: "$student_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$studentId"] } } }],
          as: "studentDetails",
        },
      },
      // Stage 3: Unwind student details
      {
        $unwind: {
          path: "$studentDetails",
          preserveNullAndEmptyArrays: false,
        },
      },
      // Stage 4: Lookup parent details
      {
        $lookup: {
          from: PARENTS_COLLECTION,
          let: { parentId: { $toObjectId: "$studentDetails.parent_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$parentId"] } } }],
          as: "parentDetails",
        },
      },
      // Stage 5: Unwind parent details
      {
        $unwind: {
          path: "$parentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 6: Lookup user details for phone number
      {
        $lookup: {
          from: USERS_COLLECTION,
          let: { userId: { $toObjectId: "$parentDetails.user_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }],
          as: "userDetails",
        },
      },
      // Stage 7: Unwind user details
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Stage 8: Sort by sequence order before grouping
      {
        $sort: { sequence_order: 1 },
      },
      // Stage 9: Group by parent_id
      {
        $group: {
          _id: "$studentDetails.parent_id",
          parent_name: { $first: "$parentDetails.name" },
          parent_phone_number: { $first: "$userDetails.phone_number" },
          parent_photo_url: { $first: "$parentDetails.photo_url" },
          students: {
            $push: {
              trip_student_id: "$_id",
              student_id: "$student_id",
              student_name: "$studentDetails.student_name",
              student_photo_url: "$studentDetails.photo_url",
              student_class: "$studentDetails.class",
              student_section: "$studentDetails.section",
              student_roll_number: "$studentDetails.roll_number",
              student_gender: "$studentDetails.gender",
              sequence_order: "$sequence_order",
              attendance_status: "$attendance_status",
              pickup_status: "$pickup_status",
            },
          },
        },
      },
      // Stage 10: Project final format
      {
        $project: {
          _id: 0,
          parent_id: "$_id",
          parent_name: 1,
          parent_phone_number: 1,
          parent_photo_url: 1,
          students: 1,
        },
      },
      // Stage 11: Sort by first student's sequence order
      {
        $addFields: {
          first_sequence: { $arrayElemAt: ["$students.sequence_order", 0] },
        },
      },
      {
        $sort: { first_sequence: 1 },
      },
      {
        $project: {
          parent_id: 1,
          parent_name: 1,
          parent_phone_number: 1,
          parent_photo_url: 1,
          students: 1,
        },
      },
    ])
    .toArray();

  return result;
};

/**
 * Get all trips for a specific student
 */
export const getTripStudentsByStudentId = async (
  studentId: string,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByStudentId(studentId);
};

/**
 * Get trip student by trip ID and student ID
 */
export const getTripStudentByTripAndStudent = async (
  tripId: string,
  studentId: string,
): Promise<WithId<TripStudent> | null> => {
  return await tripStudentRepository.findByTripAndStudent(tripId, studentId);
};

/**
 * Mark attendance for a student on a trip
 * This is typically done by the driver before or at the start of the trip
 * If marking absent, also updates the daily_qr_otp record
 */
export const markAttendance = async (
  tripId: string,
  studentId: string,
  attendanceStatus: AttendanceStatus,
  notes?: string,
): Promise<WithId<TripStudent> | null> => {
  // Find the trip student record
  const tripStudent = await tripStudentRepository.findByTripAndStudent(
    tripId,
    studentId,
  );

  if (!tripStudent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
    );
  }

  const db = await getDB();
  const now = new Date();

  // If marking absent, update the OTP record as well
  if (attendanceStatus === AttendanceStatus.ABSENT) {
    // Get student's parent_id
    const student = await db
      .collection(STUDENTS_COLLECTION)
      .findOne({ _id: new ObjectId(studentId) });

    if (student) {
      // Find the OTP for this parent and trip
      const qrOtpRecord = await db.collection(DAILY_QR_OTP_COLLECTION).findOne({
        parent_id: student.parent_id,
        trip_id: tripId,
        student_ids: studentId,
      });

      if (qrOtpRecord) {
        // Add to absent_student_ids
        const absentStudentIds = qrOtpRecord.absent_student_ids || [];
        if (!absentStudentIds.includes(studentId)) {
          absentStudentIds.push(studentId);
        }

        // Check if all students are now accounted for (verified or absent)
        const verifiedStudentIds = qrOtpRecord.verified_student_ids || [];
        const allStudentsAccountedFor = (
          qrOtpRecord.student_ids as string[]
        ).every(
          (id: string) =>
            verifiedStudentIds.includes(id) || absentStudentIds.includes(id),
        );

        await db.collection(DAILY_QR_OTP_COLLECTION).updateOne(
          { _id: qrOtpRecord._id },
          {
            $set: {
              absent_student_ids: absentStudentIds,
              ...(allStudentsAccountedFor
                ? { is_used: true, used_at: now }
                : {}),
            },
          },
        );
      }
    }
  }

  // Update attendance status in trip_students
  const updates: Partial<TripStudent> = {
    attendance_status: attendanceStatus,
    pickup_status:
      attendanceStatus === AttendanceStatus.ABSENT
        ? PickupStatus.NO_SHOW
        : tripStudent.pickup_status,
    updated_at: now,
  };

  if (notes) {
    updates.notes = notes;
  }

  return await tripStudentRepository.updateById(tripStudent._id.toString(), {
    $set: updates,
  });
};

/**
 * Record student pickup
 * Driver records when they pick up a student during the trip
 * Requires valid OTP or QR code provided by parent
 */
export const recordPickup = async (
  tripId: string,
  studentId: string,
  pickupData: {
    pickup_latitude?: number;
    pickup_longitude?: number;
    pickup_qr_code?: string;
    pickup_otp?: string;
    notes?: string;
  },
): Promise<WithId<TripStudent> | null> => {
  // Find the trip student record
  const tripStudent = await tripStudentRepository.findByTripAndStudent(
    tripId,
    studentId,
  );

  if (!tripStudent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
    );
  }

  // Check if already picked
  if (tripStudent.pickup_status === PickupStatus.PICKED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_PICKED,
    );
  }

  // Verify OTP/QR code before recording pickup
  const otpVerified = await verifyOtpBeforeRecording(
    studentId,
    tripId,
    pickupData.pickup_otp,
    pickupData.pickup_qr_code,
  );

  if (!otpVerified) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
    );
  }

  // Update pickup information
  const updates: Partial<TripStudent> = {
    pickup_status: PickupStatus.PICKED,
    pickup_time: new Date(),
    attendance_status: AttendanceStatus.PRESENT,
    updated_at: new Date(),
    ...pickupData,
  };

  const result = await tripStudentRepository.updateById(
    tripStudent._id.toString(),
    {
      $set: updates,
    },
  );

  // Emit parent-specific notification for pickup
  // Get student info for notification
  try {
    const db = await getDB();
    const student = await db
      .collection(STUDENTS_COLLECTION)
      .findOne({ _id: new ObjectId(studentId) });

    if (student && student.parent_id) {
      const trip = await db
        .collection(TRIPS_COLLECTION)
        .findOne({ _id: new ObjectId(tripId) });

      const parent = await db
        .collection(PARENTS_COLLECTION)
        .findOne({ _id: new ObjectId(student.parent_id) });

      NotificationDispatcher.notifyParentStudentPicked(
        student.parent_id,
        parent?.user_id || student.parent_id,
        tripId,
        studentId,
        student.name || student.first_name || "Your child",
        trip?.driver_id,
      );
    }
  } catch (error) {
    // Don't fail the pickup if notification fails
    console.error("Failed to send parent pickup notification:", error);
  }

  return result;
};

/**
 * Record student drop-off
 * Driver records when they drop off a student at destination
 * Requires valid OTP or QR code provided by parent
 */
export const recordDrop = async (
  tripId: string,
  studentId: string,
  dropData: {
    drop_latitude?: number;
    drop_longitude?: number;
    drop_qr_code?: string;
    drop_otp?: string;
    notes?: string;
  },
): Promise<WithId<TripStudent> | null> => {
  // Find the trip student record
  const tripStudent = await tripStudentRepository.findByTripAndStudent(
    tripId,
    studentId,
  );

  if (!tripStudent) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
    );
  }

  // Check if already dropped
  if (tripStudent.pickup_status === PickupStatus.DROPPED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_DROPPED,
    );
  }

  // Check if student was picked up
  if (tripStudent.pickup_status !== PickupStatus.PICKED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.MUST_BE_PICKED_BEFORE_DROP,
    );
  }

  // Verify OTP/QR code before recording drop
  const otpVerified = await verifyOtpBeforeRecording(
    studentId,
    tripId,
    dropData.drop_otp,
    dropData.drop_qr_code,
  );

  if (!otpVerified) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
    );
  }

  // Update drop information
  const updates: Partial<TripStudent> = {
    pickup_status: PickupStatus.DROPPED,
    drop_time: new Date(),
    updated_at: new Date(),
    ...dropData,
  };

  const result = await tripStudentRepository.updateById(
    tripStudent._id.toString(),
    {
      $set: updates,
    },
  );

  // Emit parent-specific notification for drop-off
  // Get student info for notification
  try {
    const db = await getDB();
    const student = await db
      .collection(STUDENTS_COLLECTION)
      .findOne({ _id: new ObjectId(studentId) });

    if (student && student.parent_id) {
      const trip = await db
        .collection(TRIPS_COLLECTION)
        .findOne({ _id: new ObjectId(tripId) });

      const parent = await db
        .collection(PARENTS_COLLECTION)
        .findOne({ _id: new ObjectId(student.parent_id) });

      NotificationDispatcher.notifyParentStudentDropped(
        student.parent_id,
        parent?.user_id || student.parent_id,
        tripId,
        studentId,
        student.name || student.first_name || "Your child",
        trip?.driver_id,
      );
    }
  } catch (error) {
    // Don't fail the drop-off if notification fails
    console.error("Failed to send parent drop notification:", error);
  }

  return result;
};

/**
 * Update trip student record
 */
export const updateTripStudent = async (
  id: string,
  updates: Partial<TripStudent>,
): Promise<WithId<TripStudent> | null> => {
  const currentTripStudent = await tripStudentRepository.findById(id);

  if (!currentTripStudent) {
    return null;
  }

  return await tripStudentRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

/**
 * Get trip students by attendance status
 */
export const getTripStudentsByAttendanceStatus = async (
  tripId: string,
  attendanceStatus: AttendanceStatus,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByAttendanceStatus(
    tripId,
    attendanceStatus,
  );
};

/**
 * Get trip students by pickup status
 */
export const getTripStudentsByPickupStatus = async (
  tripId: string,
  pickupStatus: PickupStatus,
): Promise<WithId<TripStudent>[]> => {
  return await tripStudentRepository.findByPickupStatus(tripId, pickupStatus);
};

/**
 * Result type for bulk stop action
 */
export interface BulkStopActionResult {
  trip_type: TripType;
  processed_students: string[];
  absent_students: string[];
  failed_students: { student_id: string; reason: string }[];
}

/**
 * Bulk stop action - handles all students at one stop in a single call
 * Works for both PICKUP (morning) and DROP (evening) trips based on trip_type
 * - PICKUP: marks students as picked up
 * - DROP: marks students as dropped off (must be PICKED first)
 */
export const bulkStopAction = async (
  tripId: string,
  data: {
    student_ids: string[];
    absent_student_ids: string[];
    otp_code?: string;
    qr_code?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<BulkStopActionResult> => {
  const db = await getDB();
  const now = new Date();

  // Fetch trip to get trip_type
  const trip = await db
    .collection(TRIPS_COLLECTION)
    .findOne({ _id: new ObjectId(tripId) });

  if (!trip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
  }

  const tripType = trip.trip_type as TripType;

  const result: BulkStopActionResult = {
    trip_type: tripType,
    processed_students: [],
    absent_students: [],
    failed_students: [],
  };

  // Get all student IDs and fetch all student details upfront
  const allStudentIds = [...data.student_ids, ...data.absent_student_ids];
  if (allStudentIds.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.NO_STUDENTS_PROVIDED,
    );
  }

  // Fetch all students in one query
  const allStudents = await db
    .collection(STUDENTS_COLLECTION)
    .find({ _id: { $in: allStudentIds.map((id) => new ObjectId(id)) } })
    .toArray();

  if (allStudents.length === 0) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.STUDENT.NOT_FOUND);
  }

  // Build a map for quick lookup (keyed by string _id)
  const studentMap = new Map(
    allStudents.map((s) => [
      String(s._id),
      { parent_id: s.parent_id, student_name: s.student_name || "Your child" },
    ]),
  );

  // All students at one stop share the same parent
  const parentId = allStudents[0].parent_id;

  // If we have students to process (pickup/drop), verify OTP first
  if (data.student_ids.length > 0) {
    // DEV BYPASS: Accept "1111" as valid OTP in development environment
    const isDevBypass =
      process.env.NODE_ENV === "dev" && data.otp_code === "1111";

    if (!isDevBypass && !data.otp_code && !data.qr_code) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TRIP_STUDENT.QR_CODE_OR_OTP_REQUIRED,
      );
    }

    // Verify OTP/QR exists and is valid for this parent and trip
    const query: any = {
      parent_id: parentId,
      trip_id: tripId,
    };

    // Only add validity checks if not dev bypass
    if (!isDevBypass) {
      query.is_used = false;
      query.valid_from = { $lte: now };
      query.valid_until = { $gte: now };

      if (data.otp_code) {
        query.otp_code = data.otp_code;
      } else if (data.qr_code) {
        query.qr_code = data.qr_code;
      }
    }

    const qrOtpRecord = await db
      .collection(DAILY_QR_OTP_COLLECTION)
      .findOne(query);

    if (!qrOtpRecord) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DAILY_QR_OTP.INVALID,
      );
    }

    // Process students based on trip type
    for (const studentId of data.student_ids) {
      try {
        // Check student is in OTP's student_ids (skip in dev bypass)
        if (
          !isDevBypass &&
          !(qrOtpRecord.student_ids as string[]).includes(studentId)
        ) {
          result.failed_students.push({
            student_id: studentId,
            reason: "Student not covered by this OTP",
          });
          continue;
        }

        const tripStudent = await tripStudentRepository.findByTripAndStudent(
          tripId,
          studentId,
        );

        if (!tripStudent) {
          result.failed_students.push({
            student_id: studentId,
            reason: ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
          });
          continue;
        }

        // Build updates based on trip type
        let updates: Partial<TripStudent>;

        if (tripType === TripType.PICKUP) {
          // PICKUP: Mark as picked up
          if (tripStudent.pickup_status === PickupStatus.PICKED) {
            result.failed_students.push({
              student_id: studentId,
              reason: ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_PICKED,
            });
            continue;
          }

          updates = {
            pickup_status: PickupStatus.PICKED,
            pickup_time: now,
            attendance_status: AttendanceStatus.PRESENT,
            updated_at: now,
          };

          if (data.latitude !== undefined) {
            updates.pickup_latitude = data.latitude;
          }
          if (data.longitude !== undefined) {
            updates.pickup_longitude = data.longitude;
          }
        } else {
          // DROP: Mark as dropped off (must be PICKED first)
          if (tripStudent.pickup_status === PickupStatus.DROPPED) {
            result.failed_students.push({
              student_id: studentId,
              reason: ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_DROPPED,
            });
            continue;
          }

          if (tripStudent.pickup_status !== PickupStatus.PICKED) {
            result.failed_students.push({
              student_id: studentId,
              reason: ERROR_MESSAGES.TRIP_STUDENT.MUST_BE_PICKED_BEFORE_DROP,
            });
            continue;
          }

          updates = {
            pickup_status: PickupStatus.DROPPED,
            drop_time: now,
            updated_at: now,
          };

          if (data.latitude !== undefined) {
            updates.drop_latitude = data.latitude;
          }
          if (data.longitude !== undefined) {
            updates.drop_longitude = data.longitude;
          }
        }

        await tripStudentRepository.updateById(tripStudent._id.toString(), {
          $set: updates,
        });

        result.processed_students.push(studentId);
      } catch (error) {
        result.failed_students.push({
          student_id: studentId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update OTP verified_student_ids
    const existingVerified = qrOtpRecord.verified_student_ids || [];
    const newVerified = [
      ...new Set([...existingVerified, ...result.processed_students]),
    ];

    // Check if all students are now accounted for
    const existingAbsent = qrOtpRecord.absent_student_ids || [];
    const newAbsent = [
      ...new Set([...existingAbsent, ...data.absent_student_ids]),
    ];
    const allAccountedFor = (qrOtpRecord.student_ids as string[]).every(
      (id: string) => newVerified.includes(id) || newAbsent.includes(id),
    );

    await db.collection(DAILY_QR_OTP_COLLECTION).updateOne(
      { _id: qrOtpRecord._id },
      {
        $set: {
          verified_student_ids: newVerified,
          absent_student_ids: newAbsent,
          ...(allAccountedFor ? { is_used: true, used_at: now } : {}),
        },
      },
    );
  }

  // Process absences (no OTP needed)
  for (const studentId of data.absent_student_ids) {
    try {
      const tripStudent = await tripStudentRepository.findByTripAndStudent(
        tripId,
        studentId,
      );

      if (!tripStudent) {
        result.failed_students.push({
          student_id: studentId,
          reason: ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
        });
        continue;
      }

      // Mark as absent
      await tripStudentRepository.updateById(tripStudent._id.toString(), {
        $set: {
          attendance_status: AttendanceStatus.ABSENT,
          pickup_status: PickupStatus.NO_SHOW,
          updated_at: now,
        },
      });

      result.absent_students.push(studentId);

      // Update OTP record if not already done above
      if (data.student_ids.length === 0) {
        // Only update OTP if we didn't already do it in pickup/drop flow
        const qrOtpRecord = await db
          .collection(DAILY_QR_OTP_COLLECTION)
          .findOne({
            parent_id: parentId,
            trip_id: tripId,
            student_ids: studentId,
          });

        if (qrOtpRecord) {
          const absentStudentIds = qrOtpRecord.absent_student_ids || [];
          if (!absentStudentIds.includes(studentId)) {
            absentStudentIds.push(studentId);
          }

          const verifiedStudentIds = qrOtpRecord.verified_student_ids || [];
          const allAccountedFor = (qrOtpRecord.student_ids as string[]).every(
            (id: string) =>
              verifiedStudentIds.includes(id) || absentStudentIds.includes(id),
          );

          await db.collection(DAILY_QR_OTP_COLLECTION).updateOne(
            { _id: qrOtpRecord._id },
            {
              $set: {
                absent_student_ids: absentStudentIds,
                ...(allAccountedFor ? { is_used: true, used_at: now } : {}),
              },
            },
          );
        }
      }
    } catch (error) {
      result.failed_students.push({
        student_id: studentId,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Send consolidated notifications using already-fetched student data
  try {
    // Look up parent's user_id for notification dispatcher
    const db = await getDB();
    const parentDoc = await db
      .collection(PARENTS_COLLECTION)
      .findOne({ _id: new ObjectId(parentId) });
    const parentUserId = parentDoc?.user_id || parentId;

    // Build notifications for picked/dropped students
    if (result.processed_students.length > 0) {
      const processedStudentDetails = result.processed_students
        .filter((id) => studentMap.has(id))
        .map((id) => ({
          studentId: id,
          studentName: studentMap.get(id)!.student_name,
        }));

      logger.info(
        `[Bulk Stop Action] Processed Students | Trip: ${tripId} | Students: ${result.processed_students.join(", ")} | Driver: ${trip?.driver_id}`,
      );

      if (processedStudentDetails.length > 0) {
        if (tripType === TripType.PICKUP) {
          NotificationDispatcher.notifyParentStudentsPicked(
            parentId,
            parentUserId,
            tripId,
            processedStudentDetails,
            trip?.driver_id,
          );
        } else {
          NotificationDispatcher.notifyParentStudentsDropped(
            parentId,
            parentUserId,
            tripId,
            processedStudentDetails,
            trip?.driver_id,
          );
        }
      }
    }

    // Build notifications for absent students
    if (result.absent_students.length > 0) {
      logger.info(
        `[Bulk Stop Action] Absent Students | Trip: ${tripId} | Students: ${result.absent_students.join(", ")} | Driver: ${trip?.driver_id}`,
      );

      const absentStudentDetails = result.absent_students
        .filter((id) => studentMap.has(id))
        .map((id) => ({
          studentId: id,
          studentName: studentMap.get(id)!.student_name,
        }));

      if (absentStudentDetails.length > 0) {
        NotificationDispatcher.notifyParentStudentsAbsent(
          parentId,
          parentUserId,
          tripId,
          absentStudentDetails,
          trip?.driver_id,
        );
      }
    }
  } catch (notifyError) {
    // Don't fail the action if notification fails
    console.error("Failed to send parent notifications:", notifyError);
  }

  return result;
};

/**
 * Result type for bulk school action
 */
export interface BulkSchoolActionResult {
  trip_type: TripType;
  action: "picked_from_school" | "dropped_at_school";
  processed_students: string[];
  skipped_students: string[];
  failed_students: { student_id: string; reason: string }[];
}

/**
 * Bulk school action - handles all students at school without OTP
 * - PICKUP trip: marks PICKED students as DROPPED at school
 * - DROP trip: marks PENDING students as PICKED from school
 *   - skipped_student_ids: students not boarding (marked as NO_SHOW)
 * No OTP required since this is at school location
 */
export const bulkSchoolAction = async (
  tripId: string,
  data: {
    student_ids: string[];
    skipped_student_ids?: string[];
    latitude?: number;
    longitude?: number;
  },
): Promise<BulkSchoolActionResult> => {
  const db = await getDB();
  const now = new Date();

  // Fetch trip to get trip_type
  const trip = await db
    .collection(TRIPS_COLLECTION)
    .findOne({ _id: new ObjectId(tripId) });

  if (!trip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
  }

  const tripType = trip.trip_type as TripType;

  const result: BulkSchoolActionResult = {
    trip_type: tripType,
    action:
      tripType === TripType.PICKUP ? "dropped_at_school" : "picked_from_school",
    processed_students: [],
    skipped_students: [],
    failed_students: [],
  };

  const skippedStudentIds = data.skipped_student_ids || [];

  // For school-point, allow empty student_ids if skipped_student_ids has values (DROP trip)
  if (data.student_ids.length === 0 && skippedStudentIds.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.NO_STUDENTS_PROVIDED,
    );
  }

  // Combine all student IDs for fetching details
  const allStudentIds = [...data.student_ids, ...skippedStudentIds];

  // Fetch all student details upfront
  const allStudents = await db
    .collection(STUDENTS_COLLECTION)
    .find({ _id: { $in: allStudentIds.map((id) => new ObjectId(id)) } })
    .toArray();

  // Build a map for quick lookup (keyed by string _id)
  const studentMap = new Map(
    allStudents.map((s) => [
      String(s._id),
      { parent_id: s.parent_id, student_name: s.student_name || "Your child" },
    ]),
  );

  for (const studentId of data.student_ids) {
    try {
      const tripStudent = await tripStudentRepository.findByTripAndStudent(
        tripId,
        studentId,
      );

      if (!tripStudent) {
        result.failed_students.push({
          student_id: studentId,
          reason: ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
        });
        continue;
      }

      let updates: Partial<TripStudent>;

      if (tripType === TripType.PICKUP) {
        // PICKUP trip at school: mark as DROPPED
        if (tripStudent.pickup_status === PickupStatus.DROPPED) {
          result.failed_students.push({
            student_id: studentId,
            reason: ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_DROPPED,
          });
          continue;
        }

        if (tripStudent.pickup_status !== PickupStatus.PICKED) {
          result.failed_students.push({
            student_id: studentId,
            reason: "Student must be picked up before dropping at school",
          });
          continue;
        }

        updates = {
          pickup_status: PickupStatus.DROPPED,
          drop_time: now,
          updated_at: now,
        };

        if (data.latitude !== undefined) {
          updates.drop_latitude = data.latitude;
        }
        if (data.longitude !== undefined) {
          updates.drop_longitude = data.longitude;
        }
      } else {
        // DROP trip at school: mark as PICKED (collecting from school)
        if (tripStudent.pickup_status === PickupStatus.PICKED) {
          result.failed_students.push({
            student_id: studentId,
            reason: ERROR_MESSAGES.TRIP_STUDENT.STUDENT_ALREADY_PICKED,
          });
          continue;
        }

        updates = {
          pickup_status: PickupStatus.PICKED,
          pickup_time: now,
          attendance_status: AttendanceStatus.PRESENT,
          updated_at: now,
        };

        if (data.latitude !== undefined) {
          updates.pickup_latitude = data.latitude;
        }
        if (data.longitude !== undefined) {
          updates.pickup_longitude = data.longitude;
        }
      }

      await tripStudentRepository.updateById(tripStudent._id.toString(), {
        $set: updates,
      });

      result.processed_students.push(studentId);
    } catch (error) {
      result.failed_students.push({
        student_id: studentId,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Process skipped students (only for DROP trips - students not boarding from school)
  if (tripType === TripType.DROP && skippedStudentIds.length > 0) {
    for (const studentId of skippedStudentIds) {
      try {
        const tripStudent = await tripStudentRepository.findByTripAndStudent(
          tripId,
          studentId,
        );

        if (!tripStudent) {
          result.failed_students.push({
            student_id: studentId,
            reason: ERROR_MESSAGES.TRIP_STUDENT.NOT_FOUND,
          });
          continue;
        }

        // Mark as NO_SHOW (student not boarding for drop trip)
        if (
          tripStudent.pickup_status === PickupStatus.NO_SHOW ||
          tripStudent.attendance_status === AttendanceStatus.ABSENT
        ) {
          // Already marked as skipped/absent, skip
          result.skipped_students.push(studentId);
          continue;
        }

        await tripStudentRepository.updateById(tripStudent._id.toString(), {
          $set: {
            pickup_status: PickupStatus.NO_SHOW,
            attendance_status: AttendanceStatus.ABSENT,
            updated_at: now,
          },
        });

        result.skipped_students.push(studentId);
      } catch (error) {
        result.failed_students.push({
          student_id: studentId,
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  // Send consolidated notifications - one per parent using already-fetched data
  if (result.processed_students.length > 0) {
    try {
      // Group students by parent_id using the studentMap
      const studentsByParent = new Map<
        string,
        { studentId: string; studentName: string }[]
      >();

      for (const studentId of result.processed_students) {
        const studentInfo = studentMap.get(studentId);
        if (studentInfo && studentInfo.parent_id) {
          const existing = studentsByParent.get(studentInfo.parent_id) || [];
          existing.push({
            studentId,
            studentName: studentInfo.student_name,
          });
          studentsByParent.set(studentInfo.parent_id, existing);
        }
      }

      // Look up parent user_ids for notification dispatcher
      const db = await getDB();
      const parentIds = [...studentsByParent.keys()];
      const parentDocs = await db
        .collection(PARENTS_COLLECTION)
        .find({ _id: { $in: parentIds.map((id) => new ObjectId(id)) } })
        .toArray();
      const parentUserIdMap = new Map(
        parentDocs.map((p) => [p._id.toString(), p.user_id]),
      );

      // Send one notification per parent
      for (const [pId, pStudents] of studentsByParent) {
        const pUserId = parentUserIdMap.get(pId) || pId;
        if (tripType === TripType.PICKUP) {
          // PICKUP trip at school = dropped at school
          NotificationDispatcher.notifyParentStudentsDropped(
            pId,
            pUserId,
            tripId,
            pStudents,
            trip?.driver_id,
          );
        } else {
          // DROP trip at school = picked from school
          NotificationDispatcher.notifyParentStudentsPicked(
            pId,
            pUserId,
            tripId,
            pStudents,
            trip?.driver_id,
          );
        }
      }
    } catch (notifyError) {
      // Don't fail the action if notification fails
      console.error("Failed to send parent notifications:", notifyError);
    }
  }

  return result;
};
