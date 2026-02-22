const albumService = require("../services/albumService");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseAlbumId = (value) => {
  const albumId = String(value || "").trim();
  if (!UUID_REGEX.test(albumId)) {
    throw createHttpError(400, "Invalid album id");
  }
  return albumId;
};

const parseOptionalUuid = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = String(value).trim();
  if (!UUID_REGEX.test(normalized)) {
    throw createHttpError(400, `Invalid ${fieldName}`);
  }

  return normalized;
};

const getAlbums = asyncHandler(async (req, res) => {
  const albums = await albumService.listAlbumsByUser(req.user.id);
  return sendSuccess(res, 200, "Albums fetched successfully", albums);
});

const createAlbum = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    throw createHttpError(400, "Title is required");
  }

  const payload = {
    user_id: req.user.id,
    title,
  };

  if (req.body.description !== undefined) {
    payload.description = String(req.body.description || "").trim();
  }

  if (req.body.is_public !== undefined) {
    payload.is_public = String(req.body.is_public).toLowerCase() === "true";
  }

  if (req.body.cover_media_id !== undefined) {
    payload.cover_media_id = parseOptionalUuid(
      req.body.cover_media_id,
      "cover_media_id",
    );
  }

  const created = await albumService.createAlbum(payload);

  return sendSuccess(res, 201, created);
});

const updateAlbum = asyncHandler(async (req, res) => {
  const albumId = parseAlbumId(req.params.id);
  const payload = {};

  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim();
    if (!title) {
      throw createHttpError(400, "Title cannot be empty");
    }
    payload.title = title;
  }

  if (req.body.description !== undefined) {
    payload.description = String(req.body.description).trim();
  }

  if (req.body.is_public !== undefined) {
    payload.is_public = String(req.body.is_public).toLowerCase() === "true";
  }

  if (req.body.cover_media_id !== undefined) {
    payload.cover_media_id = parseOptionalUuid(
      req.body.cover_media_id,
      "cover_media_id",
    );
  }

  if (Object.keys(payload).length === 0) {
    throw createHttpError(400, "No fields provided for update");
  }

  const updated = await albumService.updateAlbum(
    req.user.id,
    albumId,
    payload,
  );

  if (!updated) {
    throw createHttpError(404, "Album not found");
  }

  return sendSuccess(res, 200, updated);
});

const deleteAlbum = asyncHandler(async (req, res) => {
  const albumId = parseAlbumId(req.params.id);
  const deleted = await albumService.deleteAlbum(req.user.id, albumId);

  if (!deleted) {
    throw createHttpError(404, "Album not found");
  }

  return sendSuccess(res, 200, { id: albumId });
});

module.exports = {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
};
