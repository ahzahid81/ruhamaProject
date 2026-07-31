const mongoose = require("mongoose");

const examSubjectSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSetting",
      required: true,
    },

    className: {
      type: String,
      required: true,
      trim: true,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    subjectCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    fullMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },

    passMarks: {
      type: Number,
      required: true,
      default: 33,
      min: 0,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

examSubjectSchema.index(
  { exam: 1, className: 1, subjectName: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ExamSubject",
  examSubjectSchema
);
