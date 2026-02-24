const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAllUserMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getTodayReminders,
} = require("../controllers/milestoneController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get today's reminder milestones (must come before :id routes)
router.get("/today", getTodayReminders);

// Get all user milestones
router.get("/", getAllUserMilestones);

// Create new milestone
router.post("/", createMilestone);

// Update milestone by ID
router.put("/:id", updateMilestone);

// Delete milestone by ID
router.delete("/:id", deleteMilestone);

module.exports = router;
