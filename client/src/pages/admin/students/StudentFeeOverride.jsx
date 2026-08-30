import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../services/api";
import { getSettings } from "../../../services/settingsCache";
import { AlertTriangle } from "lucide-react";

export default function StudentFeeOverride() {
  const { id: studentId } = useParams();

  const [overrides, setOverrides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [form, setForm] = useState({
    academicSession: "",
    feeCategory: "",
    amount: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadOverrides();
    loadSystemSettings();
    loadCategories();
  }, []);

  const loadSystemSettings = useCallback(async () => {
    try {
      const res = await getSettings();
      setSystemSettings(res.data);
      setForm((prev) => ({
        ...prev,
        academicSession: res.data.currentSession || "",
      }));
    } catch (err) {
      setSystemSettings({
        academicSessions: ["2025", "2026", "2027"],
        currentSession: "2026",
      });
      setForm((prev) => ({
        ...prev,
        academicSession: "2026",
      }));
    }
  }, []);

  const loadOverrides = useCallback(async () => {
    try {
      const res = await api.get(
        `/fees/student-overrides?student=${studentId}`
      );
      const data = res.data;
      if (Array.isArray(data)) {
        setOverrides(data);
      } else if (data?.overrides) {
        setOverrides(Array.isArray(data.overrides) ? data.overrides : []);
      } else {
        setOverrides([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  }, [studentId]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await api.get("/payments/fee-categories");
      const data = res.data;
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data?.categories) {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      // silent
    }
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/fees/student-overrides", {
        student: studentId,
        ...form,
      });
      showMessage("Fee override created successfully");
      setForm({ academicSession: systemSettings?.currentSession || "", feeCategory: "", amount: "", reason: "" });
      loadOverrides();
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Failed to create override",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/fees/student-overrides/${deleteTarget}`);
      showMessage("Override deleted");
      setDeleteTarget(null);
      loadOverrides();
    } catch (err) {
      showMessage("Failed to delete override", "error");
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c._id === id);
    return cat ? cat.name : id;
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Student Fee Override
        </h1>
        <div className="flex gap-2">
          <Link to={`/students/${studentId}`}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
          >← Profile</Link>
          <Link to={`/students/${studentId}/fees`}
            className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-100 transition border border-orange-200"
          >Optional Fees</Link>
          <Link to={`/collect-payment?studentId=${studentId}`}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
          >Collect Payment</Link>
          <Link to={`/students/${studentId}/ledger`}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition border border-blue-200"
          >View Ledger</Link>
        </div>
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

      {/* Add Override Form */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4">
          Add Override
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Session *
            </label>
            <select
              name="academicSession"
              value={form.academicSession}
              onChange={handleChange}
              required
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {(systemSettings?.academicSessions || []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Fee Category *
            </label>
            <select
              name="feeCategory"
              value={form.feeCategory}
              onChange={handleChange}
              required
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} ({cat.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Override Amount (BDT ) *
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Reason
            </label>
            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="e.g., Scholarship 50%"
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Override"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Overrides */}
      <div className="bg-white rounded-3xl shadow-lg p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-700 mb-4">
          Existing Overrides
        </h2>
        {overrides.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No overrides for this student.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3 font-semibold">Session</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Reason</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map((o) => (
                <tr key={o._id} className="border-b last:border-none hover:bg-gray-50">
                  <td className="py-3">{o.academicSession}</td>
                  <td className="py-3">{o.feeCategory?.name || getCategoryName(o.feeCategory)}</td>
                  <td className="py-3 font-bold text-emerald-700">
                    BDT {Number(o.amount).toLocaleString("en-BD")}
                  </td>
                  <td className="py-3 text-gray-500">{o.reason || "—"}</td>
                  <td className="py-3">
                    <button
                      onClick={() => setDeleteTarget(o._id)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete Override</h2>
            <p className="text-sm text-gray-400 mt-1">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={handleDeleteConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all">
                Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-all border border-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
