import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  SUCCESS_MESSAGES_COMMON,
  VehicleType,
  VehicleTypesArray,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import { deleteFile, uploadFile } from "@shared/services/file-storage.service";
import { assignTrimmedFields } from "@shared/utils";

import { driverOnboardingRepository } from "./driver.repository";
import {
  adminCreateDriverWithUser,
  adminDeleteDriverCascade,
  adminGetDriverAddress,
  adminGetDriverDocuments,
  adminUpdateDriverDocuments,
  adminUpdateDriverProfile,
  adminUpsertDriverAddress,
  adminUpsertDriverDocuments,
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
import {
  AdminCreateDriverInput,
  DriverAddressInput,
  DriverDocumentInput,
  DriverDocumentUpdate,
} from "./driver.type";

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
        ERROR_MESSAGES.COMMON.CREATE_FAILED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
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
        ERROR_MESSAGES.COMMON.UPDATE_FAILED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
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

    // Validate required fields (use == null to allow 0 as a valid coordinate)
    if (
      !address_line1 ||
      !city ||
      !state ||
      latitude == null ||
      longitude == null
    ) {
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
        ERROR_MESSAGES.COMMON.UPDATE_FAILED,
      );
    }

    const updatedAddress = await getDriverAddressByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedAddress,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
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
    if (files?.driving_license_photo?.[0]) {
      documentsData.driving_license_photo_url = await uploadFile(
        files.driving_license_photo[0],
        `driver-documents/driving-licenses/${userId}`,
      );
    }

    if (files?.vehicle_license_photo?.[0]) {
      documentsData.vehicle_license_photo_url = await uploadFile(
        files.vehicle_license_photo[0],
        `driver-documents/vehicle-licenses/${userId}`,
      );
    }

    if (files?.insurance_photo?.[0]) {
      documentsData.insurance_photo_url = await uploadFile(
        files.insurance_photo[0],
        `driver-documents/insurance/${userId}`,
      );
    }

    const success = await upsertDriverDocumentsByUserId(userId, documentsData);
    if (!success) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_MESSAGES.COMMON.UPDATE_FAILED,
      );
    }

    const updatedDocuments = await getDriverDocumentsByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedDocuments,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
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

    // Get existing documents to delete old files
    const existingDocuments = await getDriverDocumentsByUserId(userId);

    // Delete and upload driving license photo
    if (files?.driving_license_photo?.[0]) {
      if (existingDocuments?.driving_license_photo_url) {
        await deleteFile(existingDocuments.driving_license_photo_url);
      }
      documents.driving_license_photo_url = await uploadFile(
        files.driving_license_photo[0],
        `driver-documents/driving-licenses/${userId}`,
      );
    }

    // Delete and upload vehicle license photo
    if (files?.vehicle_license_photo?.[0]) {
      if (existingDocuments?.vehicle_license_photo_url) {
        await deleteFile(existingDocuments.vehicle_license_photo_url);
      }
      documents.vehicle_license_photo_url = await uploadFile(
        files.vehicle_license_photo[0],
        `driver-documents/vehicle-licenses/${userId}`,
      );
    }

    // Delete and upload insurance photo
    if (files?.insurance_photo?.[0]) {
      if (existingDocuments?.insurance_photo_url) {
        await deleteFile(existingDocuments.insurance_photo_url);
      }
      documents.insurance_photo_url = await uploadFile(
        files.insurance_photo[0],
        `driver-documents/insurance/${userId}`,
      );
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
        ERROR_MESSAGES.COMMON.UPDATE_FAILED,
      );
    }

    const updatedDocuments = await getDriverDocumentsByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updatedDocuments,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

const requireAdminId = (req: Request): string => {
  const adminId = req.admin?.adminId;
  if (!adminId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
    );
  }
  return adminId;
};

export const adminCreateDriverHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = requireAdminId(req);
    const result = await adminCreateDriverWithUser(
      req.body as AdminCreateDriverInput,
      adminId,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

export const adminUpdateDriverHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;
    const updated = await adminUpdateDriverProfile(driverId, req.body);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const adminDeleteDriverHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;
    const ok = await adminDeleteDriverCascade(driverId);

    if (!ok) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
    });
  },
);

export const adminGetDriverAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;
    const address = await adminGetDriverAddress(driverId);

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
  },
);

export const adminUpsertDriverAddressHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;

    const {
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      latitude,
      longitude,
    } = req.body;

    const data: DriverAddressInput = {
      driver_id: "",
      address_line1: String(address_line1).trim(),
      address_line2: address_line2 ? String(address_line2).trim() : undefined,
      city: String(city).trim(),
      state: String(state).trim(),
      pincode: pincode ? String(pincode).trim() : undefined,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      is_primary: true,
    };

    const updated = await adminUpsertDriverAddress(driverId, data);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const adminGetDriverDocumentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;
    const docs = await adminGetDriverDocuments(driverId);

    if (!docs) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DOCUMENTS_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: docs,
    });
  },
);

export const adminUpsertDriverDocumentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;

    const data: DriverDocumentInput = {
      driver_id: "",
      driving_license_number: String(req.body.driving_license_number).trim(),
      driving_license_photo_url: req.body.driving_license_photo_url,
      vehicle_license_number: String(req.body.vehicle_license_number).trim(),
      vehicle_license_photo_url: req.body.vehicle_license_photo_url,
      insurance_number: req.body.insurance_number,
      insurance_photo_url: req.body.insurance_photo_url,
    };

    const updated = await adminUpsertDriverDocuments(driverId, data);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DRIVER_PROFILE_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const adminUpdateDriverDocumentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params as Record<string, string>;

    const updates: DriverDocumentUpdate = {};
    const allowed: (keyof DriverDocumentUpdate)[] = [
      "driving_license_number",
      "driving_license_photo_url",
      "vehicle_license_number",
      "vehicle_license_photo_url",
      "insurance_number",
      "insurance_photo_url",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (updates as any)[key] = req.body[key];
      }
    }

    const updated = await adminUpdateDriverDocuments(driverId, updates);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.DRIVER.DOCUMENTS_NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);
