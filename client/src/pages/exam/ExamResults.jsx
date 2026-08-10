import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import ReportCard from "../../components/exam/ReportCard";
import { Download, Printer } from "lucide-react";

const ExamResults = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [examId, setExamId] = useState("");
  const [className, setClassName] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [printAll, setPrintAll] = useState(false);
  const printTimeoutRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get("/exams"),
      api.get("/settings"),
    ]).then(([examRes, settingsRes]) => {
      setExams(examRes.data.exams || []);
      setSystemSettings(settingsRes.data);
    }).catch(() => setToast({ message: "Failed to load exams.", type: "error" }));
  }, []);

  useEffect(() => {
    const afterPrint = () => {
      setPrintAll(false);
    };
    window.addEventListener("afterprint", afterPrint);
    return () => {
      if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const loadResults = async (eId, cls) => {
    if (!eId || !cls) return;
    setLoading(true);
    try {
      const res = await api.get(`/exams/${eId}/results?className=${encodeURIComponent(cls)}`);
      const results = (res.data.results || []).slice().sort((a, b) =>
        String(a.studentId).localeCompare(String(b.studentId), undefined, { numeric: true, sensitivity: "base" })
      );
      setResults({ ...res.data, results });
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to load results.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (v) => {
    setExamId(v);
    setResults(null);
    if (v && className) loadResults(v, className);
  };

  const handleClassChange = (v) => {
    setClassName(v);
    setResults(null);
    if (examId && v) loadResults(examId, v);
  };

  const viewReportCard = (studentId) => {
    navigate(`/exam/report-card?examId=${examId}&studentId=${studentId}`);
  };

  const viewResultSheet = () => {
    navigate(`/exam/result-sheet?examId=${examId}&className=${encodeURIComponent(className)}`);
  };

  const handlePublish = async (published) => {
    try {
      await api.post(`/exams/${examId}/results/publish`, { className, published });
      setToast({ message: `Results ${published ? "published" : "unpublished"}`, type: "success" });
      loadResults(examId, className);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to update.", type: "error" });
    }
  };

  const downloadExcel = async () => {
    if (!examId || !className) return;
    try {
      const res = await api.get(`/exams/${examId}/results/export`, {
        params: { className },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${results?.exam?.examName || "Exam"}_${className}_Result.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setToast({ message: "Failed to download Excel.", type: "error" });
    }
  };

  const handlePrintAll = () => {
    if (!results?.results?.length) return;
    setPrintAll(true);
    requestAnimationFrame(() => {
      printTimeoutRef.current = setTimeout(() => window.print(), 500);
    });
  };

  const passCount = results?.results?.filter((r) => r.status === "Pass").length || 0;
  const totalCount = results?.results?.length || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Exam Results</h1>
        <p className="text-sm text-gray-500 mt-1">View results, merit list, and report cards</p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

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
          {results && (
            <div className="flex items-end gap-2">
              <button onClick={downloadExcel} disabled={totalCount === 0}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button onClick={handlePrintAll} disabled={totalCount === 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" />
                Print All
              </button>
            </div>
          )}
        </div>
        {results && (
          <div className="flex gap-2 mt-4">
            <button onClick={viewResultSheet} disabled={totalCount === 0}
              className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
              Result Sheet
            </button>
            <button onClick={() => handlePublish(true)} disabled={totalCount === 0}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
              Publish
            </button>
            <button onClick={() => handlePublish(false)} disabled={totalCount === 0}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50">
              Unpublish
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : results ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-800">{results.exam.examName} — {results.className}</h2>
              <p className="text-sm text-gray-500">{totalCount} students • {passCount} passed • {totalCount - passCount} failed</p>
            </div>
            <div className="text-xs text-gray-400">{results.results.filter((r) => r.resultPublished).length} published</div>
          </div>
          {totalCount === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🎓</p>
              <p className="text-gray-400 text-sm">No results yet for this exam and class. Enter marks first.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Serial</th>
                    <th className="px-4 py-3 font-semibold min-w-[200px]">Student</th>
                    <th className="px-3 py-3 font-semibold text-center">Obtained</th>
                    <th className="px-3 py-3 font-semibold text-center">%</th>
                    <th className="px-3 py-3 font-semibold text-center">GPA</th>
                    <th className="px-3 py-3 font-semibold text-center">Grade</th>
                    <th className="px-3 py-3 font-semibold text-center">Status</th>
                    <th className="px-3 py-3 font-semibold text-center">Published</th>
                    <th className="px-3 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.results.map((r, index) => (
                    <tr key={r._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-500">{index + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {r.student?.photo ? (
                            <img src={r.student.photo} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {r.studentName?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{r.studentName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-400">{r.studentId}</p>
                              {r.isHifz && (
                                <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wide">Hifz</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold">{r.totalObtained}/{r.totalFullMarks}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{r.percentage}%</td>
                      <td className="px-3 py-2.5 text-center font-bold text-indigo-700">{r.gpa.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">{r.grade}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === "Pass" ? "bg-emerald-50 text-emerald-700" : r.status === "Absent" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-sm ${r.resultPublished ? "text-emerald-600" : "text-gray-300"}`}>
                          {r.resultPublished ? "✓" : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => viewReportCard(r.student?._id || r.studentId)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition">
                          Report Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400 text-sm">Select an exam and class to view results.</p>
        </div>
      )}

      {/* Print All Overlay */}
      {printAll && results?.results?.length > 0 && (
        <div className="print-all print-only">
          {results.results.map((r) => (
            <ReportCard
              key={r._id}
              data={{ exam: results.exam, student: r.student, result: r }}
            />
          ))}
        </div>
      )}

      {/* Print styles */}
      <style>
        {`
          .print-only {
            display: none;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          @media print {
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: white;
            }

            body * {
              visibility: hidden;
            }

            .print-all, .print-all * {
              visibility: visible;
            }

            .print-all {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }

            .print-all .report-card {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              page-break-after: always;
              page-break-inside: avoid;
              box-shadow: none !important;
              border: none !important;
            }

            .print-all .report-card:last-child {
              page-break-after: auto;
            }

            .no-print {
              display: none !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            .report-card .grid {
              display: grid !important;
            }

            .report-card .grid-cols-12 {
              grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
            }

            .report-card .grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }

            .report-card .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            .report-card .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            .report-card .col-span-3 {
              grid-column: span 3 / span 3 !important;
            }

            .report-card .col-span-9 {
              grid-column: span 9 / span 9 !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ExamResults;
