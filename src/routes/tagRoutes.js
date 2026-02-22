const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getTags,
  createTag,
  deleteTag,
} = require("../controllers/tagController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getTags);
router.post("/", createTag);
router.delete("/:id", deleteTag);

module.exports = router;
