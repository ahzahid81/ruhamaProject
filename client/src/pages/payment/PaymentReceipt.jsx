import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft } from "lucide-react";
import api from "../../services/api";
import { bdDate } from "../../utils/bdTime";

const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

export default function PaymentReceipt() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const receiptRef = useRef();

  const stateReceipt = location.state?.receipt;
  const stateStudent = location.state?.student;

  const [payment, setPayment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/payments/receipt/${id}`);
        setPayment(res.data.payment || null);
        setItems(res.data.items || []);
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
            onClick={() => navigate("/collect-payment")}
            className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Back to Collect Payment
          </button>
        </div>
      </div>
    );
  }

  const date = payment.receiveDate || payment.createdAt ? bdDate(payment.receiveDate || payment.createdAt) : bdDate();

  return (
    <div className="max-w-md mx-auto py-6">
      <div ref={receiptRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-8">
        <h2 className="text-center text-xl font-black text-slate-800">RUHAMA UNITED SCHOOL</h2>
        <p className="text-center text-xs text-gray-400 mt-0.5">Money Receipt</p>
        <div className="flex justify-center my-4">
          <div className="bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200">Payment Successful</div>
        </div>
        <hr />
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Receipt No</span><b className="text-slate-800">{payment.receiptNo}</b></div>
          <div className="flex justify-between"><span className="text-gray-400">Date</span><b className="text-slate-800">{date}</b></div>
          <hr />
          <div className="flex justify-between"><span className="text-gray-400">Student</span><b className="text-slate-800">{payment.studentName}</b></div>
          <div className="flex justify-between"><span className="text-gray-400">Student ID</span><b className="text-slate-800">{payment.studentId}</b></div>
          <div className="flex justify-between"><span className="text-gray-400">Class</span><b className="text-slate-800">{payment.className}</b></div>
          <hr />
        </div>

        {items.length > 0 && (
          <div className="mt-4">
            <div className="space-y-1.5">
              {items.map((item, i) => {
                const period =
                  item.applicableType === "Month"
                    ? `${["January","February","March","April","May","June","July","August","September","October","November","December"][(item.month || 1) - 1]} ${item.year || ""}`
                    : item.applicableType === "Exam"
                    ? item.examName
                    : item.customTitle || item.applicableType;
                return (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500">{item.feeName} <span className="text-gray-400">({period.trim()})</span></span>
                    <b className="text-slate-800">{fmt(item.paidAmount)}</b>
                  </div>
                );
              })}
            </div>
            <hr className="my-3" />
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Total Amount</span><b className="text-slate-800">{fmt(payment.totalAmount)}</b></div>
          <div className="flex justify-between"><span className="text-gray-400">Discount</span><b className="text-slate-800">{fmt(payment.totalDiscount || 0)}</b></div>
          <div className="flex justify-between"><span className="text-gray-400">Fine</span><b className="text-slate-800">{fmt(payment.totalFine || 0)}</b></div>
          <div className="flex justify-between text-base"><span className="font-semibold">Paid</span><b className="text-emerald-700">{fmt(payment.paidAmount)}</b></div>
          <div className="flex justify-between"><span className="text-gray-400">Payment Method</span><b className="text-slate-800">{payment.paymentMethod || "Cash"}</b></div>
          {payment.transactionId && <div className="flex justify-between"><span className="text-gray-400">Transaction ID</span><b className="text-slate-800">{payment.transactionId}</b></div>}
          {payment.referenceNo && <div className="flex justify-between"><span className="text-gray-400">Reference No</span><b className="text-slate-800">{payment.referenceNo}</b></div>}
          {payment.receivedBy?.name && <div className="flex justify-between"><span className="text-gray-400">Received By</span><b className="text-slate-800">{payment.receivedBy.name}</b></div>}
        </div>
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-gray-400">Thank you</p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={handlePrint}
          className="flex-1 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
        >Print Receipt</button>
        <button onClick={() => navigate("/collect-payment")}
          className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}