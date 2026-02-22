const supabase = require("../config/supabaseClient");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const getMilestones = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", req.user.id)
    .eq("is_milestone", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw createHttpError(500, error.message);
  }

  return sendSuccess(res, 200, "Milestones fetched successfully", data);
});

module.exports = {
  getMilestones,
};
