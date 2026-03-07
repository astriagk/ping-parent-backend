import { validate } from "@shared/middlewares";

import {
  registerDeviceToken,
  removeDeviceToken,
} from "./device-token.controller";
import {
  registerTokenSchema,
  removeTokenSchema,
} from "./device-token.validation";

/**
 * Handler group for device token module.
 * Import in src/routes/shared.routes.ts — NO auth middleware here.
 */
export const deviceTokenHandlers = {
  shared: {
    validateRegister: validate(registerTokenSchema),
    register: registerDeviceToken,
    validateRemove: validate(removeTokenSchema),
    remove: removeDeviceToken,
  },
};
