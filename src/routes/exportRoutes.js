const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getExports,
  createExport,
  deleteExport,
} = require("../controllers/exportController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getExports);
router.post("/", createExport);
router.delete("/:id", deleteExport);

module.exports = router;
