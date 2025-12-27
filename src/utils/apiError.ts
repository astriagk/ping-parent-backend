import { ERROR_MESSAGES, HTTP_STATUS } from "@constants";

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: unknown;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: unknown) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, true, errors);
  }

  static unauthorized(message = ERROR_MESSAGES.COMMON.UNAUTHORIZED) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  static forbidden(message = ERROR_MESSAGES.COMMON.FORBIDDEN) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  static notFound(message = ERROR_MESSAGES.COMMON.RESOURCE_NOT_FOUND) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static conflict(message = ERROR_MESSAGES.COMMON.RESOURCE_ALREADY_EXISTS) {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static validationError(errors: unknown) {
    return new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_MESSAGES.COMMON.VALIDATION_ERROR,
      true,
      errors,
    );
  }

  static internalError(message = ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, false);
  }
}
