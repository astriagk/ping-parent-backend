import { Request, Response } from "express";

import { asyncHandler } from "@shared/middlewares";

export const receiveGpsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { vnum, datetime, latitude, longitude, speed, heading, accuracy } =
      req.body;
    console.log(
      `[GPS] ${datetime} | vnum: ${vnum}, lat: ${latitude}, lng: ${longitude}, speed: ${speed ?? "-"}, heading: ${heading ?? "-"}, accuracy: ${accuracy ?? "-"}`,
    );

    return res.json({
      success: true,
      received: req.body,
    });
  },
);
