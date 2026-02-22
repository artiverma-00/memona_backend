const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadMiddleware } = require("../middlewares/uploadMiddleware");
const {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} = require("../controllers/albumController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAlbums);
router.get("/:id", getAlbumById);
router.post("/", uploadMiddleware, createAlbum);
router.put("/:id", uploadMiddleware, updateAlbum);
router.delete("/:id", deleteAlbum);

module.exports = router;
