const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getMilestones } = require("../controllers/milestoneController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMilestones);

module.exports = router;
