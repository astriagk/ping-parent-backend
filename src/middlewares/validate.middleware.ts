import { NextFunction, Request, Response } from "express";
import { ObjectSchema } from "joi";

import { ERROR_MESSAGES, HTTP_STATUS } from "@constants";

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: ERROR_MESSAGES.COMMON.VALIDATION_ERROR,
        details: errors,
      });
    }

    req.body = value;
    next();
  };
};
