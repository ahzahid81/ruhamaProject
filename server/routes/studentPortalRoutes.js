const express = require("express");
const router = express.Router();

const { protectStudent } = require("../middlewares/studentAuthMiddleware");
const {
  getDashboard,
  getAttendance,
  getResults,
  getPaymentInfo,
  getDailyDiary,
  getHifzProgress,
} = require("../controllers/studentPortalController");

router.get("/dashboard", protectStudent, getDashboard);
router.get("/attendance", protectStudent, getAttendance);
router.get("/results", protectStudent, getResults);
router.get("/payments", protectStudent, getPaymentInfo);
router.get("/diary", protectStudent, getDailyDiary);
router.get("/hifz", protectStudent, getHifzProgress);

module.exports = router;
