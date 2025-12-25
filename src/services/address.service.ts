import {
  PARENT_ADDRESSES_COLLECTION,
  PARENTS_COLLECTION,
} from "@config/collections";
import { connectDB } from "@db/mongo";
import { ParentAddress, ParentAddressInput } from "@models/index";

/**
 * Upsert address by user_id (finds parent first, then updates/creates address)
 */
export const upsertAddressByUserId = async (
  userId: string,
  address: ParentAddressInput
): Promise<boolean> => {
  try {
    const db = await connectDB();

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
        }
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
  } catch (error) {
    return false;
  }
};

/**
 * Get primary address by user_id (finds parent first, then gets address)
 */
export const getAddressByUserId = async (
  userId: string
): Promise<ParentAddress | null> => {
  try {
    const db = await connectDB();

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
  } catch (error) {
    return null;
  }
};
