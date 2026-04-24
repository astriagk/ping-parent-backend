import jwt from "jsonwebtoken";

import { ENV } from "@shared/config";
import { UserRole } from "@shared/constants/enums";
import { AdminTokenPayload } from "@shared/types/global/global";

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};

export const generateTokenPair = (payload: TokenPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// Admin token functions
export const generateAdminAccessToken = (
  payload: AdminTokenPayload,
): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateAdminRefreshToken = (
  payload: AdminTokenPayload,
): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyAdminAccessToken = (token: string): AdminTokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as AdminTokenPayload;
};

export const generateAdminTokenPair = (payload: AdminTokenPayload) => {
  return {
    access_token: generateAdminAccessToken(payload),
    refresh_token: generateAdminRefreshToken(payload),
  };
};
