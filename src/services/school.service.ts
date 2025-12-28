import { WithId } from "mongodb";
import { nanoid } from "nanoid";

import { ERROR_MESSAGES, HTTP_STATUS } from "@constants";
import { ApiError } from "@middlewares";
import { School } from "@models/school.type";
import { schoolRepository } from "@repositories/school.repository";

export const createSchool = async (
  data: Omit<School, "school_id" | "created_at">,
): Promise<WithId<School>> => {
  // Check for duplicate school (same name and city)
  const duplicate = await schoolRepository.findDuplicateSchool(
    data.school_name,
    data.city,
  );

  if (duplicate) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.SCHOOL.ALREADY_EXISTS,
    );
  }

  const schoolData: School = {
    school_id: nanoid(),
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await schoolRepository.create(schoolData);
};

export const getSchoolById = async (
  id: string,
): Promise<WithId<School> | null> => {
  return await schoolRepository.findById(id);
};

export const getAllSchools = async (): Promise<WithId<School>[]> => {
  return await schoolRepository.findMany();
};

export const getSchoolsByCity = async (
  city: string,
): Promise<WithId<School>[]> => {
  return await schoolRepository.findByCity(city);
};

export const getSchoolsByState = async (
  state: string,
): Promise<WithId<School>[]> => {
  return await schoolRepository.findByState(state);
};

export const searchSchools = async (
  query: string,
): Promise<WithId<School>[]> => {
  return await schoolRepository.searchSchools(query);
};

export const updateSchool = async (
  id: string,
  updates: Partial<School>,
): Promise<WithId<School> | null> => {
  // Get current school
  const currentSchool = await schoolRepository.findById(id);

  if (!currentSchool) {
    return null;
  }

  // Check for duplicate if updating name or city
  if (updates.school_name || updates.city) {
    const duplicate = await schoolRepository.findDuplicateSchool(
      updates.school_name || currentSchool.school_name,
      updates.city || currentSchool.city,
    );

    // If duplicate exists and it's not the same school
    if (duplicate && duplicate._id.toString() !== id) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.SCHOOL.ALREADY_EXISTS,
      );
    }
  }

  return await schoolRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const deleteSchool = async (id: string): Promise<boolean> => {
  return await schoolRepository.deleteById(id);
};
