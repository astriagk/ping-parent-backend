import { Router } from "express";

import { parentHandlers } from "@modules/users/parent/parent.routes";

const router = Router();

// --- Profile ---
router.get("/profile", parentHandlers.getProfile);
router.put(
  "/profile",
  parentHandlers.validateUpdate,
  parentHandlers.updateProfile,
);
router.get("/address", parentHandlers.getAddress);
router.put(
  "/address",
  parentHandlers.validateAddress,
  parentHandlers.updateAddress,
);

export default router;
