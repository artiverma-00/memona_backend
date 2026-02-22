const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const listExportsByUser = async (userId) => {
  const { data, error } = await supabase
    .from("exports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const createExport = async (payload) => {
  const { data, error } = await supabase
    .from("exports")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const deleteExport = async ({ id, userId }) => {
  const { data, error } = await supabase
    .from("exports")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  return data || null;
};

module.exports = {
  listExportsByUser,
  createExport,
  deleteExport,
};
