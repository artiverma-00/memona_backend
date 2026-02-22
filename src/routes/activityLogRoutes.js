const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getActivityLogs,
  createActivityLog,
} = require("../controllers/activityLogController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getActivityLogs);
router.post("/", createActivityLog);

module.exports = router;
