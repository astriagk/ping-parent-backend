import {
  deleteFileFromStorage,
  uploadFileToStorage,
} from "./file-storage.service";
import {
  deleteFileFromLocal,
  uploadFileToLocal,
} from "./local-storage.service";

type StorageProvider = "local" | "s3" | "digitalocean" | "wasabi" | "minio";

const getStorageProvider = (): StorageProvider => {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || "local";
};

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string,
): Promise<string> => {
  const provider = getStorageProvider();

  if (provider === "local") {
    return uploadFileToLocal(file, folder);
  } else {
    // All S3-compatible providers (s3, digitalocean, wasabi, minio)
    return uploadFileToStorage(file, folder);
  }
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) {
    return;
  }

  const provider = getStorageProvider();

  if (provider === "local") {
    await deleteFileFromLocal(fileUrl);
  } else {
    // All S3-compatible providers (s3, digitalocean, wasabi, minio)
    await deleteFileFromStorage(fileUrl);
  }
};

export const getStorageProviderInfo = () => {
  const provider = getStorageProvider();
  return {
    provider,
    isLocal: provider === "local",
    isCloud: provider !== "local",
  };
};
