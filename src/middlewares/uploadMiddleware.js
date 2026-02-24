const multer = require("multer");

// 500MB limit for large video uploads
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
const ALLOWED_PREFIXES = ["image/", "video/", "audio/"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const mimeType = String(file?.mimetype || "").toLowerCase();
  const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
    mimeType.startsWith(prefix),
  );

  console.log(
    `[UPLOAD-FILTER] File: ${file.originalname}, MIME: ${mimeType}, Allowed: ${isAllowed}`,
  );

  if (!isAllowed) {
    const error = new Error(
      "Invalid file type. Only image, video, or audio files are allowed",
    );
    error.statusCode = 400;
    cb(error);
    return;
  }

  cb(null, true);
};

const uploader = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

const uploadMiddleware = (req, res, next) => {
  const upload = uploader.single("file");
  upload(req, res, (err) => {
    if (err) {
      console.error(`[UPLOAD-ERROR] ${err.message}`);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `File too large. Maximum size: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
        });
      }
      return res.status(err.statusCode || 400).json({ error: err.message });
    }
    if (req.file) {
      console.log(
        `[UPLOAD-RECEIVED] ${req.file.originalname}, ${req.file.size} bytes`,
      );
    }
    next();
  });
};

module.exports = {
  uploadMiddleware,
  MAX_FILE_SIZE_BYTES,
};
