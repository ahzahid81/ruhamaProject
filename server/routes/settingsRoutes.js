const express = require("express");
const router = express.Router();

const {
  protect,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

router.get("/", protect, getSettings);

router.put("/", protect, authorizeRoles("admin"), updateSettings);

module.exports = router;
