import { NextFunction, Request, Response } from "express";

import { ERROR_MESSAGES, HTTP_STATUS } from "@constants";
import { verifyAccessToken } from "@services/token.service";

export const verifyParentToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MALFORMED_AUTH_HEADER,
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.role !== "parent") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.PARENT_ROLE_REQUIRED,
      });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    });
  }
};

export const verifyDriverToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MALFORMED_AUTH_HEADER,
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.role !== "driver") {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.DRIVER_ROLE_REQUIRED,
      });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    });
  }
};

export const verifyToken_Middleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MISSING_AUTH_HEADER,
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.MALFORMED_AUTH_HEADER,
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    });
  }
};
