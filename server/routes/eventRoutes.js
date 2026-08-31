const express = require("express");

const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const uploadEventImages = require("../middlewares/uploadEvent");

const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

// =====================================
// PUBLIC: LIST EVENTS (recent first)
// Supports ?limit=N
// =====================================

router.get("/", getEvents);

// =====================================
// PUBLIC: SINGLE EVENT DETAIL
// =====================================

router.get("/:id", getEvent);

// =====================================
// ADMIN: CREATE EVENT
// =====================================

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  uploadEventImages.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "morePhotos", maxCount: 8 },
  ]),
  createEvent
);

// =====================================
// ADMIN: UPDATE EVENT
// =====================================

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  uploadEventImages.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "morePhotos", maxCount: 8 },
  ]),
  updateEvent
);

// =====================================
// ADMIN: DELETE EVENT
// =====================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteEvent
);

module.exports = router;