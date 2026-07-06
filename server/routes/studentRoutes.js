const express = require("express");

const router = express.Router();

const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  resetPassword,
} = require("../controllers/studentController");

// ==============================
// GET ALL STUDENTS
// ==============================

router.get(
  "/",
  getStudents
);

// ==============================
// GET SINGLE STUDENT
// ==============================

router.get(
  "/:id",
  getStudent
);

// ==============================
// CREATE STUDENT
// ==============================

router.post(
  "/create",
  createStudent
);

// ==============================
// UPDATE STUDENT
// ==============================

router.put(
  "/:id",
  updateStudent
);

// ==============================
// DELETE STUDENT
// ==============================

router.delete(
  "/:id",
  deleteStudent
);

// ==============================
// RESET PASSWORD
// Default Password = Father's Mobile
// ==============================

router.put(
  "/reset-password/:id",
  resetPassword
);

module.exports = router;