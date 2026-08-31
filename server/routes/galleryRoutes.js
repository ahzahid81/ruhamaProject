const express = require("express");

const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const uploadGallery = require("../middlewares/uploadGallery");

const {
  createGallery,
  getGallery,
  getGalleryPhoto,
  updateGallery,
  deleteGallery,
} = require("../controllers/galleryController");

// =====================================
// PUBLIC: LIST PHOTOS (latest first)
// Supports ?limit=N
// =====================================

router.get("/", getGallery);

// =====================================
// PUBLIC: SINGLE PHOTO
// =====================================

router.get("/:id", getGalleryPhoto);

// =====================================
// ADMIN: CREATE PHOTO
// =====================================

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  uploadGallery.single("photo"),
  createGallery
);

// =====================================
// ADMIN: UPDATE PHOTO / ALT TEXT
// =====================================

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  uploadGallery.single("photo"),
  updateGallery
);

// =====================================
// ADMIN: DELETE PHOTO
// =====================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteGallery
);

module.exports = router;