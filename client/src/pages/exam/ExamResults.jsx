import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import Toast from "../../components/Toast";
import logo from "../../assets/logo.png";
import { QRCodeSVG } from "qrcode.react";

const ResultCard = ({ data, onClose, onPrint, isPrinting }) => {
  const { exam, student, result } = data;
  const isFail = result.status === "Fail";
  const entries = result.entries || [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="my-8 w-full max-w-[210mm] print:max-w-none" onClick={(e) => e.stopPropagation()}>
        {/* ACTION BUTTONS */}
        <div className="no-print flex items-center justify-between px-6 py-4 mb-4 bg-white rounded-2xl shadow-lg">
          <h2 className="text-lg font-bold text-slate-800">Report Card</h2>
          <div className="flex gap-2">
            <button onClick={onPrint} disabled={isPrinting} className="px-4 py-2 bg-indigo-700 text-white rounded-xl text-sm font-semibold hover:bg-indigo-800 transition disabled:opacity-50">
              🖨 Print
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
              Close
            </button>
          </div>
        </div>

        {/* REPORT CARD */}
        <div
          id="report-card"
          className="bg-white shadow-xl mx-auto overflow-hidden w-full max-w-[210mm] print:w-[210mm] print:shadow-none print:border-none"
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-6 py-4 flex justify-center items-center">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
                <img src={logo} alt="School Logo" className="w-14 h-14 object-contain" />
              </div>
              <div>
                <h1 className="text-center text-2xl font-black uppercase tracking-wide">Ruhama United School</h1>
                <p className="text-center text-sm text-yellow-300 font-medium">Change Yourself, Decorate The World</p>
                <p className="text-center text-xs text-white/70">An English Version School with Tahfizul Quran</p>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-4 relative">
            {/* Watermark Logo */}
            <img
              src={logo}
              alt=""
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] opacity-[0.04] pointer-events-none select-none"
            />

            {/* EXAM BADGE */}
            <div className="relative flex justify-center">
              <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide shadow-md">
                {exam.examName} — Result Sheet
              </div>
            </div>
            <p className="relative text-center text-xs text-slate-500 mt-1.5 mb-4">Academic Session: {exam.academicSession}</p>

            {/* STUDENT INFO */}
            <div className="relative grid grid-cols-12 gap-5">
              <div className="col-span-3">
                <div className="bg-gradient-to-b from-slate-50 to-white border rounded-2xl p-4 shadow-sm">
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-full aspect-[3/4] object-cover rounded-xl border-4 border-slate-200"
                    />
                  ) : (
                    <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-6xl bg-slate-50">
                      👤
                    </div>
                  )}
                  <div className="mt-3 bg-indigo-700 text-white rounded-lg py-2 text-center font-bold tracking-wider text-sm">
                    {student.studentId}
                  </div>
                </div>
              </div>

              <div className="col-span-9">
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-black text-[#07153B]">{student.name}</h2>
                      <p className="text-sm text-slate-500">Student Profile</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full font-bold text-sm ${isFail ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {isFail ? "❌ Failed" : "✅ Passed"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-5">
                    <InfoItem label="Student ID" value={student.studentId} />
                    <InfoItem label="Class" value={`${student.className} • Section ${student.section}`} />
                    <InfoItem label="Roll" value={student.roll} />
                    <InfoItem label="GPA" value={isFail ? "0.00" : result.gpa.toFixed(2)} />
                  </div>
                </div>
              </div>
            </div>

            {/* MARKS TABLE */}
            <div className="relative mt-4 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-5 py-2.5">
                <h2 className="text-lg font-bold">📊 Marks Sheet</h2>
              </div>
              <div className="bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left text-xs text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5 font-bold text-slate-600">Subject</th>
                      <th className="px-3 py-2.5 text-center font-bold text-slate-600">Full</th>
                      <th className="px-3 py-2.5 text-center font-bold text-slate-600">Obtained</th>
                      <th className="px-3 py-2.5 text-center font-bold text-slate-600">Grade</th>
                      <th className="px-3 py-2.5 text-center font-bold text-slate-600">Point</th>
                      <th className="px-3 py-2.5 text-center font-bold text-slate-600">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((e, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-medium text-[#07153B]">{e.subjectName}</td>
                        <td className="px-3 py-2.5 text-center text-slate-500">{e.fullMarks}</td>
                        <td className="px-3 py-2.5 text-center font-semibold text-[#07153B]">{e.obtainedMarks}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${e.status === "Fail" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {e.grade}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold">{e.gradePoint.toFixed(1)}</td>
                        <td className={`px-3 py-2.5 text-center font-bold ${e.status === "Fail" ? "text-red-600" : "text-emerald-600"}`}>
                          {e.status}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-4 py-3 text-[#07153B]">Total</td>
                      <td className="px-3 py-3 text-center text-slate-500">{result.totalFullMarks}</td>
                      <td className="px-3 py-3 text-center text-[#07153B]">{result.totalObtained}</td>
                      <td className="px-3 py-3 text-center text-[#07153B]" colSpan="2">{result.percentage}%</td>
                      <td className={`px-3 py-3 text-center ${isFail ? "text-red-600" : "text-emerald-600"}`}>{result.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="relative mt-4 grid grid-cols-4 gap-4">
              <SummaryCard label="GPA" value={isFail ? "0.00" : result.gpa.toFixed(2)} color={isFail ? "text-red-600" : "text-indigo-700"} />
              <SummaryCard label="Grade" value={result.grade || "—"} color={isFail ? "text-red-600" : "text-emerald-600"} />
              <SummaryCard label="Division" value={result.division || "—"} color="text-indigo-700" />
              <SummaryCard label="Percentage" value={`${result.percentage}%`} color="text-[#07153B]" />
            </div>

            {/* QR + VERIFICATION */}
            <div className="relative mt-4 grid grid-cols-3 gap-6 items-center">
              <div className="border rounded-2xl p-3 text-center bg-slate-50">
                <div className="flex justify-center">
                  <QRCodeSVG
                    value={JSON.stringify({
                      id: student.studentId,
                      name: student.name,
                      class: student.className,
                      session: exam.academicSession,
                      gpa: isFail ? "0.00" : result.gpa.toFixed(2),
                    })}
                    size={110}
                    includeMargin
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 font-medium">🔍 Scan for Verification</p>
              </div>

              <div className="flex flex-col justify-center items-center text-center">
                <p className={`text-6xl font-black ${isFail ? "text-red-500" : "text-emerald-500"}`}>
                  {isFail ? "❌" : "✅"}
                </p>
                <p className={`mt-2 text-2xl font-black tracking-wide ${isFail ? "text-red-600" : "text-emerald-600"}`}>
                  {isFail ? "FAILED" : "PASSED"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Final Result</p>
              </div>

              <div className="border-2 border-dashed rounded-full w-36 h-36 mx-auto flex flex-col items-center justify-center text-center">
                <p className="text-sm font-bold text-slate-400">Official Seal</p>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="relative mt-6 grid grid-cols-3 gap-8">
              <SignatureCard title="Class Teacher" />
              <SignatureCard title="Guardian" />
              <SignatureCard title="Principal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="mt-0.5 text-base font-bold text-[#07153B] break-words">{value || "—"}</p>
  </div>
);

const SummaryCard = ({ label, value, color }) => (
  <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
    <p className="text-[10px] text-slate-400 uppercase font-medium tracking-wide">{label}</p>
    <p className={`mt-1 text-2xl font-black ${color}`}>{value || "—"}</p>
  </div>
);

const SignatureCard = ({ title }) => (
  <div className="text-center">
    <div className="h-10 border-b-2 border-dashed border-slate-300 mx-4" />
    <p className="mt-1.5 text-sm font-semibold text-slate-600">{title}</p>
  </div>
);

const ExamResults = () => {
  const [exams, setExams] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [examId, setExamId] = useState("");
  const [className, setClassName] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewCard, setViewCard] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
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
    return () => {
      if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
    };
  }, []);

  const loadResults = async (eId, cls) => {
    if (!eId || !cls) return;
    setLoading(true);
    try {
      const res = await api.get(`/exams/${eId}/results?className=${encodeURIComponent(cls)}`);
      setResults(res.data);
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

  const viewReportCard = async (studentId) => {
    try {
      const res = await api.get(`/exams/${examId}/results/student/${studentId}`);
      setViewCard(res.data);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to load report card.", type: "error" });
    }
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

  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 400);
    });
  };

  useEffect(() => {
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

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
                    <th className="px-4 py-3 font-semibold">#</th>
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
                  {results.results.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-2.5 font-bold text-slate-500">{r.position}</td>
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
                            <p className="text-xs text-gray-400">Roll {r.roll} • {r.studentId}</p>
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === "Pass" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-sm ${r.resultPublished ? "text-emerald-600" : "text-gray-300"}`}>
                          {r.resultPublished ? "✓" : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button onClick={() => viewReportCard(r.student._id)}
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

      {/* Report Card Modal */}
      {viewCard && (
        <ResultCard
          data={viewCard}
          onClose={() => setViewCard(null)}
          onPrint={handlePrint}
          isPrinting={isPrinting}
        />
      )}

      {/* Print styles */}
      <style>
        {`
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
              overflow: hidden;
            }

            body * {
              visibility: hidden;
            }

            #report-card, #report-card * {
              visibility: visible;
            }

            #report-card {
              position: fixed;
              left: 0;
              top: 0;
              width: 210mm;
              min-height: 297mm;
              overflow: hidden;
              page-break-after: avoid;
              page-break-inside: avoid;
              margin: 0;
              padding: 0;
              background: white;
              box-shadow: none !important;
              border: none !important;
            }

            .no-print {
              display: none !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            .bg-gradient-to-r,
            .bg-indigo-700,
            .bg-green-100,
            .bg-red-100,
            .bg-slate-50,
            .bg-white {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            #report-card .grid {
              display: grid !important;
            }

            #report-card .grid-cols-12 {
              grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
            }

            #report-card .grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            }

            #report-card .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            #report-card .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            #report-card .col-span-3 {
              grid-column: span 3 / span 3 !important;
            }

            #report-card .col-span-9 {
              grid-column: span 9 / span 9 !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ExamResults;
