const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const TABLE_NAME = "albums";

const listAlbumsByUser = async (userId) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const createAlbum = async (payload) => {
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

const updateAlbum = async (userId, albumId, payload) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq("id", albumId)
    .eq("user_id", userId)
    .select("*")
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
  createAlbum,
  updateAlbum,
  deleteAlbum,
};
