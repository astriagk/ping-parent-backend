import { ObjectId, WithId } from "mongodb";

import { userRepository } from "@modules/auth/auth.repository";
import { User } from "@modules/auth/auth.type";
import { getDB } from "@shared/config";
import {
  AssignmentStatus,
  DRIVER_STUDENT_ASSIGNMENTS_COLLECTION,
  PARENTS_COLLECTION,
  PARENT_ADDRESSES_COLLECTION,
  STUDENTS_COLLECTION,
  USERS_COLLECTION,
  UserRole,
} from "@shared/constants";
import { HTTP_STATUS } from "@shared/constants";
import { ERROR_MESSAGES } from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { parentAddressRepository, parentRepository } from "./parent.repository";
import {
  AdminBulkParentResult,
  AdminBulkParentWithStudentsRecord,
  AdminBulkParentsWithStudentsResultItem,
  AdminCreateParentInput,
  AdminCreateParentResult,
  AdminUpdateParentInput,
  Parent,
  ParentAddress,
  ParentAddressInput,
} from "./parent.type";

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

export const adminCreateParentWithUser = async (
  data: AdminCreateParentInput,
): Promise<AdminCreateParentResult> => {
  const phoneExists = await userRepository.findByPhoneNumber(data.phone_number);
  if (phoneExists) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.PHONE.PHONE_ALREADY_REGISTERED,
    );
  }

  const now = new Date();
  const userDoc = await userRepository.create({
    phone_number: data.phone_number,
    user_type: UserRole.PARENT,
    is_active: true,
    created_at: now,
    updated_at: now,
  });

  const userId = String(userDoc._id);

  const parentDoc = await parentRepository.createParent({
    user_id: userId,
    name: data.name,
    email: data.email,
    photo_url: data.photo_url,
    created_at: now,
    updated_at: now,
  });

  const parentId = String(parentDoc._id);

  let addressId: string | undefined;
  if (data.address) {
    const created = await parentAddressRepository.create({
      parent_id: parentId,
      address_line1: data.address.address_line1,
      address_line2: data.address.address_line2,
      city: data.address.city,
      state: data.address.state,
      pincode: data.address.pincode,
      latitude: data.address.latitude,
      longitude: data.address.longitude,
      is_primary: true,
      created_at: now,
      updated_at: now,
    } as any);
    addressId = String(created._id);
  }

  return { user_id: userId, parent_id: parentId, address_id: addressId };
};

export const adminUpdateParent = async (
  parentId: string,
  updates: AdminUpdateParentInput,
): Promise<WithId<Parent> | null> => {
  if (!ObjectId.isValid(parentId)) {
    return null;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PARENT.NO_UPDATES_PROVIDED,
    );
  }

  return await parentRepository.updateById(parentId, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const adminDeleteParentCascade = async (
  parentId: string,
): Promise<boolean> => {
  if (!ObjectId.isValid(parentId)) {
    return false;
  }

  const parent = await parentRepository.findById(parentId);
  if (!parent) {
    return false;
  }

  const db = await getDB();
  const now = new Date();

  if (ObjectId.isValid(parent.user_id)) {
    await db
      .collection(USERS_COLLECTION)
      .updateOne(
        { _id: new ObjectId(parent.user_id) },
        { $set: { is_active: false, updated_at: now } },
      );
  }

  const students = await db
    .collection(STUDENTS_COLLECTION)
    .find({ parent_id: parentId })
    .toArray();
  const studentIds = students.map((s) => String(s._id));

  if (studentIds.length > 0) {
    await db
      .collection(STUDENTS_COLLECTION)
      .updateMany(
        { parent_id: parentId },
        { $set: { is_active: false, updated_at: now } },
      );

    await db.collection(DRIVER_STUDENT_ASSIGNMENTS_COLLECTION).updateMany(
      {
        student_id: { $in: studentIds },
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
  }

  return true;
};

export const adminGetParentAddress = async (
  parentId: string,
): Promise<WithId<ParentAddress> | null> => {
  if (!ObjectId.isValid(parentId)) {
    return null;
  }
  return await parentAddressRepository.findOne({
    parent_id: parentId,
    is_primary: true,
  });
};

export const adminUpsertParentAddress = async (
  parentId: string,
  address: ParentAddressInput,
): Promise<WithId<ParentAddress> | null> => {
  if (!ObjectId.isValid(parentId)) {
    return null;
  }

  const parent = await parentRepository.findById(parentId);
  if (!parent) {
    return null;
  }

  const existing = await parentAddressRepository.findOne({
    parent_id: parentId,
    is_primary: true,
  });

  const now = new Date();
  if (existing) {
    return await parentAddressRepository.updateOne(
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
          updated_at: now,
        },
      },
    );
  }

  const created = await parentAddressRepository.create({
    parent_id: parentId,
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
  return created;
};

export const adminBulkCreateParents = async (
  parents: AdminCreateParentInput[],
): Promise<{
  results: AdminBulkParentResult[];
  created: number;
  skipped: number;
}> => {
  const results: AdminBulkParentResult[] = [];
  let created = 0;
  let skipped = 0;

  for (const item of parents) {
    try {
      const out = await adminCreateParentWithUser(item);
      results.push({
        phone_number: item.phone_number,
        status: "created",
        parent_id: out.parent_id,
        user_id: out.user_id,
        address_id: out.address_id,
      });
      created++;
    } catch (err: any) {
      results.push({
        phone_number: item.phone_number,
        status: "skipped",
        reason: err?.message || "create failed",
      });
      skipped++;
    }
  }

  return { results, created, skipped };
};

export const adminBulkCreateParentsWithStudents = async (
  records: AdminBulkParentWithStudentsRecord[],
): Promise<{
  results: AdminBulkParentsWithStudentsResultItem[];
  parents_created: number;
  students_created: number;
  skipped: number;
}> => {
  const { adminCreateStudentForParent } =
    await import("../student/student.service");

  const results: AdminBulkParentsWithStudentsResultItem[] = [];
  let parentsCreated = 0;
  let studentsCreated = 0;
  let skipped = 0;

  for (const record of records) {
    let parentId: string | undefined;
    let userId: string | undefined;
    let parentStatus: "created" | "skipped" = "created";
    let parentReason: string | undefined;
    let createdAddressId: string | undefined;

    try {
      const out = await adminCreateParentWithUser(record.parent);
      parentId = out.parent_id;
      userId = out.user_id;
      createdAddressId = out.address_id;
      parentsCreated++;
    } catch (err: any) {
      parentStatus = "skipped";
      parentReason = err?.message || "create failed";

      const existingUser = await userRepository.findByPhoneNumber(
        record.parent.phone_number,
      );
      if (existingUser) {
        const existingParent = await parentRepository.findByUserId(
          String(existingUser._id),
        );
        if (existingParent) {
          parentId = String(existingParent._id);
          userId = String(existingUser._id);
        }
      }
      skipped++;
    }

    const studentResults: AdminBulkParentsWithStudentsResultItem["students"] =
      [];

    if (!parentId) {
      results.push({
        phone_number: record.parent.phone_number,
        parent_status: parentStatus,
        parent_id: parentId,
        user_id: userId,
        parent_reason: parentReason,
        students: record.students.map((s) => ({
          student_name: s.student_name,
          status: "skipped",
          reason: parentReason || "parent unavailable",
        })),
      });
      continue;
    }

    let primaryAddressId = createdAddressId;
    if (!primaryAddressId) {
      const existingPrimary = await parentAddressRepository.findOne({
        parent_id: parentId,
        is_primary: true,
      });
      if (existingPrimary) {
        primaryAddressId = String(existingPrimary._id);
      }
    }

    for (const s of record.students) {
      const pickup =
        s.pickup_address_id == null ? primaryAddressId : s.pickup_address_id;

      if (!pickup) {
        studentResults.push({
          student_name: s.student_name,
          status: "skipped",
          reason: "no pickup address",
        });
        continue;
      }

      try {
        const created = await adminCreateStudentForParent(parentId, {
          school_id: s.school_id,
          student_name: s.student_name,
          class: s.class,
          section: s.section,
          roll_number: s.roll_number,
          gender: s.gender as any,
          date_of_birth: s.date_of_birth
            ? new Date(s.date_of_birth)
            : undefined,
          pickup_address_id: pickup,
          emergency_contact: s.emergency_contact,
          medical_info: s.medical_info,
        });
        studentResults.push({
          student_name: s.student_name,
          status: "created",
          student_id: String(created._id),
        });
        studentsCreated++;
      } catch (err: any) {
        studentResults.push({
          student_name: s.student_name,
          status: "skipped",
          reason: err?.message || "create failed",
        });
      }
    }

    results.push({
      phone_number: record.parent.phone_number,
      parent_status: parentStatus,
      parent_id: parentId,
      user_id: userId,
      parent_reason: parentReason,
      students: studentResults,
    });
  }

  return {
    results,
    parents_created: parentsCreated,
    students_created: studentsCreated,
    skipped,
  };
};
