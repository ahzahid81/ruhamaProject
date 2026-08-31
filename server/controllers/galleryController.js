const Gallery = require("../models/Gallery");

const imagePath = (filename) => `/uploads/gallery/${filename}`;

// =====================================
// CREATE GALLERY PHOTO
// =====================================

const createGallery = async (req, res) => {
  try {
    const photo =
      req.file?.filename || req.body.photo || "";

    if (!photo) {
      return res.status(400).json({ message: "Photo is required" });
    }

    const gallery = await Gallery.create({
      photo: photo.startsWith("/uploads")
        ? photo
        : imagePath(photo),
      altText: (req.body.altText || "").trim(),
    });

    res.status(201).json({ success: true, gallery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// LIST GALLERY PHOTOS (newest first)
// Supports ?limit=N
// =====================================

const getGallery = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10);

    let query = Gallery.find().sort({ createdAt: -1 });

    if (!Number.isNaN(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const photos = await query.lean();

    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// SINGLE GALLERY PHOTO
// =====================================

const getGalleryPhoto = async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id).lean();

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.status(200).json(photo);
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Photo not found" });
    }
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// UPDATE GALLERY PHOTO
// =====================================

const updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({ message: "Photo not found" });
    }

    if (req.body.altText !== undefined) {
      gallery.altText = req.body.altText.trim();
    }

    if (req.file?.filename) {
      gallery.photo = imagePath(req.file.filename);
    }

    await gallery.save();

    res.status(200).json({ success: true, gallery });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Photo not found" });
    }
    res.status(500).json({ message: error.message });
  }
};

// =====================================
// DELETE GALLERY PHOTO
// =====================================

const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findByIdAndDelete(req.params.id);

    if (!gallery) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.status(200).json({ success: true, message: "Photo deleted" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Photo not found" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGallery,
  getGallery,
  getGalleryPhoto,
  updateGallery,
  deleteGallery,
};