import { Router } from "express";

import { gpsHandlers } from "@modules/gps/gps.routes";

const router = Router();

router.post(
  "/gps/push",
  gpsHandlers.public.validatePush,
  gpsHandlers.public.push,
);

export default router;
