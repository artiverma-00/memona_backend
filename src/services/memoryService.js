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

const listMapMemoriesByUser = async (userId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      "id, title, created_at, location_lat, location_lng, media_file:media_files!media_id(secure_url)",
    )
    .eq("user_id", userId)
    .not("location_lat", "is", null)
    .not("location_lng", "is", null)
    .gte("location_lat", -90)
    .lte("location_lat", 90)
    .gte("location_lng", -180)
    .lte("location_lng", 180)
    .order("created_at", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return (data || []).map((memory) => ({
    id: memory.id,
    title: memory.title,
    created_at: memory.created_at,
    location_lat: Number(memory.location_lat),
    location_lng: Number(memory.location_lng),
    media_thumbnail: memory.media_file?.secure_url || null,
  }));
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
  listMapMemoriesByUser,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
};
