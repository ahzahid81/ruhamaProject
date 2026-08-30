import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import { Calendar, Users, CheckCircle2, XCircle, Save, RefreshCw, Search } from "lucide-react";

export default function DailyAttendance() {
  const [settings, setSettings] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [absentIds, setAbsentIds] = useState(new Set());
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    if (!selectedClass || !selectedDate) return;
    setLoading(true);
    setAbsentIds(new Set());
    setAlreadyMarked(false);
    setSearchQuery("");
    try {
      const params = new URLSearchParams({ className: selectedClass, status: "Active" });
      if (selectedSection) params.append("section", selectedSection);

      const [studentsRes, attendanceRes] = await Promise.all([
        api.get(`/students?${params}`),
        api.get(`/attendance/class?${new URLSearchParams({ className: selectedClass, date: selectedDate, ...(selectedSection ? { section: selectedSection } : {}) })}`),
      ]);

      const studentList = studentsRes.data.students || studentsRes.data;
      setStudents(Array.isArray(studentList) ? studentList : []);

      if (attendanceRes.data.students?.length > 0) {
        const absent = new Set();
        attendanceRes.data.students.forEach((s) => {
          if (s.status === "Absent") absent.add(s.student?._id || s.student);
        });
        setAbsentIds(absent);
        setAlreadyMarked(true);
      }
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection, selectedDate]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const toggleAbsent = (studentId) => {
    setAbsentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const res = await api.post("/attendance/mark", {
        className: selectedClass,
        section: selectedSection,
        date: selectedDate,
        absentStudentIds: Array.from(absentIds),
      });
      setToast({ type: "success", text: res.data.message });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.message || "Failed to save attendance" });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)
    );
  });

  const presentCount = students.length - absentIds.size;
  const sections = settings?.sections || [];
  const classes = settings?.classes || [];

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
        <div className="max-w-5xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-slate-800">Daily Attendance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Mark absent students — all others default to PRESENT</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Selection Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              >
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
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              >
                <option value="">All</option>
                {sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadStudents}
                disabled={loading}
                className="w-full px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Loading...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Load Students</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {students.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 border border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total</p></div>
              <p className="text-2xl font-bold text-blue-800 mt-1">{students.length}</p>
            </div>
            <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Present</p></div>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{presentCount}</p>
            </div>
            <div className="rounded-xl p-4 border border-red-200 bg-red-50">
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" /><p className="text-xs font-semibold uppercase tracking-wider text-red-600">Absent</p></div>
              <p className="text-2xl font-bold text-red-800 mt-1">{absentIds.size}</p>
            </div>
            <div className="rounded-xl p-4 border border-purple-200 bg-purple-50">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-600" /><p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Date</p></div>
              <p className="text-lg font-bold text-purple-800 mt-1">{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>
        )}

        {/* Student List */}
        {students.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-slate-800">Students — {selectedClass}{selectedSection ? " / " + selectedSection : ""}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {alreadyMarked ? "Existing attendance loaded — update as needed" : "Click students to mark them ABSENT"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition w-48"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200"
                >
                  {saving ? (
                    <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Attendance</>
                  )}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => {
                    const isAbsent = absentIds.has(student._id);
                    return (
                      <tr
                        key={student._id}
                        onClick={() => toggleAbsent(student._id)}
                        className={`cursor-pointer transition ${
                          isAbsent
                            ? "bg-red-50/70 hover:bg-red-50"
                            : "hover:bg-emerald-50/30"
                        }`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {student.photo ? (
                              <img src={student.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                                {student.name?.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-slate-700">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">{student.studentId}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            isAbsent
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}>
                            {isAbsent ? <><XCircle className="w-3.5 h-3.5" /> Absent</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Present</>}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && students.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No students match your search</p>
              </div>
            )}
          </div>
        )}

        {!loading && students.length === 0 && selectedClass && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-gray-400 text-sm font-medium">No students found</p>
            <p className="text-gray-300 text-xs mt-1">Select a class and click Load Students</p>
          </div>
        )}
      </div>
    </div>
  );
}
