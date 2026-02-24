const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const TABLE_NAME = "memories";

const listMemoriesByUser = async (userId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      "*, media_file:media_files!memories_media_id_fkey(secure_url, resource_type), album_memories(album_id)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const getMemoryById = async (userId, memoryId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      "*, media_file:media_files!memories_media_id_fkey(secure_url, resource_type), album_memories(album_id)",
    )
    .eq("id", memoryId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

const createMemory = async (payload) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const updateMemory = async (userId, memoryId, payload) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

const deleteMemory = async (userId, memoryId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

module.exports = {
  listMemoriesByUser,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
};
