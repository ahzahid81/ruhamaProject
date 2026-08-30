import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../services/api";
import { getSettings } from "../../../services/settingsCache";
import { AlertTriangle } from "lucide-react";

export default function StudentFeeAssignments() {
  const { id: studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
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
    loadStudent();
    loadAssignments();
    loadSystemSettings();
    loadCategories();
  }, []);

  const loadStudent = useCallback(async () => {
    try {
      const res = await api.get(`/students/${studentId}`);
      setStudent(res.data);
    } catch {
      // silent
    }
  }, [studentId]);

  const loadSystemSettings = useCallback(async () => {
    try {
      const res = await getSettings();
      setSystemSettings(res.data);
      setForm((prev) => ({
        ...prev,
        academicSession: res.data.currentSession || "",
      }));
    } catch {
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

  const loadAssignments = useCallback(async () => {
    try {
      const res = await api.get(
        `/fees/student-assignments?student=${studentId}`
      );
      const data = res.data;
      if (Array.isArray(data)) {
        setAssignments(data);
      } else if (data?.assignments) {
        setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
      } else {
        setAssignments([]);
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
      let list = Array.isArray(data) ? data : Array.isArray(data?.categories) ? data.categories : [];
      // Only optional (non-required) active categories can be assigned per-student
      list = list.filter((c) => !c.isRequired && c.isActive);
      setCategories(list);
    } catch {
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
      await api.post("/fees/student-assignments", {
        student: studentId,
        ...form,
      });
      showMessage("Optional fee assigned successfully");
      setForm((prev) => ({ ...prev, feeCategory: "", amount: "", reason: "" }));
      loadAssignments();
    } catch (err) {
      showMessage(
        err.response?.data?.message || "Failed to assign fee",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (assignment) => {
    try {
      await api.put(`/fees/student-assignments/${assignment._id}`, {
        isActive: !assignment.isActive,
      });
      showMessage(assignment.isActive ? "Fee removed from student" : "Fee assigned to student");
      loadAssignments();
    } catch {
      showMessage("Failed to update fee assignment", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/fees/student-assignments/${deleteTarget}`);
      showMessage("Fee assignment deleted");
      setDeleteTarget(null);
      loadAssignments();
    } catch {
      showMessage("Failed to delete fee assignment", "error");
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c._id === id);
    return cat ? cat.name : id;
  };

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

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
          Optional Fee Assignment
        </h1>
        <div className="flex gap-2">
          <Link to={`/students/${studentId}`}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
          >← Profile</Link>
          <Link to={`/students/${studentId}/fee-override`}
            className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition border border-amber-200"
          >Fee Override</Link>
          <Link to={`/collect-payment?studentId=${studentId}`}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
          >Collect Payment</Link>
          <Link to={`/students/${studentId}/ledger`}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition border border-blue-200"
          >View Ledger</Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">🧾</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{student?.name || "Student"}</p>
          <p className="text-xs text-gray-400">
            {student?.studentId || ""} • {student?.className || ""}
          </p>
        </div>
        <p className="text-xs text-gray-400 hidden sm:block">
          Apply optional fees (Transport, Hostel, Meal, etc.) to this student only
        </p>
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

      {/* Add Assignment Form */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-700 mb-4">
          Assign Optional Fee
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
              Optional Fee Category *
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
            {categories.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No optional fee categories yet. Add one in Fee Settings (uncheck "Required").
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Amount (BDT) — optional
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Leave 0 to use class rate / default"
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
              placeholder="e.g., Hostel boarding student"
              className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Assign Optional Fee"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Assignments */}
      <div className="bg-white rounded-3xl shadow-lg p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-700 mb-4">
          Assigned Optional Fees
        </h2>
        {assignments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No optional fees assigned to this student.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3 font-semibold">Session</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Reason</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id} className="border-b last:border-none hover:bg-gray-50">
                  <td className="py-3">{a.academicSession}</td>
                  <td className="py-3">{a.feeCategory?.name || getCategoryName(a.feeCategory)}</td>
                  <td className="py-3 font-bold text-emerald-700">
                    {a.amount > 0 ? fmt(a.amount) : "—"}
                  </td>
                  <td className="py-3 text-gray-500">{a.reason || "—"}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                      a.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {a.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleToggleActive(a)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                          a.isActive
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {a.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a._id)}
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

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Delete Fee Assignment</h2>
            <p className="text-sm text-gray-400 mt-1">This student will no longer be charged this optional fee. Are you sure?</p>
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