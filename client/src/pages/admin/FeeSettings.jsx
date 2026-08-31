import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";

const fallbackSettings = {
  classes: [],
  academicSessions: ["2026"],
  currentSession: "2026",
};

export default function FeeSettings() {
  const [categories, setCategories] = useState([]);
  const [rates, setRates] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [systemSettings, setSystemSettings] = useState(fallbackSettings);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const session = systemSettings.currentSession || "";

  useEffect(() => {
    (async () => {
      try {
        const sres = await getSettings();
        setSystemSettings(sres.data);
      } catch {
        // fallback
      }
      try {
        const res = await api.get("/payments/fee-categories");
        setCategories(res.data);
      } catch {
        // silent
      }
      try {
        const res = await api.get("/fees/settings");
        setRates(res.data.settings || res.data || []);
      } catch {
        // silent
      }
      try {
        const res = await api.get("/fees/student-overrides");
        setOverrides(res.data.overrides || []);
      } catch {
        // silent
      }
      setLoading(false);
    })();
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleActive = async (cat) => {
    try {
      await api.put(`/payments/fee-categories/${cat._id}`, { isActive: !cat.isActive });
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? { ...c, isActive: !cat.isActive } : c)));
      showToast(cat.isActive ? "Fee deactivated" : "Fee activated");
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/payments/fee-categories/${id}`);
      showToast("Fee deleted");
      setDeleteConfirm(null);
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const ratesFor = (catId) => rates.filter((r) => String(r.feeCategory?._id || r.feeCategory) === String(catId));
  const overridesFor = (catId) => overrides.filter((o) => String(o.feeCategory?._id || o.feeCategory) === String(catId));

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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Fee Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define each fee once — set a global amount, per-class amounts, or per-student amounts.
          </p>
        </div>
        <Link to="/fees/settings/categories/new"
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
        >
          <span>+</span> Add Fee
        </Link>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Session: <span className="font-semibold text-gray-500">{session || "—"}</span>
      </p>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

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

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-400 text-sm">No fees yet. Click "Add Fee" to create your first fee.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map((cat) => {
            const catRates = ratesFor(cat._id);
            const catOverrides = overridesFor(cat._id);
            const appliesTo = cat.applicableTo || (catRates.length > 0 ? "Class Wise" : "Global");
            return (
              <div key={cat._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-800 text-lg">{cat.name}</h3>
                      <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{cat.code}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${cat.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-lg font-medium">Type: {cat.frequency}</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg font-medium">Applies To: {appliesTo}</span>
                      {cat.description && <span className="text-gray-400">— {cat.description}</span>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {appliesTo === "Global" && (
                        <p className="text-sm text-gray-600">
                          Amount: <span className="font-bold text-slate-800">{fmt(cat.defaultAmount)}</span>
                          <span className="text-gray-400 ml-2">applies to every student</span>
                        </p>
                      )}
                      {appliesTo === "Class Wise" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Per class</span>
                          {catRates.length === 0 ? (
                            <span className="text-xs text-amber-600">No class amounts set yet — edit to add.</span>
                          ) : (
                            catRates.map((r) => (
                              <span key={r._id} className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                                <b>{r.className}</b>: {fmt(r.amount)}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                      {appliesTo === "Specific" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Per student</span>
                          {catOverrides.length === 0 ? (
                            <span className="text-xs text-amber-600">Not activated for anyone yet — activate per student from Student-wise Fees.</span>
                          ) : (
                            <>
                              <span className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                                {catOverrides.length} student{catOverrides.length !== 1 && "s"}
                              </span>
                              {catOverrides.slice(0, 4).map((o) => (
                                <span key={o._id} className="px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                                  <b>{o.studentId}</b>: {fmt(o.amount)}
                                </span>
                              ))}
                              {catOverrides.length > 4 && <span className="text-xs text-gray-400">+{catOverrides.length - 4} more</span>}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        cat.isActive
                          ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                      title={cat.isActive ? "Click to deactivate" : "Click to activate this fee"}
                    >
                      {cat.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <div className="flex gap-2">
                      <Link to={`/fees/settings/categories/${cat._id}/edit`} state={{ category: cat }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                      >Edit</Link>
                      <button onClick={() => setDeleteConfirm({ message: `Delete "${cat.name}"? This also removes its class rates and student amounts.`, action: () => deleteCategory(cat._id) })}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                      >Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}