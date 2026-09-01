import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import { bdToday, bdDate, bdDateLong } from "../../utils/bdTime";
import Toast from "../../components/Toast";
import {
  BookOpen,
  Calendar,
  Users,
  Save,
  Trash2,
  History,
  Layers,
  Search,
} from "lucide-react";

const EMPTY_LESSON = { juz: "", page: "", verse: "" };

const LESSON_ICONS = {
  lesson: "📖",
  sevenLessons: "📚",
  memorizationReview: "🧠",
};

const LESSON_LABELS = {
  lesson: "Lesson",
  sevenLessons: "Seven Lessons",
  memorizationReview: "Memorization Review",
};

export default function HifzReport() {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(bdToday());

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  const [lesson, setLesson] = useState({ ...EMPTY_LESSON });
  const [sevenLessons, setSevenLessons] = useState({ ...EMPTY_LESSON });
  const [memorizationReview, setMemorizationReview] = useState({ ...EMPTY_LESSON });
  const [remarks, setRemarks] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [toast, setToast] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
      if (res.data.classes?.length > 0) {
        setSelectedClass(res.data.classes[0].name);
      }
    } catch {
      // silent
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    setSelectedStudent("");
    setHistory([]);
    try {
      const params = new URLSearchParams({ className: selectedClass, status: "Active", studentType: "Hifzul Quran" });
      if (selectedSection) params.append("section", selectedSection);
      const res = await api.get(`/students?${params}`);
      const list = res.data.students || res.data;
      setStudents(Array.isArray(list) ? list : []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadReport = useCallback(async () => {
    if (!selectedStudent || !selectedDate) return;
    setLoadingReport(true);
    try {
      const params = new URLSearchParams({ studentId: selectedStudent, date: selectedDate });
      const res = await api.get(`/hifz?${params}`);
      const r = res.data.report;
      if (r) {
        setLesson({ juz: r.lesson?.juz || "", page: r.lesson?.page || "", verse: r.lesson?.verse || "" });
        setSevenLessons({ juz: r.sevenLessons?.juz || "", page: r.sevenLessons?.page || "", verse: r.sevenLessons?.verse || "" });
        setMemorizationReview({ juz: r.memorizationReview?.juz || "", page: r.memorizationReview?.page || "", verse: r.memorizationReview?.verse || "" });
        setRemarks(r.remarks || "");
        showToast("success", "Existing report loaded for this date.");
      } else {
        setLesson({ ...EMPTY_LESSON });
        setSevenLessons({ ...EMPTY_LESSON });
        setMemorizationReview({ ...EMPTY_LESSON });
        setRemarks("");
      }
    } catch {
      // silent
    } finally {
      setLoadingReport(false);
    }
  }, [selectedStudent, selectedDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const loadHistory = useCallback(async () => {
    if (!selectedStudent) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(`/hifz/student/${selectedStudent}`);
      setHistory(res.data.reports || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedStudent]);

  const toggleHistory = () => {
    if (!selectedStudent) {
      showToast("error", "Select a student first.");
      return;
    }
    if (!showHistory) loadHistory();
    setShowHistory((v) => !v);
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const setField = (setter) => (field) => (e) => {
    setter((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedStudent) {
      showToast("error", "Select class and student.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/hifz/save", {
        studentId: selectedStudent,
        date: selectedDate,
        lesson,
        sevenLessons,
        memorizationReview,
        remarks,
      });
      showToast("success", res.data.message);
      if (showHistory) loadHistory();
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
      loadHistory();
      if (selectedStudent && selectedDate) loadReport();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to delete report");
    } finally {
      setDeleting(false);
    }
  };

  const classes = settings?.classes || [];
  const sections = settings?.sections || [];
  const hasAnyLesson =
    [lesson, sevenLessons, memorizationReview].some((l) => l.juz || l.page || l.verse);

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
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Hifz Report</h1>
              <p className="text-sm text-gray-400 mt-0.5">Daily hifz progress for individual students (Juz, Page, Verse)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* SELECTORS */}
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={loadingStudents}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition disabled:bg-gray-50"
                >
                  <option value="">{loadingStudents ? "Loading..." : "Select Student"}</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              <Users className="inline w-4 h-4 mr-1 text-gray-400" />
              <b>{students.length}</b> student{students.length !== 1 ? "s" : ""} in {selectedClass}{selectedSection ? " / " + selectedSection : ""}
            </p>
            <button
              onClick={toggleHistory}
              disabled={!selectedStudent}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition disabled:opacity-40"
            >
              <History className="w-4 h-4" />
              {showHistory ? "Hide History" : "Student History"}
            </button>
          </div>
        </div>

        {/* FORM */}
        {selectedStudent && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-black">
                  {students.find((s) => s._id === selectedStudent)?.name?.charAt(0) || "؟"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {students.find((s) => s._id === selectedStudent)?.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {students.find((s) => s._id === selectedStudent)?.studentId} • {bdDateLong(selectedDate, { shortMonth: true })}
                  </p>
                </div>
              </div>
              {loadingReport && <p className="text-xs text-gray-400">Loading existing report...</p>}
            </div>

            <div className="space-y-5">
              {[
                { key: "lesson", value: lesson, setter: setLesson },
                { key: "sevenLessons", value: sevenLessons, setter: setSevenLessons },
                { key: "memorizationReview", value: memorizationReview, setter: setMemorizationReview },
              ].map(({ key, value, setter }) => (
                <div key={key} className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <span className="text-xl">{LESSON_ICONS[key]}</span>
                    <h3 className="font-bold text-slate-800">{LESSON_LABELS[key]}</h3>
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-gray-400">Verse (optional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
                    <LessonInput label="Juz" value={value.juz} onChange={setField(setter)("juz")} />
                    <LessonInput label="Page" value={value.page} onChange={setField(setter)("page")} />
                    <LessonInput label="Verse (optional)" value={value.verse} onChange={setField(setter)("verse")} optional />
                  </div>
                </div>
              ))}

              {/* REMARKS */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <span className="text-xl">📝</span>
                  <h3 className="font-bold text-slate-800">Remarks</h3>
                </div>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remark / note for today"
                  className="w-full p-4 text-sm outline-none resize-none"
                />
              </div>

              {/* SAVE */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <p className="text-xs text-gray-400">
                  {hasAnyLesson
                    ? "At least one lesson filled — ready to save."
                    : "Fill at least one lesson section before saving."}
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  {saving ? (
                    <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Hifz Report</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedStudent && !loadingStudents && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">Select a class and student to begin</p>
            <p className="text-gray-300 text-xs mt-1">Then enter today's lesson progress</p>
          </div>
        )}

        {/* HISTORY */}
        {showHistory && selectedStudent && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <History className="w-4 h-4 text-gray-400" />
              <h2 className="text-base font-bold text-slate-800">Report History</h2>
              <span className="ml-auto text-xs text-gray-400">{history.length} records</span>
            </div>
            {loadingHistory ? (
              <div className="py-10 flex items-center justify-center">
                <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-gray-400 text-sm">No hifz reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Lesson</th>
                      <th className="px-5 py-3 font-semibold">Seven Lessons</th>
                      <th className="px-5 py-3 font-semibold">Memorization Review</th>
                      <th className="px-5 py-3 font-semibold">Remarks</th>
                      <th className="px-5 py-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap text-xs">{bdDate(r.date)}</td>
                        <td className="px-5 py-3 text-xs"><LessonCell l={r.lesson} /></td>
                        <td className="px-5 py-3 text-xs"><LessonCell l={r.sevenLessons} /></td>
                        <td className="px-5 py-3 text-xs"><LessonCell l={r.memorizationReview} /></td>
                        <td className="px-5 py-3 text-xs text-gray-500 max-w-[160px] truncate">{r.remarks || "—"}</td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
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

// ======================================
// LESSON INPUT
// ======================================
const LessonInput = ({ label, value, onChange, optional }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={optional ? "—" : ""}
      className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
    />
  </div>
);

// ======================================
// LESSON CELL (history)
// ======================================
const LessonCell = ({ l }) => {
  const parts = [];
  if (l?.juz) parts.push(`Juz ${l.juz}`);
  if (l?.page) parts.push(`P.${l.page}`);
  if (l?.verse) parts.push(`V.${l.verse}`);
  if (parts.length === 0) return <span className="text-gray-300">—</span>;
  return <span className="text-slate-700">{parts.join(", ")}</span>;
};
