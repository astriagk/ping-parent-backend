import { WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  PARENTS_COLLECTION,
  SCHOOL_STUDENT_CODES_COLLECTION,
  STUDENTS_COLLECTION,
  USERS_COLLECTION,
} from "@shared/constants";
import { BaseRepository } from "@shared/database";

import {
  SchoolStudentCode,
  SchoolStudentCodeListItem,
} from "./school_student_code.type";

export class SchoolStudentCodeRepository extends BaseRepository<SchoolStudentCode> {
  constructor() {
    super(SCHOOL_STUDENT_CODES_COLLECTION);
  }

  async findByCode(code: string): Promise<WithId<SchoolStudentCode> | null> {
    return await this.findOne({ code });
  }

  async findBySchoolSubscriptionId(
    schoolSubscriptionId: string,
  ): Promise<SchoolStudentCodeListItem[]> {
    const db = getDB();
    return (await db
      .collection(this.collectionName)
      .aggregate([
        { $match: { school_subscription_id: schoolSubscriptionId } },
        {
          $lookup: {
            from: STUDENTS_COLLECTION,
            let: { studentId: { $toObjectId: "$student_id" } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$studentId"] } } },
              {
                $project: {
                  student_name: 1,
                  class: 1,
                  section: 1,
                  parent_id: 1,
                },
              },
            ],
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
        // Join student's parent
        {
          $lookup: {
            from: PARENTS_COLLECTION,
            let: {
              parentId: {
                $cond: {
                  if: "$student.parent_id",
                  then: { $toObjectId: "$student.parent_id" },
                  else: null,
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ["$$parentId", null] },
                      { $eq: ["$_id", "$$parentId"] },
                    ],
                  },
                },
              },
              { $project: { name: 1, email: 1, user_id: 1 } },
            ],
            as: "parent",
          },
        },
        { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
        // Join parent user for phone number
        {
          $lookup: {
            from: USERS_COLLECTION,
            let: {
              userId: {
                $cond: {
                  if: "$parent.user_id",
                  then: { $toObjectId: "$parent.user_id" },
                  else: null,
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ["$$userId", null] },
                      { $eq: ["$_id", "$$userId"] },
                    ],
                  },
                },
              },
              { $project: { phone_number: 1 } },
            ],
            as: "parent_user",
          },
        },
        { $unwind: { path: "$parent_user", preserveNullAndEmptyArrays: true } },
        // Join parent who redeemed the code
        {
          $lookup: {
            from: PARENTS_COLLECTION,
            let: {
              parentId: {
                $cond: {
                  if: "$redeemed_by_parent_id",
                  then: { $toObjectId: "$redeemed_by_parent_id" },
                  else: null,
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ["$$parentId", null] },
                      { $eq: ["$_id", "$$parentId"] },
                    ],
                  },
                },
              },
              { $project: { name: 1 } },
            ],
            as: "redeemed_by",
          },
        },
        { $unwind: { path: "$redeemed_by", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            code: 1,
            school_subscription_id: 1,
            school_id: 1,
            student_id: 1,
            plan_id: 1,
            end_date: 1,
            is_redeemed: 1,
            redeemed_by_parent_id: 1,
            redeemed_at: 1,
            created_at: 1,
            student_name: "$student.student_name",
            student_class: "$student.class",
            student_section: "$student.section",
            redeemed_by_name: "$redeemed_by.name",
            parent_name: "$parent.name",
            parent_email: "$parent.email",
            parent_phone: "$parent_user.phone_number",
          },
        },
      ])
      .toArray()) as SchoolStudentCodeListItem[];
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
