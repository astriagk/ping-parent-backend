import { WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  AttendanceStatus,
  DAILY_QR_OTP_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PickupStatus,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TripType,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { tripStudentRepository } from "./trip_student.repository";
import { TripStudent } from "./trip_student.type";

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
 */
const verifyOtpBeforeRecording = async (
  studentId: string,
  tripId: string,
  otpCode?: string,
  qrCode?: string,
): Promise<boolean> => {
  // If neither OTP nor QR code provided, not required
  if (!otpCode && !qrCode) {
    return true;
  }

  const db = await getDB();
  const now = new Date();

  // First, get the student's parent_id
  const student = await db
    .collection(STUDENTS_COLLECTION)
    .findOne({ student_id: studentId });

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

  console.log(validQrOtp);

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
      .findOne({ student_id: studentId });

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

  console.log("OTP verification result for pickup:", { otpVerified });

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

  return await tripStudentRepository.updateById(tripStudent._id.toString(), {
    $set: updates,
  });
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

  return await tripStudentRepository.updateById(tripStudent._id.toString(), {
    $set: updates,
  });
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
    .findOne({ trip_id: tripId });

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

  // Get parent_id from first available student (all should share same parent)
  const allStudentIds = [...data.student_ids, ...data.absent_student_ids];
  if (allStudentIds.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.NO_STUDENTS_PROVIDED,
    );
  }

  const firstStudent = await db
    .collection(STUDENTS_COLLECTION)
    .findOne({ student_id: allStudentIds[0] });

  if (!firstStudent) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.STUDENT.NOT_FOUND);
  }

  const parentId = firstStudent.parent_id;

  // If we have students to process (pickup/drop), verify OTP first
  if (data.student_ids.length > 0) {
    if (!data.otp_code && !data.qr_code) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TRIP_STUDENT.QR_CODE_OR_OTP_REQUIRED,
      );
    }

    // Verify OTP/QR exists and is valid for this parent and trip
    const query: any = {
      parent_id: parentId,
      trip_id: tripId,
      is_used: false,
      valid_from: { $lte: now },
      valid_until: { $gte: now },
    };

    if (data.otp_code) {
      query.otp_code = data.otp_code;
    } else if (data.qr_code) {
      query.qr_code = data.qr_code;
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
        // Check student is in OTP's student_ids
        if (!(qrOtpRecord.student_ids as string[]).includes(studentId)) {
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

  return result;
};

/**
 * Result type for bulk school action
 */
export interface BulkSchoolActionResult {
  trip_type: TripType;
  action: "picked_from_school" | "dropped_at_school";
  processed_students: string[];
  failed_students: { student_id: string; reason: string }[];
}

/**
 * Bulk school action - handles all students at school without OTP
 * - PICKUP trip: marks PICKED students as DROPPED at school
 * - DROP trip: marks PENDING students as PICKED from school
 * No OTP required since this is at school location
 */
export const bulkSchoolAction = async (
  tripId: string,
  data: {
    student_ids: string[];
    latitude?: number;
    longitude?: number;
  },
): Promise<BulkSchoolActionResult> => {
  const db = await getDB();
  const now = new Date();

  // Fetch trip to get trip_type
  const trip = await db
    .collection(TRIPS_COLLECTION)
    .findOne({ trip_id: tripId });

  if (!trip) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
  }

  const tripType = trip.trip_type as TripType;

  const result: BulkSchoolActionResult = {
    trip_type: tripType,
    action:
      tripType === TripType.PICKUP ? "dropped_at_school" : "picked_from_school",
    processed_students: [],
    failed_students: [],
  };

  if (data.student_ids.length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.TRIP_STUDENT.NO_STUDENTS_PROVIDED,
    );
  }

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

  return result;
};
