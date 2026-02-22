const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  listCollaborations,
  createCollaboration,
  updateCollaboration,
  deleteCollaboration,
} = require("../controllers/collaborationController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listCollaborations);
router.post("/", createCollaboration);
router.put("/:id", updateCollaboration);
router.delete("/:id", deleteCollaboration);

module.exports = router;
