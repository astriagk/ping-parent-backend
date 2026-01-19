import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  createSchool as createSchoolService,
  deleteSchool as deleteSchoolService,
  getAllSchools as getAllSchoolsService,
  getSchool as getSchoolService,
  getSchoolsByCity,
  getSchoolsByState,
  searchSchools,
  updateSchool as updateSchoolService,
} from "./school.service";

export const createSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const schoolData = req.body;

    const school = await createSchoolService(schoolData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: school,
      message: SUCCESS_MESSAGES.SCHOOL.CREATED_SUCCESSFULLY,
    });
  },
);

export const getSchool = asyncHandler(async (req: Request, res: Response) => {
  const { school_id } = req.params;

  const school = await getSchoolService(school_id);

  if (!school) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.SCHOOL.NOT_FOUND);
  }

  return res.json({
    success: true,
    data: school,
    message: SUCCESS_MESSAGES.SCHOOL.FETCHED_SUCCESSFULLY,
  });
});

export const getAllSchools = asyncHandler(
  async (req: Request, res: Response) => {
    const { city, state, search } = req.query;

    let schools;

    if (search) {
      schools = await searchSchools(search as string);
    } else if (city) {
      schools = await getSchoolsByCity(city as string);
    } else if (state) {
      schools = await getSchoolsByState(state as string);
    } else {
      schools = await getAllSchoolsService();
    }

    return res.json({
      success: true,
      data: schools,
      message: SUCCESS_MESSAGES.SCHOOL.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const updateSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { school_id } = req.params;
    const updates = req.body;

    const school = await updateSchoolService(school_id, updates);

    if (!school) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: school,
      message: SUCCESS_MESSAGES.SCHOOL.UPDATED_SUCCESSFULLY,
    });
  },
);

export const deleteSchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { school_id } = req.params;

    const deleted = await deleteSchoolService(school_id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.SCHOOL.DELETED_SUCCESSFULLY,
    });
  },
);
