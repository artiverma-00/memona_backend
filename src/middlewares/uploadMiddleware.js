const multer = require("multer");

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_PREFIXES = ["image/", "video/", "audio/"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const mimeType = String(file?.mimetype || "").toLowerCase();
  const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
    mimeType.startsWith(prefix),
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

const uploadMiddleware = uploader.single("file");

module.exports = {
  uploadMiddleware,
  MAX_FILE_SIZE_BYTES,
};
