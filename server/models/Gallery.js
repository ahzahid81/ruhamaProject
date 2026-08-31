const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    photo: {
      type: String,
      required: true,
      default: "",
    },

    altText: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Gallery", gallerySchema);