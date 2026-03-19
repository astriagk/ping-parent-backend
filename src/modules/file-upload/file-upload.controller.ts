import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  MESSAGE_TEMPLATES,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import { deleteFile, uploadFile } from "@shared/services/storage.factory";

/**
 * POST /shared/upload
 * Upload a file and return the URL
 * Query params: folder_path (e.g., "user-profiles", "images", "documents")
 */
export const uploadFileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { folder_path } = req.query as Record<string, string>;

    // Validate folder path
    if (!folder_path || !folder_path.trim()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.FOLDER_PATH_REQUIRED,
      );
    }

    // Check if file was uploaded
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.NO_FILE_UPLOADED,
      );
    }

    // Validate file size
    if (file.size === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.FILE_EMPTY,
      );
    }

    try {
      // Upload file to storage and get URL
      const fileUrl = await uploadFile(file, folder_path.trim());

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          file_url: fileUrl,
          file_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
        },
        message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        MESSAGE_TEMPLATES.FILE_UPLOAD.uploadFailed(errorMessage),
      );
    }
  },
);

/**
 * PUT /shared/upload
 * Update/replace an existing file
 * Deletes old file and uploads new one
 * Body: { old_file_url: "..." }
 * Query: folder_path (e.g., "user-profiles")
 */
export const updateFileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { folder_path } = req.query as Record<string, string>;
    const { old_file_url } = req.body as Record<string, string>;

    // Validate folder path
    if (!folder_path || !folder_path.trim()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.FOLDER_PATH_REQUIRED,
      );
    }

    // Validate old file URL
    if (!old_file_url || !old_file_url.trim()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.OLD_FILE_URL_REQUIRED,
      );
    }

    // Check if file was uploaded
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.NO_FILE_UPLOADED,
      );
    }

    try {
      // Delete old file
      await deleteFile(old_file_url.trim());

      // Upload new file
      const fileUrl = await uploadFile(file, folder_path.trim());

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          file_url: fileUrl,
          file_name: file.originalname,
          file_size: file.size,
          mime_type: file.mimetype,
        },
        message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        MESSAGE_TEMPLATES.FILE_UPLOAD.updateFailed(errorMessage),
      );
    }
  },
);
