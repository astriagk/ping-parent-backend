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
    return new ApiError(400, message, true, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists") {
    return new ApiError(409, message);
  }

  static validationError(errors: unknown) {
    return new ApiError(422, "Validation error", true, errors);
  }

  static internalError(message = "Internal server error") {
    return new ApiError(500, message, false);
  }
}
