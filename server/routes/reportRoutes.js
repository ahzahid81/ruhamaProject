const express = require("express");

const router = express.Router();

const {
  createEntry,
  getClassReport,
  getAllReports,
  getPendingSubjects,
  deleteEntry,
  updateEntry,
} = require("../controllers/reportController");

router.post("/create", createEntry);

router.get(
  "/class-report",
  getClassReport
);

router.get(
  "/all",
  getAllReports
);

router.get(
  "/pending",
  getPendingSubjects
);

router.delete(
  "/:reportId/:entryId",
  deleteEntry
);

router.put(
  "/:reportId/:entryId",
  updateEntry
);

module.exports = router;