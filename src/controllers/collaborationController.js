const collaborationService = require("../services/collaborationService");
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

const listCollaborations = asyncHandler(async (req, res) => {
  const data = await collaborationService.listCollaborationsByOwner(req.user.id);
  return sendSuccess(res, 200, data);
});

const createCollaboration = asyncHandler(async (req, res) => {
  const albumId = parseUuid(req.body.album_id, "album_id");
  const collaboratorId = parseUuid(req.body.collaborator_id, "collaborator_id");
  const role = req.body.role ? String(req.body.role).trim() : "editor";

  const created = await collaborationService.createCollaboration({
    album_id: albumId,
    owner_id: req.user.id,
    collaborator_id: collaboratorId,
    role,
  });

  return sendSuccess(res, 201, created);
});

const updateCollaboration = asyncHandler(async (req, res) => {
  const id = parseUuid(req.params.id, "collaboration id");
  const role = String(req.body.role || "").trim();

  if (!role) {
    throw createHttpError(400, "Role is required");
  }

  const updated = await collaborationService.updateCollaboration({
    id,
    ownerId: req.user.id,
    payload: { role },
  });

  if (!updated) {
    throw createHttpError(404, "Collaboration not found");
  }

  return sendSuccess(res, 200, updated);
});

const deleteCollaboration = asyncHandler(async (req, res) => {
  const id = parseUuid(req.params.id, "collaboration id");
  const deleted = await collaborationService.deleteCollaboration({
    id,
    ownerId: req.user.id,
  });

  if (!deleted) {
    throw createHttpError(404, "Collaboration not found");
  }

  return sendSuccess(res, 200, { id });
});

module.exports = {
  listCollaborations,
  createCollaboration,
  updateCollaboration,
  deleteCollaboration,
};
