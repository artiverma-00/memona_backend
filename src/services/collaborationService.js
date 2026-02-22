const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const listCollaborationsByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from("collaborations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("id", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const createCollaboration = async (payload) => {
  const { data, error } = await supabase
    .from("collaborations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const updateCollaboration = async ({ id, ownerId, payload }) => {
  const { data, error } = await supabase
    .from("collaborations")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

const deleteCollaboration = async ({ id, ownerId }) => {
  const { data, error } = await supabase
    .from("collaborations")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

module.exports = {
  listCollaborationsByOwner,
  createCollaboration,
  updateCollaboration,
  deleteCollaboration,
};
