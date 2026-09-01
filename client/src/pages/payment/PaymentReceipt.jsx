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

  return (
    <div className="py-6">
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
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
        >
          Print Receipt
        </button>
      </div>

      {/* RECEIPT */}
      <div
        ref={receiptRef}
        id="payment-receipt"
        className="bg-white shadow-xl mx-auto overflow-hidden w-[210mm] min-h-[150mm] print:w-[210mm] print:shadow-none print:border-none"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-6 py-4 flex items-center justify-center">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <img src={logo} alt="School Logo" className="w-14 h-14 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black uppercase tracking-wide">Ruhama United School</h1>
              <p className="text-sm text-yellow-300 font-medium">Change Yourself, Decorate The World</p>
              <p className="text-xs text-white/70">An English Version School with Tahfizul Quran</p>
              <p className="text-xs text-white/70 mt-0.5">Ludhi House-101/102, Road-9, Housing Estate, Amberkhana, Sylhet</p>
            </div>
          </div>
        </div>

        {/* RECEIPT TITLE */}
        <div className="px-8 pt-5 pb-1 text-center">
          <div className="inline-flex items-center gap-3">
            <span className="h-px w-10 bg-emerald-700" />
            <h2 className="text-2xl font-black tracking-[4px] text-[#07153B] uppercase">Money Receipt</h2>
            <span className="h-px w-10 bg-emerald-700" />
          </div>
        </div>

        {/* BODY */}
        <div className="px-8 py-4">
          <div className="relative">
            {/* Watermark */}
            <img
              src={logo}
              alt=""
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] opacity-[0.04] pointer-events-none select-none"
            />

            {/* RECEIPT META */}
            <div className="flex justify-between items-center mb-4">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
                Payment Successful
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Receipt No</p>
                <p className="text-sm font-mono font-bold text-[#07153B]">{payment.receiptNo}</p>
              </div>
            </div>

            {/* STUDENT INFO */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-5 py-2">
                <h3 className="text-sm font-bold">Student Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 bg-white">
                <InfoItem label="Student Name" value={payment.studentName} />
                <InfoItem label="Student ID" value={payment.studentId} />
                <InfoItem label="Class" value={payment.className} />
                <InfoItem label="Date" value={date} />
              </div>
            </div>

            {/* FEE BREAKDOWN */}
            <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-5 py-2">
                <h3 className="text-sm font-bold">Fee Details</h3>
              </div>
              {items.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, i) => {
                      const period =
                        item.applicableType === "Month"
                          ? `${MonthNames[(item.month || 1) - 1]} ${item.year || ""}`
                          : item.applicableType === "Exam"
                          ? item.examName
                          : item.customTitle || "";
                      return (
                        <tr key={i}>
                          <td className="px-4 py-1.5 text-slate-700">
                            {item.feeName}
                            {period ? <span className="text-slate-400"> ({period.trim()})</span> : null}
                          </td>
                          <td className="px-4 py-1.5 text-right font-bold text-slate-800">{fmt(item.paidAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200">
                      <td className="px-4 py-2 font-bold text-slate-700">Total</td>
                      <td className="px-4 py-2 text-right font-black text-[#07153B]">{fmt(total)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td className="px-4 py-1.5 text-slate-600">Discount</td>
                        <td className="px-4 py-1.5 text-right font-semibold text-green-700">- {fmt(discount)}</td>
                      </tr>
                    )}
                    {fine > 0 && (
                      <tr>
                        <td className="px-4 py-1.5 text-slate-600">Fine</td>
                        <td className="px-4 py-1.5 text-right font-semibold text-red-600">{fmt(fine)}</td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-4 py-2 font-black text-[#07153B]">Amount Paid</td>
                      <td className="px-4 py-2 text-right font-black text-emerald-700">{fmt(paid)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="p-4 grid grid-cols-2 gap-3">
                  <InfoItem label="Total Amount" value={fmt(total)} />
                  <InfoItem label="Amount Paid" value={fmt(paid)} />
                  {discount > 0 && <InfoItem label="Discount" value={fmt(discount)} />}
                  {fine > 0 && <InfoItem label="Fine" value={fmt(fine)} />}
                </div>
              )}
            </div>

            {/* AMOUNT IN WORDS */}
            <div className="mt-4 flex justify-between items-center gap-4 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-3">
              <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wide flex-shrink-0">In Words</span>
              <span className="text-sm font-bold text-[#07153B] italic text-right">{amountInWords(paid)}</span>
            </div>

            {/* PAYMENT METHOD + QR */}
            <div className="mt-4 grid grid-cols-3 gap-6 items-center">
              <div className="space-y-2 text-sm col-span-2">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                  <span className="text-gray-400">Payment Method</span>
                  <b className="text-slate-800">{payment.paymentMethod || "Cash"}</b>
                </div>
                {payment.transactionId && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span className="text-gray-400">Transaction ID</span>
                    <b className="text-slate-800">{payment.transactionId}</b>
                  </div>
                )}
                {payment.referenceNo && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span className="text-gray-400">Reference No</span>
                    <b className="text-slate-800">{payment.referenceNo}</b>
                  </div>
                )}
                {Number(openingBalance) !== 0 && (
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <span className="text-gray-400">Opening Balance</span>
                    <b className="text-slate-800">{fmt(openingBalance)}</b>
                  </div>
                )}
                {Number(closingBalance) !== 0 && (
                  <div className="flex justify-between pb-1.5">
                    <span className="text-gray-400">Closing Balance</span>
                    <b className="text-slate-800">{fmt(closingBalance)}</b>
                  </div>
                )}
                {payment.receivedBy?.name && (
                  <div className="flex justify-between pb-1.5">
                    <span className="text-gray-400">Received By</span>
                    <b className="text-slate-800">{payment.receivedBy.name}</b>
                  </div>
                )}
              </div>

              {/* QR CODE */}
              <div className="border rounded-2xl p-3 text-center bg-slate-50">
                <div className="flex justify-center">
                  <QRCodeSVG value={qrData} size={105} includeMargin />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500 font-medium">Scan for Verification</p>
              </div>
            </div>

            {/* SIGNATURES */}
            <div className="mt-8 grid grid-cols-2 gap-8">
              <SignatureCard title="Received By" />
              <SignatureCard title="Authorized Signature" />
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-400">
              This is a computer generated receipt and requires no signature if QR code is verified.
            </p>
          </div>
        </div>
      </div>

      {/* PRINT STYLE */}
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

            #payment-receipt .grid {
                display: grid !important;
            }

            #payment-receipt .grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            #payment-receipt .grid-cols-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
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
// INFO ITEM
// ======================================
const InfoItem = ({ label, value }) => {
  return (
    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-base font-bold text-[#07153B] break-words">{value || "—"}</p>
    </div>
  );
};

// ======================================
// SIGNATURE CARD
// ======================================
const SignatureCard = ({ title }) => {
  return (
    <div className="text-center">
      <div className="h-10 border-b-2 border-dashed border-slate-300 mx-6" />
      <p className="mt-1.5 text-sm font-semibold text-slate-600">{title}</p>
    </div>
  );
};
