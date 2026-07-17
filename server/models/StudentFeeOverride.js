const mongoose = require("mongoose");

const studentFeeOverrideSchema = new mongoose.Schema(
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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    frequency: {
      type: String,
      enum: ["Monthly", "One Time", "Per Exam", "Yearly", "Custom"],
      default: "Monthly",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    effectiveFrom: {
      type: Date,
      default: Date.now,
    },

    effectiveTo: {
      type: Date,
      default: null,
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

studentFeeOverrideSchema.index(
  { student: 1, academicSession: 1, feeCategory: 1 },
  { unique: true }
);

module.exports = mongoose.model("StudentFeeOverride", studentFeeOverrideSchema);
