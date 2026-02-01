import { WithId } from "mongodb";

import { SCHOOL_ADMINS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { SchoolAdmin } from "./school_admin.type";

export class SchoolAdminRepository extends BaseRepository<SchoolAdmin> {
  constructor() {
    super(SCHOOL_ADMINS_COLLECTION);
  }

  async findByEmail(email: string): Promise<WithId<SchoolAdmin> | null> {
    return await this.findOne({ email });
  }

  async findBySchoolId(schoolId: string): Promise<WithId<SchoolAdmin>[]> {
    const collection = this.getCollection();
    return await collection
      .find({ school_id: schoolId, is_active: true })
      .toArray();
  }

  async findActiveAdminBySchool(
    schoolId: string,
  ): Promise<WithId<SchoolAdmin> | null> {
    return await this.findOne({ school_id: schoolId, is_active: true });
  }

  async findByAdminId(adminId: string): Promise<WithId<SchoolAdmin> | null> {
    return await this.findOne({ admin_id: adminId });
  }

  async countBySchoolId(schoolId: string): Promise<number> {
    const collection = this.getCollection();
    return await collection.countDocuments({ school_id: schoolId });
  }
}

export const schoolAdminRepository = new SchoolAdminRepository();
