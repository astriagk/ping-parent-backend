import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  VehicleType,
  VehicleTypesArray,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import { uploadFile } from "@shared/services/storage.factory";
import { assignTrimmedFields } from "@shared/utils";

import { driverOnboardingRepository } from "./driver.repository";
import {
  createDriverProfile,
  getDriverAddressByUserId,
  getDriverDocumentsByUserId,
  getDriverProfile,
  setDriverAvailability,
  updateDriverDocumentsByUserId,
  updateDriverProfile,
  upsertDriverAddressByUserId,
  upsertDriverDocumentsByUserId,
} from "./driver.service";

const getUserIdFromRequest = (req: Request): string | null => {
  return req.user?.userId || null;
};

const formatDriverProfileResponse = (profile: any) => ({
  driver_id: profile.driver_id,
  user_id: profile.user_id,
  driver_unique_id: profile.driver_unique_id,
  name: profile.name,
  email: profile.email,
  photo_url: profile.photo_url,
  home_address: profile.home_address,
  home_latitude: profile.home_latitude,
  home_longitude: profile.home_longitude,
  driving_license_number: profile.driving_license_number,
  driving_license_photo_url: profile.driving_license_photo_url,
  vehicle_license_number: profile.vehicle_license_number,
  vehicle_license_photo_url: profile.vehicle_license_photo_url,
  insurance_number: profile.insurance_number,
  insurance_photo_url: profile.insurance_photo_url,
  vehicle_type: profile.vehicle_type,
  vehicle_number: profile.vehicle_number,
  vehicle_capacity: profile.vehicle_capacity,
  current_student_count: profile.current_student_count,
  approval_status: profile.approval_status,
  is_available: profile.is_available,
  rating: profile.rating,
  total_trips: profile.total_trips,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
});

/**
 * GET /driver/profile
 * Get driver profile details
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
    );
  }

  const profile = await getDriverProfile(userId);
  if (!profile) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
    );
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...formatDriverProfileResponse(profile),
      user: profile.user,
    },
  });
});

/**
 * POST /driver/profile
 * Create driver profile (during registration)
 */
export const createProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const {
      name,
      email,
      photo_url,
      vehicle_type,
      vehicle_number,
      vehicle_capacity,
      is_available,
    } = req.body;

    // Validate required fields
    if (!name || !vehicle_type || !vehicle_number || !vehicle_capacity) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.REQUIRED_FIELDS_MISSING,
      );
    }

    // Validate vehicle type
    if (!VehicleTypesArray.includes(vehicle_type)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.INVALID_VEHICLE_TYPE,
      );
    }

    // Validate vehicle capacity
    const capacity = parseInt(vehicle_capacity);
    if (isNaN(capacity) || capacity <= 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.INVALID_VEHICLE_CAPACITY,
      );
    }

    const driverData = {
      user_id: userId,
      name: String(name).trim(),
      email: email ? String(email).trim() : undefined,
      photo_url: photo_url ? String(photo_url).trim() : undefined,
      vehicle_type: vehicle_type as VehicleType,
      vehicle_number: String(vehicle_number).trim(),
      vehicle_capacity: capacity,
      is_available: is_available !== undefined ? Boolean(is_available) : true,
    };

    const created = await createDriverProfile(userId, driverData);
    if (!created) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.DRIVER.FAILED_TO_CREATE_DRIVER_PROFILE,
      );
    }

    const createdProfile = await getDriverProfile(userId);
    if (!createdProfile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: formatDriverProfileResponse(createdProfile),
      message: SUCCESS_MESSAGES.DRIVER.PROFILE_CREATED_SUCCESSFULLY,
    });
  },
);

/**
 * PUT /driver/profile
 * Update driver profile
 */
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const { vehicle_type, vehicle_capacity, is_available } = req.body;

    const updates: any = {};
    await assignTrimmedFields(updates, req.body, [
      "name",
      "email",
      "photo_url",
      "vehicle_number",
    ]);

    if (vehicle_type !== undefined) {
      if (VehicleTypesArray.includes(vehicle_type)) {
        updates.vehicle_type = vehicle_type;
      } else {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_MESSAGES.DRIVER.INVALID_VEHICLE_TYPE,
        );
      }
    }

    if (vehicle_capacity !== undefined) {
      const capacity = parseInt(vehicle_capacity);
      if (isNaN(capacity) || capacity <= 0) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_MESSAGES.DRIVER.INVALID_VEHICLE_CAPACITY,
        );
      }
      updates.vehicle_capacity = capacity;
    }

    if (is_available !== undefined) {
      updates.is_available = Boolean(is_available);
    }

    if (Object.keys(updates).length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.NO_UPDATES_PROVIDED,
      );
    }

    const updated = await updateDriverProfile(userId, updates);

    if (!updated) {
      // Try to create profile if it doesn't exist
      const exists = await getDriverProfile(userId);
      if (!exists) {
        throw new ApiError(
          HTTP_STATUS.NOT_FOUND,
          ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
        );
      }

      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.DRIVER.FAILED_TO_UPDATE_DRIVER_PROFILE,
      );
    }

    const updatedProfile = await getDriverProfile(userId);
    if (!updatedProfile) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: formatDriverProfileResponse(updatedProfile),
      message: SUCCESS_MESSAGES.DRIVER.PROFILE_UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * GET /driver/address
 * Get driver's primary address
 */
export const getAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
    );
  }

  const address = await getDriverAddressByUserId(userId);
  if (!address) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.DRIVER.ADDRESS_NOT_FOUND,
    );
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: address,
  });
});

/**
 * POST /driver/address
 * Create or update driver's primary address
 */
export const upsertAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
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

    // Validate required fields
    if (!address_line1 || !city || !state || !latitude || !longitude) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.REQUIRED_FIELDS_MISSING,
      );
    }

    // Validate latitude and longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.INVALID_COORDINATES,
      );
    }

    const addressData = {
      driver_id: "", // Will be set by service
      address_line1: String(address_line1).trim(),
      address_line2: address_line2 ? String(address_line2).trim() : undefined,
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: pincode ? String(pincode).trim() : undefined,
      latitude: lat,
      longitude: lng,
      is_primary: is_primary !== undefined ? Boolean(is_primary) : true,
    };

    const success = await upsertDriverAddressByUserId(userId, addressData);
    if (!success) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.DRIVER.FAILED_TO_UPDATE_ADDRESS,
      );
    }

    const updatedAddress = await getDriverAddressByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedAddress,
      message: SUCCESS_MESSAGES.DRIVER.ADDRESS_UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * GET /driver/documents
 * Get driver documents
 */
export const getDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const documents = await getDriverDocumentsByUserId(userId);
    if (!documents) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DOCUMENTS_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: documents,
    });
  },
);

/**
 * POST /driver/documents
 * Create or fully update driver documents
 */
export const createDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const { driving_license_number, vehicle_license_number, insurance_number } =
      req.body;

    // Validate required fields
    if (!driving_license_number || !vehicle_license_number) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.REQUIRED_FIELDS_MISSING,
      );
    }

    const documentsData: any = {
      driver_id: "",
      driving_license_number: String(driving_license_number).trim(),
      vehicle_license_number: String(vehicle_license_number).trim(),
      insurance_number: insurance_number
        ? String(insurance_number).trim()
        : undefined,
    };

    // Handle file uploads
    const files = req.files as { [key: string]: Express.Multer.File[] };

    // Original uploadFile code (commented out)
    // if (files?.driving_license_photo?.[0]) {
    //   documentsData.driving_license_photo_url = await uploadFile(
    //     files.driving_license_photo[0],
    //     "driver-documents/driving-licenses",
    //   );
    // }
    //
    // if (files?.vehicle_license_photo?.[0]) {
    //   documentsData.vehicle_license_photo_url = await uploadFile(
    //     files.vehicle_license_photo[0],
    //     "driver-documents/vehicle-licenses",
    //   );
    // }
    //
    // if (files?.insurance_photo?.[0]) {
    //   documentsData.insurance_photo_url = await uploadFile(
    //     files.insurance_photo[0],
    //     "driver-documents/insurance",
    //   );
    // }

    // New code: Using placeholder URL
    const placeholderUrl = "https://picsum.photos/seed/picsum/200/300";

    if (files?.driving_license_photo?.[0]) {
      documentsData.driving_license_photo_url = placeholderUrl;
    }

    if (files?.vehicle_license_photo?.[0]) {
      documentsData.vehicle_license_photo_url = placeholderUrl;
    }

    if (files?.insurance_photo?.[0]) {
      documentsData.insurance_photo_url = placeholderUrl;
    }

    const success = await upsertDriverDocumentsByUserId(userId, documentsData);
    if (!success) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.DRIVER.FAILED_TO_UPDATE_DOCUMENTS,
      );
    }

    const updatedDocuments = await getDriverDocumentsByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedDocuments,
      message: SUCCESS_MESSAGES.DRIVER.DOCUMENTS_UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * PUT /driver/documents
 * Partially update driver documents
 */
export const updateDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const documents: any = {};
    await assignTrimmedFields(documents, req.body, [
      "driving_license_number",
      "vehicle_license_number",
      "insurance_number",
    ]);

    // Handle file uploads
    const files = req.files as { [key: string]: Express.Multer.File[] };

    // Original uploadFile code (commented out)
    // if (files?.driving_license_photo?.[0]) {
    //   documents.driving_license_photo_url = await uploadFile(
    //     files.driving_license_photo[0],
    //     "driver-documents/driving-licenses",
    //   );
    // }
    //
    // if (files?.vehicle_license_photo?.[0]) {
    //   documents.vehicle_license_photo_url = await uploadFile(
    //     files.vehicle_license_photo[0],
    //     "driver-documents/vehicle-licenses",
    //   );
    // }
    //
    // if (files?.insurance_photo?.[0]) {
    //   documents.insurance_photo_url = await uploadFile(
    //     files.insurance_photo[0],
    //     "driver-documents/insurance",
    //   );
    // }

    // New code: Using placeholder URL
    const placeholderUrl = "https://picsum.photos/seed/picsum/200/300";

    if (files?.driving_license_photo?.[0]) {
      documents.driving_license_photo_url = placeholderUrl;
    }

    if (files?.vehicle_license_photo?.[0]) {
      documents.vehicle_license_photo_url = placeholderUrl;
    }

    if (files?.insurance_photo?.[0]) {
      documents.insurance_photo_url = placeholderUrl;
    }

    if (Object.keys(documents).length === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.DRIVER.NO_UPDATES_PROVIDED,
      );
    }

    const updated = await updateDriverDocumentsByUserId(userId, documents);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.DRIVER.FAILED_TO_UPDATE_DOCUMENTS,
      );
    }

    const updatedDocuments = await getDriverDocumentsByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedDocuments,
      message: SUCCESS_MESSAGES.DRIVER.DOCUMENTS_UPDATED_SUCCESSFULLY,
    });
  },
);

/**
 * PATCH /driver/availability
 * Set driver availability status
 */
export const setAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const { is_available } = req.body;

    if (is_available === undefined) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Availability status (is_available) is required",
      );
    }

    const updated = await setDriverAvailability(userId, Boolean(is_available));

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    const updatedProfile = await getDriverProfile(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedProfile ? formatDriverProfileResponse(updatedProfile) : null,
      message: "Driver availability updated successfully",
    });
  },
);

/**
 * GET /driver/onboarding/screen
 * Get driver onboarding screen progress
 */
export const getDriverOnboardingScreen = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const record = await driverOnboardingRepository.findByUserId(userId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: record?.screen_name || null,
    });
  },
);

/**
 * PUT /driver/onboarding/screen
 * Update driver onboarding screen progress
 */
export const updateDriverOnboardingScreen = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const { screen_name } = req.body;
    await driverOnboardingRepository.upsertByUserId(userId, screen_name);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Screen updated successfully",
    });
  },
);
