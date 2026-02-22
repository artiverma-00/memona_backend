const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getComments,
  addComment,
  deleteComment,
  likeMemory,
  unlikeMemory,
  getLikeSummary,
} = require("../controllers/interactionController");

const router = express.Router();

router.use(authMiddleware);

router.get("/memories/:memoryId/comments", getComments);
router.post("/memories/:memoryId/comments", addComment);
router.delete("/comments/:commentId", deleteComment);

router.get("/memories/:memoryId/likes", getLikeSummary);
router.post("/memories/:memoryId/likes", likeMemory);
router.delete("/memories/:memoryId/likes", unlikeMemory);

module.exports = router;
