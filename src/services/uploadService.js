const cloudinary = require("../config/cloudinary");
const { createHttpError } = require("../utils/responseHandler");

const resolveResourceType = (input) => {
  const value = String(input || "").toLowerCase();

  if (value.startsWith("image/") || value === "image") {
    return "image";
  }

  if (
    value.startsWith("video/") ||
    value.startsWith("audio/") ||
    value === "video" ||
    value === "audio"
  ) {
    return "video";
  }

  throw createHttpError(400, "Unsupported file type");
};

const uploadToCloudinary = async (fileBuffer, resourceType) => {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw createHttpError(400, "File is required");
  }

  const cloudinaryResourceType = resolveResourceType(resourceType);

  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "memona",
          resource_type: cloudinaryResourceType,
          overwrite: false,
        },
        (error, uploadedFile) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(uploadedFile);
        },
      );

      stream.end(fileBuffer);
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format || null,
      bytes: Number(result.bytes || 0),
      duration: typeof result.duration === "number" ? result.duration : null,
    };
  } catch (error) {
    throw createHttpError(502, "Failed to upload file");
  }
};

module.exports = {
  uploadToCloudinary,
};
