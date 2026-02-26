const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");
const { uploadToCloudinary } = require("../services/uploadService");
const {
  asyncHandler,
  sendSuccess,
  createHttpError,
} = require("../utils/responseHandler");

// Get all voice reflections for the authenticated user
const getVoiceReflections = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: audioFiles, error: audioError } = await supabase
    .from("media_files")
    .select("*")
    .eq("user_id", userId)
    .eq("resource_type", "audio")
    .order("created_at", { ascending: false });

  if (audioError) {
    throw createHttpError(500, audioError.message);
  }

  const { data: memoryMediaRows, error: memoryMediaError } = await supabase
    .from("memories")
    .select("media_id")
    .eq("user_id", userId)
    .not("media_id", "is", null);

  if (memoryMediaError) {
    throw createHttpError(500, memoryMediaError.message);
  }

  const memoryMediaIds = new Set(
    (memoryMediaRows || []).map((row) => row.media_id).filter(Boolean),
  );

  const recordingOnlyItems = (audioFiles || []).filter(
    (item) => !memoryMediaIds.has(item.id),
  );

  return sendSuccess(res, 200, recordingOnlyItems);
});

// Upload a new voice reflection
const uploadVoiceReflection = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    throw createHttpError(400, "Audio file is required");
  }

  console.log(
    `[VOICE-UPLOAD] File: ${req.file.originalname}, size: ${(req.file.size / 1024).toFixed(2)}KB, type: ${req.file.mimetype}`,
  );

  // Upload to Cloudinary with resource_type as video (Cloudinary treats audio similar to video)
  const uploadedMedia = await uploadToCloudinary(
    req.file.buffer,
    req.file.mimetype,
  );

  console.log(`[VOICE-UPLOAD] Uploaded: ${uploadedMedia.secure_url}`);

  // Save to media_files table
  const { data: mediaRow, error: mediaInsertError } = await supabase
    .from("media_files")
    .insert({
      user_id: userId,
      public_id: uploadedMedia.public_id,
      secure_url: uploadedMedia.secure_url,
      resource_type: "audio",
      format: uploadedMedia.format,
      bytes: uploadedMedia.bytes,
      duration: uploadedMedia.duration,
    })
    .select("*")
    .single();

  if (mediaInsertError) {
    throw createHttpError(500, mediaInsertError.message);
  }

  return sendSuccess(res, 201, mediaRow);
});

// Get voice reflection by ID
const getVoiceReflectionById = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { data, error } = await supabase
    .from("media_files")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  if (!data) {
    throw createHttpError(404, "Voice reflection not found");
  }

  return sendSuccess(res, 200, data);
});

// Delete voice reflection
const deleteVoiceReflection = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from("media_files")
    .select("id, public_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw createHttpError(500, fetchError.message);
  }

  if (!existing) {
    throw createHttpError(404, "Voice reflection not found");
  }

  const { error: deleteError } = await supabase
    .from("media_files")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (deleteError) {
    throw createHttpError(500, deleteError.message);
  }

  return sendSuccess(res, 200, { id, message: "Voice reflection deleted" });
});

module.exports = {
  getVoiceReflections,
  getVoiceReflectionById,
  deleteVoiceReflection,
  uploadVoiceReflection,
};
