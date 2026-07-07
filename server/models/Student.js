const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    // ==========================
    // LOGIN
    // ==========================

    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // ==========================
    // BASIC INFORMATION
    // ==========================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      type: String,
      default: "",
    },

    admissionNo: {
      type: String,
      default: "",
      sparse: true,
    },

    roll: {
      type: Number,
      required: true,
    },

    className: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      default: "A",
    },

    session: {
      type: String,
      default: "2026",
    },

    studentType: {
      type: String,
      enum: [
        "Regular",
        "Day Care",
        "Hostel",
        "Hifzul Quran",
      ],
      default: "Regular",
    },

    // ==========================
    // PERSONAL INFORMATION
    // ==========================

    gender: {
      type: String,
      enum: [
        "Male",
        "Female",
      ],
      required: true,
    },

    religion: {
      type: String,
      default: "Islam",
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    nationality: {
      type: String,
      default: "Bangladeshi",
    },

    dateOfBirth: Date,

    // ==========================
    // PARENTS
    // ==========================

    fatherName: {
      type: String,
      required: true,
    },

    fatherMobile: {
      type: String,
      required: true,
    },

    motherName: {
      type: String,
      default: "",
    },

    motherMobile: {
      type: String,
      default: "",
    },

    guardianName: {
      type: String,
      default: "",
    },

    guardianRelation: {
      type: String,
      default: "",
    },

    guardianMobile: {
      type: String,
      default: "",
    },

    emergencyContact: {
      type: String,
      default: "",
    },

    // ==========================
    // ADDRESS
    // ==========================

    presentAddress: {
      type: String,
      default: "",
    },

    permanentAddress: {
      type: String,
      default: "",
    },


    // ==========================
    // ADMISSION
    // ==========================

    admissionDate: {
      type: Date,
      default: Date.now,
    },

    // ==========================
    // STATUS
    // ==========================

    status: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "Completed",
        "TC",
      ],
      default: "Active",
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
  "Student",
  studentSchema
);