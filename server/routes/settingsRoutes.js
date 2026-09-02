const express = require("express");
const router = express.Router();

const {
  protect,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const {
  getSettings,
  updateSettings,
  addSettingItem,
  updateSettingItem,
  deleteSettingItem,
  updateCurrentSession,
  updateOpeningCeremony,
} = require("../controllers/settingsController");

router.get("/", getSettings);

router.put("/", protect, authorizeRoles("admin"), updateSettings);

router.put("/current-session", protect, authorizeRoles("admin"), updateCurrentSession);

router.put("/opening-ceremony", protect, authorizeRoles("admin"), updateOpeningCeremony);

router.post("/:key", protect, authorizeRoles("admin"), addSettingItem);

router.put("/:key/:index", protect, authorizeRoles("admin"), updateSettingItem);

router.delete("/:key/:index", protect, authorizeRoles("admin"), deleteSettingItem);

module.exports = router;