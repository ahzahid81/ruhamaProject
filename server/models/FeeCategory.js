const mongoose = require("mongoose");

const feeCategorySchema = new mongoose.Schema(
  {
    // ===================================
    // BASIC
    // ===================================

    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    // ===================================
    // CATEGORY
    // ===================================

    category: {
      type: String,
      enum: [
        "Admission",
        "Monthly",
        "Service",
        "Exam",
        "Annual",
        "Books",
        "Uniform",
        "Transport",
        "Hostel",
        "Day Care",
        "Quran",
        "Other",
      ],
      default: "Other",
    },

    // ===================================
    // FREQUENCY
    // ===================================

    frequency: {
      type: String,
      enum: [
        "One Time",
        "Monthly",
        "Yearly",
        "Per Exam",
        "Custom",
      ],
      default: "Monthly",
    },

    // ===================================
    // DEFAULT AMOUNT
    // ===================================

    defaultAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===================================
    // SETTINGS
    // ===================================

    isRequired: {
      type: Boolean,
      default: false,
    },

    allowDiscount: {
      type: Boolean,
      default: true,
    },

    allowFine: {
      type: Boolean,
      default: true,
    },

    allowAdvance: {
      type: Boolean,
      default: true,
    },

    // ===================================
    // EXAM / ADMIT CARD
    // ===================================

    requiredForAdmitCard: {
      type: Boolean,
      default: false,
    },

    // ===================================
    // STATUS
    // ===================================

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
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
  "FeeCategory",
  feeCategorySchema
);