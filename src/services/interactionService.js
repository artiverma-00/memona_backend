const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const listComments = async (memoryId) => {
  const { data, error } = await supabase
    .from("memory_comments")
    .select("id, memory_id, user_id, comment, created_at")
    .eq("memory_id", memoryId)
    .order("created_at", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const createComment = async ({ memoryId, userId, comment }) => {
  const { data, error } = await supabase
    .from("memory_comments")
    .insert({ memory_id: memoryId, user_id: userId, comment })
    .select("id, memory_id, user_id, comment, created_at")
    .single();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const deleteComment = async ({ commentId, userId }) => {
  const { data, error } = await supabase
    .from("memory_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

const likeMemory = async ({ memoryId, userId }) => {
  const { error } = await supabase
    .from("memory_likes")
    .insert({ memory_id: memoryId, user_id: userId });

  if (error && error.code !== "23505") {
    throw createHttpError(500, error.message);
  }

  return true;
};

const unlikeMemory = async ({ memoryId, userId }) => {
  const { error } = await supabase
    .from("memory_likes")
    .delete()
    .eq("memory_id", memoryId)
    .eq("user_id", userId);

  if (error) {
    throw createHttpError(500, error.message);
  }

  return true;
};

const getLikeSummary = async ({ memoryId, userId }) => {
  const { count, error: countError } = await supabase
    .from("memory_likes")
    .select("*", { count: "exact", head: true })
    .eq("memory_id", memoryId);

  if (countError) {
    throw createHttpError(500, countError.message);
  }

  const { data, error } = await supabase
    .from("memory_likes")
    .select("memory_id")
    .eq("memory_id", memoryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return {
    count: count || 0,
    liked: Boolean(data),
  };
};

module.exports = {
  listComments,
  createComment,
  deleteComment,
  likeMemory,
  unlikeMemory,
  getLikeSummary,
};
