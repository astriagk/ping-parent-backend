import { validate } from "@shared/middlewares";

import { receiveGpsHandler } from "./gps.controller";
import { gpsDataSchema } from "./gps.validation";

export const gpsHandlers = {
  public: {
    validatePush: validate(gpsDataSchema),
    push: receiveGpsHandler,
  },
};
