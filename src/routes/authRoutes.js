const express = require("express");
const {
  login,
  register,
  me,
  updateProfile,
  changePassword,
  healthCheck,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", authMiddleware, me);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, changePassword);

// Health check endpoint to verify Supabase connectivity
router.get("/health", healthCheck);

module.exports = router;
