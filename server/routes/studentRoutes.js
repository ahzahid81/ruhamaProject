const express = require("express");

const router = express.Router();

const uploadExcel = require("../middlewares/uploadExcel");
const uploadImage =
  require("../middlewares/uploadImage");

const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  resetPassword,
  importStudents,
  generateRollNumbers,
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
  uploadImage.single("photo"),
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

// =====================================
// GENERATE ROLL NUMBERS
// =====================================

router.post(
  "/generate-roll",
  generateRollNumbers
);

// =====================================
// GET SINGLE STUDENT
// =====================================

router.get(
  "/:id",
  getStudent
);


module.exports = router;