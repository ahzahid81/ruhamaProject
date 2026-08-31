const express = require("express");

const router = express.Router();

const {
  protect,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const {
  getExamNames,
  createExamName,
  updateExamName,
  deleteExamName,
} = require("../controllers/examNameController");

router.get(
  "/",
  getExamNames
);

router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  createExamName
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateExamName
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteExamName
);

module.exports = router;