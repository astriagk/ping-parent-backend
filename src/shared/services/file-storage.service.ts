import { v4 as uuidv4 } from "uuid";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// S3-compatible client works with: AWS S3, DigitalOcean Spaces, Wasabi, MinIO
const s3Client = new S3Client({
  region: process.env.STORAGE_REGION || "us-east-1",
  endpoint: process.env.STORAGE_ENDPOINT, // Only needed for DO Spaces/Wasabi
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
    secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
  },
});

const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "driver-documents";

export const uploadFileToStorage = async (
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

  // Construct file URL based on storage provider
  let fileUrl: string;
  if (process.env.STORAGE_ENDPOINT) {
    // DigitalOcean Spaces or Wasabi
    fileUrl = `${process.env.STORAGE_ENDPOINT}/${BUCKET_NAME}/${fileName}`;
  } else {
    // AWS S3
    fileUrl = `https://${BUCKET_NAME}.s3.${process.env.STORAGE_REGION}.amazonaws.com/${fileName}`;
  }

  return fileUrl;
};

export const deleteFileFromStorage = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) {
    return;
  }

  try {
    // Extract the object key from the URL
    let objectKey: string;

    if (process.env.STORAGE_ENDPOINT) {
      // DigitalOcean Spaces or Wasabi format: https://endpoint/bucket/folder/filename
      const url = new URL(fileUrl);
      // Remove leading slash and bucket name from path
      objectKey = url.pathname.substring(`/${BUCKET_NAME}/`.length);
    } else {
      // AWS S3 format: https://bucket.s3.region.amazonaws.com/folder/filename
      const url = new URL(fileUrl);
      objectKey = url.pathname.substring(1); // Remove leading slash
    }

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
