import { NextFunction, Request, Response } from "express";

type Entry = { count: number; firstSeen: number };

const attempts: Map<string, Entry> = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export const loginRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const key = (req.body?.email || req.ip || "anon").toString().toLowerCase();
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry) {
    attempts.set(key, { count: 0, firstSeen: now });
    return next();
  }

  if (now - entry.firstSeen > WINDOW_MS) {
    // reset window
    attempts.set(key, { count: 0, firstSeen: now });
    return next();
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.firstSeen)) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({
      success: false,
      error: "Too many login attempts. Try again later.",
    });
  }

  return next();
};

export const recordFailedLogin = (emailOrKey: string) => {
  const key = emailOrKey.toString().toLowerCase();
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) {
    attempts.set(key, { count: 1, firstSeen: now });
  } else {
    if (now - entry.firstSeen > WINDOW_MS) {
      attempts.set(key, { count: 1, firstSeen: now });
    } else {
      attempts.set(key, { count: entry.count + 1, firstSeen: entry.firstSeen });
    }
  }
};
