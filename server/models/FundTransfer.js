const mongoose = require("mongoose");

const fundTransferSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: String,
      required: true,
      index: true,
    },
    toAccount: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    charge: {
      type: Number,
      default: 0,
    },
    chargeAccount: {
      type: String,
    },
    note: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    academicSession: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FundTransfer", fundTransferSchema);