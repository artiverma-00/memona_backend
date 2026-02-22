const tagService = require("../services/tagService");
const profileService = require("../services/profileService");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseTagId = (value) => {
  const tagId = String(value || "").trim();
  if (!UUID_REGEX.test(tagId)) {
    throw createHttpError(400, "Invalid tag id");
  }
  return tagId;
};

const getTags = asyncHandler(async (req, res) => {
  const tags = await tagService.listTags();
  return sendSuccess(res, 200, tags);
});

const createTag = asyncHandler(async (req, res) => {
  const isAdmin = await profileService.isAdmin(req.user.id);
  if (!isAdmin) {
    throw createHttpError(403, "Only admins can create tags");
  }

  const name = String(req.body.name || "").trim();
  if (!name) {
    throw createHttpError(400, "Tag name is required");
  }

  const created = await tagService.createTag(name);
  return sendSuccess(res, 201, created);
});

const deleteTag = asyncHandler(async (req, res) => {
  const isAdmin = await profileService.isAdmin(req.user.id);
  if (!isAdmin) {
    throw createHttpError(403, "Only admins can delete tags");
  }

  const tagId = parseTagId(req.params.id);
  const deleted = await tagService.deleteTag(tagId);

  if (!deleted) {
    throw createHttpError(404, "Tag not found");
  }

  return sendSuccess(res, 200, { id: tagId });
});

module.exports = {
  getTags,
  createTag,
  deleteTag,
};
