const mongoose = require("mongoose");

const classFeeSettingSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },

    academicSession: {
      type: String,
      required: true,
      default: "2026",
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

    dueDay: {
      type: Number,
      min: 1,
      max: 31,
      default: 10,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

classFeeSettingSchema.index(
  { className: 1, academicSession: 1, feeCategory: 1 },
  { unique: true }
);

module.exports = mongoose.model("ClassFeeSetting", classFeeSettingSchema);
