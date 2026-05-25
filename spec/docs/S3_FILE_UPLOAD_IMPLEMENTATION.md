# S3 File Upload Implementation

This document describes the current S3-based file upload implementation in this
backend so the **same pattern can be replicated in another project**. It covers
dependencies, environment variables, the storage service, the multer middleware,
the controller, routes, validation, and how to wire it all together.

---

## 1. Dependencies

Install these packages (versions currently used in this repo):

```bash
npm install @aws-sdk/client-s3@^3.974.0 multer@^2.0.2 uuid@^13.0.0
npm install -D @types/multer@^2.0.0
```

| Package              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `@aws-sdk/client-s3` | AWS SDK v3 client for S3 (PutObject/Delete)  |
| `multer`             | Parse `multipart/form-data` file uploads     |
| `uuid`               | Generate unique file keys                    |
| `@types/multer`      | TypeScript types for multer                  |

---

## 2. Environment Variables

The storage service reads these from `process.env`:

| Variable               | Description                         | Fallback in code     |
| ---------------------- | ----------------------------------- | -------------------- |
| `STORAGE_REGION`       | AWS region of the bucket            | `us-east-1`          |
| `STORAGE_ACCESS_KEY`   | IAM access key ID                   | `""`                 |
| `STORAGE_SECRET_KEY`   | IAM secret access key               | `""`                 |
| `STORAGE_BUCKET_NAME`  | Target S3 bucket name               | `driver-documents`   |

Add these to your `.env` (and to your env schema/`.env.example` if you maintain one):

```env
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET_NAME=your-bucket-name
```

> The IAM user/role needs `s3:PutObject` and `s3:DeleteObject` permissions on the
> bucket. If files are served publicly, the bucket/object must allow public read
> (or you should serve via CloudFront / presigned URLs instead).

---

## 3. Storage Service

The core S3 logic. Two functions: `uploadFile` and `deleteFile`. The upload
returns a public HTTPS URL built from the bucket + region + key.

**File:** `src/shared/services/file-storage.service.ts`

```ts
import { v4 as uuidv4 } from "uuid";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
    secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
  },
});

const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "driver-documents";

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  const fileName = `${folder}/${uuidv4()}-${Date.now()}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.STORAGE_REGION}.amazonaws.com/${fileName}`;

  return fileUrl;
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) {
    return;
  }

  try {
    // Extract the object key from the URL
    // AWS S3 format: https://bucket.s3.region.amazonaws.com/folder/filename
    const url = new URL(fileUrl);
    const objectKey = url.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
    });

    await s3Client.send(command);
  } catch (error) {
    // Log error but don't throw - file deletion failure shouldn't block updates
    console.error(`Failed to delete cloud file: ${fileUrl}`, error);
  }
};
```

**Key design notes:**

- The object key is `{folder}/{uuid}-{timestamp}` — guarantees uniqueness and
  groups files by logical folder (e.g. `user-profiles`, `documents`).
- `Body` is `file.buffer` — works because multer uses **memory storage** (below).
- `deleteFile` parses the key back out of the URL and **swallows errors** so a
  failed delete never blocks an update flow.

---

## 4. Multer Middleware

Uses **memory storage** (so `file.buffer` is available for the S3 upload),
filters to images, and limits size to 10MB.

**File:** `src/shared/middlewares/multer.middleware.ts`

```ts
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
```

> Adjust `fileFilter` and `limits` for your use case (e.g. allow PDFs for
> documents). Mobile clients often send `application/octet-stream`, which is why
> it is explicitly allowed.

---

## 5. Controller

Two handlers: **upload** (POST) and **update** (PUT, deletes old then uploads
new). The folder is passed as a `folder_path` query param.

**File:** `src/modules/file-upload/file-upload.controller.ts`

```ts
import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  MESSAGE_TEMPLATES,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";
import { deleteFile, uploadFile } from "@shared/services/file-storage.service";

/**
 * POST /shared/upload
 * Upload a file and return the URL
 * Query params: folder_path (e.g., "user-profiles", "images", "documents")
 */
export const uploadFileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { folder_path } = req.query as Record<string, string>;

    if (!folder_path || !folder_path.trim()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.FOLDER_PATH_REQUIRED,
      );
    }

    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.NO_FILE_UPLOADED,
      );
    }

    if (file.size === 0) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.FILE_EMPTY,
      );
    }

    try {
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
 * Update/replace an existing file. Deletes old file and uploads new one.
 * Body: { old_file_url: "..." }
 * Query: folder_path (e.g., "user-profiles")
 */
export const updateFileHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { folder_path } = req.query as Record<string, string>;
    const { old_file_url } = req.body as Record<string, string>;

    if (!folder_path || !folder_path.trim()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.FOLDER_PATH_REQUIRED,
      );
    }

    if (!old_file_url || !old_file_url.trim()) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.OLD_FILE_URL_REQUIRED,
      );
    }

    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.FILE_UPLOAD.NO_FILE_UPLOADED,
      );
    }

    try {
      await deleteFile(old_file_url.trim());
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
```

> `asyncHandler` and `ApiError` are shared middleware helpers. In the other
> project, replace these with that project's equivalent error-handling wrapper
> and structured error class. The constants (`ERROR_MESSAGES`, `HTTP_STATUS`,
> `MESSAGE_TEMPLATES`, `SUCCESS_MESSAGES_COMMON`) are shared constants — see
> section 8.

---

## 6. Validation (Joi)

**File:** `src/modules/file-upload/file-upload.validation.ts`

```ts
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
```

---

## 7. Response Type

**File:** `src/modules/file-upload/file-upload.type.ts`

```ts
export interface FileUploadResponse {
  success: boolean;
  data: {
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  };
  message: string;
}
```

---

## 8. Routes & Wiring

**Handler group** — `src/modules/file-upload/file-upload.routes.ts`:

```ts
import { uploadMiddleware } from "@shared/middlewares/multer.middleware";

import { updateFileHandler, uploadFileHandler } from "./file-upload.controller";

export const fileUploadHandlers = {
  shared: {
    uploadMiddleware: uploadMiddleware.single("file"), // form field name = "file"
    upload: uploadFileHandler,
    update: updateFileHandler,
  },
};
```

**Barrel export** — `src/modules/file-upload/index.ts`:

```ts
export * from "./file-upload.controller";
export * from "./file-upload.routes";
export * from "./file-upload.type";
export * from "./file-upload.validation";
```

**Router mount** — `src/routes/shared/upload.routes.ts`:

```ts
import { Router } from "express";

import { fileUploadHandlers } from "@modules/file-upload/file-upload.routes";

const router = Router();

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
```

The order matters: the **multer middleware must run before the controller** so
`req.file` is populated.

---

## 9. Required Shared Constants

The controller/validation reference these constant keys. Ensure equivalents
exist in the target project (`@shared/constants`):

- `HTTP_STATUS` — `BAD_REQUEST` (400), `CREATED` (201), `OK` (200),
  `INTERNAL_SERVER_ERROR` (500).
- `ERROR_MESSAGES.FILE_UPLOAD` — `FOLDER_PATH_REQUIRED`, `NO_FILE_UPLOADED`,
  `FILE_EMPTY`, `OLD_FILE_URL_REQUIRED`.
- `VALIDATION_MESSAGES.FILE_UPLOAD` — `FOLDER_PATH_REQUIRED`,
  `FOLDER_PATH_EMPTY`, `OLD_FILE_URL_REQUIRED`, `OLD_FILE_URL_EMPTY`.
- `MESSAGE_TEMPLATES.FILE_UPLOAD` — `invalidFileType(mimetype)`,
  `uploadFailed(error)`, `updateFailed(error)` (template functions).
- `SUCCESS_MESSAGES_COMMON` — `RESOURCE_CREATED`, `RESOURCE_UPDATED`.

---

## 10. API Usage

**Upload (POST):**

```
POST /shared/upload?folder_path=user-profiles
Content-Type: multipart/form-data
Authorization: Bearer <token>

form-data:
  file: <binary>
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "file_url": "https://your-bucket.s3.us-east-1.amazonaws.com/user-profiles/<uuid>-<ts>",
    "file_name": "avatar.png",
    "file_size": 12345,
    "mime_type": "image/png"
  },
  "message": "Resource created successfully"
}
```

**Update/replace (PUT):**

```
PUT /shared/upload?folder_path=user-profiles
Content-Type: multipart/form-data

form-data:
  file: <binary>
  old_file_url: https://your-bucket.s3.us-east-1.amazonaws.com/user-profiles/<old-key>
```

---

## 11. Replication Checklist

To implement the same upload in the other project:

- [ ] `npm install @aws-sdk/client-s3 multer uuid` + `-D @types/multer`.
- [ ] Add `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`,
      `STORAGE_BUCKET_NAME` to env.
- [ ] Add `file-storage.service.ts` (`uploadFile` / `deleteFile`).
- [ ] Add `multer.middleware.ts` (memory storage + fileFilter + size limit).
- [ ] Add controller (`uploadFileHandler` / `updateFileHandler`) — adapt the
      error wrapper + constants to that project.
- [ ] Add validation schemas (if that project validates query/body).
- [ ] Register routes with the multer middleware **before** the handler.
- [ ] Ensure the shared constants in section 9 exist (or inline the messages).
- [ ] Confirm IAM permissions: `s3:PutObject`, `s3:DeleteObject`.
```
