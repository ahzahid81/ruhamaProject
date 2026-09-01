const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    account: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
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

    // Supporting voucher (the shop/vendor voucher the buyer attached): when
    // "Supporting Voucher" is Yes on the expense form, this holds the shop's
    // voucher / invoice number line. The system voucher number is voucherNo.
    supportingVoucher: {
      type: String,
      default: "",
    },

    // Supporting voucher: when enabled the expense is given a unique
    // voucher number and can be printed as a premium Expense Voucher.
    hasVoucher: {
      type: Boolean,
      default: false,
    },
    voucherNo: {
      type: String,
      default: "",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);