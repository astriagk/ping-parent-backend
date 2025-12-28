import { Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES_COMMON,
} from "@constants";

export class ApiResponse {
  static success(
    res: Response,
    data: unknown,
    message?: string,
    statusCode = HTTP_STATUS.OK,
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(
    res: Response,
    data: unknown,
    message = SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
  ) {
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message,
      data,
    });
  }

  static noContent(res: Response) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: unknown,
  ) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(errors && typeof errors === "object" ? { errors } : {}),
    });
  }

  static badRequest(res: Response, message: string, errors?: unknown) {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(
    res: Response,
    message = ERROR_MESSAGES.COMMON.UNAUTHORIZED,
  ) {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res: Response, message = ERROR_MESSAGES.COMMON.FORBIDDEN) {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(
    res: Response,
    message = ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND,
  ) {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(
    res: Response,
    message = ERROR_MESSAGES.COMMON.RESOURCE_ALREADY_EXISTS,
  ) {
    return this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  static validationError(res: Response, errors: unknown) {
    return this.error(
      res,
      ERROR_MESSAGES.COMMON.VALIDATION_ERROR,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      errors,
    );
  }

  static internalError(
    res: Response,
    message = ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR,
  ) {
    return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
