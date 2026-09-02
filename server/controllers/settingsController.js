const Settings = require("../models/Settings");

const ARRAY_KEYS = [
  "classes",
  "sections",
  "subjects",
  "paymentMethods",
  "academicSessions",
];

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings  (bulk update, kept for compatibility)
exports.updateSettings = async (req, res) => {
  try {
    const allowed = [
      "classes",
      "sections",
      "subjects",
      "paymentMethods",
      "academicSessions",
      "currentSession",
      "paymentMethodAccounts",
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    const settings = await Settings.getSettings();

    if (update.paymentMethodAccounts) {
      settings.paymentMethodAccounts = Object.assign(
        {},
        settings.paymentMethodAccounts || {},
        update.paymentMethodAccounts
      );
      settings.markModified("paymentMethodAccounts");
      delete update.paymentMethodAccounts;
    }

    Object.assign(settings, update);
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/settings/:key  (add one item)
exports.addSettingItem = async (req, res) => {
  try {
    const { key } = req.params;
    if (!ARRAY_KEYS.includes(key)) {
      return res.status(400).json({ message: "Invalid settings field" });
    }
    const settings = await Settings.getSettings();
    const list = settings[key] || [];

    if (key === "classes") {
      const name = String(req.body.name || "").trim();
      const code = String(req.body.code || "").trim().toUpperCase();
      if (!name) return res.status(400).json({ message: "Class name is required" });
      if (!code) return res.status(400).json({ message: "Class code is required" });
      if (list.some((c) => c.name === name || c.code === code)) {
        return res.status(400).json({ message: "A class with that name or code already exists" });
      }
      list.push({ name, code, order: list.length + 1 });
    } else {
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ message: "Name is required" });
      if (list.includes(name)) {
        return res.status(400).json({ message: "Item already exists" });
      }
      list.push(name);
    }

    settings.markModified(key);
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/:key/:index  (update one item)
exports.updateSettingItem = async (req, res) => {
  try {
    const { key, index } = req.params;
    if (!ARRAY_KEYS.includes(key)) {
      return res.status(400).json({ message: "Invalid settings field" });
    }
    const idx = Number(index);
    const settings = await Settings.getSettings();
    const list = settings[key] || [];
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (key === "classes") {
      const name = String(req.body.name || "").trim();
      const code = String(req.body.code || "").trim().toUpperCase();
      if (!name) return res.status(400).json({ message: "Class name is required" });
      if (!code) return res.status(400).json({ message: "Class code is required" });
      const dup = list.findIndex((c, i) => i !== idx && (c.name === name || c.code === code));
      if (dup !== -1) {
        return res.status(400).json({ message: "Another class already uses that name or code" });
      }
      list[idx] = { name, code, order: list[idx]?.order || idx + 1 };
    } else {
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ message: "Name is required" });
      if (list.includes(name)) {
        return res.status(400).json({ message: "Item already exists" });
      }
      list[idx] = name;
    }

    settings.markModified(key);
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/settings/:key/:index  (remove one item)
exports.deleteSettingItem = async (req, res) => {
  try {
    const { key, index } = req.params;
    if (!ARRAY_KEYS.includes(key)) {
      return res.status(400).json({ message: "Invalid settings field" });
    }
    const idx = Number(index);
    const settings = await Settings.getSettings();
    const list = settings[key] || [];
    if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) {
      return res.status(404).json({ message: "Item not found" });
    }
    list.splice(idx, 1);
    settings.markModified(key);
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/current-session
exports.updateCurrentSession = async (req, res) => {
  try {
    const value = String(req.body.currentSession || "").trim();
    if (!value) {
      return res.status(400).json({ message: "Session is required" });
    }
    const settings = await Settings.getSettings();
    settings.currentSession = value;
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/opening-ceremony
exports.updateOpeningCeremony = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "enabled (boolean) is required" });
    }
    const settings = await Settings.getSettings();
    settings.openingCeremony = settings.openingCeremony || {};
    settings.openingCeremony.enabled = enabled;
    settings.markModified("openingCeremony");
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};