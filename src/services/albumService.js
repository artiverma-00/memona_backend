const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const TABLE_NAME = "albums";

const listAlbumsByUser = async (userId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      "*, cover_media:media_files!cover_media_id(secure_url, resource_type), album_memories(memory_id)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const getAlbumById = async (userId, albumId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      `*, 
       cover_media:media_files!cover_media_id(secure_url, resource_type),
       memories:album_memories(
         memory:memories(
           *,
           media_file:media_files!media_id(secure_url, resource_type)
         )
       )`,
    )
    .eq("id", albumId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

const createAlbum = async (payload) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select(
      "*, cover_media:media_files!cover_media_id(secure_url, resource_type)",
    )
    .single();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const updateAlbum = async (userId, albumId, payload) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq("id", albumId)
    .eq("user_id", userId)
    .select(
      "*, cover_media:media_files!cover_media_id(secure_url, resource_type)",
    )
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

const deleteAlbum = async (userId, albumId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", albumId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

module.exports = {
  listAlbumsByUser,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
};
