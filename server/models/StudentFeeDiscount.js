const mongoose = require("mongoose");

const studentFeeDiscountSchema = new mongoose.Schema(
  {
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

    academicSession: {
      type: String,
      required: true,
    },

    feeCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeCategory",
      required: true,
    },

    feeName: {
      type: String,
      required: true,
    },

    applicableType: {
      type: String,
      enum: ["Month", "Exam", "Year", "One Time", "Custom"],
      required: true,
    },

    month: {
      type: Number,
      default: null,
    },

    year: {
      type: Number,
      default: null,
    },

    examName: {
      type: String,
      default: "",
    },

    period: {
      type: String,
      default: "",
    },

    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

studentFeeDiscountSchema.index(
  {
    student: 1,
    academicSession: 1,
    applicableType: 1,
    feeCategory: 1,
    month: 1,
    examName: 1,
    year: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("StudentFeeDiscount", studentFeeDiscountSchema);