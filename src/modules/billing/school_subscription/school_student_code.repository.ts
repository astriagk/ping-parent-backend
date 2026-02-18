import { WithId } from "mongodb";

import { SCHOOL_STUDENT_CODES_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { SchoolStudentCode } from "./school_student_code.type";

export class SchoolStudentCodeRepository extends BaseRepository<SchoolStudentCode> {
  constructor() {
    super(SCHOOL_STUDENT_CODES_COLLECTION);
  }

  async findByCode(code: string): Promise<WithId<SchoolStudentCode> | null> {
    return await this.findOne({ code });
  }

  async findBySchoolSubscriptionId(
    schoolSubscriptionId: string,
  ): Promise<WithId<SchoolStudentCode>[]> {
    return await this.findMany({
      school_subscription_id: schoolSubscriptionId,
    });
  }

  async findUnredeemedByStudentAndSub(
    studentId: string,
    schoolSubscriptionId: string,
  ): Promise<WithId<SchoolStudentCode> | null> {
    return await this.findOne({
      student_id: studentId,
      school_subscription_id: schoolSubscriptionId,
      is_redeemed: false,
    });
  }

  async findAvailableCodes(): Promise<WithId<SchoolStudentCode>[]> {
    return await this.findMany({
      is_redeemed: false,
      end_date: { $gte: new Date() },
    } as any);
  }

  async markRedeemed(
    id: string,
    parentMongoId: string,
  ): Promise<WithId<SchoolStudentCode> | null> {
    return await this.updateById(id, {
      $set: {
        is_redeemed: true,
        redeemed_by_parent_id: parentMongoId,
        redeemed_at: new Date(),
      },
    });
  }
}

export const schoolStudentCodeRepository = new SchoolStudentCodeRepository();
