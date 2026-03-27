import { ObjectId } from "mongodb";

import { User } from "@modules/auth/auth.type";
import { getDB } from "@shared/config";
import {
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  USERS_COLLECTION,
} from "@shared/constants";
import { HTTP_STATUS } from "@shared/constants";
import { ERROR_MESSAGES } from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { parentRepository } from "./parent.repository";
import { Parent, ParentAddress, ParentAddressInput } from "./parent.type";

/**
 * Get parent profile by user_id
 * Returns combined data from users and parents tables
 */
export const getParentProfile = async (
  userId: string,
): Promise<(Parent & { user?: User }) | null> => {
  const db = await getDB();

  // Query users collection
  const userQuery: any = {
    _id: new ObjectId(userId),
  };

  const user = await db.collection(USERS_COLLECTION).findOne(userQuery);

  if (!user) {
    return null;
  }

  // Query parents collection by user_id
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    return null;
  }

  // Return combined profile
  return {
    ...parent,
    user: {
      phone_number: user.phone_number,
      user_type: user.user_type,
      is_active: user.is_active,
      fcm_token: user.fcm_token,
      last_login: user.last_login,
    } as User,
  } as Parent & { user?: User };
};

/**
 * Update parent profile in parents table
 */
export const updateParentProfile = async (
  userId: string,
  updates: Partial<Parent>,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // Remove fields that shouldn't be updated
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, user_id, ...sanitizedUpdates } = updates;

    // Find parent by user_id
    const result = await db.collection(PARENTS_COLLECTION).updateOne(
      { user_id: userId },
      {
        $set: { ...sanitizedUpdates, updated_at: new Date() },
      },
    );

    return result.modifiedCount > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Create parent profile in parents table
 * Called after user is created during registration
 */
export const createParentProfile = async (
  userId: string,
  parentData: Partial<Parent>,
): Promise<boolean> => {
  try {
    const db = await getDB();

    const newParent = {
      user_id: userId,
      name: parentData.name || "",
      email: parentData.email,
      photo_url: parentData.photo_url,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection(PARENTS_COLLECTION).insertOne(newParent);
    return !!result.insertedId;
  } catch (error) {
    return false;
  }
};

/**
 * Check if parent profile exists for a user
 */
export const parentProfileExists = async (userId: string): Promise<boolean> => {
  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });
  return !!parent;
};

/**
 * Upsert address by user_id (finds parent first, then updates/creates address)
 */
export const upsertAddressByUserId = async (
  userId: string,
  address: ParentAddressInput,
): Promise<boolean> => {
  try {
    const db = await getDB();

    // First, find the parent_id from the parents collection
    const parent = await db
      .collection(PARENTS_COLLECTION)
      .findOne({ user_id: userId });

    if (!parent) {
      return false;
    }

    const parentId = String(parent._id);

    // Try to update existing primary address first
    const updateResult = await db
      .collection(PARENT_ADDRESSES_COLLECTION)
      .updateOne(
        { parent_id: parentId, is_primary: true },
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
        parent_id: parentId,
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
        .collection(PARENT_ADDRESSES_COLLECTION)
        .insertOne(newAddress);
      return !!insertResult.insertedId;
    }

    return updateResult.modifiedCount > 0;
  } catch {
    return false;
  }
};

/**
 * Get primary address by user_id (finds parent first, then gets address)
 */
export const getAddressByUserId = async (
  userId: string,
): Promise<ParentAddress | null> => {
  try {
    const db = await getDB();

    // First, find the parent_id from the parents collection
    const parent = await db
      .collection(PARENTS_COLLECTION)
      .findOne({ user_id: userId });

    if (!parent) {
      return null;
    }

    const parentId = String(parent._id);

    // Get the primary address for this parent
    const address = await db
      .collection(PARENT_ADDRESSES_COLLECTION)
      .findOne({ parent_id: parentId, is_primary: true });

    return address as ParentAddress | null;
  } catch {
    return null;
  }
};

/**
 * Get complete parent details by parent_id (for admin verification)
 * Includes parent info, user info, addresses, and students
 */
export const getCompleteParentDetailsById = async (
  parentId: string,
): Promise<any> => {
  try {
    return await parentRepository.findByIdWithDetails(parentId);
  } catch (_) {
    return null;
  }
};

/**
 * Get active trips for a parent's children
 * Uses aggregation pipeline for efficient querying
 * Flow: user_id -> parent_id -> students -> trip_students -> trips (with status = in_progress/started)
 */
export const getParentActiveTrips = async (userId: string): Promise<any[]> => {
  const result = await parentRepository.findActiveTripsWithDetails(userId);
  const faceTResult = result[0] as any;

  if (faceTResult.error === "PARENT_NOT_FOUND") {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT?.PARENT_PROFILE_NOT_FOUND || "Parent not found",
    );
  }

  return faceTResult.trips || [];
};

/**
 * Get all trips (active + completed) for a parent's children
 * Uses aggregation pipeline for efficient querying
 */
export const getParentAllTrips = async (userId: string): Promise<any[]> => {
  const result = await parentRepository.findAllTripsWithDetails(userId);
  const facetResult = result[0] as any;

  if (facetResult.error === "PARENT_NOT_FOUND") {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT?.PARENT_PROFILE_NOT_FOUND || "Parent not found",
    );
  }

  return facetResult.trips || [];
};
