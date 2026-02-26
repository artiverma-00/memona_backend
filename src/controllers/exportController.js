const exportService = require("../services/exportService");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");
const cloudinary = require("../config/cloudinary");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseExportId = (value) => {
  const exportId = String(value || "").trim();
  if (!UUID_REGEX.test(exportId)) {
    throw createHttpError(400, "Invalid export id");
  }
  return exportId;
};

const getExports = asyncHandler(async (req, res) => {
  const data = await exportService.listExportsByUser(req.user.id);
  return sendSuccess(res, 200, data);
});

const createExport = asyncHandler(async (req, res) => {
  const fileUrl = String(req.body.file_url || "").trim();
  const format = String(req.body.format || "").trim();

  if (!fileUrl) {
    throw createHttpError(400, "file_url is required");
  }

  if (!format) {
    throw createHttpError(400, "format is required");
  }

  const created = await exportService.createExport({
    user_id: req.user.id,
    file_url: fileUrl,
    format,
  });

  return sendSuccess(res, 201, created);
});

const deleteExport = asyncHandler(async (req, res) => {
  const id = parseExportId(req.params.id);
  const deleted = await exportService.deleteExport({
    id,
    userId: req.user.id,
  });

  if (!deleted) {
    throw createHttpError(404, "Export record not found");
  }

  return sendSuccess(res, 200, { id });
});

const downloadMedia = asyncHandler(async (req, res) => {
  const { url, filename } = req.query;

  if (!url) {
    throw createHttpError(400, "url parameter is required");
  }

  try {
    // Decode the URL
    const decodedUrl = decodeURIComponent(url);

    // Check if it's a Cloudinary URL
    if (decodedUrl.includes("cloudinary.com")) {
      // Check if URL already has query params
      const hasQueryParams = decodedUrl.includes("?");

      // Remove any existing fl_attachment to avoid duplicates
      let cleanUrl = decodedUrl.replace(/[?&]fl_attachment=[^&]*/g, "");

      // Add fl_attachment parameter
      const downloadUrl =
        cleanUrl + (hasQueryParams ? "&" : "?") + "fl_attachment=true";

      // Redirect to the download URL
      res.redirect(downloadUrl);
    } else {
      // For non-Cloudinary URLs, redirect directly
      res.redirect(decodedUrl);
    }
  } catch (error) {
    console.error("Download error:", error);
    throw createHttpError(500, "Failed to generate download URL");
  }
});

module.exports = {
  getExports,
  createExport,
  deleteExport,
  downloadMedia,
};
