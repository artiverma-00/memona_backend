const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const TABLE_NAME = "memories";
const MEMORY_SELECT =
  "*, media_file:media_files!media_id(secure_url, resource_type), album_memories(album_id), memory_likes(user_id)";

const listMemoriesByUser = async (userId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(MEMORY_SELECT)
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
    .select(MEMORY_SELECT)
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
    .select(MEMORY_SELECT)
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
    .select(MEMORY_SELECT)
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
