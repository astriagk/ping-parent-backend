import { WithId } from "mongodb";

import { ERROR_MESSAGES, HTTP_STATUS } from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { schoolRepository } from "./school.repository";
import { School } from "./school.type";

export const createSchool = async (
  data: Omit<School, "created_at">,
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
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await schoolRepository.create(schoolData);
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

export const getSchool = async (
  schoolId: string,
): Promise<WithId<School> | null> => {
  return await schoolRepository.findById(schoolId);
};

export const updateSchool = async (
  schoolId: string,
  updates: Partial<School>,
): Promise<WithId<School> | null> => {
  // Get current school
  const currentSchool = await schoolRepository.findById(schoolId);

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
    if (duplicate && String(duplicate._id) !== schoolId) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.SCHOOL.ALREADY_EXISTS,
      );
    }
  }

  return await schoolRepository.updateById(schoolId, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const deleteSchool = async (schoolId: string): Promise<boolean> => {
  return await schoolRepository.deleteById(schoolId);
};
