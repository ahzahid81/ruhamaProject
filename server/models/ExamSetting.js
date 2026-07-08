const mongoose = require("mongoose");

const requiredFeeSchema = new mongoose.Schema(
  {
    feeCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeCategory",
      required: true,
    },

    applicableType: {
      type: String,
      enum: [
        "Month",
        "Exam",
        "Year",
        "One Time",
        "Custom",
      ],
      required: true,
    },

    month: {
      type: Number,
      min: 1,
      max: 12,
      default: null,
    },

    year: {
      type: Number,
      default: null,
    },

    customTitle: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const examSettingSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    examCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    academicSession: {
      type: String,
      required: true,
      default: "2026",
    },

    startDate: Date,

    endDate: Date,

    admitCardStart: Date,

    admitCardEnd: Date,

    resultPublishDate: Date,

    requiredFees: [requiredFeeSchema],

    isActive: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model(
  "ExamSetting",
  examSettingSchema
);