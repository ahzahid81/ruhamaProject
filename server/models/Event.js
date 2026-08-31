const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnail: {
      type: String,
      required: true,
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    morePhotos: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);