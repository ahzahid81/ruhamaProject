const express = require("express");

const router = express.Router();

const {
  protect,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const {
  getTeachers,
  getTeachersManage,
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

router.get(
  "/manage",
  protect,
  authorizeRoles("admin"),
  getTeachersManage
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