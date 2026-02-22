const multer = require("multer");

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");

  if (!isImage && !isVideo) {
    const error = new Error("Only image and video files are allowed");
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

const handleSingleUpload = (fieldName) => uploader.single(fieldName);

module.exports = {
  handleSingleUpload,
  MAX_FILE_SIZE_BYTES,
};
