import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";

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
  const totalCount = rows.length;
  const passCount = rows.filter((r) => r.result?.status === "Pass").length;

  return (
    <div className="p-6 max-w-full mx-auto">
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
        <div className="text-center border-b-2 border-[#07153B] pb-4 mb-5">
          <h1 className="text-3xl font-black uppercase tracking-wide text-[#07153B]">Ruhama United School</h1>
          <p className="text-sm text-slate-600 mt-1">Change Yourself, Decorate The World</p>
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <span className="px-5 py-1.5 bg-[#07153B] text-white rounded-full text-sm font-bold uppercase tracking-wide">{exam.examName} — Result</span>
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold">{className}</span>
            <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">Session: {exam.academicSession}</span>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Total Students: {totalCount} • Passed: {passCount} • Failed: {totalCount - passCount}
          </p>
        </div>

        {/* Marks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-slate-800 border-collapse">
            <thead>
              <tr className="bg-[#07153B] text-white">
                <th className="px-3 py-2.5 border border-slate-300 font-bold text-center">Serial</th>
                <th className="px-3 py-2.5 border border-slate-300 font-bold text-left min-w-[100px]">ID</th>
                <th className="px-3 py-2.5 border border-slate-300 font-bold text-left min-w-[180px]">Name</th>
                <th className="px-2 py-2.5 border border-slate-300 font-bold text-center">Hifz</th>
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
                <th className="px-2 py-2.5 border border-slate-300 font-bold text-center">Result</th>
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
                    <td className="px-2 py-2 border border-slate-300 text-center">
                      {row.isHifz ? (
                        <span className="inline-block w-4 h-4 rounded-sm bg-teal-600 text-white text-[10px] leading-4 font-bold">✓</span>
                      ) : (
                        <span className="inline-block w-4 h-4 rounded-sm border border-slate-300" />
                      )}
                    </td>
                    {subjects.map((sub) => {
                      const m = row.markMap[String(sub._id)];
                      const val = m?.obtainedMarks;
                      const isEmpty = val === "" || val === null || val === undefined;
                      const fail = m?.status === "Fail";
                      return (
                        <td key={sub._id} className="px-2 py-2 border border-slate-300 text-center">
                          {isEmpty ? (
                            <span className="text-slate-300">—</span>
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
                    <td className="px-2 py-2 border border-slate-300 text-center font-bold text-indigo-700">{r ? r.gpa.toFixed(2) : "—"}</td>
                    <td className="px-2 py-2 border border-slate-300 text-center">
                      {r ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === "Pass" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {r.grade}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 border border-slate-300 text-center">
                      {r ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === "Pass" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {r.status}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Signature */}
        <div className="flex justify-between mt-10 px-6">
          <div className="text-center">
            <div className="w-44 border-b border-slate-700" />
            <p className="mt-1.5 text-sm font-semibold text-slate-600">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-700" />
            <p className="mt-1.5 text-sm font-semibold text-slate-600">Guardian</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-slate-700" />
            <p className="mt-1.5 text-sm font-semibold text-slate-600">Principal</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-6 text-center">
          Hifz students are assessed on their entered subjects only. "—" = not entered. "N/A" = result not submitted.
        </p>
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
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }

            .no-print {
              display: none !important;
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
