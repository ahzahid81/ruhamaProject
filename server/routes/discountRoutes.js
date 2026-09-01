const express = require("express");

const router = express.Router();

const {
  getStudentDiscounts,
  saveDiscount,
  deleteDiscount,
} = require("../controllers/discountController");

// Discounts for a student
router.get("/student/:studentId", getStudentDiscounts);

// Create / update a discount on a fee item
router.post("/", saveDiscount);

// Remove a discount
router.delete("/:id", deleteDiscount);

module.exports = router;