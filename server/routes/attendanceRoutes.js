const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const {
  markAttendance,
  getAttendanceByClass,
  getAttendanceByStudent,
  getMonthlyReport,
  getAttendanceStats,
  listAllAttendance,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  deleteAttendanceByClassDate,
} = require("../controllers/attendanceController");

// Mark attendance (bulk upsert) — staff
router.post("/mark", protect, markAttendance);

// Get attendance by class + date
router.get("/class", protect, getAttendanceByClass);

// Get attendance by student
router.get("/student/:studentId", protect, getAttendanceByStudent);

// Get monthly report
router.get("/monthly-report", protect, getMonthlyReport);

// Get attendance stats for a student
router.get("/stats/:studentId", protect, getAttendanceStats);

// ============================================
// ADMIN-ONLY CRUD
// ============================================

// List all attendance records (paginated + filters)
router.get("/admin", protect, authorizeRoles("admin"), listAllAttendance);

// Update a single attendance record
router.put("/admin/:id", protect, authorizeRoles("admin"), updateAttendanceRecord);

// Delete a single attendance record
router.delete("/admin/:id", protect, authorizeRoles("admin"), deleteAttendanceRecord);

// Delete attendance for a whole class + date
router.delete("/admin", protect, authorizeRoles("admin"), deleteAttendanceByClassDate);

module.exports = router;
