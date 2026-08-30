const mongoose = require("mongoose");

const marksEntrySchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSubject",
      required: true,
    },

    subjectName: {
      type: String,
      default: "",
    },

    fullMarks: {
      type: Number,
      default: 0,
    },

    passMarks: {
      type: Number,
      default: 0,
    },

    obtainedMarks: {
      type: Number,
      default: 0,
    },

    grade: {
      type: String,
      default: "",
    },

    gradePoint: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Pass", "Fail"],
      default: "Pass",
    },
  },
  {
    _id: false,
  }
);

const examResultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSetting",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    className: {
      type: String,
      default: "",
    },

    academicSession: {
      type: String,
      default: "",
    },

    studentName: {
      type: String,
      default: "",
    },

    studentId: {
      type: String,
      default: "",
    },

    entries: [marksEntrySchema],

    totalFullMarks: {
      type: Number,
      default: 0,
    },

    totalObtained: {
      type: Number,
      default: 0,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    gpa: {
      type: Number,
      default: 0,
    },

    grade: {
      type: String,
      default: "",
    },

    division: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pass", "Fail"],
      default: "Pass",
    },

    resultPublished: {
      type: Boolean,
      default: false,
    },

    isHifz: {
      type: Boolean,
      default: false,
    },

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

examResultSchema.index(
  { exam: 1, student: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ExamResult",
  examResultSchema
);
