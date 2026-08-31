const express = require("express");

const router = express.Router();

const uploadExcel = require("../middlewares/uploadExcel");
const uploadImage =
  require("../middlewares/uploadImage");

const {
  protect,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const {
  createStudent,
  getStudents,
  getStudentsManage,
  getStudent,
  updateStudent,
  deleteStudent,
  resetPassword,
  importStudents,
  searchStudents,
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
// GET STUDENTS WITH PASSWORDS (admin / account manager only)
// =====================================

router.get(
  "/manage",
  protect,
  authorizeRoles("admin", "account-manager"),
  getStudentsManage
);



// =====================================
// CREATE STUDENT
// =====================================

router.post(
  "/create",
  uploadImage.single("photo"),
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

router.get(
  "/search",
  searchStudents
);


// =====================================
// GET SINGLE STUDENT
// =====================================

router.get(
  "/:id",
  getStudent
);


module.exports = router;