import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const toCode = (name) =>
  name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

const initialForm = {
  name: "",
  code: "",
  category: "Other",
  frequency: "Monthly",
  defaultAmount: "",
  description: "",
  isRequired: false,
  allowDiscount: true,
  allowFine: true,
  allowAdvance: true,
  requiredForAdmitCard: false,
  isActive: true,
  sortOrder: 0,
};

const CATEGORY_TYPES = [
  "Admission", "Monthly", "Service", "Exam", "Annual",
  "Books", "Uniform", "Transport", "Hostel", "Day Care", "Quran", "Other",
];

const CATEGORY_KEYWORDS = {
  Admission: ["admission", "enrollment", "registration"],
  Monthly: ["monthly", "tuition", "tution"],
  Exam: ["exam", "test", "assessment", "yearly", "half"],
  Annual: ["annual", "yearly"],
  Books: ["book", "library"],
  Uniform: ["uniform", "dress"],
  Transport: ["transport", "bus", "van", "conveyance"],
  Hostel: ["hostel", "boarding"],
  "Day Care": ["day care", "daycare"],
  Quran: ["quran", "hifz", "islamic"],
  Service: ["service", "lab", "computer", "sports", "activity"],
};

const deriveCategory = (name) => {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Other";
};

const deriveFrequency = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes("exam") || lower.includes("test") || lower.includes("assessment")) return "Per Exam";
  if (lower.includes("admission") || lower.includes("registration") || lower.includes("enrollment")) return "One Time";
  if (lower.includes("annual") || lower.includes("yearly")) return "Yearly";
  if (lower.includes("book") || lower.includes("uniform") || lower.includes("transport")) return "One Time";
  return "Monthly";
};

export default function FeeCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get("/payments/fee-categories");
      setCategories(res.data);
    } catch (err) {
      showMessage("Failed to load fee categories", "error");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const updates = { [e.target.name]: value };
    if (e.target.name === "name") {
      updates.category = deriveCategory(value);
      updates.frequency = deriveFrequency(value);
      if (!editingId) updates.code = toCode(value);
    }
    setForm({ ...form, ...updates });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return showMessage("Name is required", "error");
    }
    setLoading(true);
    const payload = {
      ...form,
      code: form.code || toCode(form.name),
      sortOrder: form.sortOrder || categories.length + 1,
    };
    try {
      if (editingId) {
        await api.put(`/payments/fee-categories/${editingId}`, payload);
        await api.put(`/payments/fee-categories/${editingId}`, form);
        showMessage("Fee category updated");
      } else {
        await api.post("/payments/fee-categories", payload);
        showMessage("Fee category created");
      }
      setForm(initialForm);
      setEditingId(null);
      loadCategories();
    } catch (err) {
      showMessage(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      code: cat.code,
      category: cat.category,
      frequency: cat.frequency,
      defaultAmount: cat.defaultAmount || "",
      description: cat.description || "",
      isRequired: cat.isRequired,
      allowDiscount: cat.allowDiscount,
      allowFine: cat.allowFine,
      allowAdvance: cat.allowAdvance,
      requiredForAdmitCard: cat.requiredForAdmitCard,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder || 0,
    });
    setEditingId(cat._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee category?")) return;
    try {
      await api.delete(`/payments/fee-categories/${id}`);
      showMessage("Fee category deleted");
      loadCategories();
    } catch (err) {
      showMessage("Failed to delete", "error");
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Fee Categories</h1>

      {message && (
        <div className={`p-4 rounded-2xl mb-4 font-semibold ${
          message.type === "error"
            ? "bg-red-100 text-red-700"
            : "bg-emerald-100 text-emerald-700"
        }`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-700 mb-4">
          {editingId ? "Edit Fee Category" : "Add Fee Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Name *</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} required
                placeholder="e.g. Tuition Fee"
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-400 mt-1">Auto-fills code, category & frequency</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Default Amount (BDT )</label>
              <input
                type="number" name="defaultAmount" value={form.defaultAmount}
                onChange={handleChange} min="0" step="0.01"
                placeholder="0.00"
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
              <input
                type="text" name="description" value={form.description}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            {[
              { key: "isRequired", label: "Required" },
              { key: "allowDiscount", label: "Allow Discount" },
              { key: "allowFine", label: "Allow Fine" },
              { key: "allowAdvance", label: "Allow Advance" },
              { key: "requiredForAdmitCard", label: "Required for Admit Card" },
              { key: "isActive", label: "Active" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" name={key} checked={form[key]}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="submit" disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button" onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-lg p-6 overflow-x-auto">
        <h2 className="text-xl font-bold text-slate-700 mb-4">All Fee Categories</h2>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No fee categories found.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Frequency</th>
                <th className="pb-3 font-semibold">Default Amount</th>
                <th className="pb-3 font-semibold">Active</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b last:border-none hover:bg-gray-50">
                  <td className="py-3 font-mono font-bold text-indigo-600">{cat.code}</td>
                  <td className="py-3 font-semibold">{cat.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-semibold">{cat.category}</span>
                  </td>
                  <td className="py-3 text-sm">{cat.frequency}</td>
                  <td className="py-3 font-bold text-emerald-700">
                    BDT {Number(cat.defaultAmount || 0).toLocaleString("en-BD")}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      cat.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {cat.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(cat)}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDelete(cat._id)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
