import { Response } from "express";

export class ApiResponse {
  static success(
    res: Response,
    data: unknown,
    message?: string,
    statusCode = 200,
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
    message = "Resource created successfully",
  ) {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown,
  ) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(errors && typeof errors === "object" ? { errors } : {}),
    });
  }

  static badRequest(res: Response, message: string, errors?: unknown) {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message = "Unauthorized") {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = "Forbidden") {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = "Resource not found") {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message = "Resource already exists") {
    return this.error(res, message, 409);
  }

  static validationError(res: Response, errors: unknown) {
    return this.error(res, "Validation error", 422, errors);
  }

  static internalError(res: Response, message = "Internal server error") {
    return this.error(res, message, 500);
  }
}
