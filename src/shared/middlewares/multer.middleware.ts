import multer from "multer";

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG and PNG allowed."));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB
});
