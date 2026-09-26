import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdmitCardPreview from "../../components/exam/AdmitCardPreview";

// One card per sheet, using the exact same box as the single admit card.
// Exported so the print regression test renders with this same stylesheet.
export const PRINT_ALL_STYLES = `
  .no-print { display: none !important; }
  @page { size: A4 portrait; margin: 0; }

  @media print {
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      overflow: visible;
    }

    body * { visibility: hidden; }
    #print-all-page, #print-all-page * { visibility: visible; }

    #print-all-page {
      position: static !important;
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      background: #fff;
    }

    /* Drop the screen-only page chrome so card 1 starts at the very top of sheet 1 */
    #print-all-page .print-reset {
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      width: auto !important;
    }

    /*
      One card per sheet in normal document flow.
      position:fixed is deliberately NOT used: Chrome repaints a fixed element on
      every sheet, which stacks every card on every page instead of one per page.
    */
    #print-all-page .admit-card-page {
      display: block !important;
      position: static !important;
      width: 210mm !important;
      height: 140mm !important;
      max-height: 140mm !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    #print-all-page .admit-card-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    /* Same canvas box as the single admit card - no size override here */
    #print-all-page .admit-card-canvas {
      display: block !important;
      position: static !important;
      width: 210mm !important;
      height: 140mm !important;
      max-height: 140mm !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      background: #fff;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    #print-all-page .grid { display: grid !important; }
    #print-all-page .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
    #print-all-page .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    #print-all-page .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    #print-all-page .col-span-3 { grid-column: span 3 / span 3 !important; }
    #print-all-page .col-span-9 { grid-column: span 9 / span 9 !important; }
    #print-all-page img { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
    #print-all-page svg { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
    #print-all-page .react-barcode { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
  }
`;

const PrintAllAdmitCards = () => {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(() => new URLSearchParams(window.location.search).get("examId") || "");
  const [cards, setCards] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const selectedExam = exams.find((e) => e._id === selectedExamId) || null;

  useEffect(() => {
    api.get("/exams").then((res) => {
      const list = res.data?.exams || [];
      setExams(list);
      if (list.length > 0) {
        setSelectedExamId((prev) =>
          prev ||
          new URLSearchParams(window.location.search).get("examId") ||
          list.find((e) => e.isActive)?._id ||
          list[0]._id
        );
      }
    }).catch(() => setExams([]));
  }, []);

  const loadCards = useCallback(async () => {
    if (!selectedExamId || !selectedExam) return;
    setLoading(true);
    setCards([]);
    setCount(0);
    try {
      const res = await api.get(`/payments/admit-card/print-all?examId=${selectedExamId}`);
      const students = res.data?.students || [];
      setCount(res.data?.count || students.length);
      setCards(students.map((s) => ({ student: s })));
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed to load eligible students.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [selectedExamId, selectedExam]);

  useEffect(() => {
    if (selectedExamId && selectedExam) loadCards();
  }, [selectedExamId, selectedExam, loadCards]);

  const changeExam = (e) => {
    const value = e.target.value;
    setSelectedExamId(value);
    setSearchParams({ examId: value }, { replace: true });
  };

  const handlePrint = async () => {
    // With 100+ cards, let fonts and layout settle so the whole batch is
    // painted before Chrome opens the print dialog.
    if (document.fonts?.ready) {
      try { await document.fonts.ready; } catch { /* ignore */ }
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    setTimeout(() => { window.print(); }, 300);
  };

  const exam = selectedExam
    ? { examName: selectedExam.examName, academicSession: selectedExam.academicSession }
    : null;

  return (
    <>
      <div id="print-all-page" className="min-h-screen bg-slate-100">
        <div className="no-print bg-gradient-to-r from-[#07153B] to-[#12308F] text-white">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-black">Print All Admit Cards</h1>
                <p className="mt-3 text-white/80 text-lg">Generate admit cards for every eligible student</p>
              </div>
              <button onClick={() => navigate("/exam/admit-card")}
                className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-white/90 text-sm font-semibold transition">
                ← Single Admit Card
              </button>
            </div>
          </div>
        </div>

        <div className="print-reset max-w-7xl mx-auto px-4 py-8">
          {/* TOOLBAR */}
          <div className="bg-white rounded-3xl shadow-xl p-6 no-print">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[300px] flex-1">
                <label className="block text-sm font-bold text-slate-600 mb-2">Select Exam</label>
                <select value={selectedExamId} onChange={changeExam}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition">
                  {exams.length === 0 && <option value="">No exams found</option>}
                  {exams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.examName}{ex.examCode ? ` (${ex.examCode})` : ""} — {ex.academicSession}{ex.isActive ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[220px]">
                <label className="block text-sm font-bold text-slate-600 mb-2">Status</label>
                <div className="px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-semibold text-slate-600">
                  {loading ? "Loading..." : `${count} eligible student${count !== 1 ? "s" : ""}`}
                </div>
              </div>
              <button onClick={handlePrint} disabled={cards.length === 0 || loading}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition text-white font-bold rounded-xl shadow-lg">
                {loading ? "Loading..." : `🖨 Print ${cards.length > 0 ? `${count} Card${count !== 1 ? "s" : ""}` : "All"}`}
              </button>
            </div>
          </div>

          {/* STATUS */}
          {toast && (
            <div className={`mt-6 px-5 py-3 rounded-2xl text-sm font-semibold ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {toast.message}
            </div>
          )}

          {/* CARDS */}
          {loading ? (
            <div className="mt-10 bg-white rounded-3xl shadow-xl p-16 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading eligible students...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="mt-10 bg-white rounded-3xl shadow-xl p-16 text-center">
              <p className="text-4xl mb-3">🖨️</p>
              <p className="text-slate-500 font-semibold">No eligible students for this exam yet.</p>
              <p className="text-xs text-slate-400 mt-1">Students must clear the exam's required fees before their admit card can be printed.</p>
            </div>
          ) : (
            <div className="mt-10 space-y-10 print:mt-0 print:space-y-0">
              {cards.map(({ student }) => (
                <AdmitCardPreview key={student._id} student={student} exam={exam} bulk />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRINT STYLE — one card per page */}
      <style>{PRINT_ALL_STYLES}</style>
    </>
  );
};

export default PrintAllAdmitCards;