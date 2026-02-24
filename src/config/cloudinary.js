const { v2: cloudinary } = require("cloudinary");
const env = require("./env");

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true,
});

// Extend upload timeout for large files
cloudinary.uploader.upload_stream = (function (original) {
  return function () {
    const args = Array.from(arguments);
    // Ensure timeout is set to high value
    if (typeof args[0] === "object" && !args[0].timeout) {
      args[0].timeout = 600000; // 10 minutes
    }
    return original.apply(this, args);
  };
})(cloudinary.uploader.upload_stream);

module.exports = cloudinary;
