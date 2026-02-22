const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} = require("../controllers/albumController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAlbums);
router.post("/", createAlbum);
router.put("/:id", updateAlbum);
router.delete("/:id", deleteAlbum);

module.exports = router;
