import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  Save,
  Database,
  Trash,
} from "lucide-react";
import { bdDate } from "../../utils/bdTime";

const STATUS_OPTIONS = ["Present", "Absent", "Late", "Leave"];

const STATUS_STYLES = {
  Present: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Absent: "bg-red-100 text-red-700 border border-red-200",
  Late: "bg-amber-100 text-amber-700 border border-amber-200",
  Leave: "bg-purple-100 text-purple-700 border border-purple-200",
};

const STATUS_ICONS = {
  Present: CheckCircle2,
  Absent: XCircle,
  Late: Clock,
  Leave: CalendarOff,
};

export default function AttendanceManagement() {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [filters, setFilters] = useState({
    className: "",
    section: "",
    status: "",
    from: "",
    to: "",
    search: "",
  });

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [editStatus, setEditStatus] = useState("Present");
  const [editRemarks, setEditRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmations
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
      if (res.data.classes?.length > 0) {
        setFilters((f) => ({ ...f, className: f.className || res.data.classes[0].name }));
      }
    } catch {
      // silent
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filters.className) params.append("className", filters.className);
      if (filters.section) params.append("section", filters.section);
      if (filters.status) params.append("status", filters.status);
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.search) params.append("search", filters.search);

      const res = await api.get(`/attendance/admin?${params}`);
      setRecords(res.data.records || []);
      setTotal(res.data.total || 0);
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const resetPageAndLoad = () => {
    setPage(1);
  };

  const openEdit = (record) => {
    setEditing(record);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || "");
  };

  const handleEditSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/attendance/admin/${editing._id}`, {
        status: editStatus,
        remarks: editRemarks,
      });
      showToast("success", "Attendance updated successfully.");
      setEditing(null);
      loadRecords();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update attendance");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/attendance/admin/${deleteTarget._id}`);
      showToast("success", "Attendance record deleted.");
      setDeleteTarget(null);
      loadRecords();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to delete attendance");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete("/attendance/admin", {
        data: {
          className: filters.className,
          section: filters.section,
          date: filters.from || filters.to,
        },
      });
      showToast("success", res.data.message || "Attendance cleared.");
      setBulkDelete(false);
      loadRecords();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to clear attendance");
    } finally {
      setDeleting(false);
    }
  };

  const classes = settings?.classes || [];
  const sections = settings?.sections || [];
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-semibold text-sm ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-slate-800">Attendance Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create, view, update and delete attendance records (Admin)</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
              <select
                value={filters.className}
                onChange={(e) => { setFilters((f) => ({ ...f, className: e.target.value })); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                <option value="">All</option>
                {classes.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
              <select
                value={filters.section}
                onChange={(e) => { setFilters((f) => ({ ...f, section: e.target.value })); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                <option value="">All</option>
                {sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                <option value="">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => { setFilters((f) => ({ ...f, from: e.target.value })); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => { setFilters((f) => ({ ...f, to: e.target.value })); setPage(1); }}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              />
            </div>
            <div className="flex items-end">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
                  placeholder="Search ID/Class"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={resetPageAndLoad}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <RefreshCw className="w-4 h-4" /> Apply
              </button>
              <p className="text-sm text-gray-500">
                <span className="font-bold text-slate-800">{total}</span> record{total !== 1 ? "s" : ""} found
              </p>
            </div>
            <button
              onClick={() => setBulkDelete(true)}
              disabled={!filters.className || !filters.from}
              title={!filters.className || !filters.from ? "Select a class and From date to clear" : "Delete all attendance for selected class/date"}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition disabled:opacity-40"
            >
              <Trash className="w-4 h-4" /> Clear Day (Class)
            </button>
          </div>
        </div>

        {/* Summary */}
        {records.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATUS_OPTIONS.map((s) => {
              const count = records.filter((r) => r.status === s).length;
              return (
                <div key={s} className="rounded-xl p-4 border bg-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Records */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-bold text-slate-800">Attendance Records</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Class</th>
                  <th className="px-5 py-3 font-semibold">Section</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                  <th className="px-5 py-3 font-semibold">Remarks</th>
                  <th className="px-5 py-3 font-semibold">Marked By</th>
                  <th className="px-5 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => {
                  const Icon = STATUS_ICONS[r.status] || CheckCircle2;
                  return (
                    <tr key={r._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap text-xs">{bdDate(r.date)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {r.student?.photo ? (
                            <img src={r.student.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                              {(r.student?.name || r.studentId || "?").charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-slate-700">{r.student?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{r.studentId}</td>
                      <td className="px-5 py-3 text-xs text-slate-700">{r.className}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{r.section || "—"}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[r.status] || STATUS_STYLES.Present}`}>
                          <Icon className="w-3.5 h-3.5" /> {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 max-w-[160px] truncate">{r.remarks || "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{r.markedBy?.name || "—"}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && records.length === 0 && (
            <div className="text-center py-12">
              <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No attendance records found</p>
              <p className="text-gray-300 text-xs mt-1">Adjust filters or mark attendance first</p>
            </div>
          )}

          {loading && (
            <div className="py-12 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-slate-800">Edit Attendance</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-800">{editing.student?.name || "Unknown Student"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{editing.studentId} • {editing.className}{editing.section ? " / " + editing.section : ""} • {bdDate(editing.date)}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditStatus(s)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border transition ${
                        editStatus === s
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Remarks</label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  rows={2}
                  placeholder="Optional remark"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SINGLE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete Attendance?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete the attendance record for{" "}
                <b>{deleteTarget.student?.name || deleteTarget.studentId}</b> on <b>{bdDate(deleteTarget.date)}</b>.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE MODAL */}
      {bulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Clear Attendance Day</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete all attendance records for{" "}
                <b>{filters.className}</b>
                {filters.section ? " / " + filters.section : ""} on <b>{bdDate(filters.from)}</b>.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setBulkDelete(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
