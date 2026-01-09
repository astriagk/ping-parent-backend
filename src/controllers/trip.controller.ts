import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import {
  createTrip as createTripService,
  deleteTrip,
  getActiveTrips,
  getAllTrips,
  getTripById,
  getTripsByDriverIdAndDate,
  getTripsByUserId,
  updateTrip,
  updateTripStatus as updateTripStatusService,
} from "@shared/services/trip.service";

// NOTE: Exports WITHOUT "Controller" suffix

/**
 * Get all trips (admin only)
 */
export const getAllTripsController = asyncHandler(
  async (req: Request, res: Response) => {
    const trips = await getAllTrips();

    return res.json({
      success: true,
      data: trips,
      message: SUCCESS_MESSAGES.TRIP.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const createTrip = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId; // From JWT token

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
    );
  }

  const tripData = req.body; // Does NOT include driver_id

  const trip = await createTripService(userId, tripData);

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data: trip,
    message: SUCCESS_MESSAGES.TRIP.CREATED_SUCCESSFULLY,
  });
});

export const getTripProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const trip = await getTripById(id);

    if (!trip) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
    }

    return res.json({
      success: true,
      data: trip,
    });
  },
);

export const getMyTrips = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId; // From auth middleware

  if (!userId) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
    );
  }

  const trips = await getTripsByUserId(userId);

  return res.json({
    success: true,
    data: trips,
    message: SUCCESS_MESSAGES.TRIP.LIST_FETCHED_SUCCESSFULLY,
  });
});

export const getMyTripsByDate = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { date } = req.query;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    if (!date) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TRIP.TRIP_DATE_REQUIRED,
      );
    }

    const tripDate = new Date(date as string);

    if (isNaN(tripDate.getTime())) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TRIP.TRIP_DATE_REQUIRED,
      );
    }

    const trips = await getTripsByDriverIdAndDate(userId, tripDate);

    return res.json({
      success: true,
      data: trips,
      message: SUCCESS_MESSAGES.TRIP.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyActiveTrips = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.DRIVER.USER_NOT_AUTHENTICATED,
      );
    }

    const trips = await getActiveTrips(userId);

    return res.json({
      success: true,
      data: trips,
      message: SUCCESS_MESSAGES.TRIP.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const updateTripProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const trip = await updateTrip(id, updates);

    if (!trip) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
    }

    return res.json({
      success: true,
      data: trip,
      message: SUCCESS_MESSAGES.TRIP.UPDATED_SUCCESSFULLY,
    });
  },
);

export const updateTripStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { trip_status } = req.body;

    const trip = await updateTripStatusService(id, trip_status);

    if (!trip) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
    }

    return res.json({
      success: true,
      data: trip,
      message: SUCCESS_MESSAGES.TRIP.STATUS_UPDATED_SUCCESSFULLY,
    });
  },
);

export const deleteTripProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await deleteTrip(id);

    if (!deleted) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.TRIP.NOT_FOUND);
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.TRIP.DELETED_SUCCESSFULLY,
    });
  },
);
