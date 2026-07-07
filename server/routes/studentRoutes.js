const express = require("express");

const router = express.Router();

const uploadExcel = require("../middlewares/uploadExcel");

const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  resetPassword,
  importStudents,
} = require("../controllers/studentController");

// =====================================
// IMPORT STUDENTS FROM EXCEL
// =====================================

router.post(
  "/import",
  uploadExcel.single("file"),
  importStudents
);

// =====================================
// GET ALL STUDENTS
// =====================================

router.get(
  "/",
  getStudents
);

// =====================================
// GET SINGLE STUDENT
// =====================================

router.get(
  "/:id",
  getStudent
);

// =====================================
// CREATE STUDENT
// =====================================

router.post(
  "/create",
  createStudent
);

// =====================================
// UPDATE STUDENT
// =====================================

router.put(
  "/:id",
  updateStudent
);

// =====================================
// DELETE STUDENT
// =====================================

router.delete(
  "/:id",
  deleteStudent
);

// =====================================
// RESET PASSWORD
// =====================================

router.put(
  "/reset-password/:id",
  resetPassword
);

module.exports = router;