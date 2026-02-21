import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  changeSchoolAdminPassword as changeSchoolAdminPasswordService,
  deactivateSchoolAdmin as deactivateSchoolAdminService,
  getSchoolAdminById as getSchoolAdminByIdService,
  getSchoolAdmins as getSchoolAdminsService,
  loginSchoolAdmin as loginSchoolAdminService,
  registerSchoolAdmin as registerSchoolAdminService,
  updateSchoolAdmin as updateSchoolAdminService,
} from "./school_admin.service";

/**
 * Register new school admin
 * @route POST /api/v1/school/admin/register
 */
export const registerSchoolAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const admin = await registerSchoolAdminService(req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: admin,
      message: SUCCESS_MESSAGES.SCHOOL_ADMIN.REGISTERED_SUCCESSFULLY,
    });
  },
);

/**
 * Login school admin
 * @route POST /api/v1/school/admin/login
 */
export const loginSchoolAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await loginSchoolAdminService(req.body);

    return res.json({
      success: true,
      data: {
        admin: result.admin,
        tokens: result.tokens,
      },
      message: SUCCESS_MESSAGES.SCHOOL_ADMIN.LOGIN_SUCCESSFUL,
    });
  },
);

/**
 * Get current school admin (requires auth)
 * @route GET /api/v1/school/admin/me
 */
export const getCurrentSchoolAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.admin?.adminId;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const admin = await getSchoolAdminByIdService(adminId);

    if (!admin) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_ADMIN.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: admin,
      message: SUCCESS_MESSAGES.SCHOOL_ADMIN.RETRIEVED_SUCCESSFULLY,
    });
  },
);

/**
 * Get all admins for a school (admin only)
 * @route GET /api/v1/school/admin/:schoolId
 */
export const getSchoolAdmins = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    if (!schoolId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_ADMIN.SCHOOL_ID_REQUIRED,
      );
    }

    const admins = await getSchoolAdminsService(schoolId);

    return res.json({
      success: true,
      data: admins,
      message: SUCCESS_MESSAGES.SCHOOL_ADMIN.LIST_RETRIEVED_SUCCESSFULLY,
    });
  },
);

/**
 * Update school admin profile
 * @route PATCH /api/v1/school/admin
 */
export const updateSchoolAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.admin?.adminId;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const admin = await updateSchoolAdminService(adminId, req.body);

    if (!admin) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SCHOOL_ADMIN.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: admin,
      message: SUCCESS_MESSAGES.SCHOOL_ADMIN.UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * Change school admin password
 * @route POST /api/v1/school/admin/change-password
 */
export const changeSchoolAdminPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.admin?.adminId;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const { current_password, new_password } = req.body;

    await changeSchoolAdminPasswordService(
      adminId,
      current_password,
      new_password,
    );

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.SCHOOL_ADMIN.PASSWORD_CHANGED_SUCCESSFULLY,
    });
  },
);

/**
 * Deactivate school admin (admin only)
 * @route POST /api/v1/school/admin/:adminId/deactivate
 */
export const deactivateSchoolAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { adminId } = req.params as Record<string, string>;

    if (!adminId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.SCHOOL_ADMIN.ADMIN_ID_REQUIRED,
      );
    }

    await deactivateSchoolAdminService(adminId);

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.SCHOOL_ADMIN.DEACTIVATED_SUCCESSFULLY,
    });
  },
);
