import Joi from "joi";

export const uploadFileSchema = Joi.object({
  folder_path: Joi.string().required().trim().messages({
    "any.required": "Folder path is required",
    "string.empty": "Folder path cannot be empty",
  }),
});

export const updateFileSchema = Joi.object({
  old_file_url: Joi.string().required().trim().messages({
    "any.required": "Old file URL is required",
    "string.empty": "Old file URL cannot be empty",
  }),
});
