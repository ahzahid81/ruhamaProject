const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Leave"],
      default: "Present",
    },
    academicSession: {
      type: String,
      default: "2026",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ className: 1, date: 1, section: 1 });
attendanceSchema.index({ student: 1, academicSession: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
