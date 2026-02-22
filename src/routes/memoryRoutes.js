const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadMiddleware } = require("../middlewares/uploadMiddleware");
const {
  getMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
} = require("../controllers/memoryController");

const router = express.Router();

router.get("/", authMiddleware, getMemories);
router.get("/:id", authMiddleware, getMemoryById);
router.post("/", authMiddleware, uploadMiddleware, createMemory);
router.put("/:id", authMiddleware, updateMemory);
router.delete("/:id", authMiddleware, deleteMemory);

module.exports = router;
