import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api from "../../services/api";
import { bdDate } from "../../utils/bdTime";
import logo from "../../assets/logo.png";

const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

// ==========================================
// NUMBER TO WORDS (BD / Indian numbering)
// ==========================================
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return (TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "")).trim();
}

function threeDigits(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h) out += ONES[h] + " Hundred";
  if (rest) out += (out ? " " : "") + twoDigits(rest);
  return out;
}

function amountInWords(num) {
  const value = Number(num || 0);
  const taka = Math.floor(Math.abs(value));
  const paisa = Math.round((Math.abs(value) - taka) * 100);

  const crore = Math.floor(taka / 10000000);
  const lakh = Math.floor((taka % 10000000) / 100000);
  const thousand = Math.floor((taka % 100000) / 1000);
  const hundred = taka % 1000;

  let words = "";
  if (crore) words += threeDigits(crore) + " Crore";
  if (lakh) words += (words ? " " : "") + twoDigits(lakh) + " Lakh";
  if (thousand) words += (words ? " " : "") + twoDigits(thousand) + " Thousand";
  if (hundred) words += (words ? " " : "") + threeDigits(hundred);
  if (!words) words = "Zero";

  words += " Taka";
  if (paisa) words += " and " + twoDigits(paisa) + " Paisa";
  words += " Only";

  return words;
}

const MonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function PaymentReceipt() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef();

  const stateReceipt = location.state?.receipt;
  const stateStudent = location.state?.student;

  const [payment, setPayment] = useState(null);
  const [items, setItems] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/payments/receipt/${id}`);
        setPayment(res.data.payment || null);
        setItems(res.data.items || []);
        setOpeningBalance(res.data.openingBalance || 0);
        setClosingBalance(res.data.closingBalance || 0);
      } catch {
        if (stateReceipt) {
          setPayment({ ...stateReceipt, studentName: stateStudent?.name, studentId: stateStudent?.studentId, className: stateStudent?.className });
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: payment?.receiptNo || "Receipt",
  });

  const isStudent = !!localStorage.getItem("studentToken") && !localStorage.getItem("teacher");

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isStudent ? "/student-portal" : "/collect-payment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Receipt not found</p>
          <button
            onClick={goBack}
            className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const date = payment.receiveDate || payment.createdAt ? bdDate(payment.receiveDate || payment.createdAt) : bdDate();
  const paid = Number(payment.paidAmount || 0);
  const discount = Number(payment.totalDiscount || 0);
  const fine = Number(payment.totalFine || 0);
  const total = Number(payment.totalAmount || 0);

  const qrData = JSON.stringify({
    receiptNo: payment.receiptNo,
    student: payment.studentName,
    studentId: payment.studentId,
    date,
    amount: paid,
  });

  const session = payment.academicSession || "—";

  return (
    <div className="py-6 px-4">
      {/* ACTION BUTTONS */}
      <div className="no-print print:hidden flex justify-end gap-3 mb-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition"
        >
          Print Receipt
        </button>
      </div>

      {/* RECEIPT — half-height A4 (210mm × 148mm) STUDENT COPY */}
      <div
        ref={receiptRef}
        id="payment-receipt"
        className="bg-white mx-auto w-[210mm] print:w-[210mm] print:shadow-none print:border-none"
      >
        <div className="receipt-card bg-white overflow-hidden w-[210mm] h-[148mm] print:w-[210mm] print:h-[148mm] print:overflow-hidden">
          {/* PREMIUM LIGHT FRAME */}
          <div className="h-full w-full bg-white p-[2.5mm]">
            <div className="h-full w-full border border-neutral-900 rounded-[2mm] overflow-hidden flex flex-col relative bg-white">

              {/* ============ HEADER ============ */}
              <div className="relative bg-white px-5 pt-[3.5mm] pb-[2.5mm] text-neutral-900 border-b-2 border-neutral-900">
                {/* copy tag */}
                <span className="absolute top-[2mm] right-[2.5mm] inline-block bg-white text-neutral-900 text-[6.5px] font-black uppercase tracking-[1.5px] px-1.5 py-[0.5mm] rounded-sm border border-neutral-900 z-10">
                  Student Copy
                </span>

                {/* brand — logo left of text, whole block centered */}
                <div className="relative flex items-center justify-center gap-4">
                  <div className="w-[16mm] h-[16mm] bg-white rounded-full flex items-center justify-center ring-1 ring-neutral-900 flex-shrink-0">
                    <img src={logo} alt="School Logo" className="w-[14mm] h-[14mm] object-contain" />
                  </div>
                  <div className="min-w-0 text-center">
                    <h1 className="text-[22px] leading-tight font-black uppercase tracking-wide">Ruhama United School</h1>
                    <p className="text-[9.5px] text-neutral-500 font-bold tracking-wide leading-tight">
                      ~ Change Yourself, Decorate The World ~
                    </p>
                    <p className="text-[8.5px] text-neutral-600 leading-tight mt-[0.5mm]">
                      An English Version School with Tahfizul Quran
                    </p>
                  </div>
                </div>
              </div>

              {/* thin divider */}
              <div className="h-px w-full bg-neutral-900 flex-shrink-0" />

              {/* ============ META STRIP ============ */}
              <div className="px-[4.5mm] pt-[2mm] flex-shrink-0">
                <div className="flex items-center justify-between rounded-md border border-neutral-900 bg-white px-4 py-[1.4mm]">
                  <span className="inline-flex items-center gap-1.5 text-neutral-900 px-2.5 py-[0.6mm] rounded-full text-[8.5px] font-bold border border-neutral-900">
                    <span className="w-[6px] h-[6px] rounded-full bg-neutral-900" />
                    Payment Successful
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rotate-45 bg-neutral-900" />
                    <h2 className="text-[13px] font-black tracking-[3px] uppercase text-neutral-900">Money Receipt</h2>
                    <span className="w-1.5 h-1.5 rotate-45 bg-neutral-900" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[7px] uppercase tracking-[2px] text-neutral-400 font-semibold">Receipt No</p>
                      <p className="text-[10px] font-mono font-bold tracking-wide leading-tight text-neutral-900">{payment.receiptNo}</p>
                    </div>
                    <div className="h-7 w-px bg-neutral-300" />
                    <div className="text-right">
                      <p className="text-[7px] uppercase tracking-[2px] text-neutral-400 font-semibold">Date</p>
                      <p className="text-[10px] font-bold leading-tight text-neutral-900">{date}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============ BODY ============ */}
              <div className="relative flex-1 px-[4.5mm] pt-[2mm] pb-[1.2mm] min-h-0 flex flex-col">
                {/* Watermark */}
                <img
                  src={logo}
                  alt=""
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110mm] opacity-[0.03] pointer-events-none select-none"
                />

                {/* STUDENT INFO */}
                <div className="relative grid grid-cols-5 gap-[1.5mm] flex-shrink-0">
                  <div className="col-span-2"><Cell label="Student Name" value={payment.studentName} /></div>
                  <Cell label="Student ID" value={payment.studentId} />
                  <Cell label="Class" value={payment.className} />
                  <Cell label="Session" value={session} />
                </div>

                {/* MAIN ROW: fees + payment card */}
                <div className="relative mt-[2mm] grid grid-cols-3 gap-[3mm] flex-1 min-h-0">
                  {/* LEFT: fees */}
                  <div className="col-span-2 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-[1mm] flex-shrink-0">
                      <span className="h-px flex-1 bg-neutral-400" />
                      <h3 className="text-[9px] font-black uppercase tracking-[2px] text-neutral-900">Fee Details</h3>
                      <span className="h-px flex-1 bg-neutral-400" />
                    </div>

                    {items.length > 0 ? (
                      <table className="w-full text-[9.5px]">
                        <thead>
                          <tr className="bg-neutral-100 text-neutral-900">
                            <th className="text-left px-2 py-[0.8mm] text-[7.5px] uppercase tracking-[1.5px] font-bold">Description</th>
                            <th className="text-right px-2 py-[0.8mm] text-[7.5px] uppercase tracking-[1.5px] font-bold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => {
                            const period =
                              item.applicableType === "Month"
                                ? `${MonthNames[(item.month || 1) - 1]} ${item.year || ""}`
                                : item.applicableType === "Exam"
                                ? item.examName
                                : item.customTitle || "";
                            return (
                              <tr key={i} className="border-b border-neutral-200">
                                <td className="px-2 py-[0.6mm] text-neutral-700">
                                  {item.feeName}
                                  {period ? <span className="text-neutral-400"> ({period.trim()})</span> : null}
                                </td>
                                <td className="px-2 py-[0.6mm] text-right font-bold text-neutral-800 whitespace-nowrap">{fmt(item.paidAmount)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="grid grid-cols-3 gap-[1.5mm]">
                        <Cell label="Total Amount" value={fmt(total)} />
                        <Cell label="Amount Paid" value={fmt(paid)} />
                        <Cell label="Date" value={date} />
                      </div>
                    )}

                    {/* SUMMARY */}
                    <div className="mt-[1mm] flex-shrink-0">
                      <table className="w-full text-[10px] border border-neutral-300">
                        <tbody>
                          <tr className="border-b border-neutral-300 bg-white">
                            <td className="px-2 py-[0.7mm] font-bold text-neutral-600">Total Amount</td>
                            <td className="px-2 py-[0.7mm] text-right font-black text-neutral-900">{fmt(total)}</td>
                          </tr>
                          {discount > 0 && (
                            <tr className="border-b border-neutral-300 bg-white">
                              <td className="px-2 py-[0.7mm] text-neutral-600">Discount</td>
                              <td className="px-2 py-[0.7mm] text-right font-semibold text-neutral-600">- {fmt(discount)}</td>
                            </tr>
                          )}
                          {fine > 0 && (
                            <tr className="border-b border-neutral-300 bg-white">
                              <td className="px-2 py-[0.7mm] text-neutral-600">Fine</td>
                              <td className="px-2 py-[0.7mm] text-right font-semibold text-neutral-700">+ {fmt(fine)}</td>
                            </tr>
                          )}
                          {Number(openingBalance) !== 0 && (
                            <tr className="border-b border-neutral-300 bg-white">
                              <td className="px-2 py-[0.7mm] text-neutral-600">Previous Due</td>
                              <td className="px-2 py-[0.7mm] text-right font-semibold text-neutral-700">{fmt(openingBalance)}</td>
                            </tr>
                          )}
                          <tr className="bg-neutral-100 text-neutral-900">
                            <td className="px-2 py-[0.8mm] font-black uppercase tracking-wide text-[9.5px]">Amount Paid</td>
                            <td className="px-2 py-[0.8mm] text-right font-black text-[12px]">{fmt(paid)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                </div>

                  {/* RIGHT: payment card */}
                  <div className="flex flex-col gap-[1.8mm] min-w-0">
                    {/* in words */}
                    <div className="rounded-md bg-white border border-neutral-300 px-2.5 py-[1mm] flex-shrink-0">
                      <p className="text-[7.5px] text-neutral-500 uppercase font-black tracking-[1.5px]">In Words</p>
                      <p className="text-[9px] font-bold text-neutral-900 italic leading-snug">{amountInWords(paid)}</p>
                    </div>

                    {/* payment details */}
                    <div className="rounded-md border border-neutral-300 px-2.5 py-[1mm] flex-1 min-h-0">
                      <div className="flex justify-between items-center border-b border-dashed border-neutral-300 pb-[0.8mm]">
                        <span className="text-[8px] text-neutral-400">Payment Method</span>
                        <b className="text-[9px] text-neutral-800 capitalize">{payment.paymentMethod || "Cash"}</b>
                      </div>
                      {payment.transactionId && (
                        <div className="flex justify-between items-center border-b border-dashed border-neutral-300 py-[0.8mm]">
                          <span className="text-[8px] text-neutral-400">Transaction ID</span>
                          <b className="text-[9px] text-neutral-800 font-mono">{payment.transactionId}</b>
                        </div>
                      )}
                      {payment.referenceNo && (
                        <div className="flex justify-between items-center border-b border-dashed border-neutral-300 py-[0.8mm]">
                          <span className="text-[8px] text-neutral-400">Reference No</span>
                          <b className="text-[9px] text-neutral-800 font-mono">{payment.referenceNo}</b>
                        </div>
                      )}
                      {Number(closingBalance) !== 0 && (
                        <div className="flex justify-between items-center border-b border-dashed border-neutral-300 py-[0.8mm]">
                          <span className="text-[8px] text-neutral-400">Balance After</span>
                          <b className="text-[9px] text-neutral-800">{fmt(closingBalance)}</b>
                        </div>
                      )}
                      {payment.receivedBy?.name && (
                        <div className="flex justify-between items-center pt-[0.8mm]">
                          <span className="text-[8px] text-neutral-400">Received By</span>
                          <b className="text-[9px] text-neutral-800">{payment.receivedBy.name}</b>
                        </div>
                      )}
                    </div>

                    {/* QR */}
                    <div className="rounded-md border-2 border-neutral-900 bg-white py-[1.5mm] flex-shrink-0 flex items-center justify-center">
                      <QRCodeSVG value={qrData} size={96} includeMargin={false} />
                    </div>
                  </div>
                </div>
                {/* SIGNATURES — pinned to bottom of the frame */}
                <div className="relative mt-auto pt-[2mm] grid grid-cols-3 gap-12">
                  <SignatureCard title="Received By" />
                  <SignatureCard title="Authorized Signature" />
                </div>

                {/* FOOTER */}
                <div className="relative flex-shrink-0 flex flex-col items-center pt-[1.5mm]">
                  <span className="h-px w-full bg-neutral-400" />
                  <div className="mt-[1mm] w-full text-center py-[0.8mm] rounded-sm border border-neutral-300 bg-neutral-50 flex items-center justify-center gap-3">
                    <p className="text-[7px] font-bold tracking-[2px] uppercase text-neutral-900">Ruhama United School • {session} Session</p>
                    <span className="text-[7px] text-neutral-500">Computer generated receipt — no signature needed if QR is verified.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT + LAYOUT STYLE */}
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

            #payment-receipt, #payment-receipt * {
                visibility: visible;
            }

            #payment-receipt {
                position: fixed;
                left: 0;
                top: 0;
                width: 210mm;
                overflow: hidden;
                page-break-after: avoid;
                page-break-inside: avoid;
                margin: 0;
                padding: 0;
                background: white;
                box-shadow: none !important;
                border: none !important;
            }

            #payment-receipt .receipt-card {
                width: 210mm;
                height: 148mm;
                max-height: 148mm;
                overflow: hidden;
                page-break-inside: avoid;
                break-inside: avoid;
            }

            .no-print {
                display: none !important;
            }

            #payment-receipt .grid {
                display: grid !important;
            }

            #payment-receipt .grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            #payment-receipt .grid-cols-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            #payment-receipt .grid-cols-5 {
                grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
            }

            #payment-receipt svg {
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
            }

            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
        }
        `}
      </style>
    </div>
  );
}

// ======================================
// COMPACT INFO CELL
// ======================================
const Cell = ({ label, value }) => {
  return (
    <div className="bg-white rounded-md border border-neutral-300 px-2 py-[1mm]">
      <p className="text-[7px] text-neutral-400 font-bold uppercase tracking-[1px]">{label}</p>
      <p className="mt-[0.3mm] text-[10px] font-bold text-neutral-900 break-words truncate">{value || "—"}</p>
    </div>
  );
};

// ======================================
// SIGNATURE CARD
// ======================================
const SignatureCard = ({ title }) => {
  return (
    <div className="text-center">
      <div className="h-[6mm] border-b-[1.5px] border-dotted border-neutral-400 mx-4" />
      <p className="mt-[0.8mm] text-[9px] font-bold uppercase tracking-wide text-neutral-500">{title}</p>
    </div>
  );
};