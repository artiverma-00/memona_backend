const interactionService = require("../services/interactionService");
const {
  asyncHandler,
  createHttpError,
  sendSuccess,
} = require("../utils/responseHandler");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseUuid = (value, fieldName) => {
  const parsed = String(value || "").trim();
  if (!UUID_REGEX.test(parsed)) {
    throw createHttpError(400, `Invalid ${fieldName}`);
  }
  return parsed;
};

const getComments = asyncHandler(async (req, res) => {
  const memoryId = parseUuid(req.params.memoryId, "memory id");
  const comments = await interactionService.listComments(memoryId);
  return sendSuccess(res, 200, comments);
});

const addComment = asyncHandler(async (req, res) => {
  const memoryId = parseUuid(req.params.memoryId, "memory id");
  const comment = String(req.body.comment || "").trim();

  if (!comment) {
    throw createHttpError(400, "Comment is required");
  }

  const created = await interactionService.createComment({
    memoryId,
    userId: req.user.id,
    comment,
  });

  return sendSuccess(res, 201, created);
});

const deleteComment = asyncHandler(async (req, res) => {
  const commentId = parseUuid(req.params.commentId, "comment id");
  const deleted = await interactionService.deleteComment({
    commentId,
    userId: req.user.id,
  });

  if (!deleted) {
    throw createHttpError(404, "Comment not found");
  }

  return sendSuccess(res, 200, { id: commentId });
});

const likeMemory = asyncHandler(async (req, res) => {
  const memoryId = parseUuid(req.params.memoryId, "memory id");
  await interactionService.likeMemory({
    memoryId,
    userId: req.user.id,
  });

  return sendSuccess(res, 200, { memory_id: memoryId, liked: true });
});

const unlikeMemory = asyncHandler(async (req, res) => {
  const memoryId = parseUuid(req.params.memoryId, "memory id");
  await interactionService.unlikeMemory({
    memoryId,
    userId: req.user.id,
  });

  return sendSuccess(res, 200, { memory_id: memoryId, liked: false });
});

const getLikeSummary = asyncHandler(async (req, res) => {
  const memoryId = parseUuid(req.params.memoryId, "memory id");
  const summary = await interactionService.getLikeSummary({
    memoryId,
    userId: req.user.id,
  });

  return sendSuccess(res, 200, summary);
});

module.exports = {
  getComments,
  addComment,
  deleteComment,
  likeMemory,
  unlikeMemory,
  getLikeSummary,
};
