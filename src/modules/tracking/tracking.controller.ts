import { Request, Response } from "express";

import { tripRepository } from "@modules/trips/trip/trip.repository";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  calculateOptimalRouteWithTomTom,
  calculateRoute,
  cleanOldTrackingData,
  getLatestDriverPosition,
  getRouteDetails,
  getRouteTracking,
  recalculateRoute,
  updateDriverPosition,
} from "./tracking.service";

export const calculateRouteHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const result = await calculateRoute(userId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: result.message,
    });
  },
);

export const updatePositionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { tripId } = req.params as Record<string, string>;
    const { latitude, longitude, speed, heading, accuracy } = req.body;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        SUCCESS_MESSAGES.ROUTE.TRIP_ID_REQUIRED,
      );
    }

    const tracking = await updateDriverPosition(
      userId,
      tripId,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
    );

    return res.json({
      success: true,
      data: tracking,
      message: SUCCESS_MESSAGES.ROUTE.POSITION_UPDATED_SUCCESSFULLY,
    });
  },
);

export const getTrackingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId, limit } = req.params as Record<string, string>;

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        SUCCESS_MESSAGES.ROUTE.TRIP_ID_REQUIRED,
      );
    }

    const tracking = await getRouteTracking(tripId, Number(limit));

    return res.json({
      success: true,
      data: tracking,
      count: tracking.length,
      message: SUCCESS_MESSAGES.ROUTE.TRACKING_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getCurrentPositionHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        SUCCESS_MESSAGES.ROUTE.TRIP_ID_REQUIRED,
      );
    }

    const position = await getLatestDriverPosition(tripId);

    if (!position) {
      return res.json({
        success: true,
        data: null,
        message: SUCCESS_MESSAGES.ROUTE.NO_POSITION_DATA_AVAILABLE,
      });
    }

    return res.json({
      success: true,
      data: position,
      message: SUCCESS_MESSAGES.ROUTE.CURRENT_POSITION_RETRIEVED_SUCCESSFULLY,
    });
  },
);

export const getRouteDetailsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { tripId } = req.params as Record<string, string>;

    if (!tripId) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        SUCCESS_MESSAGES.ROUTE.TRIP_ID_REQUIRED,
      );
    }

    const routeDetails = await getRouteDetails(tripId);

    return res.json({
      success: true,
      data: routeDetails,
      message: SUCCESS_MESSAGES.ROUTE.DETAILS_FETCHED_SUCCESSFULLY,
    });
  },
);

export const cleanTrackingDataHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { daysOld } = req.body;

    if (!daysOld || daysOld < 1) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.TRACKING.DAYS_OLD_INVALID,
      );
    }

    const deletedCount = await cleanOldTrackingData(daysOld);

    return res.json({
      success: true,
      data: {
        deletedCount,
        message: SUCCESS_MESSAGES.ROUTE.CLEANUP_RECORDS_DELETED.replace(
          "{count}",
          deletedCount.toString(),
        ),
      },
      message: SUCCESS_MESSAGES.ROUTE.CLEANUP_COMPLETED_SUCCESSFULLY,
    });
  },
);

export const calculateOptimalRouteWithTomTomHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { trip_id } = req.body;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    if (!trip_id) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        SUCCESS_MESSAGES.ROUTE.TRIP_ID_REQUIRED,
      );
    }

    // Check if trip exists
    const existingTrip = await tripRepository.findById(trip_id);

    console.log(existingTrip);

    if (existingTrip && existingTrip.optimized_route_data) {
      // Trip exists and has optimized route data, return it
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          _id: existingTrip._id?.toString(),
          trip_id: existingTrip._id?.toString(),
          route_geometry: existingTrip.optimized_route_data,
          total_distance: existingTrip.optimized_route_data.total_distance,
          total_duration: existingTrip.optimized_route_data.total_duration,
        },
        message: SUCCESS_MESSAGES.ROUTE.DETAILS_FETCHED_SUCCESSFULLY,
      });
    }

    const result = await calculateOptimalRouteWithTomTom(userId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.ROUTE.TOMTOM_ROUTE_CALCULATED,
    });
  },
);

export const recalculateRouteHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
      );
    }

    const result = await recalculateRoute(userId, req.body);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES.ROUTE.RECALCULATED_SUCCESSFULLY,
    });
  },
);
