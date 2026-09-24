const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const {
  scanQR,
  getAttendanceForExam,
  getRoster,
  updateStatus,
  deleteRecord,
  clearForExam,
} = require("../controllers/examAttendanceController");

// Scan a student's admit card QR (eligible students only) — staff
router.post("/scan", protect, scanQR);

// Attendance records for an exam
router.get("/exam/:examId", protect, getAttendanceForExam);

// Eligible roster with marked status for an exam
router.get("/exam/:examId/roster", protect, getRoster);

// ============================================
// ADMIN-ONLY
// ============================================

// Update a record's status (Present/Absent/Late/Leave)
router.put("/:id", protect, authorizeRoles("admin"), updateStatus);

// Delete a single record
router.delete("/:id", protect, authorizeRoles("admin"), deleteRecord);

// Clear all attendance for an exam
router.delete("/exam/:examId", protect, authorizeRoles("admin"), clearForExam);

module.exports = router;