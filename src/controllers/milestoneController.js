const supabase = require("../config/supabaseClient");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseMemoryId = (value) => {
  const memoryId = String(value || "").trim();
  if (!UUID_REGEX.test(memoryId)) {
    throw createHttpError(400, "Invalid milestone id");
  }
  return memoryId;
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return fallback;
};

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

const createMilestone = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    throw createHttpError(400, "Title is required");
  }

  const payload = {
    user_id: req.user.id,
    title,
    is_milestone: true,
  };

  if (req.body.description !== undefined) {
    payload.description = String(req.body.description || "").trim();
  }

  if (req.body.is_public !== undefined) {
    payload.is_public = parseBoolean(req.body.is_public, false);
  }

  const { data, error } = await supabase
    .from("memories")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw createHttpError(500, error.message);
  }

  return sendSuccess(res, 201, data);
});

const updateMilestone = asyncHandler(async (req, res) => {
  const milestoneId = parseMemoryId(req.params.id);
  const payload = {};

  if (req.body.title !== undefined) {
    const title = String(req.body.title).trim();
    if (!title) {
      throw createHttpError(400, "Title cannot be empty");
    }
    payload.title = title;
  }

  if (req.body.description !== undefined) {
    payload.description = String(req.body.description).trim();
  }

  if (req.body.is_public !== undefined) {
    payload.is_public = parseBoolean(req.body.is_public, false);
  }

  if (Object.keys(payload).length === 0) {
    throw createHttpError(400, "No fields provided for update");
  }

  const { data, error } = await supabase
    .from("memories")
    .update(payload)
    .eq("id", milestoneId)
    .eq("user_id", req.user.id)
    .eq("is_milestone", true)
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  if (!data) {
    throw createHttpError(404, "Milestone not found");
  }

  return sendSuccess(res, 200, data);
});

const deleteMilestone = asyncHandler(async (req, res) => {
  const milestoneId = parseMemoryId(req.params.id);

  const { data, error } = await supabase
    .from("memories")
    .delete()
    .eq("id", milestoneId)
    .eq("user_id", req.user.id)
    .eq("is_milestone", true)
    .select("id")
    .single();

  if (error && error.code !== "PGRST116") {
    throw createHttpError(500, error.message);
  }

  if (!data) {
    throw createHttpError(404, "Milestone not found");
  }

  return sendSuccess(res, 200, { id: milestoneId });
});

module.exports = {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
