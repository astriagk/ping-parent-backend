import Joi from "joi";

export const gpsDataSchema = Joi.object({
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  speed: Joi.number().optional().min(0),
  heading: Joi.number().optional().min(0).max(360),
  accuracy: Joi.number().optional().min(0),
});
