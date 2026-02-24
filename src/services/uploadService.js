const cloudinary = require("../config/cloudinary");
const { createHttpError } = require("../utils/responseHandler");

const resolveResourceType = (input) => {
  const value = String(input || "").toLowerCase();

  if (value.startsWith("image/") || value === "image") {
    return "image";
  }

  // Cloudinary uses 'video' resource type for both video AND audio files
  if (
    value.startsWith("video/") ||
    value.startsWith("audio/") ||
    value === "video" ||
    value === "audio"
  ) {
    return "video";
  }

  throw createHttpError(400, "Unsupported file type: " + value);
};

const uploadToCloudinary = async (fileBuffer, resourceType) => {
  if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw createHttpError(400, "File is required");
  }

  const cloudinaryResourceType = resolveResourceType(resourceType);

  try {
    const result = await new Promise((resolve, reject) => {
      let timeoutHandle;

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "memona",
          resource_type: cloudinaryResourceType,
          overwrite: false,
          timeout: 300000, // 5 minutes for large uploads
        },
        (error, uploadedFile) => {
          clearTimeout(timeoutHandle);
          if (error) {
            reject(error);
            return;
          }
          resolve(uploadedFile);
        },
      );

      // Fallback timeout (15 minutes total)
      timeoutHandle = setTimeout(() => {
        console.error(`[UPLOAD] Timeout - taking too long`);
        stream.destroy();
        reject(new Error("Upload timeout - file took too long to upload"));
      }, 900000);

      stream.on("error", (error) => {
        clearTimeout(timeoutHandle);
        console.error(`[UPLOAD] Stream error:`, error.message);
        reject(error);
      });

      const fileSizeMB = fileBuffer.length / (1024 * 1024);
      console.log(
        `[UPLOAD] Uploading ${fileSizeMB.toFixed(2)}MB (${cloudinaryResourceType})...`,
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
    const errorMsg = error.message || "Unknown error";
    console.error(`[UPLOAD] Error: ${errorMsg}`);
    throw createHttpError(502, "Failed to upload file: " + errorMsg);
  }
};

module.exports = {
  uploadToCloudinary,
};
