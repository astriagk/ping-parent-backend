import { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "@services";

export const verifyParentToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Authorization header missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token missing from authorization header",
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.role !== "parent") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Parent role required.",
      });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
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
    return res.status(401).json({
      success: false,
      error: "Authorization header missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token missing from authorization header",
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.role !== "driver") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Driver role required.",
      });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
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
    return res.status(401).json({
      success: false,
      error: "Authorization header missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token missing from authorization header",
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};
