const mongoose = require("mongoose");

const examAttendanceSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSetting",
      required: true,
    },
    examName: {
      type: String,
      required: true,
    },
    academicSession: {
      type: String,
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    name: {
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
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Leave"],
      default: "Present",
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    markedByName: {
      type: String,
      default: "",
    },
    method: {
      type: String,
      enum: ["scan", "manual"],
      default: "scan",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

examAttendanceSchema.index({ exam: 1, student: 1 }, { unique: true });
examAttendanceSchema.index({ exam: 1, status: 1 });
examAttendanceSchema.index({ student: 1, academicSession: 1 });

module.exports = mongoose.model(
  "ExamAttendance",
  examAttendanceSchema
);