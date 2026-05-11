import { ObjectId, WithId } from "mongodb";

import { userRepository } from "@modules/auth/auth.repository";
import { User } from "@modules/auth/auth.type";
import { getDB } from "@shared/config";
import {
  AlphabetType,
  ApprovalStatus,
  AssignmentStatus,
  DRIVERS_COLLECTION,
  DRIVER_ADDRESSES_COLLECTION,
  DRIVER_DOCUMENTS_COLLECTION,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  TRIPS_COLLECTION,
  TripStatus,
  USERS_COLLECTION,
  UniqueCodeTypes,
  UserRole,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

import {
  driverAddressRepository,
  driverDocumentRepository,
  driverRepository,
} from "./driver.repository";
import {
  AdminCreateDriverInput,
  AdminCreateDriverResult,
  AdminUpdateDriverInput,
  Driver,
  DriverAddress,
  DriverAddressInput,
  DriverDocument,
  DriverDocumentInput,
  DriverDocumentUpdate,
  DriverInput,
  DriverProfileUpdate,
} from "./driver.type";

/**
 * Get driver profile by user_id
 * Returns combined data from users and drivers tables
 */
export const getDriverProfile = async (
  userId: string,
): Promise<(Driver & { user?: User }) | null> => {
  const db = await getDB();

  // Query users collection
  const userQuery: any = {
    _id: new ObjectId(userId),
  };

  const user = await db.collection(USERS_COLLECTION).findOne(userQuery);

  if (!user) {
    return null;
  }

  // Query drivers collection by user_id
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ user_id: userId });

  if (!driver) {
    return null;
  }

  // Return combined profile
  return {
    ...driver,
    user: {
      phone_number: user.phone_number,
      user_type: user.user_type,
      is_active: user.is_active,
      fcm_token: user.fcm_token,
      last_login: user.last_login,
    } as User,
  } as Driver & { user?: User };
};

/**
 * Create driver profile in drivers table
 * Called after user is created during registration
 */
export const createDriverProfile = async (
  userId: string,
  driverData: DriverInput,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // Generate unique driver ID
    let driverUniqueId = generateUniqueCode(UniqueCodeTypes.DRIVER, {
      length: 6,
      alphabetType: AlphabetType.Numbers,
    });
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await db
        .collection(DRIVERS_COLLECTION)
        .findOne({ driver_unique_id: driverUniqueId });
      if (!existing) break;
      driverUniqueId = generateUniqueCode(UniqueCodeTypes.DRIVER, {
        length: 6,
        alphabetType: AlphabetType.Numbers,
      });
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return false;
    }

    const newDriver = {
      user_id: userId,
      driver_unique_id: driverUniqueId,
      name: driverData.name,
      email: driverData.email,
      photo_url: driverData.photo_url,
      vehicle_type: driverData.vehicle_type,
      vehicle_number: driverData.vehicle_number,
      vehicle_capacity: driverData.vehicle_capacity,
      current_student_count: 0,
      approval_status: ApprovalStatus.PENDING,
      is_available:
        driverData.is_available !== undefined ? driverData.is_available : true,
      rating: 0.0,
      total_trips: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection(DRIVERS_COLLECTION).insertOne(newDriver);
    return !!result.insertedId;
  } catch {
    return false;
  }
};

/**
 * Update driver profile in drivers table
 */
export const updateDriverProfile = async (
  userId: string,
  updates: DriverProfileUpdate,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // Remove fields that shouldn't be updated
    const { ...sanitizedUpdates } = updates;

    // Find driver by user_id
    const result = await db.collection(DRIVERS_COLLECTION).updateOne(
      { user_id: userId },
      {
        $set: { ...sanitizedUpdates, updated_at: new Date() },
      },
    );

    return result.modifiedCount > 0;
  } catch {
    return false;
  }
};

/**
 * Set driver availability status
 */
export const setDriverAvailability = async (
  userId: string,
  isAvailable: boolean,
): Promise<boolean> => {
  try {
    const db = await getDB();

    const result = await db.collection(DRIVERS_COLLECTION).updateOne(
      { user_id: userId },
      {
        $set: { is_available: isAvailable, updated_at: new Date() },
      },
    );

    return result.modifiedCount > 0;
  } catch {
    return false;
  }
};

/**
 * Check if driver profile exists for a user
 */
export const driverProfileExists = async (userId: string): Promise<boolean> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ user_id: userId });
  return !!driver;
};

/**
 * Get driver by driver_unique_id (for parent search)
 */
export const getDriverByUniqueId = async (
  driverUniqueId: string,
): Promise<Driver | null> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ driver_unique_id: driverUniqueId });
  return driver as Driver | null;
};

/**
 * Upsert driver address by user_id (finds driver first, then updates/creates address)
 */
export const upsertDriverAddressByUserId = async (
  userId: string,
  address: DriverAddressInput,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // First, find the driver_id from the drivers collection
    const driver = await db
      .collection(DRIVERS_COLLECTION)
      .findOne({ user_id: userId });

    if (!driver) {
      return false;
    }

    const driverId = String(driver._id);

    // Try to update existing primary address first
    const updateResult = await db
      .collection(DRIVER_ADDRESSES_COLLECTION)
      .updateOne(
        { driver_id: driverId, is_primary: true },
        {
          $set: {
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: address.latitude,
            longitude: address.longitude,
            updated_at: new Date(),
          },
        },
      );

    // If no existing address found, create a new one
    if (updateResult.matchedCount === 0) {
      const newAddress = {
        driver_id: driverId,
        address_line1: address.address_line1,
        address_line2: address.address_line2,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        latitude: address.latitude,
        longitude: address.longitude,
        is_primary:
          address.is_primary !== undefined ? address.is_primary : true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const insertResult = await db
        .collection(DRIVER_ADDRESSES_COLLECTION)
        .insertOne(newAddress);
      return !!insertResult.insertedId;
    }

    return updateResult.modifiedCount > 0;
  } catch {
    return false;
  }
};

/**
 * Get primary driver address by user_id (finds driver first, then gets address)
 */
export const getDriverAddressByUserId = async (
  userId: string,
): Promise<DriverAddress | null> => {
  try {
    const db = await getDB();

    // First, find the driver_id from the drivers collection
    const driver = await db
      .collection(DRIVERS_COLLECTION)
      .findOne({ user_id: userId });

    if (!driver) {
      return null;
    }

    const driverId = String(driver._id);

    // Get the primary address for this driver
    const address = await db
      .collection(DRIVER_ADDRESSES_COLLECTION)
      .findOne({ driver_id: driverId, is_primary: true });

    return address as DriverAddress | null;
  } catch {
    return null;
  }
};

/**
 * Upsert driver documents by user_id (finds driver first, then updates/creates documents)
 */
export const upsertDriverDocumentsByUserId = async (
  userId: string,
  documents: DriverDocumentInput,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // First, find the driver_id from the drivers collection
    const driver = await db
      .collection(DRIVERS_COLLECTION)
      .findOne({ user_id: userId });

    if (!driver) {
      return false;
    }

    const driverId = String(driver._id);

    // Try to update existing documents first
    const updateResult = await db
      .collection(DRIVER_DOCUMENTS_COLLECTION)
      .updateOne(
        { driver_id: driverId },
        {
          $set: {
            driving_license_number: documents.driving_license_number,
            driving_license_photo_url: documents.driving_license_photo_url,
            vehicle_license_number: documents.vehicle_license_number,
            vehicle_license_photo_url: documents.vehicle_license_photo_url,
            insurance_number: documents.insurance_number,
            insurance_photo_url: documents.insurance_photo_url,
            updated_at: new Date(),
          },
        },
      );

    // If no existing documents found, create a new record
    if (updateResult.matchedCount === 0) {
      const newDocuments = {
        driver_id: driverId,
        driving_license_number: documents.driving_license_number,
        driving_license_photo_url: documents.driving_license_photo_url,
        vehicle_license_number: documents.vehicle_license_number,
        vehicle_license_photo_url: documents.vehicle_license_photo_url,
        insurance_number: documents.insurance_number,
        insurance_photo_url: documents.insurance_photo_url,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const insertResult = await db
        .collection(DRIVER_DOCUMENTS_COLLECTION)
        .insertOne(newDocuments);
      return !!insertResult.insertedId;
    }

    return updateResult.modifiedCount > 0;
  } catch {
    return false;
  }
};

/**
 * Update driver documents partially by user_id
 */
export const updateDriverDocumentsByUserId = async (
  userId: string,
  updates: DriverDocumentUpdate,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // First, find the driver_id from the drivers collection
    const driver = await db
      .collection(DRIVERS_COLLECTION)
      .findOne({ user_id: userId });

    if (!driver) {
      return false;
    }

    const driverId = String(driver._id);

    // Update only the provided fields
    const result = await db.collection(DRIVER_DOCUMENTS_COLLECTION).updateOne(
      { driver_id: driverId },
      {
        $set: { ...updates, updated_at: new Date() },
      },
    );

    return result.modifiedCount > 0;
  } catch {
    return false;
  }
};

/**
 * Get driver documents by user_id (finds driver first, then gets documents)
 */
export const getDriverDocumentsByUserId = async (
  userId: string,
): Promise<DriverDocument | null> => {
  try {
    const db = await getDB();

    // First, find the driver_id from the drivers collection
    const driver = await db
      .collection(DRIVERS_COLLECTION)
      .findOne({ user_id: userId });

    if (!driver) {
      return null;
    }

    const driverId = String(driver._id);

    // Get the documents for this driver
    const documents = await db
      .collection(DRIVER_DOCUMENTS_COLLECTION)
      .findOne({ driver_id: driverId });

    return documents as DriverDocument | null;
  } catch {
    return null;
  }
};

/**
 * Get complete driver details by driver_id (for admin verification)
 * Includes driver info, user info, addresses, and documents
 */
export const getCompleteDriverDetailsById = async (
  driverId: string,
): Promise<any> => {
  try {
    const db = await getDB();

    const result = await db
      .collection(DRIVERS_COLLECTION)
      .aggregate([
        {
          $match: {
            user_id: driverId,
          },
        },
        {
          $addFields: {
            user_id: { $toObjectId: "$user_id" },
          },
        },
        {
          $lookup: {
            from: USERS_COLLECTION,
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: DRIVER_ADDRESSES_COLLECTION,
            let: { driverId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$driver_id", "$$driverId"] },
                },
              },
            ],
            as: "addresses",
          },
        },
        {
          $unwind: {
            path: "$addresses",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: DRIVER_DOCUMENTS_COLLECTION,
            let: { driverId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$driver_id", "$$driverId"] },
                },
              },
            ],
            as: "documents",
          },
        },
        {
          $unwind: {
            path: "$documents",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            driver_id: 1,
            user_id: 1,
            driver_unique_id: 1,
            name: 1,
            email: 1,
            photo_url: 1,
            vehicle_type: 1,
            vehicle_number: 1,
            vehicle_capacity: 1,
            current_student_count: 1,
            approval_status: 1,
            approved_by: 1,
            approved_at: 1,
            rejection_reason: 1,
            is_available: 1,
            rating: 1,
            total_trips: 1,
            created_at: 1,
            updated_at: 1,
            user: {
              phone_number: "$user.phone_number",
              user_type: "$user.user_type",
              is_active: "$user.is_active",
              fcm_token: "$user.fcm_token",
              last_login: "$user.last_login",
            },
            addresses: 1,
            documents: 1,
          },
        },
      ])
      .toArray();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error getting complete driver details:", error);
    return null;
  }
};

const generateUniqueDriverCode = async (): Promise<string> => {
  const db = await getDB();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateUniqueCode(UniqueCodeTypes.DRIVER, {
      length: 6,
      alphabetType: AlphabetType.Numbers,
    });
    const existing = await db
      .collection(DRIVERS_COLLECTION)
      .findOne({ driver_unique_id: code });
    if (!existing) {
      return code;
    }
  }
  throw new ApiError(
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_MESSAGES.COMMON.CREATE_FAILED,
  );
};

export const adminCreateDriverWithUser = async (
  data: AdminCreateDriverInput,
  adminId: string,
): Promise<AdminCreateDriverResult> => {
  const phoneTaken = await userRepository.findByPhoneNumber(data.phone_number);
  if (phoneTaken) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED,
    );
  }

  const now = new Date();
  const userDoc = await userRepository.create({
    phone_number: data.phone_number,
    user_type: UserRole.DRIVER,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  const userId = String(userDoc._id);
  const driverUniqueId = await generateUniqueDriverCode();

  const driverDoc = await driverRepository.createDriver({
    user_id: userId,
    driver_unique_id: driverUniqueId,
    name: data.name,
    email: data.email,
    photo_url: data.photo_url,
    vehicle_type: data.vehicle_type,
    vehicle_number: data.vehicle_number,
    vehicle_capacity: data.vehicle_capacity,
    current_student_count: 0,
    approval_status: ApprovalStatus.APPROVED,
    approved_by: adminId,
    approved_at: now,
    is_available: true,
    rating: 0,
    total_trips: 0,
    school_id: data.school_id,
    created_at: now,
    updated_at: now,
  });

  const driverId = String(driverDoc._id);

  let documentsId: string | undefined;
  if (data.documents) {
    const created = await driverDocumentRepository.create({
      driver_id: driverId,
      driving_license_number: data.documents.driving_license_number,
      driving_license_photo_url: data.documents.driving_license_photo_url,
      vehicle_license_number: data.documents.vehicle_license_number,
      vehicle_license_photo_url: data.documents.vehicle_license_photo_url,
      insurance_number: data.documents.insurance_number,
      insurance_photo_url: data.documents.insurance_photo_url,
      created_at: now,
      updated_at: now,
    } as any);
    documentsId = String(created._id);
  }

  return {
    user_id: userId,
    driver_id: driverId,
    driver_unique_id: driverUniqueId,
    documents_id: documentsId,
  };
};

export const adminUpdateDriverProfile = async (
  driverId: string,
  updates: AdminUpdateDriverInput,
): Promise<WithId<Driver> | null> => {
  if (!ObjectId.isValid(driverId)) {
    return null;
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DRIVER.NO_UPDATES_PROVIDED,
    );
  }
  return await driverRepository.updateById(driverId, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const adminDeleteDriverCascade = async (
  driverId: string,
): Promise<boolean> => {
  if (!ObjectId.isValid(driverId)) {
    return false;
  }

  const driver = await driverRepository.findById(driverId);
  if (!driver) {
    return false;
  }

  const db = await getDB();
  const now = new Date();

  if (ObjectId.isValid(driver.user_id)) {
    await db
      .collection(USERS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(driver.user_id) },
        { $set: { is_active: false, updated_at: now } },
      );
  }

  await db.collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION).updateMany(
    {
      driver_id: driverId,
      assignment_status: {
        $in: [
          AssignmentStatus.ACTIVE,
          AssignmentStatus.PENDING,
          AssignmentStatus.PARENT_REQUESTED,
        ],
      },
    },
    {
      $set: {
        assignment_status: AssignmentStatus.INACTIVE,
        end_date: now,
        updated_at: now,
      },
    },
  );

  await db.collection(TRIPS_COLLECTION).updateMany(
    {
      driver_id: driverId,
      trip_status: TripStatus.SCHEDULED,
    },
    {
      $set: { trip_status: TripStatus.CANCELLED, updated_at: now },
    },
  );

  return true;
};

export const adminGetDriverAddress = async (
  driverId: string,
): Promise<WithId<DriverAddress> | null> => {
  if (!ObjectId.isValid(driverId)) {
    return null;
  }
  return await driverAddressRepository.findOne({
    driver_id: driverId,
    is_primary: true,
  });
};

export const adminUpsertDriverAddress = async (
  driverId: string,
  address: DriverAddressInput,
): Promise<WithId<DriverAddress> | null> => {
  if (!ObjectId.isValid(driverId)) {
    return null;
  }
  const driver = await driverRepository.findById(driverId);
  if (!driver) {
    return null;
  }

  const existing = await driverAddressRepository.findOne({
    driver_id: driverId,
    is_primary: true,
  });
  const now = new Date();
  if (existing) {
    return await driverAddressRepository.updateOne(
      { driver_id: driverId, is_primary: true },
      {
        $set: {
          address_line1: address.address_line1,
          address_line2: address.address_line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: address.latitude,
          longitude: address.longitude,
          updated_at: now,
        },
      },
    );
  }

  return await driverAddressRepository.create({
    driver_id: driverId,
    address_line1: address.address_line1,
    address_line2: address.address_line2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    latitude: address.latitude,
    longitude: address.longitude,
    is_primary: true,
    created_at: now,
    updated_at: now,
  } as any);
};

export const adminGetDriverDocuments = async (
  driverId: string,
): Promise<WithId<DriverDocument> | null> => {
  if (!ObjectId.isValid(driverId)) {
    return null;
  }
  return await driverDocumentRepository.findOne({ driver_id: driverId });
};

export const adminUpsertDriverDocuments = async (
  driverId: string,
  documents: DriverDocumentInput,
): Promise<WithId<DriverDocument> | null> => {
  if (!ObjectId.isValid(driverId)) {
    return null;
  }
  const driver = await driverRepository.findById(driverId);
  if (!driver) {
    return null;
  }

  const existing = await driverDocumentRepository.findOne({
    driver_id: driverId,
  });
  const now = new Date();
  if (existing) {
    return await driverDocumentRepository.updateOne(
      { driver_id: driverId },
      {
        $set: {
          driving_license_number: documents.driving_license_number,
          driving_license_photo_url: documents.driving_license_photo_url,
          vehicle_license_number: documents.vehicle_license_number,
          vehicle_license_photo_url: documents.vehicle_license_photo_url,
          insurance_number: documents.insurance_number,
          insurance_photo_url: documents.insurance_photo_url,
          updated_at: now,
        },
      },
    );
  }

  return await driverDocumentRepository.create({
    driver_id: driverId,
    driving_license_number: documents.driving_license_number,
    driving_license_photo_url: documents.driving_license_photo_url,
    vehicle_license_number: documents.vehicle_license_number,
    vehicle_license_photo_url: documents.vehicle_license_photo_url,
    insurance_number: documents.insurance_number,
    insurance_photo_url: documents.insurance_photo_url,
    created_at: now,
    updated_at: now,
  } as any);
};

export const adminUpdateDriverDocuments = async (
  driverId: string,
  updates: DriverDocumentUpdate,
): Promise<WithId<DriverDocument> | null> => {
  if (!ObjectId.isValid(driverId)) {
    return null;
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.DRIVER.NO_UPDATES_PROVIDED,
    );
  }
  return await driverDocumentRepository.updateOne(
    { driver_id: driverId },
    { $set: { ...updates, updated_at: new Date() } },
  );
};

/**
 * Update driver approval status by user_id (for admin use)
 */
export const updateDriverApprovalStatus = async (
  userId: string,
  approvalStatus: ApprovalStatus,
  adminId: string,
  rejectionReason?: string,
): Promise<boolean> => {
  try {
    const db = await getDB();

    const updateData: any = {
      approval_status: approvalStatus,
      updated_at: new Date(),
    };

    if (approvalStatus === ApprovalStatus.APPROVED) {
      updateData.approved_by = adminId;
      updateData.approved_at = new Date();
      updateData.rejection_reason = null;
    } else if (approvalStatus === ApprovalStatus.REJECTED) {
      updateData.approved_by = adminId;
      updateData.approved_at = new Date();
      updateData.rejection_reason = rejectionReason || null;
    } else if (approvalStatus === ApprovalStatus.PENDING) {
      updateData.approved_by = null;
      updateData.approved_at = null;
      updateData.rejection_reason = null;
    }

    const result = await db.collection(DRIVERS_COLLECTION).updateOne(
      { user_id: userId },
      {
        $set: updateData,
      },
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error updating driver approval status:", error);
    return false;
  }
};
