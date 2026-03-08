import { uploadMiddleware } from "@shared/middlewares/multer.middleware";

import { updateFileHandler, uploadFileHandler } from "./file-upload.controller";

/**
 * Handler group for file-upload module.
 * Import in src/routes/shared.routes.ts - Requires auth
 */
export const fileUploadHandlers = {
  shared: {
    uploadMiddleware: uploadMiddleware.single("file"),
    upload: uploadFileHandler,
    update: updateFileHandler,
  },
};
