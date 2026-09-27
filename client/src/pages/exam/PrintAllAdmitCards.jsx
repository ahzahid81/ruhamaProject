import { useEffect, useMemo, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import useQuery from "../../hooks/useQuery";
import { useExams } from "../../services/resources";
import AdmitCardPreview from "../../components/exam/AdmitCardPreview";

/* The batch is rendered into a portal that is mounted directly on <body> only
   while printing, so the print flow contains nothing but the cards. The app
   shell (fixed sidebar, sticky topbar, page padding, min-h-screen wrappers)
   can no longer shift a card sideways, add a blank page, or split a page. */
export const PRINT_ROOT_ID = "admit-card-print-root";

const ASSET_TIMEOUT_MS = 8000;

/* Print rules for the bulk page.

   The card box below repeats the same declarations the single Admit Card uses
   in print (AdmitCard.jsx → `#admit-card`: width 210mm, min-height 149mm,
   height auto, overflow visible), so a card printed here has the same size,
   design, spacing, fonts, images, QR and signatures as a single card.
   `position` is the only intentional difference: a single card is taken out of
   the flow (absolute/fixed) because it is the only thing on its page, while in
   a batch the card has to stay in the flow so the surrounding sheet can break
   the page for the next student. */
export const PRINT_ALL_STYLES = `
  @page { size: A4 portrait; margin: 0; }

  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      height: auto !important;
      background: #fff !important;
      overflow: visible !important;
    }

    /* Everything except the print portal leaves the print flow completely. */
    body > *:not(#${PRINT_ROOT_ID}) {
      display: none !important;
    }

    #${PRINT_ROOT_ID} {
      display: block !important;
      position: static !important;
      float: none !important;
      box-sizing: border-box !important;
      width: 210mm !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      overflow: visible !important;
    }

    /* One student per printed page: the sheet is what breaks, the card inside
       it is never resized, repositioned, scaled or split. */
    #${PRINT_ROOT_ID} .admit-card-sheet {
      display: block !important;
      box-sizing: border-box !important;
      width: 210mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      background: #fff !important;
      box-shadow: none !important;
      transform: none !important;
      zoom: 1 !important;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
      break-after: page;
      page-break-after: always;
    }
    #${PRINT_ROOT_ID} .admit-card-sheet:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    /* Identical to the single admit card print box (see AdmitCard.jsx). */
    #${PRINT_ROOT_ID} .admit-card-canvas {
      display: flex !important;
      position: static !important;
      float: none !important;
      box-sizing: border-box !important;
      width: 210mm !important;
      min-height: 149mm !important;
      height: auto !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: #fff !important;
      box-shadow: none !important;
      border: none !important;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Keep background fills, gradients, QR and signature artwork. */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
`;

/* Chrome paints whatever is decoded when the print snapshot is taken, so the
   batch only opens the print dialog once fonts and every student photo are
   ready. A hard timeout keeps the print button responsive if a remote photo
   never resolves. */
const waitForPrintAssets = async () => {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const root = document.getElementById(PRINT_ROOT_ID);
  const images = root ? Array.from(root.querySelectorAll("img")) : [];

  await Promise.all(
    images.map((img) => {
      if (img.complete) return img.decode?.().catch(() => {}) ?? Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })
  );

  await Promise.all(images.map((img) => img.decode?.().catch(() => {}) ?? Promise.resolve()));
};

const nextFrames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const PrintAllAdmitCards = () => {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [printMode, setPrintMode] = useState(false);

  const examsQuery = useExams();
  const exams = useMemo(() => examsQuery.data || [], [examsQuery.data]);

  /* The exam in the URL wins; otherwise the active exam, otherwise the first
     one. Derived instead of stored so the list arriving from the shared cache
     never needs a follow-up state update. */
  const urlExamId = new URLSearchParams(window.location.search).get("examId") || "";
  const [chosenExamId, setChosenExamId] = useState("");
  const selectedExamId = chosenExamId || urlExamId || exams.find((e) => e.isActive)?._id || exams[0]?._id || "";
  const selectedExam = exams.find((e) => e._id === selectedExamId) || null;

  const cardsQuery = useQuery(
    selectedExam ? `payments:admit-card:print-all:${selectedExamId}` : null,
    () =>
      api
        .get(`/payments/admit-card/print-all?examId=${selectedExamId}`)
        .then((res) => {
          const students = res.data?.students || [];
          return { count: res.data?.count || students.length, cards: students.map((s) => ({ student: s })) };
        })
  );

  const cards = useMemo(() => cardsQuery.data?.cards || [], [cardsQuery.data]);
  const count = cardsQuery.data?.count || 0;
  const loading = Boolean(selectedExam) && cardsQuery.loading;

  /* Ctrl+P / browser menu print: mount the print sheets synchronously so Chrome
     snapshots them, and drop them again once the dialog closes. */
  useEffect(() => {
    const onBeforePrint = () => {
      if (cards.length === 0) return;
      flushSync(() => setPrintMode(true));
    };
    const onAfterPrint = () => setPrintMode(false);

    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);

    const printQuery = window.matchMedia?.("print");
    const onPrintMediaChange = (e) => {
      if (!e.matches) onAfterPrint();
    };
    printQuery?.addEventListener?.("change", onPrintMediaChange);

    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      printQuery?.removeEventListener?.("change", onPrintMediaChange);
    };
  }, [cards.length]);

  /* Safety net: never leave the sheets mounted on screen if afterprint is
     missing (some browsers do not fire it), but never tear them down while a
     print is still being produced. */
  useEffect(() => {
    if (!printMode) return;
    const timer = setInterval(() => {
      if (!window.matchMedia?.("print").matches) {
        clearInterval(timer);
        setPrintMode(false);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [printMode]);

  const changeExam = (e) => {
    const value = e.target.value;
    setChosenExamId(value);
    setSearchParams({ examId: value }, { replace: true });
  };

  const handlePrint = async () => {
    // Mount the sheets first, then wait for fonts + photos, then print.
    flushSync(() => setPrintMode(true));
    await Promise.race([
      waitForPrintAssets(),
      new Promise((resolve) => setTimeout(resolve, ASSET_TIMEOUT_MS)),
    ]);
    await nextFrames();
    window.print();
  };

  const exam = selectedExam
    ? { examName: selectedExam.examName, academicSession: selectedExam.academicSession }
    : null;

  const hasCards = !loading && cards.length > 0;

  /* The batch itself — the only thing that reaches the printer. */
  const printSheets =
    printMode && exam
      ? createPortal(
          <div id={PRINT_ROOT_ID}>
            {cards.map(({ student }) => (
              <AdmitCardPreview key={student._id} student={student} exam={exam} bulk />
            ))}
          </div>,
          document.body
        )
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
                  {examsQuery.loading && <option value="">Loading exams...</option>}
                  {!examsQuery.loading && exams.length === 0 && <option value="">No exams found</option>}
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
              <button onClick={handlePrint} disabled={!hasCards || loading}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition text-white font-bold rounded-xl shadow-lg">
                {loading ? "Loading..." : `🖨 Print ${hasCards ? `${cards.length} Card${cards.length !== 1 ? "s" : ""}` : "All"}`}
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              One card per page, identical to the single admit card. In the Chrome print dialog choose
              Destination <span className="font-semibold text-slate-500">Save as PDF</span>, Paper size
              <span className="font-semibold text-slate-500"> A4</span> and Margins
              <span className="font-semibold text-slate-500"> None</span>, then tick
              <span className="font-semibold text-slate-500"> Background graphics</span>.
            </p>
          </div>

          {/* STATUS */}
          {(cardsQuery.error || examsQuery.error) && (
            <div className="no-print mt-6 px-5 py-3 rounded-2xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
              {cardsQuery.error || examsQuery.error}
            </div>
          )}

          {/* CARDS */}
          {examsQuery.loading ? (
            <div className="no-print mt-10 bg-white rounded-3xl shadow-xl p-16 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="no-print mt-10 bg-white rounded-3xl shadow-xl p-16 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-slate-500 font-semibold">No exams found.</p>
              <p className="text-xs text-slate-400 mt-1">Create an exam to print admit cards for it.</p>
            </div>
          ) : loading ? (
            <div className="no-print mt-10 bg-white rounded-3xl shadow-xl p-16 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading eligible students...</p>
            </div>
          ) : !hasCards ? (
            <div className="no-print mt-10 bg-white rounded-3xl shadow-xl p-16 text-center">
              <p className="text-4xl mb-3">🖨️</p>
              <p className="text-slate-500 font-semibold">No eligible students for this exam yet.</p>
              <p className="text-xs text-slate-400 mt-1">Students must clear the exam's required fees before their admit card can be printed.</p>
            </div>
          ) : printMode ? null : (
            /* On-screen preview only. While printing, the identical batch is
               rendered into the print portal instead, so nothing is painted twice. */
            <div className="print-sheets mt-10 space-y-10">
              {cards.map(({ student }) => (
                <AdmitCardPreview key={student._id} student={student} exam={exam} bulk />
              ))}
            </div>
          )}
        </div>
      </div>

      {printSheets}

      {/* PRINT STYLE — one card per page */}
      <style>{PRINT_ALL_STYLES}</style>
    </>
  );
};

export default PrintAllAdmitCards;
