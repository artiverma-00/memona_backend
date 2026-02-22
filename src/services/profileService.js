const supabase = require("../config/supabaseClient");
const { createHttpError } = require("../utils/responseHandler");

const isAdmin = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return data?.role === "admin";
};

module.exports = {
  isAdmin,
};
