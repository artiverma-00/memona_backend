const memoryService = require("../services/memoryService");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseUuid = (value, fieldName) => {
  const normalized = String(value || "").trim();
  if (!UUID_REGEX.test(normalized)) {
    throw createHttpError(400, `Invalid ${fieldName}`);
  }
  return normalized;
};

const parseMemoryId = (value) => {
  const memoryId = String(value || "").trim();
  if (!UUID_REGEX.test(memoryId)) {
    throw createHttpError(400, "Invalid memory id");
  }
  return memoryId;
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return fallback;
};

const getMemories = asyncHandler(async (req, res) => {
  const memories = await memoryService.listMemoriesByUser(req.user.id);
  return sendSuccess(res, 200, memories);
});

const getMemoryById = asyncHandler(async (req, res) => {
  const memoryId = parseMemoryId(req.params.id);
  const memory = await memoryService.getMemoryById(req.user.id, memoryId);

  if (!memory) {
    throw createHttpError(404, "Memory not found");
  }

  return sendSuccess(res, 200, memory);
});

const createMemory = asyncHandler(async (req, res) => {
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

  if (req.body.media_id !== undefined) {
    payload.media_id = req.body.media_id
      ? parseUuid(req.body.media_id, "media_id")
      : null;
  }

  if (req.body.voice_note_id !== undefined) {
    payload.voice_note_id = req.body.voice_note_id
      ? parseUuid(req.body.voice_note_id, "voice_note_id")
      : null;
  }

  if (req.body.location_lat !== undefined) {
    payload.location_lat = parseOptionalNumber(req.body.location_lat);
  }

  if (req.body.location_lng !== undefined) {
    payload.location_lng = parseOptionalNumber(req.body.location_lng);
  }

  if (req.body.location_name !== undefined) {
    payload.location_name = req.body.location_name
      ? String(req.body.location_name).trim()
      : null;
  }

  if (req.body.is_milestone !== undefined) {
    payload.is_milestone = parseBoolean(req.body.is_milestone, false);
  }

  if (req.body.is_public !== undefined) {
    payload.is_public = parseBoolean(req.body.is_public, false);
  }

  const created = await memoryService.createMemory(payload);
  return sendSuccess(res, 201, created);
});

const updateMemory = asyncHandler(async (req, res) => {
  const memoryId = parseMemoryId(req.params.id);
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

  if (req.body.location_lat !== undefined) {
    payload.location_lat = parseOptionalNumber(req.body.location_lat);
  }

  if (req.body.location_lng !== undefined) {
    payload.location_lng = parseOptionalNumber(req.body.location_lng);
  }

  if (req.body.location_name !== undefined) {
    payload.location_name = req.body.location_name
      ? String(req.body.location_name).trim()
      : null;
  }

  if (req.body.is_milestone !== undefined) {
    payload.is_milestone = parseBoolean(req.body.is_milestone);
  }

  if (req.body.is_public !== undefined) {
    payload.is_public = parseBoolean(req.body.is_public);
  }

  if (req.body.media_id !== undefined) {
    payload.media_id = req.body.media_id
      ? parseUuid(req.body.media_id, "media_id")
      : null;
  }

  if (req.body.voice_note_id !== undefined) {
    payload.voice_note_id = req.body.voice_note_id
      ? parseUuid(req.body.voice_note_id, "voice_note_id")
      : null;
  }

  if (Object.keys(payload).length === 0) {
    throw createHttpError(400, "No fields provided for update");
  }

  const updated = await memoryService.updateMemory(
    req.user.id,
    memoryId,
    payload,
  );

  if (!updated) {
    throw createHttpError(404, "Memory not found");
  }

  return sendSuccess(res, 200, updated);
});

const deleteMemory = asyncHandler(async (req, res) => {
  const memoryId = parseMemoryId(req.params.id);
  const deleted = await memoryService.deleteMemory(req.user.id, memoryId);

  if (!deleted) {
    throw createHttpError(404, "Memory not found");
  }

  return sendSuccess(res, 200, { id: memoryId });
});

module.exports = {
  getMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
};
