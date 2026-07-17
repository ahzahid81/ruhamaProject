const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");

const {
  getStudentLedger,
  getStudentDueSummary,
} = require("../controllers/studentLedgerController");

router.get(
  "/:studentId",
  protect,
  getStudentLedger
);

router.get(
  "/due-summary/:studentId",
  protect,
  getStudentDueSummary
);

module.exports = router;
