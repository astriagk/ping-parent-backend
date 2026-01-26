import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

export const calculateRouteSchema = Joi.object({
  trip_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.TRACKING.TRIP_ID_REQUIRED,
    "string.base": VALIDATION_MESSAGES.TRACKING.TRIP_ID_STRING,
  }),
  current_latitude: Joi.number().required().min(-90).max(90).messages({
    "any.required": VALIDATION_MESSAGES.TRACKING.CURRENT_LATITUDE_REQUIRED,
    "number.base": VALIDATION_MESSAGES.TRACKING.CURRENT_LATITUDE_NUMBER,
    "number.min": VALIDATION_MESSAGES.TRACKING.CURRENT_LATITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRACKING.CURRENT_LATITUDE_RANGE,
  }),
  current_longitude: Joi.number().required().min(-180).max(180).messages({
    "any.required": VALIDATION_MESSAGES.TRACKING.CURRENT_LONGITUDE_REQUIRED,
    "number.base": VALIDATION_MESSAGES.TRACKING.CURRENT_LONGITUDE_NUMBER,
    "number.min": VALIDATION_MESSAGES.TRACKING.CURRENT_LONGITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRACKING.CURRENT_LONGITUDE_RANGE,
  }),
  pickup_points: Joi.array()
    .items(
      Joi.object({
        latitude: Joi.number().required().min(-90).max(90).messages({
          "number.min": VALIDATION_MESSAGES.TRACKING.PICKUP_LATITUDE_RANGE,
          "number.max": VALIDATION_MESSAGES.TRACKING.PICKUP_LATITUDE_RANGE,
        }),
        longitude: Joi.number().required().min(-180).max(180).messages({
          "number.min": VALIDATION_MESSAGES.TRACKING.PICKUP_LONGITUDE_RANGE,
          "number.max": VALIDATION_MESSAGES.TRACKING.PICKUP_LONGITUDE_RANGE,
        }),
        address: Joi.string().optional(),
        student_id: Joi.string().optional(),
      }),
    )
    .optional(),
  drop_location: Joi.object({
    latitude: Joi.number().required().min(-90).max(90).messages({
      "any.required": VALIDATION_MESSAGES.TRACKING.DROP_LATITUDE_REQUIRED,
      "number.min": VALIDATION_MESSAGES.TRACKING.DROP_LATITUDE_RANGE,
      "number.max": VALIDATION_MESSAGES.TRACKING.DROP_LATITUDE_RANGE,
    }),
    longitude: Joi.number().required().min(-180).max(180).messages({
      "any.required": VALIDATION_MESSAGES.TRACKING.DROP_LONGITUDE_REQUIRED,
      "number.min": VALIDATION_MESSAGES.TRACKING.DROP_LONGITUDE_RANGE,
      "number.max": VALIDATION_MESSAGES.TRACKING.DROP_LONGITUDE_RANGE,
    }),
    address: Joi.string().optional(),
  }).optional(),
});

export const updatePositionSchema = Joi.object({
  latitude: Joi.number().required().min(-90).max(90).messages({
    "any.required": VALIDATION_MESSAGES.TRACKING.LATITUDE_REQUIRED,
    "number.base": VALIDATION_MESSAGES.TRACKING.LATITUDE_NUMBER,
    "number.min": VALIDATION_MESSAGES.TRACKING.LATITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRACKING.LATITUDE_RANGE,
  }),
  longitude: Joi.number().required().min(-180).max(180).messages({
    "any.required": VALIDATION_MESSAGES.TRACKING.LONGITUDE_REQUIRED,
    "number.base": VALIDATION_MESSAGES.TRACKING.LONGITUDE_NUMBER,
    "number.min": VALIDATION_MESSAGES.TRACKING.LONGITUDE_RANGE,
    "number.max": VALIDATION_MESSAGES.TRACKING.LONGITUDE_RANGE,
  }),
  speed: Joi.number().optional().min(0).messages({
    "number.min": VALIDATION_MESSAGES.TRACKING.SPEED_MIN,
  }),
  heading: Joi.number().optional().min(0).max(360).messages({
    "number.min": VALIDATION_MESSAGES.TRACKING.HEADING_RANGE,
    "number.max": VALIDATION_MESSAGES.TRACKING.HEADING_RANGE,
  }),
  accuracy: Joi.number().optional().min(0).messages({
    "number.min": VALIDATION_MESSAGES.TRACKING.ACCURACY_MIN,
  }),
});

export const subscribeTrackingSchema = Joi.object({
  trip_id: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.TRACKING.TRIP_ID_REQUIRED,
  }),
});
