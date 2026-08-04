import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const SECTIONS = ["classes", "sections", "subjects", "examNames", "paymentMethods", "academicSessions"];

const LABELS = {
  classes: "Classes",
  sections: "Sections",
  subjects: "Subjects",
  examNames: "Exam Names",
  paymentMethods: "Payment Methods",
  academicSessions: "Academic Sessions",
};

const HELPERS = {
  classes: "Each class needs a name and a short code used in student ID generation (e.g. Nursery → N).",
  sections: "Section labels available for class division.",
  subjects: "Subject names available for teacher assignments, marks entry, and exam subjects.",
  examNames: "Exam types shown in payment and admit card modules.",
  paymentMethods: "Payment options in collection form.",
  academicSessions: "Academic years shown in dropdowns.",
};

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("classes");
  const [newClass, setNewClass] = useState({ name: "", code: "" });
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get("/settings");
      setSettings(res.data);
    } catch (err) {
      showMessage("Failed to load from server — using defaults", "error");
      setSettings({
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
        subjects: ["Arabic", "Math", "English", "Bangla", "BGS", "Science", "MDP", "Islamic Studies"],
        examNames: ["Half Yearly", "Year Final", "Model Test", "Monthly Assessment", "Admission Test"],
        paymentMethods: ["Cash", "bKash", "Nagad", "Rocket", "Bank", "Cheque", "Card", "Online", "Other"],
        academicSessions: ["2025", "2026", "2027"],
        currentSession: "2026",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const addClass = () => {
    if (!newClass.name.trim() || !newClass.code.trim()) return;
    const updated = {
      ...settings,
      classes: [
        ...settings.classes,
        { name: newClass.name.trim(), code: newClass.code.trim().toUpperCase(), order: settings.classes.length + 1 },
      ],
    };
    setSettings(updated);
    setNewClass({ name: "", code: "" });
  };

  const removeClass = (index) => {
    const updated = { ...settings, classes: settings.classes.filter((_, i) => i !== index) };
    setSettings(updated);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const key = activeTab;
    const arr = settings[key] || [];
    const updated = { ...settings, [key]: [...arr, newItem.trim()] };
    setSettings(updated);
    setNewItem("");
  };

  const removeItem = (index) => {
    const key = activeTab;
    const arr = settings[key] || [];
    const updated = { ...settings, [key]: arr.filter((_, i) => i !== index) };
    setSettings(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/settings", settings);
      setSettings(res.data);
      showMessage("Settings saved");
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCurrentSessionChange = (value) => {
    setSettings({ ...settings, currentSession: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load settings. Make sure you are logged in and the server is running.</p>
      </div>
    );
  }

  const isArrayTab = SECTIONS.includes(activeTab);
  const arrayData = isArrayTab ? settings?.[activeTab] || [] : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">System Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl mb-4 font-semibold ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["classes", ...SECTIONS.filter((s) => s !== "classes")].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            {LABELS[tab] || tab}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">{HELPERS[activeTab]}</p>

      {/* Classes Tab */}
      {activeTab === "classes" && (
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Manage Classes</h2>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Class name (e.g. Nursery)"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              className="flex-1 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Code (e.g. N)"
              value={newClass.code}
              onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
              maxLength={5}
              className="w-24 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
            />
            <button
              onClick={addClass}
              className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Add
            </button>
          </div>
          {settings.classes.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No classes defined.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-sm text-gray-500">
                  <th className="pb-3 font-semibold">#</th>
                  <th className="pb-3 font-semibold">Class Name</th>
                  <th className="pb-3 font-semibold">Code</th>
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.classes.map((c, i) => (
                  <tr key={i} className="border-b last:border-none hover:bg-gray-50">
                    <td className="py-3">{i + 1}</td>
                    <td className="py-3 font-semibold">{c.name}</td>
                    <td className="py-3 font-mono font-bold text-indigo-600">{c.code}</td>
                    <td className="py-3 text-gray-500">{c.order}</td>
                    <td className="py-3">
                      <button
                        onClick={() => removeClass(i)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Array-based tabs */}
      {isArrayTab && activeTab !== "classes" && (
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Manage {LABELS[activeTab]}</h2>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder={`Add new ${LABELS[activeTab].slice(0, -1).toLowerCase()}...`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              className="flex-1 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={addItem}
              className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Add
            </button>
          </div>
          {arrayData.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No items defined.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {arrayData.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-gray-50 border rounded-xl px-4 py-2"
                >
                  <span className="font-medium text-gray-700">{item}</span>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Current Session */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Active Session</h2>
        <select
          value={settings.currentSession}
          onChange={(e) => handleCurrentSessionChange(e.target.value)}
          className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
        >
          {(settings.academicSessions || []).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <p className="text-sm text-gray-400 mt-2">
          This session is used as the default when creating new students and fee structures.
        </p>
      </div>
    </div>
  );
}
