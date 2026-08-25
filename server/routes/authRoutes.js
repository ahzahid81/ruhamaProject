const express = require("express");

const router = express.Router();

const {
  registerTeacher,
  loginTeacher,
  loginStudent,
} = require("../controllers/authController");

router.post("/register", registerTeacher);

router.post("/login", loginTeacher);

router.post("/student-login", loginStudent);

module.exports = router;