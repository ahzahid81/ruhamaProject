const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  subject: String,

  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
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