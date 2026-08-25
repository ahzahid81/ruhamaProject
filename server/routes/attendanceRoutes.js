const express = require("express");
const router = express.Router();

const {
  markAttendance,
  getAttendanceByClass,
  getAttendanceByStudent,
  getMonthlyReport,
  getAttendanceStats,
} = require("../controllers/attendanceController");

// Mark attendance (bulk upsert)
router.post("/mark", markAttendance);

// Get attendance by class + date
router.get("/class", getAttendanceByClass);

// Get attendance by student
router.get("/student/:studentId", getAttendanceByStudent);

// Get monthly report
router.get("/monthly-report", getMonthlyReport);

// Get attendance stats for a student
router.get("/stats/:studentId", getAttendanceStats);

module.exports = router;
