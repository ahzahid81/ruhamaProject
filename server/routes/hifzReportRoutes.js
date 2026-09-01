const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const {
  saveHifzReport,
  getHifzReport,
  getHifzStudentHistory,
  getHifzClassList,
  getHifzProgress,
  getAllHifzReports,
  deleteHifzReport,
} = require("../controllers/hifzReportController");

// Save (create/update) a report for a student on a date
router.post("/save", protect, saveHifzReport);

// Get a single report (prefill) by student + date
router.get("/", protect, getHifzReport);

// Get a class + date sheet (all students)
router.get("/class", protect, getHifzClassList);

// All students' hifz progress (staff + admin)
router.get("/progress", protect, getHifzProgress);

// Admin-only full list for CRUD management
router.get("/all", protect, authorizeRoles("admin"), getAllHifzReports);

// Get a student's history
router.get("/student/:studentId", protect, getHifzStudentHistory);

// Delete a report
router.delete("/:id", protect, deleteHifzReport);

module.exports = router;
