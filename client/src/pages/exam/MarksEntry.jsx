import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import Toast from "../../components/Toast";

const GRADE_TABLE = [
  { min: 80, grade: "A+", gradePoint: 5.0 },
  { min: 70, grade: "A", gradePoint: 4.0 },
  { min: 60, grade: "A-", gradePoint: 3.5 },
  { min: 50, grade: "B", gradePoint: 3.0 },
  { min: 40, grade: "C", gradePoint: 2.0 },
  { min: 33, grade: "D", gradePoint: 1.0 },
  { min: 0, grade: "F", gradePoint: 0.0 },
];

const previewGrade = (obtained, passMarks) => {
  if (obtained === "" || obtained === null || obtained === undefined) return null;
  const value = Number(obtained);
  const rule = GRADE_TABLE.find((g) => value >= g.min);
  if (!rule) return { grade: "F", point: 0, pass: false };
  if (rule.grade === "F") return { grade: "F", point: 0, pass: false };
  if (passMarks && value < passMarks) return { grade: "F", point: 0, pass: false };
  return { grade: rule.grade, point: rule.gradePoint, pass: true };
};

const previewSummary = (marks, isHifz) => {
  let total = 0, full = 0, points = 0, entered = 0, hasFail = false, allBlank = true;
  marks.forEach((m) => {
    const raw = m.obtainedMarks;
    const isEmpty = raw === "" || raw === null || raw === undefined;
    if (isEmpty && isHifz) return;
    const value = isEmpty ? 0 : Math.min(Number(raw), m.fullMarks);
    const g = isEmpty ? { grade: "F", point: 0, pass: false } : previewGrade(raw, m.passMarks);
    if (isEmpty) return;
    allBlank = false;
    entered += 1;
    total += value;
    full += Number(m.fullMarks) || 0;
    points += g.point;
    if (!g.pass) hasFail = true;
  });
  const count = isHifz ? entered || 1 : marks.length;
  let gpa = Math.round((points / count) * 100) / 100;
  if (hasFail) gpa = 0;
  const pct = full ? Math.round((total / full) * 1000) / 10 : 0;
  const isAbsent = allBlank && !isHifz && marks.length > 0;
  return { total, full, gpa, pct, hasFail, entered, isAbsent };
};

const MarksEntry = () => {
  const [exams, setExams] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [examId, setExamId] = useState("");
  const [className, setClassName] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRefs = useRef({});

  useEffect(() => {
    Promise.all([
      api.get("/exams"),
      api.get("/settings"),
    ]).then(([examRes, settingsRes]) => {
      setExams(examRes.data.exams || []);
      setSystemSettings(settingsRes.data);
    }).catch(() => {
      setToast({ message: "Failed to load exams.", type: "error" });
    });
  }, []);

  const loadSheet = async (eId, cls) => {
    if (!eId || !cls) return;
    setLoading(true);
    try {
      const res = await api.get(`/exams/${eId}/students?className=${encodeURIComponent(cls)}`);
      const students = (res.data.students || []).slice().sort((a, b) =>
        String(a.studentCode).localeCompare(String(b.studentCode), undefined, { numeric: true, sensitivity: "base" })
      );
      setData({ ...res.data, students });
      setToast({ message: null });
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to load students.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (v) => {
    setExamId(v);
    setData(null);
    if (v && className) loadSheet(v, className);
  };

  const handleClassChange = (v) => {
    setClassName(v);
    setData(null);
    if (examId && v) loadSheet(examId, v);
  };

  const setMark = (studentIdx, subjectIdx, value) => {
    let v = value.replace(/[^0-9.]/g, "");
    const firstDot = v.indexOf(".");
    if (firstDot !== -1) v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
    const students = [...data.students];
    students[studentIdx].marks[subjectIdx].obtainedMarks = v;
    setData({ ...data, students });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const students = data.students.map((s) => ({
        studentId: s.studentId,
        isHifz: !!s.isHifz,
        marks: s.marks.map((m) => ({
          subjectId: m.subjectId,
          obtainedMarks: m.obtainedMarks,
        })),
      }));
      const res = await api.post(`/exams/${examId}/results/save`, {
        className,
        students,
      });
      setToast({ message: res.data.message || "Marks saved successfully.", type: "success" });
      await loadSheet(examId, className);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to save marks.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const gpaColor = (gpa) => {
    if (gpa >= 4) return "text-emerald-700";
    if (gpa >= 3) return "text-blue-700";
    if (gpa >= 2) return "text-amber-700";
    return "text-red-700";
  };

  const focusCell = (si, mi, select) => {
    inputRefs.current[`${si}-${mi}`]?.focus();
    if (select) inputRefs.current[`${si}-${mi}`]?.select?.();
  };

  const toggleHifz = (si) => {
    const students = [...data.students];
    students[si].isHifz = !students[si].isHifz;
    setData({ ...data, students });
  };

  const handleCellKeyDown = (e, si, mi) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      let nextSi = si + 1;
      let nextMi = mi;
      if (nextSi >= data.students.length) {
        nextSi = 0;
        nextMi = mi + 1;
      }
      if (nextMi < data.subjects.length) focusCell(nextSi, nextMi, true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (si > 0) focusCell(si - 1, mi, true);
    }
  };

  const focusedSheetRef = useRef("");
  useEffect(() => {
    if (data) {
      const key = `${examId}|${className}`;
      if (focusedSheetRef.current !== key) {
        focusedSheetRef.current = key;
        focusCell(0, 0);
      }
    }
  }, [data, examId, className]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Marks Entry</h1>
        <p className="text-sm text-gray-500 mt-1">Enter exam marks for students per subject</p>
      </div>

      {toast && toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Selectors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Exam *</label>
            <select value={examId} onChange={(e) => handleExamChange(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition">
              <option value="">Select Exam</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.examName} ({ex.academicSession})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Class *</label>
            <select value={className} onChange={(e) => handleClassChange(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition">
              <option value="">Select Class</option>
              {(systemSettings?.classes || []).map((cls) => (
                <option key={cls.name} value={cls.name}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={saveAll} disabled={saving || !data}
              className="w-full px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Saving..." : data?.students.some((s) => s.saved) ? "Update Marks" : "Save Marks"}
            </button>
          </div>
        </div>
      </div>

      {/* Marks Sheet */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">{data.exam.examName}</h2>
              <p className="text-sm text-gray-500">{data.className} • {data.students.length} students</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                {data.students.filter((s) => s.marks.some((m) => m.obtainedMarks !== "" && m.obtainedMarks !== null && m.obtainedMarks !== undefined)).length}/{data.students.length} students entered
              </span>
              <span className="text-xs text-gray-400">Save anytime — tick Hifz to count only entered subjects; unticked students require all subjects</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold sticky left-0 bg-gray-50 min-w-[200px]">Student</th>
                  <th className="px-3 py-3 font-semibold text-center min-w-[80px]">Hifz</th>
                  {data.subjects.map((sub) => (
                    <th key={sub._id} className="px-3 py-3 font-semibold text-center min-w-[110px]">
                      <div>{sub.subjectName}</div>
                      <div className="font-normal text-[10px] text-gray-400">Full: {sub.fullMarks} / Pass: {sub.passMarks}</div>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold text-center min-w-[120px]">GPA</th>
                  <th className="px-3 py-3 font-semibold text-center min-w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.students.map((student, si) => {
                  const summary = previewSummary(student.marks, student.isHifz);
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-2.5 sticky left-0 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {student.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.studentCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleHifz(si)}
                          title="Hifz student — count only entered subjects"
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mx-auto transition-all ${
                            student.isHifz
                              ? "bg-teal-500 border-teal-500 text-white"
                              : "border-gray-300 text-transparent hover:border-teal-400"
                          }`}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="text-[10px] font-bold mt-0.5 text-teal-600">
                          {student.isHifz ? "Hifz" : ""}
                        </div>
                      </td>
                      {student.marks.map((m, mi) => {
                        const g = previewGrade(m.obtainedMarks, m.passMarks);
                        return (
                          <td key={mi} className="px-2 py-2 text-center">
                            <input
                              ref={(el) => (inputRefs.current[`${si}-${mi}`] = el)}
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              enterKeyHint={si === data.students.length - 1 && mi === data.subjects.length - 1 ? "done" : "next"}
                              value={m.obtainedMarks}
                              onChange={(e) => setMark(si, mi, e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, si, mi)}
                              className={`w-20 text-center border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition ${
                                m.obtainedMarks === "" || m.obtainedMarks === null || m.obtainedMarks === undefined
                                  ? "border-gray-200 bg-gray-50"
                                  : g.pass
                                  ? "border-emerald-200 bg-emerald-50/40"
                                  : "border-red-200 bg-red-50"
                              }`}
                            />
                            <div className={`text-[10px] font-bold mt-0.5 ${g && g.pass ? "text-emerald-600" : "text-red-500"}`}>
                              {g ? g.grade : ""}
                            </div>
                          </td>
                        );
                      })}
                      <td className={`px-3 py-2.5 text-center font-bold ${gpaColor(summary.gpa)}`}>
                        {summary.gpa.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${summary.isAbsent ? "bg-amber-50 text-amber-700" : summary.hasFail ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {summary.isAbsent ? "Absent" : summary.hasFail ? "Fail" : "Pass"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-400 text-sm">Select an exam and class to begin marks entry.</p>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;
