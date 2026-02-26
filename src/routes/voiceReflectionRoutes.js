const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getVoiceReflections,
  getVoiceReflectionById,
  deleteVoiceReflection,
  uploadVoiceReflection,
} = require("../controllers/voiceReflectionController");

// Configure multer for memory buffer storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow audio files
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
});

// All routes require authentication
router.use(authMiddleware);

// Get all voice reflections
router.get("/", getVoiceReflections);

// Upload a new voice reflection
router.post("/upload", upload.single("audio"), uploadVoiceReflection);

// Get voice reflection by ID
router.get("/:id", getVoiceReflectionById);

// Delete voice reflection
router.delete("/:id", deleteVoiceReflection);

module.exports = router;
