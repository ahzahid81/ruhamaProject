const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const {
  getStatement,
  exportStatement,
  exportStatementJson,
  addExpense,
  updateExpense,
  deleteExpense,
  addFundTransfer,
  deleteFundTransfer,
  resetAccount,
} = require("../controllers/statementController");

// Full school statement (balances, breakdown, recent entries, audit history)
router.get("/", protect, getStatement);

// Date-wise CSV download
router.get("/export", protect, exportStatement);

// Date-wise report as JSON (used by the printable Print Statement)
router.get("/export-json", protect, exportStatementJson);

// Expenses
router.post("/expense", protect, addExpense);
router.put("/expense/:id", protect, updateExpense);
router.delete("/expense/:id", protect, deleteExpense);

// Fund transfers
router.post("/fund-transfer", protect, addFundTransfer);
router.delete("/fund-transfer/:id", protect, deleteFundTransfer);

// Close the audit and reset the accounts (admin only)
router.post("/reset", protect, authorizeRoles("admin"), resetAccount);

module.exports = router;