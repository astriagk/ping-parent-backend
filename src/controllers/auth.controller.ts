import { Request, Response } from "express";
import { verifyToken, signAccessToken } from "../utils/jwt";
import { getUserById } from "../services/user.service";
import jwt from "jsonwebtoken";

export const verifyAuthToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Malformed Authorization header" });
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      data: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || "",
        tokenValid: true,
      },
    });
  } catch (err: any) {
    // handle expired token and optional refresh
    if (err instanceof jwt.TokenExpiredError) {
      const refresh = req.headers["x-refresh-token"] as string | undefined;
      if (refresh) {
        try {
          const refreshPayload = jwt.verify(
            refresh,
            process.env.JWT_SECRET || "dev-secret"
          ) as any;
          if (refreshPayload?.userId) {
            // issue new access token
            const newToken = signAccessToken({
              userId: refreshPayload.userId,
              email: refreshPayload.email,
              role: refreshPayload.role,
            });

            return res.json({
              success: true,
              data: {
                userId: refreshPayload.userId,
                email: refreshPayload.email,
                role: refreshPayload.role || "",
                tokenValid: true,
                newToken,
              },
            });
          }
        } catch (e) {
          return res
            .status(401)
            .json({ success: false, error: "Invalid refresh token" });
        }
      }

      return res.status(401).json({ success: false, error: "Token expired" });
    }

    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};
