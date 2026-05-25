import { Request, Response } from "express";

import { asyncHandler } from "@shared/middlewares";

export const receiveGpsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    console.log("[GPS]", new Date().toISOString(), req.body);

    return res.json({
      success: true,
      received: req.body,
    });
  },
);
