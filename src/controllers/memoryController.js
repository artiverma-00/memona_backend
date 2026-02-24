const memoryService = require("../services/memoryService");
const supabase = require("../config/supabaseClient");
const { uploadToCloudinary } = require("../services/uploadService");
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

const resolveMedia = (memory) => {
  const relation = memory.media_file || memory.media_files || null;
  if (!relation) {
    return {
      mediaUrl: memory.media_url || null,
      mediaType: memory.media_type || null,
    };
  }

  const item = Array.isArray(relation) ? relation[0] : relation;
  return {
    mediaUrl: item?.secure_url || memory.media_url || null,
    mediaType: item?.resource_type || memory.media_type || null,
  };
};

const getMemories = asyncHandler(async (req, res) => {
  const memories = await memoryService.listMemoriesByUser(req.user.id);
  const normalized = memories.map((memory) => ({
    ...memory,
    media_url: resolveMedia(memory).mediaUrl,
    media_type: resolveMedia(memory).mediaType,
    album_id: memory.album_memories?.[0]?.album_id || null,
  }));

  return sendSuccess(res, 200, normalized);
});

const getMemoryById = asyncHandler(async (req, res) => {
  const memoryId = parseMemoryId(req.params.id);
  const memory = await memoryService.getMemoryById(req.user.id, memoryId);

  if (!memory) {
    throw createHttpError(404, "Memory not found");
  }

  return sendSuccess(res, 200, {
    ...memory,
    media_url: resolveMedia(memory).mediaUrl,
    media_type: resolveMedia(memory).mediaType,
    album_id: memory.album_memories?.[0]?.album_id || null,
  });
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

  if (req.file) {
    const fileSizeMB = req.file.size / (1024 * 1024);
    console.log(
      `[MEMORY-CREATE] File: ${req.file.originalname}, size: ${fileSizeMB.toFixed(2)}MB, type: ${req.file.mimetype}`,
    );

    const mediaResourceType = String(req.file.mimetype || "")
      .toLowerCase()
      .startsWith("image/")
      ? "image"
      : String(req.file.mimetype || "")
            .toLowerCase()
            .startsWith("audio/")
        ? "audio"
        : "video";

    const uploadedMedia = await uploadToCloudinary(
      req.file.buffer,
      req.file.mimetype,
    );

    console.log(`[MEMORY-CREATE] Uploaded: ${uploadedMedia.secure_url}`);

    const { data: mediaRow, error: mediaInsertError } = await supabase
      .from("media_files")
      .insert({
        user_id: req.user.id,
        public_id: uploadedMedia.public_id,
        secure_url: uploadedMedia.secure_url,
        resource_type: mediaResourceType,
        format: uploadedMedia.format,
        bytes: uploadedMedia.bytes,
        duration: uploadedMedia.duration,
      })
      .select("id, secure_url")
      .single();

    if (mediaInsertError) {
      throw createHttpError(500, mediaInsertError.message);
    }

    payload.media_id = mediaRow.id;
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

  // Extract album_id if provided
  let albumId = null;
  if (req.body.album_id) {
    albumId = parseUuid(req.body.album_id, "album_id");

    // Insert into album_memories join table
    const { error: joinError } = await supabase
      .from("album_memories")
      .insert({ album_id: albumId, memory_id: created.id });

    if (joinError) {
      console.error("[MEMORY-CREATE] Error linking to album:", joinError);
      // Don't throw error - memory is created, just couldn't link to album
    } else {
      console.log(`[MEMORY-CREATE] Memory linked to album: ${albumId}`);
    }
  }

  let mediaUrl = null;
  if (payload.media_id) {
    const { data: mediaFile, error: mediaLookupError } = await supabase
      .from("media_files")
      .select("secure_url")
      .eq("id", payload.media_id)
      .single();

    if (mediaLookupError && mediaLookupError.code !== "PGRST116") {
      throw createHttpError(500, mediaLookupError.message);
    }

    mediaUrl = mediaFile?.secure_url || null;
  }

  const response = {
    id: created.id,
    title: created.title,
    description: created.description || payload.description || null,
    media_url: mediaUrl,
    media_type: req.file
      ? String(req.file.mimetype || "")
          .toLowerCase()
          .startsWith("image/")
        ? "image"
        : String(req.file.mimetype || "")
              .toLowerCase()
              .startsWith("audio/")
          ? "audio"
          : "video"
      : null,
    album_id: albumId,
    created_at: created.created_at,
  };

  console.log("[MEMORY-CREATE] Response:", response);

  return sendSuccess(res, 201, { memory: response });
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
