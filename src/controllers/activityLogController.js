const activityLogService = require("../services/activityLogService");
const profileService = require("../services/profileService");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const getActivityLogs = asyncHandler(async (req, res) => {
  const admin = await profileService.isAdmin(req.user.id);
  const logs = await activityLogService.listActivityLogs({
    userId: req.user.id,
    isAdmin: admin,
  });

  return sendSuccess(res, 200, logs);
});

const createActivityLog = asyncHandler(async (req, res) => {
  const action = String(req.body.action || "").trim();

  if (!action) {
    throw createHttpError(400, "Action is required");
  }

  const created = await activityLogService.createActivityLog({
    user_id: req.user.id,
    action,
    metadata:
      req.body.metadata && typeof req.body.metadata === "object"
        ? req.body.metadata
        : null,
  });

  return sendSuccess(res, 201, created);
});

module.exports = {
  getActivityLogs,
  createActivityLog,
};
