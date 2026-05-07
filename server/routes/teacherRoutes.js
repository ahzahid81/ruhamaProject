const express = require("express");

const router = express.Router();

const {
  getTeachers,
  createTeacher,
  deleteTeacher,
  updateTeacher,
} = require(
  "../controllers/teacherController"
);

router.get(
  "/",
  getTeachers
);

router.post(
  "/create",
  createTeacher
);

router.put(
  "/:id",
  updateTeacher
);

router.delete(
  "/:id",
  deleteTeacher
);

module.exports = router;