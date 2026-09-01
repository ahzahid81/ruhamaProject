const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");

const {
  saveHifzReport,
  getHifzReport,
  getHifzStudentHistory,
  getHifzClassList,
  deleteHifzReport,
} = require("../controllers/hifzReportController");

// Save (create/update) a report for a student on a date
router.post("/save", protect, saveHifzReport);

// Get a single report (prefill) by student + date
router.get("/", protect, getHifzReport);

// Get a class + date sheet (all students)
router.get("/class", protect, getHifzClassList);

// Get a student's history
router.get("/student/:studentId", protect, getHifzStudentHistory);

// Delete a report
router.delete("/:id", protect, deleteHifzReport);

module.exports = router;
