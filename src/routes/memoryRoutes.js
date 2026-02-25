const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadMiddleware } = require("../middlewares/uploadMiddleware");
const {
  getMemories,
  getMapMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
} = require("../controllers/memoryController");

const router = express.Router();

router.get("/", authMiddleware, getMemories);
router.get("/map", authMiddleware, getMapMemories);
router.get("/:id", authMiddleware, getMemoryById);
router.post("/", authMiddleware, uploadMiddleware, createMemory);
router.put("/:id", authMiddleware, updateMemory);
router.delete("/:id", authMiddleware, deleteMemory);

module.exports = router;
