const mongoose = require("mongoose");

const studentFeeAssignmentSchema = new mongoose.Schema(
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

    // 0 means "use class fee setting / category default amount"
    amount: {
      type: Number,
      default: 0,
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

studentFeeAssignmentSchema.index(
  { student: 1, academicSession: 1, feeCategory: 1 },
  { unique: true }
);

module.exports = mongoose.model("StudentFeeAssignment", studentFeeAssignmentSchema);