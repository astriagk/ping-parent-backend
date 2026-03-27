import { Router } from "express";

import { fileUploadHandlers } from "@modules/file-upload/file-upload.routes";

const router = Router();

// --- File Upload ---
router.post(
  "/upload",
  fileUploadHandlers.shared.uploadMiddleware,
  fileUploadHandlers.shared.upload,
);
router.put(
  "/upload",
  fileUploadHandlers.shared.uploadMiddleware,
  fileUploadHandlers.shared.update,
);

export default router;
