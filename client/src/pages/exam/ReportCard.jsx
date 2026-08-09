import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import ReportCard from "../../components/exam/ReportCard";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

const ReportCardPage = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId");
  const studentId = searchParams.get("studentId");
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printTimeoutRef = useRef(null);

  useEffect(() => {
    if (!examId || !studentId) return;
    let active = true;
    api
      .get(`/exams/${examId}/results/student/${studentId}`)
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "Failed to load report card.");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [examId, studentId]);

  useEffect(() => {
    return () => {
      if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
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
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-gray-400 text-sm">{error || (!examId || !studentId ? "Missing exam or student." : "Report card not found.")}</p>
          <button onClick={() => navigate(-1)} className="mt-5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[210mm] mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ACTION BUTTONS */}
      <div className="no-print flex items-center justify-between px-6 py-4 mb-4 bg-white rounded-2xl shadow-lg">
        <h2 className="text-lg font-bold text-slate-800">Report Card</h2>
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

      <ReportCard data={data} id="report-card" />

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
              height: 297mm;
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

export default ReportCardPage;
