const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    juz: { type: String, default: "" },
    page: { type: String, default: "" },
    verse: { type: String, default: "" },
  },
  { _id: false }
);

const hifzReportSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    studentId: { type: String, default: "" },
    studentName: { type: String, default: "" },
    className: { type: String, required: true },
    section: { type: String, default: "" },
    date: { type: Date, required: true },

    lesson: { type: lessonSchema, default: () => ({}) },
    sevenLessons: { type: lessonSchema, default: () => ({}) },
    memorizationReview: { type: lessonSchema, default: () => ({}) },

    remarks: { type: String, default: "" },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    teacherName: { type: String, default: "" },
  },
  { timestamps: true }
);

hifzReportSchema.index({ student: 1, date: 1 }, { unique: true });
hifzReportSchema.index({ className: 1, date: 1 });

module.exports = mongoose.model("HifzReport", hifzReportSchema);
