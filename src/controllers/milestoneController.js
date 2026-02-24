const supabase = require("../config/supabaseClient");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Check if a string is a valid UUID
const isValidUUID = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }
  return UUID_REGEX.test(value.trim());
};

const parseUUID = (value, fieldName = "ID") => {
  const normalized = String(value || "").trim();
  if (!UUID_REGEX.test(normalized)) {
    throw createHttpError(400, `Invalid ${fieldName}`);
  }
  return normalized;
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

/**
 * Get all user milestones with memory details
 * Joins milestones table with memories table using explicit relationship
 * Also returns standalone milestones (without memory_id) with their metadata
 */
const getAllUserMilestones = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get all milestones for the user (both from memories and standalone)
  const { data: milestonesData, error: milestonesError } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .order("celebration_date", { ascending: true });

  if (milestonesError) {
    throw createHttpError(500, milestonesError.message);
  }

  if (!milestonesData || milestonesData.length === 0) {
    return sendSuccess(res, 200, "Milestones fetched successfully", []);
  }

  // Separate standalone milestones (no memory_id) from memory-linked ones
  const standaloneMilestones = milestonesData.filter((m) => !m.memory_id);
  const memoryLinkedMilestones = milestonesData.filter((m) => m.memory_id);

  // Get memory IDs from memory-linked milestones
  const memoryIds = memoryLinkedMilestones
    .map((m) => m.memory_id)
    .filter(Boolean);

  let memoriesData = [];

  if (memoryIds.length > 0) {
    // Fetch memories with their media
    const { data: fetchedMemories, error: memoriesError } = await supabase
      .from("memories")
      .select(
        `
        id,
        user_id,
        title,
        description,
        location_name,
        location_lat,
        location_lng,
        is_milestone,
        is_public,
        created_at,
        media_file:media_files!memories_media_id_fkey(secure_url, resource_type)
      `,
      )
      .in("id", memoryIds)
      .eq("user_id", userId);

    if (memoriesError) {
      throw createHttpError(500, memoriesError.message);
    }

    memoriesData = fetchedMemories || [];
  }

  // Create a map of memory ID to memory data
  const memoriesMap = new Map();
  (memoriesData || []).forEach((memory) => {
    memoriesMap.set(memory.id, memory);
  });

  // Process memory-linked milestones
  const validMilestonesFromMemory = memoryLinkedMilestones
    .map((milestone) => {
      const memory = memoriesMap.get(milestone.memory_id);
      if (!memory) return null;

      return {
        ...milestone,
        memories: memory,
        // Flatten memory fields for frontend compatibility
        title: memory.title || "",
        description: memory.description || "",
        date: memory.created_at,
        is_standalone: false,
      };
    })
    .filter(Boolean);

  // Process standalone milestones (with metadata)
  const standaloneResult = standaloneMilestones.map((milestone) => {
    const metadata = milestone.metadata || {};
    return {
      ...milestone,
      memories: null,
      // Use metadata for standalone milestones
      title: metadata.title || "",
      description: metadata.description || "",
      type: metadata.type || "life_event",
      target_date: metadata.target_date || null,
      target_count: metadata.target_count || null,
      reminder_option:
        metadata.reminder_days !== undefined
          ? getReminderOptionFromDays(metadata.reminder_days)
          : "1_week_before",
      is_standalone: true,
      // Map celebration_date to date for frontend compatibility
      date: milestone.celebration_date,
    };
  });

  // Combine both types of milestones
  const allMilestones = [...validMilestonesFromMemory, ...standaloneResult];

  return sendSuccess(
    res,
    200,
    "Milestones fetched successfully",
    allMilestones,
  );
});

// Helper function to convert reminder days to reminder option string
const getReminderOptionFromDays = (days) => {
  const REMINDER_OPTIONS_MAP = {
    0: "on_date",
    1: "1_day_before",
    3: "3_days_before",
    7: "1_week_before",
    30: "1_month_before",
  };
  return REMINDER_OPTIONS_MAP[days] || "1_week_before";
};

/**
 * Create a new milestone
 * Supports two modes:
 * 1. Standalone: Create with full metadata (title, description, type, targetDate, targetCount, reminderOption)
 * 2. From Memory: Link to an existing memory (requires valid UUID memory_id)
 */
const createMilestone = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    memory_id,
    celebration_date,
    reminder_enabled,
    // Standalone milestone fields
    title,
    description,
    type,
    target_date,
    target_count,
    reminder_option,
  } = req.body;

  // Check if memory_id is provided and is a valid UUID
  // Only treat as "from memory" if memory_id is explicitly provided AND is a valid UUID
  const hasValidMemoryId = isValidUUID(memory_id);

  if (hasValidMemoryId) {
    // Mode 1: Create from existing memory (requires valid UUID)
    const memoryId = parseUUID(memory_id, "memory_id");

    if (!celebration_date) {
      throw createHttpError(
        400,
        "celebration_date is required when creating from memory",
      );
    }

    const celebrationDate = new Date(celebration_date);
    if (isNaN(celebrationDate.getTime())) {
      throw createHttpError(400, "Invalid celebration_date format");
    }

    const reminderEnabled = parseBoolean(reminder_enabled, false);

    // Verify memory exists and belongs to user
    const { data: memory, error: memoryError } = await supabase
      .from("memories")
      .select("id, user_id")
      .eq("id", memoryId)
      .eq("user_id", userId)
      .single();

    if (memoryError || !memory) {
      throw createHttpError(
        404,
        "Memory not found or does not belong to this user",
      );
    }

    // Create milestone in milestones table
    const { data: newMilestone, error: createError } = await supabase
      .from("milestones")
      .insert({
        user_id: userId,
        memory_id: memoryId,
        celebration_date: celebrationDate.toISOString(),
        reminder_enabled: reminderEnabled,
      })
      .select("*")
      .single();

    if (createError) {
      throw createHttpError(500, createError.message);
    }

    // Fetch the memory with its media
    const { data: memoryData, error: memoryFetchError } = await supabase
      .from("memories")
      .select(
        `
        id,
        user_id,
        title,
        description,
        location_name,
        location_lat,
        location_lng,
        is_milestone,
        is_public,
        created_at,
        media_file:media_files!memories_media_id_fkey(secure_url, resource_type)
      `,
      )
      .eq("id", memoryId)
      .single();

    if (memoryFetchError) {
      console.error("Error fetching memory for milestone:", memoryFetchError);
    }

    // Combine milestone with memory
    const milestoneWithMemory = {
      ...newMilestone,
      memories: memoryData || null,
    };

    // Update memories.is_milestone = true
    const { error: updateError } = await supabase
      .from("memories")
      .update({ is_milestone: true })
      .eq("id", memoryId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating memory is_milestone flag:", updateError);
    }

    return sendSuccess(
      res,
      201,
      "Milestone created successfully",
      milestoneWithMemory,
    );
  } else {
    // Mode 2: Create standalone milestone with full metadata
    // This handles cases where:
    // - memory_id is empty string ""
    // - memory_id is null/undefined
    // - memory_id is not a valid UUID
    // - title is provided (standalone milestone)

    if (!title || !title.trim()) {
      throw createHttpError(400, "title is required for standalone milestone");
    }

    if (!celebration_date) {
      throw createHttpError(400, "celebration_date is required");
    }

    const celebrationDate = new Date(celebration_date);
    if (isNaN(celebrationDate.getTime())) {
      throw createHttpError(400, "Invalid celebration_date format");
    }

    // Parse target_date if provided
    let targetDate = null;
    if (target_date) {
      targetDate = new Date(target_date);
      if (isNaN(targetDate.getTime())) {
        throw createHttpError(400, "Invalid target_date format");
      }
    }

    // Parse target_count if provided
    let targetCount = null;
    if (target_count !== undefined && target_count !== null) {
      targetCount = parseInt(target_count, 10);
      if (isNaN(targetCount) || targetCount < 0) {
        throw createHttpError(400, "Invalid target_count");
      }
    }

    // Parse reminder_option to get reminder_enabled and reminder_days
    let reminderEnabled = parseBoolean(reminder_enabled, true);
    let reminderDays = 7; // Default to 1 week before

    if (reminder_option) {
      const REMINDER_DAYS_MAP = {
        on_date: 0,
        "1_day_before": 1,
        "3_days_before": 3,
        "1_week_before": 7,
        "1_month_before": 30,
        none: null,
      };
      reminderDays = REMINDER_DAYS_MAP[reminder_option] ?? 7;
      reminderEnabled = reminderDays !== null;
    }

    // Create milestone with extended metadata
    const milestoneData = {
      user_id: userId,
      celebration_date: celebrationDate.toISOString(),
      reminder_enabled: reminderEnabled,
      // Extended fields stored as JSON in a metadata column
      metadata: {
        title: title.trim(),
        description: description || "",
        type: type || "life_event",
        target_date: targetDate ? targetDate.toISOString() : null,
        target_count: targetCount,
        reminder_days: reminderDays,
      },
    };

    const { data: newMilestone, error: createError } = await supabase
      .from("milestones")
      .insert(milestoneData)
      .select("*")
      .single();

    if (createError) {
      throw createHttpError(500, createError.message);
    }

    return sendSuccess(res, 201, "Milestone created successfully", {
      ...newMilestone,
      // Flatten metadata for frontend compatibility
      title: newMilestone.metadata?.title || title,
      description: newMilestone.metadata?.description || "",
      type: newMilestone.metadata?.type || "life_event",
      target_date:
        newMilestone.metadata?.target_date || targetDate?.toISOString(),
      target_count: newMilestone.metadata?.target_count || targetCount,
      reminder_option: reminder_option || "1_week_before",
      is_standalone: true,
    });
  }
});

/**
 * Update milestone (celebration_date, reminder_enabled)
 */
const updateMilestone = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const milestoneId = parseUUID(req.params.id, "milestone_id");

  // Verify milestone exists and belongs to user
  const { data: existing, error: getError } = await supabase
    .from("milestones")
    .select("id, user_id, memory_id")
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .single();

  if (getError || !existing) {
    throw createHttpError(404, "Milestone not found");
  }

  const payload = {};

  if (req.body.celebration_date !== undefined) {
    const celebrationDate = new Date(req.body.celebration_date);
    if (isNaN(celebrationDate.getTime())) {
      throw createHttpError(400, "Invalid celebration_date format");
    }
    payload.celebration_date = celebrationDate.toISOString();
  }

  if (req.body.reminder_enabled !== undefined) {
    payload.reminder_enabled = parseBoolean(req.body.reminder_enabled, false);
  }

  if (Object.keys(payload).length === 0) {
    throw createHttpError(400, "No fields provided for update");
  }

  const { data: updated, error: updateError } = await supabase
    .from("milestones")
    .update(payload)
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .select(
      `
      id,
      user_id,
      memory_id,
      celebration_date,
      reminder_enabled,
      created_at,
      updated_at,
      memories(
        id,
        user_id,
        title,
        description,
        location,
        created_at,
        media_file:media_files!memories_media_id_fkey(secure_url, resource_type)
      )
    `,
    )
    .single();

  if (updateError) {
    throw createHttpError(500, updateError.message);
  }

  return sendSuccess(res, 200, "Milestone updated successfully", updated);
});

/**
 * Delete milestone and remove is_milestone flag from memory
 */
const deleteMilestone = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const milestoneId = parseUUID(req.params.id, "milestone_id");

  // Get milestone to find associated memory
  const { data: milestone, error: getError } = await supabase
    .from("milestones")
    .select("id, memory_id")
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .single();

  if (getError || !milestone) {
    throw createHttpError(404, "Milestone not found");
  }

  // Delete milestone
  const { error: deleteError } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("user_id", userId);

  if (deleteError) {
    throw createHttpError(500, deleteError.message);
  }

  // Update memories.is_milestone = false
  const { error: updateError } = await supabase
    .from("memories")
    .update({ is_milestone: false })
    .eq("id", milestone.memory_id)
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating memory is_milestone flag:", updateError);
    // Don't fail the request
  }

  return sendSuccess(res, 200, "Milestone deleted successfully", {
    id: milestoneId,
  });
});

/**
 * Get today's reminder milestones
 * Checks if celebration_date month/day matches today
 */
const getTodayReminders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();
  const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
  const todayDay = String(today.getDate()).padStart(2, "0");

  // Get all user milestones where reminder_enabled = true
  const { data: milestonesData, error: fetchError } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .eq("reminder_enabled", true)
    .order("celebration_date", { ascending: true });

  if (fetchError) {
    throw createHttpError(500, fetchError.message);
  }

  if (!milestonesData || milestonesData.length === 0) {
    return sendSuccess(res, 200, "Today's reminders fetched successfully", []);
  }

  // Get memory IDs from milestones
  const memoryIds = milestonesData.map((m) => m.memory_id).filter(Boolean);

  if (memoryIds.length === 0) {
    return sendSuccess(res, 200, "Today's reminders fetched successfully", []);
  }

  // Fetch memories with their media
  const { data: memoriesData, error: memoriesError } = await supabase
    .from("memories")
    .select(
      `
      id,
      user_id,
      title,
      description,
      location_name,
      location_lat,
      location_lng,
      is_milestone,
      is_public,
      created_at,
      media_file:media_files!memories_media_id_fkey(secure_url, resource_type)
    `,
    )
    .in("id", memoryIds)
    .eq("user_id", userId);

  if (memoriesError) {
    throw createHttpError(500, memoriesError.message);
  }

  // Create a map of memory ID to memory data
  const memoriesMap = new Map();
  (memoriesData || []).forEach((memory) => {
    memoriesMap.set(memory.id, memory);
  });

  // Filter for today's anniversaries (month/day match)
  const todayReminders = milestonesData
    .map((milestone) => {
      const memory = memoriesMap.get(milestone.memory_id);
      if (!memory) return null;

      const celebrationDate = new Date(milestone.celebration_date);
      const celebMonth = String(celebrationDate.getMonth() + 1).padStart(
        2,
        "0",
      );
      const celebDay = String(celebrationDate.getDate()).padStart(2, "0");

      if (celebMonth === todayMonth && celebDay === todayDay) {
        return {
          ...milestone,
          memories: memory,
        };
      }
      return null;
    })
    .filter(Boolean);

  return sendSuccess(
    res,
    200,
    "Today's reminders fetched successfully",
    todayReminders,
  );
});

module.exports = {
  getAllUserMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getTodayReminders,
};
