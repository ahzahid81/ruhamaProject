const mongoose = require("mongoose");

const statementPeriodSchema = new mongoose.Schema(
  {
    periodStart: {
      type: Date,
      default: Date.now,
      index: true,
    },
    academicSession: {
      type: String,
      default: "",
    },
    openingBalances: {
      cash: { type: Number, default: 0 },
      bkash: { type: Number, default: 0 },
      bank: { type: Number, default: 0 },
    },
    closingBalances: {
      cash: { type: Number, default: 0 },
      bkash: { type: Number, default: 0 },
      bank: { type: Number, default: 0 },
    },
    note: {
      type: String,
      default: "",
    },
    resetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StatementPeriod", statementPeriodSchema);