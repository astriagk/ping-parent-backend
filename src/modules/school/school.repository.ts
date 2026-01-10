import { WithId } from "mongodb";

import { SCHOOLS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { School } from "./school.type";

export class SchoolRepository extends BaseRepository<School> {
  constructor() {
    super(SCHOOLS_COLLECTION);
  }

  async findByCity(city: string): Promise<WithId<School>[]> {
    return await this.findMany({ city });
  }

  async findByState(state: string): Promise<WithId<School>[]> {
    return await this.findMany({ state });
  }

  async findDuplicateSchool(
    schoolName: string,
    city: string,
  ): Promise<WithId<School> | null> {
    return await this.findOne({
      school_name: schoolName,
      city: city,
    });
  }

  async searchSchools(query: string): Promise<WithId<School>[]> {
    const regex = new RegExp(query, "i");
    return await this.findMany({
      $or: [{ school_name: { $regex: regex } }, { city: { $regex: regex } }],
    } as any);
  }

  async findBySchoolId(schoolId: string): Promise<WithId<School> | null> {
    return await this.findOne({ school_id: schoolId });
  }
}

export const schoolRepository = new SchoolRepository();
