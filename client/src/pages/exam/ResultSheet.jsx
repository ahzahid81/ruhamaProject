import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import logo from "../../assets/logo.png";
import { getRemark } from "../../lib/remarks";

const GRADING_SYSTEM = [
  { grade: "A+", range: "80 - 100", point: "5.00" },
  { grade: "A", range: "70 - 79", point: "4.00" },
  { grade: "A-", range: "60 - 69", point: "3.50" },
  { grade: "B", range: "50 - 59", point: "3.00" },
  { grade: "C", range: "40 - 49", point: "2.00" },
  { grade: "D", range: "33 - 39", point: "1.00" },
  { grade: "F", range: "00 - 32", point: "0.00" },
];

const ResultSheet = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId");
  const className = searchParams.get("className");
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const printTimeoutRef = useRef(null);

  useEffect(() => {
    if (!examId || !className) return;
    let active = true;
    Promise.all([
      api.get(`/exams/${examId}/students?className=${encodeURIComponent(className)}`),
      api.get(`/exams/${examId}/results?className=${encodeURIComponent(className)}`),
    ])
      .then(([studentsRes, resultsRes]) => {
        if (!active) return;
        const students = (studentsRes.data.students || [])
          .slice()
          .sort((a, b) =>
            String(a.studentCode).localeCompare(String(b.studentCode), undefined, { numeric: true, sensitivity: "base" })
          );
        const results = resultsRes.data.results || [];
        const exam = resultsRes.data.exam || studentsRes.data.exam;
        const subjects = studentsRes.data.subjects || resultsRes.data.subjects || [];

        const resultMap = {};
        results.forEach((r) => {
          if (r.student?._id) resultMap[r.student._id.toString()] = r;
        });

        const rows = students.map((s, idx) => {
          const r = resultMap[String(s.studentId)] || null;
          const markMap = {};
          (s.marks || []).forEach((m) => {
            markMap[String(m.subjectId)] = m;
          });
          return {
            serial: idx + 1,
            studentId: s.studentCode,
            name: s.name,
            isHifz: !!s.isHifz,
            markMap,
            result: r,
          };
        });

        setData({ exam, subjects, rows });
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "Failed to load result sheet.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [examId, className]);

  useEffect(() => {
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      printTimeoutRef.current = setTimeout(() => window.print(), 400);
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-400 text-sm">{error || "Result sheet not found."}</p>
          <button onClick={() => navigate(-1)} className="mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { exam, subjects, rows } = data;

  const GRADE_ORDER = ["A+", "A", "A-", "B", "C", "D", "F"];
  const gradeCounts = {};
  GRADE_ORDER.forEach((g) => {
    gradeCounts[g] = 0;
  });
  rows.forEach((row) => {
    const g = row.result?.grade;
    if (g && g in gradeCounts) gradeCounts[g] += 1;
  });

  return (
    <div className="result-sheet-page p-6 max-w-full mx-auto">
      {/* ACTION BUTTONS */}
      <div className="no-print flex items-center justify-between px-6 py-4 mb-4 bg-white rounded-2xl shadow-lg">
        <h2 className="text-lg font-bold text-slate-800">Result Sheet — {className}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="px-4 py-2 bg-indigo-700 text-white rounded-xl text-sm font-semibold hover:bg-indigo-800 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? "Printing..." : "Print"}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* RESULT SHEET */}
      <div className="result-sheet bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print:rounded-none print:border-0 print:shadow-none print:p-4">
        {/* Sheet Header */}
        <div className="bg-gradient-to-r from-[#07153B] via-[#12308F] to-[#07153B] rounded-2xl px-6 py-5 text-center relative overflow-hidden">
          <div className="pointer-events-none select-none absolute -top-16 -left-16 w-56 h-56 bg-white/5 rounded-full" />
          <div className="pointer-events-none select-none absolute -bottom-20 -right-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="relative flex items-center justify-center gap-5">
            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center flex-shrink-0 ring-4 ring-yellow-400/40">
              <img src={logo} alt="School Logo" className="w-16 h-16 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow">Ruhama United School</h1>
              <p className="text-sm text-yellow-300 mt-1 font-medium">Change Yourself, Decorate The World</p>
              <p className="text-sm text-white mt-1 font-medium">An English Version School With Tahfizul Quran</p>
            </div>
          </div>
        </div>

        {/* Exam / Class / Session */}
        <div className="mt-5 text-center">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="px-5 py-1.5 bg-yellow-400 text-[#07153B] rounded-full text-sm font-bold uppercase tracking-wide shadow-md">{exam.examName} — Result</span>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 flex-wrap p-1">
            <span className="px-4 py-1.5 bg-[#07153B]/5 text-[#07153B] ring-1 ring-[#07153B]/20 rounded-full text-sm font-bold">{className}</span>
            <span className="px-4 py-1.5 bg-[#07153B]/5 text-[#07153B] ring-1 ring-[#07153B]/20 rounded-full text-sm font-semibold">Session: {exam.academicSession}</span>
          </div>
          {/* <p className="mt-3 text-[13px] font-semibold text-slate-600">
            Total: {rows.length} &nbsp;•&nbsp; Passed: {passCount} &nbsp;•&nbsp; Failed: {failCount} &nbsp;•&nbsp;{" "}
            {GRADE_ORDER.map((g, i) => (
              <span key={g}>
                {i > 0 && <span className="text-slate-400"> &nbsp;|&nbsp; </span>}
                {g}: {gradeCounts[g]}
              </span>
            ))}
          </p> */}
        </div>

        {/* Marks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-slate-800 border-collapse">
            <thead>
              <tr className="bg-[#07153B] text-white">
                <th className="px-3 py-2.5 border border-slate-300 font-bold text-center">Serial</th>
                <th className="px-3 py-2.5 border border-slate-300 font-bold text-left min-w-[100px]">ID</th>
                <th className="px-3 py-2.5 border border-slate-300 font-bold text-left min-w-[180px]">Name</th>
                {subjects.map((sub) => (
                  <th key={sub._id} className="px-2 py-2.5 border border-slate-300 font-bold text-center">
                    {sub.subjectName}
                    <div className="font-normal text-[10px] text-indigo-200">({sub.fullMarks})</div>
                  </th>
                ))}
                <th className="px-2 py-2.5 border border-slate-300 font-bold text-center">Total</th>
                <th className="px-2 py-2.5 border border-slate-300 font-bold text-center">%</th>
                <th className="px-2 py-2.5 border border-slate-300 font-bold text-center">GPA</th>
                <th className="px-2 py-2.5 border border-slate-300 font-bold text-center">Grade</th>
                <th className="px-2 py-2.5 border border-slate-300 font-bold text-center">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const r = row.result;
                return (
                  <tr key={row.serial} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2 border border-slate-300 text-center font-bold">{row.serial}</td>
                    <td className="px-3 py-2 border border-slate-300">{row.studentId}</td>
                    <td className="px-3 py-2 border border-slate-300 font-semibold">{row.name}</td>

                    {subjects.map((sub) => {
                      const m = row.markMap[String(sub._id)];
                      const val = m?.obtainedMarks;
                      const isEmpty = val === "" || val === null || val === undefined;
                      const fail = m?.status === "Fail";
                      const absent = m?.status === "Absent" || isEmpty;
                      return (
                        <td key={sub._id} className="px-2 py-2 border border-slate-300 text-center">
                          {absent ? (
                            <span className="text-amber-600 font-bold">A</span>
                          ) : (
                            <span className={fail ? "text-red-600 font-semibold" : ""}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 border border-slate-300 text-center font-bold">
                      {r ? `${r.totalObtained}/${r.totalFullMarks}` : "—"}
                    </td>
                    <td className="px-2 py-2 border border-slate-300 text-center">{r ? `${r.percentage}%` : "—"}</td>
                    <td className="px-2 py-2 border border-slate-300 text-center font-bold text-indigo-700">{r ? (r.status === "Absent" ? "—" : r.gpa.toFixed(2)) : "—"}</td>
                    <td className="px-2 py-2 border border-slate-300 text-center">
                      {r ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === "Pass" ? "bg-emerald-50 text-emerald-700" : r.status === "Absent" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                          {r.grade}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 border border-slate-300 text-center">
                      {r ? (
                        <span className="text-xs font-semibold text-slate-700">
                          {r.status === "Absent" ? "Absent" : getRemark(r.percentage)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grade Summary & Grading System */}
        <div className="mt-6 flex items-start justify-between gap-6">
          {/* Grade Summary */}
          <div className="flex-1 min-w-0 overflow-hidden rounded-2xl border border-[#07153B]/20 shadow-lg">
            <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] px-4 py-2.5 text-center">
              <p className="text-white text-sm font-bold tracking-wide uppercase">Grade Summary</p>
            </div>
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Grade</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Students</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Grade</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Students</th>
                </tr>
              </thead>
              <tbody>
                {[0, 2, 4, 6].map((start) => {
                  const g1 = GRADE_ORDER[start];
                  const g2 = GRADE_ORDER[start + 1];
                  return (
                    <tr key={start} className="odd:bg-white even:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm font-bold text-[#07153B]">{g1 || ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm text-slate-700">{g1 ? gradeCounts[g1] : ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm font-bold text-[#07153B]">{g2 || ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm text-slate-700">{g2 ? gradeCounts[g2] : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex-shrink-0 border-2 border-dashed rounded-full w-28 h-28 mx-auto my-auto flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-400">Official Seal</p>
          </div>

          {/* Grading System */}
          <div className="flex-1 min-w-0 overflow-hidden rounded-2xl border border-[#07153B]/20 shadow-lg">
            <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] px-4 py-2.5 text-center">
              <p className="text-white text-sm font-bold tracking-wide uppercase">Grading System</p>
            </div>
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Grade</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Marks</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">GPA</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Grade</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">Marks</th>
                  <th className="border-b border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 text-center">GPA</th>
                </tr>
              </thead>
              <tbody>
                {[0, 2, 4, 6].map((start) => {
                  const r1 = GRADING_SYSTEM[start];
                  const r2 = GRADING_SYSTEM[start + 1];
                  return (
                    <tr key={start} className="odd:bg-white even:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm font-bold text-[#07153B]">{r1 ? r1.grade : ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm text-slate-700">{r1 ? `${r1.range}` : ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm text-slate-700">{r1 ? r1.point : ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm font-bold text-[#07153B]">{r2 ? r2.grade : ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm text-slate-700">{r2 ? `${r2.range}` : ""}</td>
                      <td className="border-b border-slate-100 px-3 py-1 text-center text-sm text-slate-700">{r2 ? r2.point : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature */}
        <div className="flex justify-between mt-10 px-6 pt-5">
          <div className="text-center">
            <div className="w-44 border-b border-slate-700" />
            <p className="mt-1.5 text-sm font-semibold text-slate-600">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-700" />
            <p className="mt-1.5 text-sm font-semibold text-slate-600">Exam Controller</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-700" />
            <p className="mt-1.5 text-sm font-semibold text-slate-600">Principal</p>
          </div>
        </div>

      </div>

      {/* Print styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              background: white;
            }

            body * {
              visibility: hidden;
            }

            .result-sheet, .result-sheet * {
              visibility: visible;
            }

            .result-sheet {
              position: static;
              width: 100%;
              margin: 0;
              padding: 0;
            }

            .no-print {
              display: none !important;
            }

            .result-sheet-page {
              padding: 0 !important;
              margin: 0 !important;
              max-width: none !important;
            }

            /*
              Make the print start at the very top.
              The app chrome (sidebar + topbar + wrappers)
              still reserves layout space, so remove it.
            */

            aside,
            header,
            nav {
              display: none !important;
            }

            main {
              padding: 0 !important;
              margin: 0 !important;
            }

            [class~="md:ml-64"] {
              margin-left: 0 !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            .result-sheet table {
              width: 100% !important;
            }

            .result-sheet th, .result-sheet td {
              page-break-inside: avoid;
            }

            .result-sheet tbody tr {
              page-break-inside: avoid;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ResultSheet;
