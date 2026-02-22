const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const listActivityLogs = async ({ userId, isAdmin }) => {
  let query = supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

const createActivityLog = async (payload) => {
  const { data, error } = await supabase
    .from("activity_logs")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data;
};

module.exports = {
  listActivityLogs,
  createActivityLog,
};
