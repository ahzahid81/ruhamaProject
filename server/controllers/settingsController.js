const Settings = require("../models/Settings");

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const allowed = [
      "classes",
      "sections",
      "examNames",
      "paymentMethods",
      "academicSessions",
      "currentSession",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }
    const settings = await Settings.getSettings();
    Object.assign(settings, update);
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
