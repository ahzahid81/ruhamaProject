const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    classes: [classSchema],
    sections: [String],
    subjects: [String],
    examNames: [String],
    paymentMethods: [String],
    academicSessions: [String],
    currentSession: { type: String, default: "2026" },
  },
  { timestamps: true }
);

const DEFAULT_SETTINGS = {
  classes: [
    { name: "Play Group", code: "P", order: 1 },
    { name: "Nursery", code: "N", order: 2 },
    { name: "KG", code: "K", order: 3 },
    { name: "STD-I", code: "I", order: 4 },
    { name: "STD-II", code: "J", order: 5 },
    { name: "STD-III", code: "L", order: 6 },
    { name: "STD-IV", code: "M", order: 7 },
    { name: "STD-V", code: "V", order: 8 },
  ],
  sections: ["A", "B", "C"],
  subjects: [
    "Arabic",
    "Math",
    "English",
    "Bangla",
    "BGS",
    "Science",
    "MDP",
    "Islamic Studies",
  ],
  paymentMethods: [
    "Cash",
    "bKash",
    "Nagad",
    "Rocket",
    "Bank",
    "Cheque",
    "Card",
    "Online",
    "Other",
  ],
  academicSessions: ["2025", "2026", "2027"],
  currentSession: "2026",
};

const LEGACY_EXAM_NAMES = [
  "Half Yearly",
  "Year Final",
  "Model Test",
  "Monthly Assessment",
  "Admission Test",
];

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    return this.create(DEFAULT_SETTINGS);
  }

  let changed = false;
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const emptyList =
      key === "subjects" &&
      Array.isArray(settings[key]) &&
      settings[key].length === 0;
    if (
      settings[key] === undefined ||
      settings[key] === null ||
      emptyList
    ) {
      settings[key] = DEFAULT_SETTINGS[key];
      changed = true;
    }
  }

  if (
    Array.isArray(settings.examNames) &&
    settings.examNames.length === LEGACY_EXAM_NAMES.length &&
    settings.examNames.every((name) =>
      LEGACY_EXAM_NAMES.includes(name)
    )
  ) {
    settings.examNames = [];
    changed = true;
  }

  if (changed) {
    // Persist structural defaults when we can; if validation fails on an
    // older/odd settings document, still return the corrected copy instead
    // of crashing every read that consults the settings.
    try {
      await settings.save();
    } catch {
      /* keep in-memory corrected copy */
    }
  }

  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);
