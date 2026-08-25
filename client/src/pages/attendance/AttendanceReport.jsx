import { useState, useEffect } from "react";
import api from "../../services/api";
import { BarChart3, Download, Calendar } from "lucide-react";

export default function AttendanceReport() {
  const [settings, setSettings] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get("/settings");
      setSettings(res.data);
      if (res.data.classes?.length > 0) {
        setSelectedClass(res.data.classes[0].name);
      }
    } catch {
      // silent
    }
  };

  const loadReport = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setReport(null);
    try {
      const params = new URLSearchParams({
        className: selectedClass,
        month: selectedMonth,
        year: selectedYear,
      });
      if (selectedSection) params.append("section", selectedSection);

      const res = await api.get(`/attendance/monthly-report?${params}`);
      setReport(res.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const classes = settings?.classes || [];
  const sections = settings?.sections || [];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const exportCSV = () => {
    if (!report?.students?.length) return;
    const headers = ["Roll", "Student ID", "Name", "Total Days", "Present", "Absent", "Late", "Leave", "Percentage %"];
    const rows = report.students.map((s) => [
      s.student?.roll || "",
      s.student?.studentId || "",
      s.student?.name || "",
      s.totalDays,
      s.present,
      s.absent,
      s.late,
      s.leave,
      s.percentage,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${selectedClass}-${monthNames[selectedMonth - 1]}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-slate-800">Attendance Report</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monthly attendance summary by class</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
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
                {monthNames.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
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
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={loadReport}
                disabled={loading}
                className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Loading...</>
                ) : (
                  <><BarChart3 className="w-4 h-4" /> Generate</>
                )}
              </button>
              {report?.students?.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Report Results */}
        {report && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 border border-blue-200 bg-blue-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Students</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{report.students?.length || 0}</p>
              </div>
              <div className="rounded-xl p-4 border border-indigo-200 bg-indigo-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Working Days</p>
                <p className="text-2xl font-bold text-indigo-800 mt-1">{report.totalWorkingDays || 0}</p>
              </div>
              <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">
                  {report.students?.length > 0
                    ? (report.students.reduce((sum, s) => sum + s.percentage, 0) / report.students.length).toFixed(1) + "%"
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl p-4 border border-amber-200 bg-amber-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Period</p>
                <p className="text-lg font-bold text-amber-800 mt-1">{monthNames[selectedMonth - 1]} {selectedYear}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-bold text-slate-800">
                  {selectedClass}{selectedSection ? " / " + selectedSection : ""} — {monthNames[selectedMonth - 1]} {selectedYear}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Roll</th>
                      <th className="px-5 py-3 font-semibold">Student</th>
                      <th className="px-5 py-3 font-semibold text-center">Total</th>
                      <th className="px-5 py-3 font-semibold text-center">Present</th>
                      <th className="px-5 py-3 font-semibold text-center">Absent</th>
                      <th className="px-5 py-3 font-semibold text-center">Late</th>
                      <th className="px-5 py-3 font-semibold text-center">Leave</th>
                      <th className="px-5 py-3 font-semibold text-center">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.students?.map((s, i) => (
                      <tr key={s.student?._id || i} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3 font-mono text-gray-500">{s.student?.roll || "—"}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-700">{s.student?.name}</p>
                          <p className="text-xs text-gray-400">{s.student?.studentId}</p>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-600 font-semibold">{s.totalDays}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-emerald-600 font-bold">{s.present}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`font-bold ${s.absent > 0 ? "text-red-600" : "text-gray-400"}`}>{s.absent}</span>
                        </td>
                        <td className="px-5 py-3 text-center text-amber-600 font-semibold">{s.late}</td>
                        <td className="px-5 py-3 text-center text-blue-600 font-semibold">{s.leave}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            s.percentage >= 90 ? "bg-emerald-100 text-emerald-700"
                              : s.percentage >= 75 ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {s.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {report.students?.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-gray-400 text-sm">No attendance data for this period</p>
                </div>
              )}
            </div>
          </>
        )}

        {!report && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">Select filters and click Generate</p>
          </div>
        )}
      </div>
    </div>
  );
}
