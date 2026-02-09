import { WithId } from "mongodb";

import { DAILY_QR_OTP_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { DailyQrOtp } from "./daily_qr_otp.type";

export class DailyQrOtpRepository extends BaseRepository<DailyQrOtp> {
  constructor() {
    super(DAILY_QR_OTP_COLLECTION);
  }

  async findByQrCode(qrCode: string): Promise<WithId<DailyQrOtp> | null> {
    return await this.findOne({ qr_code: qrCode });
  }

  async findByOtpCode(otpCode: string): Promise<WithId<DailyQrOtp> | null> {
    return await this.findOne({ otp_code: otpCode });
  }

  /**
   * Find OTP by parent and trip (parent-grouped OTP)
   */
  async findByParentAndTrip(
    parentId: string,
    tripId: string,
  ): Promise<WithId<DailyQrOtp> | null> {
    return await this.findOne({
      parent_id: parentId,
      trip_id: tripId,
    });
  }

  /**
   * Find OTP containing a specific student in student_ids array
   */
  async findByStudentAndTrip(
    studentId: string,
    tripId: string,
  ): Promise<WithId<DailyQrOtp> | null> {
    return await this.findOne({
      student_ids: studentId,
      trip_id: tripId,
    });
  }

  async findByTripId(tripId: string): Promise<WithId<DailyQrOtp>[]> {
    return await this.findMany({ trip_id: tripId });
  }

  /**
   * Find all OTPs containing a specific student
   */
  async findByStudentId(studentId: string): Promise<WithId<DailyQrOtp>[]> {
    return await this.findMany({ student_ids: studentId });
  }

  /**
   * Find all OTPs for a parent
   */
  async findByParentId(parentId: string): Promise<WithId<DailyQrOtp>[]> {
    return await this.findMany({ parent_id: parentId });
  }

  async findValidQrOtp(
    qrCode?: string,
    otpCode?: string,
  ): Promise<WithId<DailyQrOtp> | null> {
    const now = new Date();
    const query: any = {
      is_used: false,
      valid_from: { $lte: now },
      valid_until: { $gte: now },
    };

    if (qrCode) {
      query.qr_code = qrCode;
    } else if (otpCode) {
      query.otp_code = otpCode;
    }

    return await this.findOne(query);
  }

  /**
   * Find valid OTP by OTP code and trip (for verification)
   */
  async findValidOtpByCodeAndTrip(
    otpCode: string,
    tripId: string,
  ): Promise<WithId<DailyQrOtp> | null> {
    const now = new Date();
    return await this.findOne({
      otp_code: otpCode,
      trip_id: tripId,
      is_used: false,
      valid_from: { $lte: now },
      valid_until: { $gte: now },
    });
  }

  /**
   * Find valid OTP containing a specific student
   */
  async findValidOtpForStudent(
    studentId: string,
    tripId: string,
    otpCode?: string,
    qrCode?: string,
  ): Promise<WithId<DailyQrOtp> | null> {
    const now = new Date();
    const query: any = {
      student_ids: studentId,
      trip_id: tripId,
      is_used: false,
      valid_from: { $lte: now },
      valid_until: { $gte: now },
    };

    if (otpCode) {
      query.otp_code = otpCode;
    } else if (qrCode) {
      query.qr_code = qrCode;
    }

    return await this.findOne(query);
  }
}

export const dailyQrOtpRepository = new DailyQrOtpRepository();
