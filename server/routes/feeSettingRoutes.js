const express = require("express");
const router = express.Router();

const {
  protect,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const {
  getClassFeeSettings,
  getClassFeeSetting,
  createClassFeeSetting,
  updateClassFeeSetting,
  deleteClassFeeSetting,
  getStudentFeeBreakdown,
  getStudentOverrides,
  createStudentFeeOverride,
  deleteStudentFeeOverride,
} = require("../controllers/feeSettingController");

const {
  getStudentFeeAssignments,
  upsertStudentFeeAssignment,
  updateStudentFeeAssignment,
  deleteStudentFeeAssignment,
} = require("../controllers/studentFeeAssignmentController");

// ============================================
// CLASS FEE SETTINGS
// ============================================

router.get(
  "/settings",
  protect,
  getClassFeeSettings
);

router.get(
  "/settings/:id",
  protect,
  getClassFeeSetting
);

router.post(
  "/settings",
  protect,
  authorizeRoles("admin"),
  createClassFeeSetting
);

router.put(
  "/settings/:id",
  protect,
  authorizeRoles("admin"),
  updateClassFeeSetting
);

router.delete(
  "/settings/:id",
  protect,
  authorizeRoles("admin"),
  deleteClassFeeSetting
);

// ============================================
// STUDENT FEE BREAKDOWN
// ============================================

router.get(
  "/student-fees/:studentId",
  protect,
  getStudentFeeBreakdown
);

// ============================================
// STUDENT FEE OVERRIDES
// ============================================

router.get(
  "/student-overrides",
  protect,
  getStudentOverrides
);

router.post(
  "/student-overrides",
  protect,
  authorizeRoles("admin"),
  createStudentFeeOverride
);

router.delete(
  "/student-overrides/:id",
  protect,
  authorizeRoles("admin"),
  deleteStudentFeeOverride
);

// ============================================
// STUDENT FEE ASSIGNMENTS (optional fees)
// ============================================

router.get(
  "/student-assignments",
  protect,
  getStudentFeeAssignments
);

router.post(
  "/student-assignments",
  protect,
  authorizeRoles("admin"),
  upsertStudentFeeAssignment
);

router.put(
  "/student-assignments/:id",
  protect,
  authorizeRoles("admin"),
  updateStudentFeeAssignment
);

router.delete(
  "/student-assignments/:id",
  protect,
  authorizeRoles("admin"),
  deleteStudentFeeAssignment
);

module.exports = router;
