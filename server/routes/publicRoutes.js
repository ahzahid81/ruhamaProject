const express = require("express");

const router = express.Router();

const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Settings = require("../models/Settings");
const { sortStudents } = require("../utils/sort");

// ======================================================
// PUBLIC: ACTIVE STUDENT DIRECTORY (safe fields only)
// Ordered by class order, boys first, then girls, by id
// ======================================================

router.get("/students", async (req, res) => {
  try {
    const students = await sortStudents(
      await Student.find({ status: "Active" })
        .select("name studentId admissionNo className section photo")
        .lean()
    );
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ======================================================
// PUBLIC: REAL INSTITUTION COUNTS
// ======================================================

router.get("/counts", async (req, res) => {
  try {
    const [students, teachers, settings] = await Promise.all([
      Student.countDocuments({ status: "Active" }),
      Teacher.countDocuments(),
      Settings.getSettings(),
    ]);
    res.status(200).json({
      students,
      teachers,
      classes: settings?.classes?.length || 0,
      sections: settings?.sections?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;