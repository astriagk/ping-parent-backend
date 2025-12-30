import { WithId } from "mongodb";

import { DAILY_QR_OTP_COLLECTION } from "@constants";
import { DailyQrOtp } from "@models/daily_qr_otp.type";

import { BaseRepository } from "./base.repository";

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

  async findByStudentAndTrip(
    studentId: string,
    tripId: string,
  ): Promise<WithId<DailyQrOtp> | null> {
    return await this.findOne({
      student_id: studentId,
      trip_id: tripId,
    });
  }

  async findByTripId(tripId: string): Promise<WithId<DailyQrOtp>[]> {
    return await this.findMany({ trip_id: tripId });
  }

  async findByStudentId(studentId: string): Promise<WithId<DailyQrOtp>[]> {
    return await this.findMany({ student_id: studentId });
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
}

export const dailyQrOtpRepository = new DailyQrOtpRepository();
