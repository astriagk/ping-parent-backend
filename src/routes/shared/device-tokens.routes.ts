import { Router } from "express";

import { deviceTokenHandlers } from "@modules/device_token/device-token.routes";

const router = Router();

// --- Device Tokens (FCM push notifications) ---
router.post(
  "/device-tokens/register",
  deviceTokenHandlers.shared.validateRegister,
  deviceTokenHandlers.shared.register,
);
router.post(
  "/device-tokens/remove",
  deviceTokenHandlers.shared.validateRemove,
  deviceTokenHandlers.shared.remove,
);

export default router;
