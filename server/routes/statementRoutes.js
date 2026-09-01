const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const {
  getStatement,
  exportStatement,
  addExpense,
  deleteExpense,
  addFundTransfer,
  deleteFundTransfer,
  resetAccount,
} = require("../controllers/statementController");

// Full school statement (balances, breakdown, recent entries, audit history)
router.get("/", protect, getStatement);

// Date-wise CSV download
router.get("/export", protect, exportStatement);

// Expenses
router.post("/expense", protect, addExpense);
router.delete("/expense/:id", protect, deleteExpense);

// Fund transfers
router.post("/fund-transfer", protect, addFundTransfer);
router.delete("/fund-transfer/:id", protect, deleteFundTransfer);

// Close the audit and reset the accounts (admin only)
router.post("/reset", protect, authorizeRoles("admin"), resetAccount);

module.exports = router;