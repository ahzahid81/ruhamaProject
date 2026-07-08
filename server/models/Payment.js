const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ===========================
    // STUDENT
    // ===========================

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    studentId: {
      type: String,
      required: true,
      index: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    className: {
      type: String,
      required: true,
    },

    roll: {
      type: Number,
      default: 0,
    },

    // ===========================
    // RECEIPT
    // ===========================

    receiptNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    academicSession: {
      type: String,
      default: "2026",
    },

    // ===========================
    // TOTAL
    // ===========================

    totalAmount: {
      type: Number,
      default: 0,
    },

    totalDiscount: {
      type: Number,
      default: 0,
    },

    totalFine: {
      type: Number,
      default: 0,
    },

    advanceUsed: {
      type: Number,
      default: 0,
    },

    advanceReceived: {
      type: Number,
      default: 0,
    },

    paidAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
    },

    // ===========================
    // PAYMENT METHOD
    // ===========================

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "bKash",
        "Nagad",
        "Rocket",
        "Bank",
        "Cheque",
        "Card",
        "Online",
        "Other",
      ],
      default: "Cash",
    },

    senderNumber: {
      type: String,
      default: "",
    },

    transactionId: {
      type: String,
      default: "",
    },

    bankName: {
      type: String,
      default: "",
    },

    bankBranch: {
      type: String,
      default: "",
    },

    chequeNo: {
      type: String,
      default: "",
    },

    referenceNo: {
      type: String,
      default: "",
    },

    // ===========================
    // STATUS
    // ===========================

    paymentStatus: {
      type: String,
      enum: [
        "Completed",
        "Pending",
        "Cancelled",
        "Refunded",
      ],
      default: "Completed",
    },

    // ===========================
    // RECEIVE INFO
    // ===========================

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    receiveDate: {
      type: Date,
      default: Date.now,
    },

    // ===========================
    // REMARKS
    // ===========================

    remarks: {
      type: String,
      default: "",
    },

    // ===========================
    // AUDIT
    // ===========================

    isVoided: {
      type: Boolean,
      default: false,
    },

    voidReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);