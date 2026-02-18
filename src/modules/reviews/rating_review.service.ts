import { ObjectId, WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  DRIVERS_COLLECTION,
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  TRIPS_COLLECTION,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

import { ratingReviewRepository } from "./rating_review.repository";
import { RatingReview } from "./rating_review.type";

/**
 * Helper function to convert userId to parent_id
 * This is needed because the ratings_reviews table stores parent_id (from parents table)
 * but the authenticated user has user_id (from users table)
 */
const getParentIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    return null;
  }

  return String(parent._id);
};

/**
 * Verify that driver exists
 */
const verifyDriverExists = async (driverId: string): Promise<boolean> => {
  const db = await getDB();
  const driver = await db
    .collection(DRIVERS_COLLECTION)
    .findOne({ _id: new ObjectId(driverId) });

  return driver !== null;
};

/**
 * Verify that trip exists (optional check)
 */
const verifyTripExists = async (tripId: string): Promise<boolean> => {
  const db = await getDB();
  const trip = await db
    .collection(TRIPS_COLLECTION)
    .findOne({ _id: new ObjectId(tripId) });

  return trip !== null;
};

export const createRatingReview = async (
  userId: string,
  data: Omit<RatingReview, "review_id" | "parent_id" | "created_at">,
): Promise<WithId<RatingReview>> => {
  // Convert user_id to parent_id
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Verify driver exists
  const driverExists = await verifyDriverExists(data.driver_id);
  if (!driverExists) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.RATING_REVIEW.DRIVER_NOT_FOUND,
    );
  }

  // Verify trip exists if trip_id is provided
  if (data.trip_id) {
    const tripExists = await verifyTripExists(data.trip_id);
    if (!tripExists) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.RATING_REVIEW.TRIP_NOT_FOUND,
      );
    }
  }

  // Check for duplicate rating/review
  const duplicate = await ratingReviewRepository.findDuplicateRatingReview(
    parentId,
    data.driver_id,
    data.trip_id,
  );

  if (duplicate) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      ERROR_MESSAGES.RATING_REVIEW.ALREADY_EXISTS,
    );
  }

  const ratingReviewData: RatingReview = {
    review_id: generateUniqueCode(UniqueCodeTypes.REVIEW),
    parent_id: parentId,
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await ratingReviewRepository.create(ratingReviewData);
};

export const getRatingReviewById = async (
  id: string,
): Promise<WithId<RatingReview> | null> => {
  return await ratingReviewRepository.findById(id);
};

export const getRatingReviewsByDriverId = async (
  driverId: string,
): Promise<WithId<RatingReview>[]> => {
  return await ratingReviewRepository.findByDriverId(driverId);
};

export const getRatingReviewsByUserId = async (
  userId: string,
): Promise<WithId<RatingReview>[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await ratingReviewRepository.findByParentId(parentId);
};

export const updateRatingReview = async (
  id: string,
  userId: string,
  updates: Partial<RatingReview>,
): Promise<WithId<RatingReview> | null> => {
  const currentRatingReview = await ratingReviewRepository.findById(id);

  if (!currentRatingReview) {
    return null;
  }

  // Convert userId to parent_id to verify ownership
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Verify the rating/review belongs to this parent
  if (currentRatingReview.parent_id !== parentId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.RATING_REVIEW.UNAUTHORIZED_ACCESS,
    );
  }

  return await ratingReviewRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const deleteRatingReview = async (
  id: string,
  userId: string,
): Promise<boolean> => {
  const currentRatingReview = await ratingReviewRepository.findById(id);

  if (!currentRatingReview) {
    return false;
  }

  // Convert userId to parent_id to verify ownership
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Verify the rating/review belongs to this parent
  if (currentRatingReview.parent_id !== parentId) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      ERROR_MESSAGES.RATING_REVIEW.UNAUTHORIZED_ACCESS,
    );
  }

  const result = await ratingReviewRepository.deleteById(id);
  return result !== null;
};

export const getDriverAverageRating = async (
  driverId: string,
): Promise<number> => {
  return await ratingReviewRepository.getDriverAverageRating(driverId);
};
