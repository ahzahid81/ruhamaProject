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
      type: Object,
      default: {},
    },
    closingBalances: {
      type: Object,
      default: {},
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