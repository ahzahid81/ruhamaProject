import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import { bdToday, bdDate, bdMonth, bdYear } from "../../utils/bdTime";
import Toast from "../../components/Toast";
import {
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Pencil,
  GraduationCap,
  Activity,
  CalendarClock,
} from "lucide-react";

const EMPTY_LESSON = { juz: "", page: "", verse: "" };
const LESSON_LABELS = {
  lesson: "Lesson",
  sevenLessons: "Seven Lessons",
  memorizationReview: "Memorization Review",
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function HifzProgress() {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(bdMonth());
  const [selectedYear, setSelectedYear] = useState(bdYear());

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [lesson, setLesson] = useState({ ...EMPTY_LESSON });
  const [sevenLessons, setSevenLessons] = useState({ ...EMPTY_LESSON });
  const [memorizationReview, setMemorizationReview] = useState({ ...EMPTY_LESSON });
  const [remarks, setRemarks] = useState("");
  const [editDate, setEditDate] = useState(bdToday());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const teacher = JSON.parse(localStorage.getItem("teacher") || "null");
  const isAdmin = teacher?.role === "admin";

  const showToast = (type, text) => {
    setToast({ type, message: text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
      if (res.data.classes?.length > 0) setSelectedClass(res.data.classes[0].name);
    } catch {
      // silent
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadProgress = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    setProgress(null);
    setExpanded(null);
    try {
      const params = new URLSearchParams({ className: selectedClass, month: selectedMonth, year: selectedYear });
      if (selectedSection) params.append("section", selectedSection);
      const res = await api.get(`/hifz/progress?${params}`);
      setProgress(res.data);
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection, selectedMonth, selectedYear]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const loadStudentHistory = useCallback(async (studentId, isExpanding) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/hifz/student/${studentId}`);
      setHistory(res.data.reports || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
    if (isExpanding) setExpanded(studentId);
  }, []);

  const toggleExpand = (studentId) => {
    if (expanded === studentId) {
      setExpanded(null);
      return;
    }
    loadStudentHistory(studentId, true);
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setEditDate(bdToday());
    setLesson({ ...EMPTY_LESSON });
    setSevenLessons({ ...EMPTY_LESSON });
    setMemorizationReview({ ...EMPTY_LESSON });
    setRemarks("");
  };

  const setField = (setter) => (field) => (e) => {
    setter((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await api.post("/hifz/save", {
        studentId: editTarget.student._id,
        date: editDate,
        lesson,
        sevenLessons,
        memorizationReview,
        remarks,
      });
      showToast("success", res.data.message);
      setEditTarget(null);
      loadProgress();
      if (expanded) loadStudentHistory(expanded, false);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save hifz report");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/hifz/${deleteTarget._id}`);
      showToast("success", "Hifz report deleted.");
      setDeleteTarget(null);
      if (expanded) loadStudentHistory(expanded, false);
      loadProgress();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to delete report");
    } finally {
      setDeleting(false);
    }
  };

  const classes = settings?.classes || [];
  const sections = settings?.sections || [];
  const rows = progress?.rows || [];
  const visibleRows = rows;
  const markedDays = rows.reduce((sum, r) => sum + (r.markedDays || 0), 0);
  const filledDays = rows.reduce((sum, r) => sum + (r.filledDays || 0), 0);

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Hifz Progress</h1>
              <p className="text-sm text-gray-400 mt-0.5">All students' hifz progress — class wise overview {isAdmin ? "(Admin · Full CRUD)" : ""}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                <option value="">All</option>
                {sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              >
                {[bdYear() - 1, bdYear(), bdYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              <GraduationCap className="inline w-4 h-4 mr-1 text-emerald-500" />
              <b>{visibleRows.length}</b> Hifzul Quran student{visibleRows.length !== 1 ? "s" : ""} in {selectedClass}{selectedSection ? " / " + selectedSection : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{rows.length}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Hifz students</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{markedDays}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Marked days this month</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{filledDays}</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Days with lesson data</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-bold text-slate-800">
              Progress Overview {selectedMonth ? `— ${MONTHS[selectedMonth - 1]} ${selectedYear}` : ""}
            </h2>
            <span className="ml-auto text-xs text-gray-400">{visibleRows.length} shown</span>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-16 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No students found for {selectedClass}</p>
              <p className="text-gray-300 text-xs mt-1">Select a class with students to see hifz progress</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold text-center">Marked</th>
                    <th className="px-5 py-3 font-semibold text-center">Filled</th>
                    <th className="px-5 py-3 font-semibold">Latest Report</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleRows.map((row) => (
                    <ProgressRow
                      key={row.student._id}
                      row={row}
                      expanded={expanded === row.student._id}
                      onToggle={() => toggleExpand(row.student._id)}
                      onEdit={isAdmin ? () => openEdit(row) : null}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {expanded && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <ChevronUp className="w-4 h-4 text-gray-400" />
              <h3 className="text-base font-bold text-slate-800">
                History — {rows.find((r) => r.student._id === expanded)?.student?.name}
              </h3>
              {isAdmin && <span className="text-[10px] uppercase tracking-wide text-gray-400">Admin CRUD</span>}
              <span className="ml-auto text-xs text-gray-400">{history.length} records</span>
            </div>
            {loadingHistory ? (
              <div className="py-10 flex items-center justify-center">
                <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No reports found for this student</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-2.5 font-semibold">Date</th>
                      <th className="px-5 py-2.5 font-semibold">Lesson</th>
                      <th className="px-5 py-2.5 font-semibold">Seven Lessons</th>
                      <th className="px-5 py-2.5 font-semibold">Memorization Review</th>
                      <th className="px-5 py-2.5 font-semibold">Remarks</th>
                      {isAdmin && <th className="px-5 py-2.5 font-semibold text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.slice(0, 40).map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/60 transition">
                        <td className="px-5 py-2.5 whitespace-nowrap text-gray-600">{bdDate(r.date)}</td>
                        <td className="px-5 py-2.5"><LessonCell l={r.lesson} /></td>
                        <td className="px-5 py-2.5"><LessonCell l={r.sevenLessons} /></td>
                        <td className="px-5 py-2.5"><LessonCell l={r.memorizationReview} /></td>
                        <td className="px-5 py-2.5 text-gray-500 max-w-[160px] truncate">{r.remarks || "—"}</td>
                        {isAdmin && (
                          <td className="px-5 py-2.5 text-center">
                            <button
                              onClick={() => setDeleteTarget(r)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add / Edit Hifz Report</h3>
                <p className="text-sm text-gray-400">{editTarget.student.name} ({editTarget.student.studentId})</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                />
              </div>
              {[
                { key: "lesson", value: lesson, setter: setLesson },
                { key: "sevenLessons", value: sevenLessons, setter: setSevenLessons },
                { key: "memorizationReview", value: memorizationReview, setter: setMemorizationReview },
              ].map(({ key, value, setter }) => (
                <div key={key} className="rounded-xl border border-slate-200 p-4">
                  <h4 className="text-sm font-bold text-slate-700 mb-3">{LESSON_LABELS[key]}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Juz", f: "juz" },
                      { label: "Page", f: "page" },
                      { label: "Verse", f: "verse" },
                    ].map(({ label, f }) => (
                      <div key={f}>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
                        <input
                          type="text"
                          value={value[f]}
                          onChange={setField(setter)(f)}
                          placeholder="—"
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remark / note"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Report</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Delete Hifz Report?</h3>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete the hifz report for {bdDate(deleteTarget.date)}.
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
    </div>
  );
}

const ProgressRow = ({ row, expanded, onToggle, onEdit }) => {
  const s = row.student;
  return (
    <tr className="hover:bg-gray-50/50 transition">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          {s.photo ? (
            <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
              {s.name?.charAt(0) || "؟"}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-800">{s.name}</p>
            <p className="text-xs text-gray-400">{s.studentId}{s.section ? ` • Sec ${s.section}` : ""}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="font-bold text-slate-700">{row.markedDays}</span>
        <span className="text-xs text-gray-400"> days</span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="font-bold text-slate-700">{row.filledDays}</span>
        <span className="text-xs text-gray-400"> days</span>
      </td>
      <td className="px-5 py-3">
        {row.latest ? (
          <div className="text-xs">
            <p className="text-gray-400">{bdDate(row.latest.date)}</p>
            <p className="text-slate-700 mt-0.5 space-x-2">
              <LessonCell l={row.latest.lesson} />
            </p>
          </div>
        ) : (
          <span className="text-xs text-gray-300">No report yet</span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
              title="Add / Edit report"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition ${expanded ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            title="View history"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
};

const LessonCell = ({ l }) => {
  const parts = [];
  if (l?.juz) parts.push(`Juz ${l.juz}`);
  if (l?.page) parts.push(`P.${l.page}`);
  if (l?.verse) parts.push(`V.${l.verse}`);
  if (parts.length === 0) return <span className="text-gray-300">—</span>;
  return <span className="text-slate-700">{parts.join(", ")}</span>;
};