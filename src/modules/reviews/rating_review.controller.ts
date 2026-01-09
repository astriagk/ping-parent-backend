import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  createRatingReview as createRatingReviewService,
  deleteRatingReview,
  getDriverAverageRating,
  getRatingReviewById,
  getRatingReviewsByDriverId,
  getRatingReviewsByUserId,
  updateRatingReview,
} from "./rating_review.service";

// NOTE: Exports WITHOUT "Controller" suffix
export const submitRatingReview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From JWT token

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const ratingReviewData = req.body; // Does NOT include parent_id

    const ratingReview = await createRatingReviewService(
      userId,
      ratingReviewData,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: ratingReview,
      message: SUCCESS_MESSAGES.RATING_REVIEW.SUBMITTED_SUCCESSFULLY,
    });
  },
);

export const getRatingReview = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const ratingReview = await getRatingReviewById(id);

    if (!ratingReview) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.RATING_REVIEW.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: ratingReview,
      message: SUCCESS_MESSAGES.RATING_REVIEW.FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyRatingReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const ratingReviews = await getRatingReviewsByUserId(userId);

    return res.json({
      success: true,
      data: ratingReviews,
      message: SUCCESS_MESSAGES.RATING_REVIEW.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getDriverRatingReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params;

    const ratingReviews = await getRatingReviewsByDriverId(driverId);

    return res.json({
      success: true,
      data: ratingReviews,
      message: SUCCESS_MESSAGES.RATING_REVIEW.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const updateRatingReviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const updates = req.body;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const ratingReview = await updateRatingReview(id, userId, updates);

    if (!ratingReview) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.RATING_REVIEW.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: ratingReview,
      message: SUCCESS_MESSAGES.RATING_REVIEW.UPDATED_SUCCESSFULLY,
    });
  },
);

export const deleteRatingReviewById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const deleted = await deleteRatingReview(id, userId);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.RATING_REVIEW.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.RATING_REVIEW.DELETED_SUCCESSFULLY,
    });
  },
);

export const getDriverRating = asyncHandler(
  async (req: Request, res: Response) => {
    const { driverId } = req.params;

    const averageRating = await getDriverAverageRating(driverId);

    return res.json({
      success: true,
      data: { driver_id: driverId, average_rating: averageRating },
      message: SUCCESS_MESSAGES.RATING_REVIEW.FETCHED_SUCCESSFULLY,
    });
  },
);
