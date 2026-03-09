import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadFileToLocal = async (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  const folderPath = path.join(UPLOAD_DIR, folder);

  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const fileName = `${uuidv4()}-${Date.now()}-${file.originalname}`;
  const filePath = path.join(folderPath, fileName);

  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);

  // Return relative URL path (can be served by Express static middleware)
  const relativeUrl = `/uploads/${folder}/${fileName}`;
  return relativeUrl;
};

export const deleteFileFromLocal = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) {
    return;
  }

  // Extract file path from URL (e.g., "/uploads/driver-documents/driving-licenses/filename.jpg")
  const urlPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  const filePath = path.join(process.cwd(), urlPath);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    // Log error but don't throw - file deletion failure shouldn't block updates
    console.error(`Failed to delete local file: ${filePath}`, error);
  }
};
