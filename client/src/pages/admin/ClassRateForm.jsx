import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import useQuery from "../../hooks/useQuery";
import { invalidate, useFeeCategories, useSettings } from "../../services/resources";
import { bdDateInput } from "../../utils/bdTime";
import { PageLoader } from "../../components/Loader";

const emptyRateForm = {
  className: "", academicSession: "", feeCategory: "",
  amount: "", dueDate: "", description: "",
};

const fallbackSettings = {
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
};

const toRateForm = (rate) => ({
  className: rate.className,
  academicSession: rate.academicSession,
  feeCategory: rate.feeCategory?._id || rate.feeCategory || "",
  amount: rate.amount,
  dueDate: rate.dueDate ? bdDateInput(rate.dueDate) : "",
  description: rate.description || "",
});

function ClassRateFormView({ id, editing, categories, systemSettings, initialForm }) {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => initialForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/fees/settings/${id}`, form);
        showToast("Rate updated");
      } else {
        await api.post("/fees/settings", form);
        showToast("Rate created");
      }
      await invalidate.fees();
      setTimeout(() => navigate("/fees/settings"), 400);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{editing ? "Edit Class Rate" : "New Class Rate"}</h1>
        <p className="text-sm text-gray-500 mt-1">Configure fee amount per class and session</p>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Class *</label>
              <select name="className" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
              >
                <option value="">Select</option>
                <option value="All Classes">All Classes</option>
                {(systemSettings.classes || []).map((cls) => (
                  <option key={cls.name} value={cls.name}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Session *</label>
              <select name="academicSession" value={form.academicSession} onChange={(e) => setForm({ ...form, academicSession: e.target.value })} required
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
              >
                {(systemSettings.academicSessions || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
              <select name="feeCategory" value={form.feeCategory} onChange={(e) => setForm({ ...form, feeCategory: e.target.value })} required
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
              <input type="number" name="amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" step="0.01" placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Note</label>
              <input type="text" name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Rate" : "Create Rate"}
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

export default function ClassRateForm() {
  const { id } = useParams();
  const location = useLocation();
  const editing = Boolean(id);

  const settingsQuery = useSettings();
  const categoriesQuery = useFeeCategories();

  const preloaded = location.state?.rate;
  const ratesQuery = useQuery(
    editing && !preloaded ? "fees:settings" : null,
    () => api.get("/fees/settings").then((res) => res.data?.settings || res.data || [])
  );

  const rate = preloaded || (ratesQuery.data || []).find((r) => r._id === id);
  const settings = settingsQuery.data;
  const categories = categoriesQuery.data || [];

  const loadError = settingsQuery.error || categoriesQuery.error || ratesQuery.error;
  const ready =
    !loadError &&
    settings !== undefined &&
    categoriesQuery.data !== undefined &&
    (!editing || preloaded || ratesQuery.data !== undefined);

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  if (!ready) return <PageLoader />;

  const systemSettings = settings || fallbackSettings;
  const initialForm =
    editing && rate
      ? toRateForm(rate)
      : { ...emptyRateForm, academicSession: systemSettings.currentSession || "" };

  return (
    <ClassRateFormView
      key={id || "new"}
      id={id}
      editing={editing}
      categories={categories}
      systemSettings={systemSettings}
      initialForm={initialForm}
    />
  );
}