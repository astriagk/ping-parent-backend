import { NextFunction, Request, Response } from "express";

import { ERROR_MESSAGES, HTTP_STATUS, UserRole } from "@shared/constants";
import {
  verifyAccessToken,
  verifyAdminAccessToken,
} from "@shared/services/token.service";

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

export const verifyAdminOrAboveToken = (
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
    const payload = verifyAdminAccessToken(token);

    if (
      payload.role !== UserRole.ADMIN &&
      payload.role !== UserRole.SUPERADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.ADMIN_OR_ABOVE_ROLE_REQUIRED,
      });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    });
  }
};

export const verifySuperadminToken = (
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
    const payload = verifyAdminAccessToken(token);

    if (payload.role !== UserRole.SUPERADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.SUPERADMIN_ROLE_REQUIRED,
      });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    });
  }
};

export const verifySchoolAdminToken = (
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
    const payload = verifyAdminAccessToken(token);

    if (payload.role !== UserRole.SCHOOL_ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.SCHOOL_ADMIN_ROLE_REQUIRED,
      });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    });
  }
};

export const verifyAdminToken = (
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
    const payload = verifyAdminAccessToken(token);

    if (
      payload.role !== UserRole.ADMIN &&
      payload.role !== UserRole.SUPERADMIN &&
      payload.role !== UserRole.SCHOOL_ADMIN
    ) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.AUTH.ADMIN_ROLE_REQUIRED,
      });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
    });
  }
};
