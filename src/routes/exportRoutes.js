const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getExports,
  createExport,
  deleteExport,
} = require("../controllers/exportController");
const { downloadMedia } = require("../controllers/exportController");

const router = express.Router();

// Download endpoint doesn't require auth - serves public Cloudinary media
router.get("/download", downloadMedia);

// All other export routes require authentication
router.use(authMiddleware);

router.get("/", getExports);
router.post("/", createExport);
router.delete("/:id", deleteExport);

module.exports = router;
