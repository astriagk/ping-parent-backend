import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import {
  createParentProfile,
  getAddressByUserId,
  getParentProfile,
  updateParentProfile,
  upsertAddressByUserId,
} from "@shared/services/parent.service";

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

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
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
});

export const updateProfile = asyncHandler(
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
          ERROR_MESSAGES.PARENT.FAILED_TO_UPDATE_PARENT_PROFILE,
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
      message: SUCCESS_MESSAGES.PARENT.PROFILE_UPDATED_SUCCESSFULLY,
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
        ERROR_MESSAGES.ADDRESS.FAILED_TO_UPDATE_ADDRESS,
      );
    }

    const updatedAddress = await getAddressByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedAddress,
      message: SUCCESS_MESSAGES.ADDRESS.ADDRESS_UPDATED_SUCCESSFULLY,
    });
  },
);

export const getAddress = asyncHandler(async (req: Request, res: Response) => {
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
});
