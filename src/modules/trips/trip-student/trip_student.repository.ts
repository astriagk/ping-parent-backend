import { WithId } from "mongodb";

import { TripStudent } from "@modules/trips/trip-student/trip_student.type";
import {
  AttendanceStatus,
  PickupStatus,
  TRIP_STUDENTS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

export class TripStudentRepository extends BaseRepository<TripStudent> {
  constructor() {
    super(TRIP_STUDENTS_COLLECTION);
  }

  /**
   * Find all trip students for a specific trip
   */
  async findByTripId(tripId: string): Promise<WithId<TripStudent>[]> {
    return await this.findMany({ trip_id: tripId });
  }

  /**
   * Find all trips for a specific student
   */
  async findByStudentId(studentId: string): Promise<WithId<TripStudent>[]> {
    return await this.findMany({ student_id: studentId });
  }

  /**
   * Find a specific trip student record
   */
  async findByTripAndStudent(
    tripId: string,
    studentId: string,
  ): Promise<WithId<TripStudent> | null> {
    return await this.findOne({ trip_id: tripId, student_id: studentId });
  }

  /**
   * Find duplicate trip student record
   */
  async findDuplicateTripStudent(
    tripId: string,
    studentId: string,
  ): Promise<WithId<TripStudent> | null> {
    return await this.findOne({
      trip_id: tripId,
      student_id: studentId,
    });
  }

  /**
   * Find trip students by attendance status
   */
  async findByAttendanceStatus(
    tripId: string,
    attendanceStatus: AttendanceStatus,
  ): Promise<WithId<TripStudent>[]> {
    return await this.findMany({
      trip_id: tripId,
      attendance_status: attendanceStatus,
    });
  }

  /**
   * Find trip students by pickup status
   */
  async findByPickupStatus(
    tripId: string,
    pickupStatus: PickupStatus,
  ): Promise<WithId<TripStudent>[]> {
    return await this.findMany({
      trip_id: tripId,
      pickup_status: pickupStatus,
    });
  }

  /**
   * Find trip students ordered by sequence
   */
  async findByTripIdOrderedBySequence(
    tripId: string,
  ): Promise<WithId<TripStudent>[]> {
    return await this.getCollection()
      .find({ trip_id: tripId })
      .sort({ sequence_order: 1 })
      .toArray();
  }

  /**
   * Find trip student by QR code
   */
  async findByQRCode(
    qrCode: string,
    type: "pickup" | "drop",
  ): Promise<WithId<TripStudent> | null> {
    if (type === "pickup") {
      return await this.findOne({ pickup_qr_code: qrCode });
    } else {
      return await this.findOne({ drop_qr_code: qrCode });
    }
  }

  /**
   * Find trip student by OTP
   */
  async findByOTP(
    otp: string,
    type: "pickup" | "drop",
  ): Promise<WithId<TripStudent> | null> {
    if (type === "pickup") {
      return await this.findOne({ pickup_otp: otp });
    } else {
      return await this.findOne({ drop_otp: otp });
    }
  }
}

export const tripStudentRepository = new TripStudentRepository();
