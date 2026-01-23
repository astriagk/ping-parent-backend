import { v4 as uuidv4 } from "uuid";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
