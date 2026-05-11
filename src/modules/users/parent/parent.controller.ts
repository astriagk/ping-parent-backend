import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  adminBulkCreateParents,
  adminBulkCreateParentsWithStudents,
  adminCreateParentWithUser,
  adminDeleteParentCascade,
  adminGetParentAddress,
  adminUpdateParent,
  adminUpsertParentAddress,
  createParentProfile,
  getAddressByUserId,
  getParentActiveTrips,
  getParentAllTrips,
  getParentProfile,
  updateParentProfile,
  upsertAddressByUserId,
} from "./parent.service";
import {
  AdminBulkParentWithStudentsRecord,
  AdminCreateParentInput,
} from "./parent.type";

const getUserIdFromRequest = (req: Request): string | null => {
  return req.user?.userId || null;
};

const formatParentProfileResponse = (profile: any) => ({
  parent_id: profile.parent_id,
  user_id: profile.user_id,
  name: profile.name,
  email: profile.email,
  photo_url: profile.photo_url,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

export const getProfileParent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const profile = await getParentProfile(userId);
    if (!profile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...formatParentProfileResponse(profile),
        user: profile.user,
      },
    });
  },
);

export const updateProfileParent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const { name, email, photo_url } = req.body;
    const updates: Partial<{ name: string; email: string; photo_url: string }> =
      {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName) updates.name = trimmedName;
    }

    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (trimmedEmail) updates.email = trimmedEmail;
    }

    if (photo_url !== undefined) {
      const trimmedPhotoUrl = String(photo_url).trim();
      if (trimmedPhotoUrl) updates.photo_url = trimmedPhotoUrl;
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.PARENT.NO_UPDATES_PROVIDED,
      );
    }

    let updated = await updateParentProfile(userId, updates);

    if (!updated) {
      const created = await createParentProfile(userId, updates);
      if (!created) {
        throw new ApiError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGES.COMMON.UPDATE_FAILED,
        );
      }
    }

    const updatedProfile = await getParentProfile(userId);
    if (!updatedProfile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: formatParentProfileResponse(updatedProfile),
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const updateAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const {
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      latitude,
      longitude,
      is_primary,
    } = req.body;

    const trimmedAddressLine1 = String(address_line1 || "").trim();
    const trimmedCity = String(city || "").trim();
    const trimmedState = String(state || "").trim();

    if (!trimmedAddressLine1 || !trimmedCity || !trimmedState) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ADDRESS.ADDRESS_FIELDS_REQUIRED,
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.ADDRESS.INVALID_COORDINATES,
      );
    }

    const addressData = {
      address_line1: trimmedAddressLine1,
      address_line2: address_line2 ? String(address_line2).trim() : undefined,
      city: trimmedCity,
      state: trimmedState,
      pincode: pincode ? String(pincode).trim() : undefined,
      latitude: lat,
      longitude: lng,
      is_primary: is_primary !== undefined ? Boolean(is_primary) : true,
    };

    const updated = await upsertAddressByUserId(userId, addressData);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.COMMON.UPDATE_FAILED,
      );
    }

    const updatedAddress = await getAddressByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedAddress,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const getAddressParent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const address = await getAddressByUserId(userId);

    if (!address) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.ADDRESS.ADDRESS_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: address,
    });
  },
);

/**
 * Get active trips for parent's children
 * Active = trip_status is STARTED or IN_PROGRESS
 */
export const getMyActiveTripsParent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const trips = await getParentActiveTrips(userId);

    return res.json({
      success: true,
      data: trips,
      count: trips.length,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

/**
 * Get all trips for parent's children
 * Includes all statuses (active, completed, scheduled, cancelled)
 */
export const getMyAllTrips = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const trips = await getParentAllTrips(userId);

    return res.json({
      success: true,
      data: trips,
      count: trips.length,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

export const adminCreateParentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await adminCreateParentWithUser(
      req.body as AdminCreateParentInput,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

export const adminUpdateParentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { parentId } = req.params as Record<string, string>;
    const updates: Record<string, string> = {};

    if (req.body.name !== undefined)
      updates.name = String(req.body.name).trim();
    if (req.body.email !== undefined)
      updates.email = String(req.body.email).trim();
    if (req.body.photo_url !== undefined)
      updates.photo_url = String(req.body.photo_url).trim();

    const updated = await adminUpdateParent(parentId, updates);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const adminDeleteParentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { parentId } = req.params as Record<string, string>;

    const ok = await adminDeleteParentCascade(parentId);

    if (!ok) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
    });
  },
);

export const adminGetParentAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { parentId } = req.params as Record<string, string>;
    const address = await adminGetParentAddress(parentId);

    if (!address) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.ADDRESS.ADDRESS_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: address,
    });
  },
);

export const adminUpsertParentAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { parentId } = req.params as Record<string, string>;

    const {
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      latitude,
      longitude,
    } = req.body;

    const addressData = {
      address_line1: String(address_line1).trim(),
      address_line2: address_line2 ? String(address_line2).trim() : undefined,
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: pincode ? String(pincode).trim() : undefined,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      is_primary: true,
    };

    const updated = await adminUpsertParentAddress(parentId, addressData);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const adminBulkCreateParentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parents = (req.body?.parents || []) as AdminCreateParentInput[];
    const result = await adminBulkCreateParents(parents);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

export const adminBulkParentsWithStudentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const records = (req.body?.records ||
      []) as AdminBulkParentWithStudentsRecord[];
    const result = await adminBulkCreateParentsWithStudents(records);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);
