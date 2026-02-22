const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} = require("../controllers/milestoneController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMilestones);
router.post("/", createMilestone);
router.put("/:id", updateMilestone);
router.delete("/:id", deleteMilestone);

module.exports = router;
