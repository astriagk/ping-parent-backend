import Joi from "joi";

import { VALIDATION_MESSAGES } from "@shared/constants";

export const uploadFileSchema = Joi.object({
  folder_path: Joi.string().required().trim().messages({
    "any.required": VALIDATION_MESSAGES.FILE_UPLOAD.FOLDER_PATH_REQUIRED,
    "string.empty": VALIDATION_MESSAGES.FILE_UPLOAD.FOLDER_PATH_EMPTY,
  }),
});

export const updateFileSchema = Joi.object({
  old_file_url: Joi.string().required().trim().messages({
    "any.required": VALIDATION_MESSAGES.FILE_UPLOAD.OLD_FILE_URL_REQUIRED,
    "string.empty": VALIDATION_MESSAGES.FILE_UPLOAD.OLD_FILE_URL_EMPTY,
  }),
});
