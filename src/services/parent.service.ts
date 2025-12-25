import { connectDB } from "@db/mongo";
import { USERS_COLLECTION, PARENTS_COLLECTION } from "@config/collections";
import { Parent, User } from "@models/index";
import { ObjectId } from "mongodb";

/**
 * Get parent profile by user_id
 * Returns combined data from users and parents tables
 */
export const getParentProfile = async (
  userId: string
): Promise<(Parent & { user?: User }) | null> => {
  const db = await connectDB();

  // Query users collection
  const userQuery: any = {
    _id: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
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
  updates: Partial<Parent>
): Promise<boolean> => {
  try {
    const db = await connectDB();

    // Remove fields that shouldn't be updated
    const { _id, parent_id, user_id, ...sanitizedUpdates } = updates;

    // Find parent by user_id
    const result = await db.collection(PARENTS_COLLECTION).updateOne(
      { user_id: userId },
      {
        $set: { ...sanitizedUpdates, updated_at: new Date() },
      }
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
  parentData: Partial<Parent>
): Promise<boolean> => {
  try {
    const db = await connectDB();

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
  const db = await connectDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });
  return !!parent;
};
