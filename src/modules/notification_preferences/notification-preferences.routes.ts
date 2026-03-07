import { validate } from "@shared/middlewares";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "./notification-preferences.controller";
import { updatePreferencesSchema } from "./notification-preferences.validation";

/**
 * Handler group for notification preferences module.
 * Import in src/routes/shared.routes.ts — NO auth middleware here.
 */
export const notificationPreferencesHandlers = {
  shared: {
    get: getNotificationPreferences,
    validateUpdate: validate(updatePreferencesSchema),
    update: updateNotificationPreferences,
  },
};
