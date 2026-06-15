const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  subject: String,

  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },

  // ACTUAL TEACHER WHO TOOK THE CLASS
  takenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null,
  },

  classWork: String,

  homeWork: String,
});

const reportSchema = new mongoose.Schema(
  {
    className: String,

    date: String,

    entries: [entrySchema],

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Report",
  reportSchema
);
