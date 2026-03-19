import multer from "multer";

import { MESSAGE_TEMPLATES } from "@shared/constants";

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept:
    // 1. Proper image MIME types (image/jpeg, image/png, etc.)
    // 2. Generic binary type (application/octet-stream) - common from mobile devices
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/octet-stream"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(MESSAGE_TEMPLATES.FILE_UPLOAD.invalidFileType(file.mimetype)),
      );
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
