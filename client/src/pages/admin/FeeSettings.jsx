import { useState, useEffect } from "react";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";

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

const TABS = [
  { key: "categories", label: "Categories", icon: "📋" },
  { key: "classRates", label: "Class Rates", icon: "💰" },
];

const emptyCatForm = {
  name: "", code: "", category: "Other", frequency: "Monthly",
  description: "",
  isRequired: false, allowDiscount: true, allowFine: true, allowAdvance: true,
  requiredForAdmitCard: false, isActive: true, sortOrder: 0,
};

const emptyRateForm = {
  className: "", academicSession: "", feeCategory: "",
  amount: "", dueDate: "", description: "",
};

const toggleFields = [
  { key: "isRequired", label: "Required" },
  { key: "allowDiscount", label: "Discount" },
  { key: "allowFine", label: "Fine" },
  { key: "allowAdvance", label: "Advance" },
  { key: "requiredForAdmitCard", label: "Admit Card" },
  { key: "isActive", label: "Active" },
];

export default function FeeSettings() {
  const [tab, setTab] = useState("categories");

  // Categories
  const [categories, setCategories] = useState([]);
  const [catForm, setCatForm] = useState(emptyCatForm);
  const [catEditId, setCatEditId] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);

  // Class Rates
  const [rates, setRates] = useState([]);
  const [rateForm, setRateForm] = useState(emptyRateForm);
  const [rateEditId, setRateEditId] = useState(null);
  const [showRateModal, setShowRateModal] = useState(false);

  // Shared
  const [systemSettings, setSystemSettings] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/payments/fee-categories").then((r) => setCategories(r.data)).catch(() => {}),
      api.get("/fees/settings").then((r) => setRates(r.data.settings || r.data || [])).catch(() => {}),
      getSettings().then((r) => {
        setSystemSettings(r.data);
        setRateForm((p) => ({ ...p, academicSession: r.data.currentSession || "" }));
      }).catch(() => {
        setSystemSettings({
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
          academicSessions: ["2025", "2026", "2027"],
          currentSession: "2026",
        });
        setRateForm((p) => ({ ...p, academicSession: "2026" }));
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCatModal = (cat = null) => {
    if (cat) {
      setCatForm({
        name: cat.name, code: cat.code, category: cat.category, frequency: cat.frequency,
        description: cat.description || "",
        isRequired: cat.isRequired, allowDiscount: cat.allowDiscount, allowFine: cat.allowFine,
        allowAdvance: cat.allowAdvance, requiredForAdmitCard: cat.requiredForAdmitCard,
        isActive: cat.isActive, sortOrder: cat.sortOrder || 0,
      });
      setCatEditId(cat._id);
    } else {
      setCatForm(emptyCatForm);
      setCatEditId(null);
    }
    setShowCatModal(true);
  };

  const openRateModal = (rate = null) => {
    if (rate) {
      setRateForm({
        className: rate.className, academicSession: rate.academicSession,
        feeCategory: rate.feeCategory?._id || rate.feeCategory || "",
        amount: rate.amount, dueDate: rate.dueDate ? rate.dueDate.split("T")[0] : "",
        description: rate.description || "",
      });
      setRateEditId(rate._id);
    } else {
      setRateForm({
        ...emptyRateForm,
        academicSession: systemSettings?.currentSession || "",
      });
      setRateEditId(null);
    }
    setShowRateModal(true);
  };

  const handleCatChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    const updates = { [e.target.name]: value };
    if (e.target.name === "name") {
      updates.category = deriveCategory(value);
      updates.frequency = deriveFrequency(value);
      if (!catEditId) updates.code = toCode(value);
    }
    setCatForm({ ...catForm, ...updates });
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return showToast("Name is required", "error");
    setSaving(true);
    const payload = { ...catForm, code: catForm.code || toCode(catForm.name), sortOrder: catForm.sortOrder || categories.length + 1 };
    try {
      if (catEditId) {
        await api.put(`/payments/fee-categories/${catEditId}`, payload);
        showToast("Category updated");
      } else {
        await api.post("/payments/fee-categories", payload);
        showToast("Category created");
      }
      setShowCatModal(false);
      setCatEditId(null);
      const res = await api.get("/payments/fee-categories");
      setCategories(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/payments/fee-categories/${id}`);
      showToast("Category deleted");
      setDeleteConfirm(null);
      const res = await api.get("/payments/fee-categories");
      setCategories(res.data);
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const submitRate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (rateEditId) {
        await api.put(`/fees/settings/${rateEditId}`, rateForm);
        showToast("Rate updated");
      } else {
        await api.post("/fees/settings", rateForm);
        showToast("Rate created");
      }
      setShowRateModal(false);
      setRateEditId(null);
      const res = await api.get("/fees/settings");
      setRates(res.data.settings || res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteRate = async (id) => {
    try {
      await api.delete(`/fees/settings/${id}`);
      showToast("Rate deleted");
      setDeleteConfirm(null);
      const res = await api.get("/fees/settings");
      setRates(res.data.settings || res.data || []);
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  const getCatName = (id) => {
    const c = categories.find((c) => c._id === id);
    return c ? c.name : id;
  };

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Fee Management</h1>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all animate-slide-in ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">{deleteConfirm.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                Cancel
              </button>
              <button onClick={deleteConfirm.action} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowCatModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-5">{catEditId ? "Edit Category" : "New Category"}</h2>
            <form onSubmit={submitCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
                <input type="text" name="name" value={catForm.name} onChange={handleCatChange} required
                  placeholder="e.g. Tuition Fee"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-fills code, type & frequency</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Code</label>
                <input type="text" name="code" value={catForm.code} readOnly
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl p-3 text-sm text-gray-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <input type="text" name="description" value={catForm.description} onChange={handleCatChange}
                  placeholder="Optional"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                />
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {toggleFields.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name={key} checked={catForm[key]} onChange={handleCatChange}
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
                  {saving ? "Saving..." : catEditId ? "Update Category" : "Create Category"}
                </button>
                <button type="button" onClick={() => setShowCatModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowRateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-5">{rateEditId ? "Edit Class Rate" : "New Class Rate"}</h2>
            <form onSubmit={submitRate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Class *</label>
                  <select name="className" value={rateForm.className} onChange={(e) => setRateForm({ ...rateForm, className: e.target.value })} required
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                  >
                    <option value="">Select</option>
                    <option value="All Classes">All Classes</option>
                    {(systemSettings?.classes || []).map((cls) => (
                      <option key={cls.name} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Session *</label>
                  <select name="academicSession" value={rateForm.academicSession} onChange={(e) => setRateForm({ ...rateForm, academicSession: e.target.value })} required
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                  >
                    {(systemSettings?.academicSessions || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
                  <select name="feeCategory" value={rateForm.feeCategory} onChange={(e) => setRateForm({ ...rateForm, feeCategory: e.target.value })} required
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                  >
                    <option value="">Select</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Amount (BDT) *</label>
                  <input type="number" name="amount" value={rateForm.amount} onChange={(e) => setRateForm({ ...rateForm, amount: e.target.value })} required min="0" step="0.01" placeholder="0.00"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                  <input type="date" name="dueDate" value={rateForm.dueDate} onChange={(e) => setRateForm({ ...rateForm, dueDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Note</label>
                  <input type="text" name="description" value={rateForm.description} onChange={(e) => setRateForm({ ...rateForm, description: e.target.value })} placeholder="Optional"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : rateEditId ? "Update Rate" : "Create Rate"}
                </button>
                <button type="button" onClick={() => setShowRateModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {tab === "categories" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
            <button onClick={() => openCatModal()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
            >
              <span>+</span> Add Category
            </button>
          </div>
          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-400 text-sm">No fee categories yet. Click "Add Category" to create one.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {categories.map((cat) => (
                <div key={cat._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-800 text-lg">{cat.name}</h3>
                        <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{cat.code}</span>
                        <span className={`inline-block w-2 h-2 rounded-full ${cat.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-lg font-medium">{cat.category}</span>
                        <span>{cat.frequency}</span>
                        {cat.isRequired && <span className="text-amber-600 font-medium">Required</span>}
                        {cat.description && <span className="text-gray-400">— {cat.description}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex gap-1.5">
                        <button onClick={() => openCatModal(cat)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                        >Edit</button>
                        <button onClick={() => setDeleteConfirm({ message: `Delete "${cat.name}"? This cannot be undone.`, action: () => deleteCategory(cat._id) })}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                        >Delete</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                    {[
                      { key: "allowDiscount", label: "Discount" },
                      { key: "allowFine", label: "Fine" },
                      { key: "allowAdvance", label: "Advance" },
                      { key: "requiredForAdmitCard", label: "Admit Card" },
                    ].map(({ key, label }) => (
                      <span key={key} className={`text-xs font-medium px-2 py-0.5 rounded-lg ${
                        cat[key] ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
                      }`}>
                        {label}: {cat[key] ? "Yes" : "No"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Class Rates Tab */}
      {tab === "classRates" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{rates.length} rate{rates.length !== 1 && "s"}</p>
            <button onClick={() => openRateModal()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
            >
              <span>+</span> Add Rate
            </button>
          </div>
          {rates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-4xl mb-3">💰</p>
              <p className="text-gray-400 text-sm">No class rates set yet. Click "Add Rate" to configure fee amounts per class.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5 font-semibold">Class</th>
                      <th className="px-5 py-3.5 font-semibold">Session</th>
                      <th className="px-5 py-3.5 font-semibold">Category</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Amount</th>
                      <th className="px-5 py-3.5 font-semibold">Due Date</th>
                      <th className="px-5 py-3.5 font-semibold">Note</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rates.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3.5 font-medium">{r.className}</td>
                        <td className="px-5 py-3.5 text-gray-500">{r.academicSession}</td>
                        <td className="px-5 py-3.5">{r.feeCategory?.name || getCatName(r.feeCategory)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">{fmt(r.amount)}</td>
                        <td className="px-5 py-3.5 text-sm">{r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-sm max-w-[160px] truncate">{r.description || "—"}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => openRateModal(r)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                            >Edit</button>
                            <button onClick={() => setDeleteConfirm({ message: `Delete this rate for ${r.className} — ${r.feeCategory?.name || getCatName(r.feeCategory)}?`, action: () => deleteRate(r._id) })}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                            >Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
