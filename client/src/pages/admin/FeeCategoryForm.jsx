import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";

const toCode = (name) =>
  name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

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

const emptyCatForm = {
  name: "", code: "", category: "Other", frequency: "Monthly",
  description: "",
  isRequired: false, allowDiscount: true, allowFine: true, allowAdvance: true,
  requiredForAdmitCard: false, isActive: true, sortOrder: 0,
};

const toggleFields = [
  { key: "isRequired", label: "Required" },
  { key: "allowDiscount", label: "Discount" },
  { key: "allowFine", label: "Fine" },
  { key: "allowAdvance", label: "Advance" },
  { key: "requiredForAdmitCard", label: "Admit Card" },
  { key: "isActive", label: "Active" },
];

export default function FeeCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editing = Boolean(id);

  const [form, setForm] = useState(emptyCatForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      let cats = [];
      try {
        const res = await api.get("/payments/fee-categories");
        cats = res.data;
        setCategories(cats);
      } catch {
        // silent
      }

      if (editing) {
        const cat = location.state?.category || cats.find((c) => c._id === id);
        if (cat) {
          setForm({
            name: cat.name, code: cat.code, category: cat.category, frequency: cat.frequency,
            description: cat.description || "",
            isRequired: cat.isRequired, allowDiscount: cat.allowDiscount, allowFine: cat.allowFine,
            allowAdvance: cat.allowAdvance, requiredForAdmitCard: cat.requiredForAdmitCard,
            isActive: cat.isActive, sortOrder: cat.sortOrder || 0,
          });
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const updates = { [e.target.name]: value };
    if (e.target.name === "name") {
      updates.category = deriveCategory(value);
      updates.frequency = deriveFrequency(value);
      if (!editing) updates.code = toCode(value);
    }
    setForm({ ...form, ...updates });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("Name is required", "error");
    setSaving(true);
    const payload = { ...form, code: form.code || toCode(form.name), sortOrder: form.sortOrder || categories.length + 1 };
    try {
      if (editing) {
        await api.put(`/payments/fee-categories/${id}`, payload);
        showToast("Category updated");
      } else {
        await api.post("/payments/fee-categories", payload);
        showToast("Category created");
      }
      setTimeout(() => navigate("/fees/settings"), 400);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{editing ? "Edit Category" : "New Category"}</h1>
        <p className="text-sm text-gray-500 mt-1">Fee category configuration</p>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Tuition Fee"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-fills code, type & frequency</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Code</label>
            <input type="text" name="code" value={form.code} readOnly
              className="w-full border border-gray-100 bg-gray-50 rounded-xl p-3 text-sm text-gray-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <input type="text" name="description" value={form.description} onChange={handleChange}
              placeholder="Optional"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            {toggleFields.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name={key} checked={form[key]} onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Category" : "Create Category"}
            </button>
            <button type="button" onClick={() => navigate("/fees/settings")}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}