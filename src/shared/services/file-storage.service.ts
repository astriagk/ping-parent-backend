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
