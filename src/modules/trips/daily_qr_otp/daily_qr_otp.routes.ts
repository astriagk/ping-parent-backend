import { validate } from "@shared/middlewares";

import {
  generateQrOtp,
  getParentOtpForTrip,
  getQrOtp,
  getQrOtpForParent,
  verifyAndRecordAttendance,
  verifyQrOtp,
} from "./daily_qr_otp.controller";
import {
  generateQrOtpSchema,
  verifyAndRecordAttendanceSchema,
  verifyQrOtpSchema,
} from "./daily_qr_otp.validation";

/**
 * Handler group for daily_qr_otp module.
 * Import in src/routes/parent.routes.ts, driver.routes.ts — NO auth middleware here.
 */
export const qrOtpHandlers = {
  // Driver-specific (generate, verify)
  driver: {
    validateGenerate: validate(generateQrOtpSchema),
    generate: generateQrOtp,
    getForStudentTrip: getQrOtp,
    validateVerify: validate(verifyQrOtpSchema),
    verify: verifyQrOtp,
    validateVerifyAttendance: validate(verifyAndRecordAttendanceSchema),
    verifyAttendance: verifyAndRecordAttendance,
  },

  // Parent-specific
  parent: {
    getForStudentTrip: getQrOtpForParent,
    getForTrip: getParentOtpForTrip,
  },
};
