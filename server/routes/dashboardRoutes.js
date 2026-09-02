const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getSummary } = require("../controllers/dashboardController");

router.get("/summary", protect, getSummary);

module.exports = router;
