const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const listTags = async () => {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const createTag = async (name) => {
  const { data, error } = await supabase
    .from("tags")
    .insert({ name })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw createHttpError(409, "Tag already exists");
    }
    throw createHttpError(500, error.message);
  }

  return data;
};

const deleteTag = async (tagId) => {
  const { data, error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

module.exports = {
  listTags,
  createTag,
  deleteTag,
};
