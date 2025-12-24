import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export const signAccessToken = (
  payload: Omit<AccessTokenPayload, "iat" | "exp">
) => {
  return jwt.sign(payload as object, SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

export const signRefreshToken = (
  payload: Omit<AccessTokenPayload, "iat" | "exp">
) => {
  return jwt.sign({ ...payload, type: "refresh" } as object, SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET) as AccessTokenPayload;
};

export const signEmailToken = (
  payload: Omit<AccessTokenPayload, "iat" | "exp">,
  expiresIn = "1d"
) => {
  return jwt.sign({ ...payload, type: "email" } as object, SECRET, {
    expiresIn,
  });
};
