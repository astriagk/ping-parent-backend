import Joi from "joi";

import { TripStatus, TripType, VALIDATION_MESSAGES } from "@shared/constants";

export const createTripSchema = Joi.object({
  // driver_id is derived from authenticated user (NOT in request body)
  school_id: Joi.string().optional().messages({
    "any.required": VALIDATION_MESSAGES.TRIP.SCHOOL_ID_REQUIRED,
  }),
  trip_type: Joi.string()
    .valid(...Object.values(TripType))
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.TRIP.TRIP_TYPE_REQUIRED,
      "any.only": VALIDATION_MESSAGES.TRIP.TRIP_TYPE_INVALID,
    }),
  trip_date: Joi.date().required().messages({
    "any.required": VALIDATION_MESSAGES.TRIP.TRIP_DATE_REQUIRED,
    "date.base": VALIDATION_MESSAGES.TRIP.TRIP_DATE_INVALID,
  }),
  // Note: trip_status is set to 'scheduled' by default in service layer
  // Note: start_time and end_time are managed by status transitions in service layer
  // Note: total_distance is calculated from route data (excluded from user input)
  // Note: optimized_route_data is system-calculated based on lat/long (excluded from user input)
});

export const updateTripSchema = Joi.object({
  school_id: Joi.string().optional().messages({
    "string.base": VALIDATION_MESSAGES.TRIP.SCHOOL_ID_REQUIRED,
  }),
  trip_type: Joi.string()
    .valid(...Object.values(TripType))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.TRIP.TRIP_TYPE_INVALID,
    }),
  trip_date: Joi.date().optional().messages({
    "date.base": VALIDATION_MESSAGES.TRIP.TRIP_DATE_INVALID,
  }),
  // Note: Use PATCH /trips/:id/status endpoint to update trip_status
  // Note: start_time and end_time are managed by status transitions
  // Note: total_distance is calculated from route data (excluded from user input)
  // Note: optimized_route_data is system-calculated based on lat/long (excluded from user input)
});

export const updateTripStatusSchema = Joi.object({
  trip_status: Joi.string()
    .valid(...Object.values(TripStatus))
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.TRIP.TRIP_STATUS_INVALID,
      "any.only": VALIDATION_MESSAGES.TRIP.TRIP_STATUS_INVALID,
    }),
});
