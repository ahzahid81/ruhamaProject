import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { bdDate } from "../../utils/bdTime";

const TABS = [
  { key: "categories", label: "Categories", icon: "📋" },
  { key: "classRates", label: "Class Rates", icon: "💰" },
];

export default function FeeSettings() {
  const [tab, setTab] = useState("categories");

  // Categories
  const [categories, setCategories] = useState([]);

  // Class Rates
  const [rates, setRates] = useState([]);

  // Shared
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/payments/fee-categories").then((r) => setCategories(r.data)).catch(() => {}),
      api.get("/fees/settings").then((r) => setRates(r.data.settings || r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/payments/fee-categories/${id}`);
      showToast("Category deleted");
      setDeleteConfirm(null);
      const res = await api.get("/payments/fee-categories");
      setCategories(res.data);
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const deleteRate = async (id) => {
    try {
      await api.delete(`/fees/settings/${id}`);
      showToast("Rate deleted");
      setDeleteConfirm(null);
      const res = await api.get("/fees/settings");
      setRates(res.data.settings || res.data || []);
    } catch {
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
            <Link to="/fees/settings/categories/new"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
            >
              <span>+</span> Add Category
            </Link>
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
                        <Link to={`/fees/settings/categories/${cat._id}/edit`} state={{ category: cat }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                        >Edit</Link>
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
            <Link to="/fees/settings/rates/new"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
            >
              <span>+</span> Add Rate
            </Link>
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
                        <td className="px-5 py-3.5 text-sm">{r.dueDate ? bdDate(r.dueDate) : "—"}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-sm max-w-[160px] truncate">{r.description || "—"}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex gap-1.5 justify-end">
                            <Link to={`/fees/settings/rates/${r._id}/edit`} state={{ rate: r }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                            >Edit</Link>
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