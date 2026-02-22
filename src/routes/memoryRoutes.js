const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
} = require("../controllers/memoryController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMemories);
router.get("/:id", getMemoryById);
router.post("/", createMemory);
router.put("/:id", updateMemory);
router.delete("/:id", deleteMemory);

module.exports = router;
