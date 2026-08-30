import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CollectPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentIdParam = searchParams.get("studentId");

  const [student, setStudent] = useState(null);
  const [dueItems, setDueItems] = useState([]);
  const [feeLedger, setFeeLedger] = useState([]);
  const [feeStructure, setFeeStructure] = useState([]);
  const [dueSummary, setDueSummary] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [toast, setToast] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentMethodsList, setPaymentMethodsList] = useState(["Cash", "bKash", "Nagad", "Rocket", "Bank", "Cheque", "Card", "Online", "Other"]);
  const [transactionId, setTransactionId] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [discount, setDiscount] = useState(0);
  const [fine, setFine] = useState(0);
  const [payingAmount, setPayingAmount] = useState("");

  const [selectedItems, setSelectedItems] = useState([]);

  // All unpaid items currently selected? (manual selection only)
  const allUnpaidSelected = dueItems.length > 0 && selectedItems.length === dueItems.length;

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    if (!student) return;
    loadAllStudentData();
  }, [student]);

  useEffect(() => {
    if (!studentIdParam) return;
    api.get(`/students/search?q=${studentIdParam}`).then((res) => {
      if (res.data.length > 0) setStudent(res.data[0]);
    }).catch(() => {});
  }, [studentIdParam]);

  const loadAllStudentData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [dueRes, summaryRes, historyRes] = await Promise.allSettled([
        api.get(`/payments/due-items/${student._id}`),
        api.get(`/ledger/due-summary/${student._id}`),
        api.get(`/payments/history/${student._id}`),
      ]);

      if (dueRes.status === "fulfilled" && dueRes.value.data.success) {
        setDueItems(dueRes.value.data.dueItems || []);
        setFeeLedger(dueRes.value.data.feeLedger || []);
        setFeeStructure(dueRes.value.data.feeStructure || []);
      }
      if (summaryRes.status === "fulfilled") {
        const sd = summaryRes.value.data || {};
        setDueSummary({
          openingBalance: sd.summary?.openingBalance ?? 0,
          totalPaid: sd.summary?.totalPaid ?? 0,
          totalDue: sd.summary?.totalDue ?? 0,
          balance: sd.summary?.currentBalance ?? 0,
        });
      }
      if (historyRes.status === "fulfilled") {
        const hd = historyRes.value.data;
        setPaymentHistory(Array.isArray(hd) ? hd.slice(0, 10) : (hd.payments?.slice(0, 10) || []));
      }
    } catch {
      // silent
    } finally {
      setLoadingData(false);
    }
  }, [student]);

  const loadPaymentMethods = async () => {
    try {
      const res = await getSettings();
      if (res.data.paymentMethods?.length) setPaymentMethodsList(res.data.paymentMethods);
    } catch {
      // silent
    }
  };

  const toggleSelectAll = () => {
    if (allUnpaidSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(dueItems.map((_, i) => i));
    }
  };

  const toggleItem = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // ---- Grouped fee ledger helpers (removed; flat table uses dueIndex directly) ----

  const selectedFees = useMemo(() => {
    return dueItems.filter((_, i) => selectedItems.includes(i));
  }, [dueItems, selectedItems]);

  const subtotal = useMemo(() => {
    return selectedFees.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [selectedFees]);

  const total = useMemo(() => {
    return subtotal + Number(fine || 0) - Number(discount || 0);
  }, [subtotal, fine, discount]);

  // Flatten the fee ledger into professional line items (every fee, every month)
  const ledgerRows = useMemo(() => {
    const rows = [];
    (feeLedger || []).forEach((group, gi) => {
      if (group.applicableType === "Month") {
        (group.months || []).forEach((m) => {
          rows.push({
            key: `${gi}-m${m.month}`,
            feeName: group.feeName,
            frequency: "Monthly",
            period: `${months[m.month - 1]} ${m.year}`,
            amount: Number(m.amount || 0),
            paid: Number(m.amount || 0) - Number(m.dueAmount || 0),
            due: Number(m.dueAmount || 0),
            status: m.status,
            dueIndex: m.dueIndex,
          });
        });
      } else if (group.applicableType === "Exam") {
        (group.exams || []).forEach((e) => {
          rows.push({
            key: `${gi}-e${e.examName}`,
            feeName: group.feeName,
            frequency: "Per Exam",
            period: e.examName,
            amount: Number(e.amount || 0),
            paid: Number(e.amount || 0) - Number(e.dueAmount || 0),
            due: Number(e.dueAmount || 0),
            status: e.status,
            dueIndex: e.dueIndex,
          });
        });
      } else {
        rows.push({
          key: `${gi}-x`,
          feeName: group.feeName,
          frequency: group.frequency || group.applicableType,
          period: group.period || "One Time",
          amount: Number(group.amount || 0),
          paid: Number(group.amount || 0) - Number(group.dueAmount || 0),
          due: Number(group.dueAmount || 0),
          status: group.status,
          dueIndex: group.dueIndex,
        });
      }
    });
    return rows;
  }, [feeLedger]);

  const totals = useMemo(() => ({
    fees: ledgerRows.reduce((s, r) => s + r.amount, 0),
    paid: ledgerRows.reduce((s, r) => s + r.paid, 0),
    due: ledgerRows.reduce((s, r) => s + r.due, 0),
  }), [ledgerRows]);

  const handleStudentSelect = (studentData) => {
    setStudent(studentData);
    setDueItems([]);
    setFeeLedger([]);
    setDueSummary(null);
    setPaymentHistory([]);
    setSelectedItems([]);
    setDiscount(0);
    setFine(0);
    setPayingAmount("");
  };

  const showToast = (text, type = "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const submitPayment = async () => {
    if (!student) return showToast("Select a student first.");
    if (selectedFees.length === 0) return showToast("Select at least one fee item.");
    setLoading(true);
    try {
      const paidAmount = payingAmount ? Number(payingAmount) : total;
      let remaining = paidAmount;
      const items = selectedFees.map((fee) => {
        const payable = Number(fee.amount);
        const paid = Math.min(payable, remaining);
        remaining = Math.max(0, remaining - paid);
        return {
          feeCategory: fee.feeCategory || null,
          feeName: fee.feeName,
          applicableType: fee.applicableType,
          month: fee.applicableType === "Month" ? fee.month : null,
          year: fee.year || new Date().getFullYear(),
          examName: fee.applicableType === "Exam" ? fee.examName : "",
          payableAmount: payable,
          paidAmount: paid,
          dueAmount: payable - paid,
          discount: 0,
          fine: 0,
        };
      });
      const payload = {
        student: student._id,
        receivedBy: JSON.parse(localStorage.getItem("teacher"))?._id,
        paymentMethod,
        transactionId,
        referenceNo,
        remarks,
        totalDiscount: Number(discount),
        totalFine: Number(fine),
        paidAmount,
        items,
      };
      const res = await api.post("/payments/collect", payload);
      navigate(`/payment/receipt/${res.data.paymentId}`, {
        state: { receipt: { ...res.data, paymentMethod, transactionId, referenceNo }, student },
      });
      setDiscount(0); setFine(0); setTransactionId(""); setReferenceNo(""); setRemarks(""); setPayingAmount("");
      loadAllStudentData();
    } catch (error) {
      showToast(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

  const inputClass = "w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-white";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
  const selectClass = inputClass;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-semibold text-sm ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Collect Payment</h1>
            <p className="text-sm text-gray-400 mt-0.5">Student fee collection & receipt management</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">

        {/* Student Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className={labelClass}>Search Student</label>
          <StudentSearchInner onSelect={handleStudentSelect} />
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading student data...</p>
          </div>
        )}

        {/* Student Profile + Fee Structure */}
        {student && !loadingData && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 flex items-start gap-5">
              {student.photo ? (
                <img src={student.photo} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">👤</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
                  <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{student.studentId}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${student.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{student.status}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-500">
                  <span>{student.className}{student.section ? " • " + student.section : ""}</span>
                  {student.fatherMobile && <span>📞 {student.fatherMobile}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link to={`/students/${student._id}`}
                    className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition border border-indigo-100"
                  >View Profile</Link>
                  <Link to={`/students/${student._id}/ledger`}
                    className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition border border-blue-100"
                  >View Ledger</Link>
                  <Link to={`/students/${student._id}/fee-override`}
                    className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition border border-amber-100"
                  >Fee Override</Link>
                  <Link to={`/students/${student._id}/fees`}
                    className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition border border-orange-100"
                  >Optional Fees</Link>
                </div>
              </div>
              <button onClick={() => { setStudent(null); setDueItems([]); setFeeLedger([]); setSelectedItems([]); setDueSummary(null); setPaymentHistory([]); }}
                className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-200 transition flex-shrink-0"
              >Change</button>
            </div>

            {/* Fee Structure Tags */}
            {feeStructure.length > 0 && (
              <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                {feeStructure.map((fs, i) => (
                  <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-100">
                    {fs.feeCategory?.name || fs.feeName} — <b className="text-emerald-600">{fmt(fs.effectiveAmount || fs.amount)}</b>
                    <span className="text-gray-400 ml-1">({fs.frequency})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Due Summary */}
        {dueSummary && !loadingData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Opening Balance", value: dueSummary.openingBalance, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", textBold: "text-blue-800" },
              { label: "Total Paid", value: dueSummary.totalPaid, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", textBold: "text-emerald-800" },
              { label: "Total Due", value: dueSummary.totalDue, bg: "bg-red-50", border: "border-red-200", text: "text-red-600", textBold: "text-red-800" },
              { label: "Balance", value: dueSummary.balance, bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", textBold: "text-purple-800" },
            ].map(({ label, value, bg, border, text, textBold }) => (
              <div key={label} className={`rounded-xl p-4 border ${border} ${bg}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${text}`}>{label}</p>
                <p className={`text-xl font-bold mt-1 ${textBold}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Due Fees */}
        {student && !loadingData && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Due Fees</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {dueItems.length === 0 ? "All fees settled" : `${dueItems.length} unpaid item${dueItems.length !== 1 ? "s" : ""} due`}
                </p>
              </div>
              <button onClick={loadAllStudentData}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
              >↻ Refresh</button>
            </div>

            {ledgerRows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-400 text-sm font-medium">No fees configured</p>
                <p className="text-gray-300 text-xs mt-1">No fee categories apply to this student</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Session totals */}
                <div className="px-5 py-3 bg-slate-50/80 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Session Fees</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{fmt(totals.fees)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Paid</p>
                    <p className="text-lg font-black text-emerald-700 mt-1">{fmt(totals.paid)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Due</p>
                    <p className="text-lg font-black text-red-600 mt-1">{fmt(totals.due)}</p>
                  </div>
                </div>

                {/* Line items — every fee, every month; paid rows have no selection */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-5 py-3 w-12">
                          <input type="checkbox" checked={allUnpaidSelected} onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </th>
                        <th className="px-4 py-3 font-semibold">Fee</th>
                        <th className="px-4 py-3 font-semibold">Period</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                        <th className="px-4 py-3 font-semibold text-right">Paid</th>
                        <th className="px-4 py-3 font-semibold text-right">Due</th>
                        <th className="px-5 py-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ledgerRows.map((row) => {
                        const isPaid = row.status === "Paid";
                        const on = !isPaid && row.dueIndex >= 0 && selectedItems.includes(row.dueIndex);
                        return (
                          <tr key={row.key} className={`transition ${on ? "bg-emerald-50/40" : "hover:bg-gray-50/50"}`}>
                            <td className="px-5 py-3">
                              {isPaid ? (
                                <span title="Paid" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black">✓</span>
                              ) : (
                                <input type="checkbox" checked={on} onChange={() => toggleItem(row.dueIndex)}
                                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className={`font-medium ${isPaid ? "text-gray-400" : "text-slate-700"}`}>{row.feeName}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{row.frequency}</p>
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap ${isPaid ? "text-gray-400" : "text-gray-600"}`}>{row.period}</td>
                            <td className={`px-4 py-3 text-right ${isPaid ? "text-gray-400" : "text-gray-600"}`}>{fmt(row.amount)}</td>
                            <td className={`px-4 py-3 text-right ${row.paid > 0 ? "text-emerald-600" : "text-gray-300"}`}>{row.paid > 0 ? fmt(row.paid) : "—"}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${row.due > 0 ? "text-red-500" : "text-gray-300"}`}>{row.due > 0 ? fmt(row.due) : "—"}</td>
                            <td className="px-5 py-3 text-right">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Paid</span>
                              ) : row.status === "Partial" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Partial</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600">Due</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {selectedItems.length} of {dueItems.length} unpaid item{dueItems.length !== 1 ? "s" : ""} selected
                  </span>
                  <span className="font-bold text-slate-800">
                    Subtotal: <span className="text-emerald-700">{fmt(subtotal)}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Entry */}
        {student && selectedFees.length > 0 && !loadingData && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-bold text-slate-800 mb-5">Payment Entry</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
              <div>
                <label className={labelClass}>Subtotal</label>
                <p className="text-lg font-bold text-slate-700 mt-1">{fmt(subtotal)}</p>
              </div>
              <div>
                <label className={labelClass}>Discount</label>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min="0" step="0.01" placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Fine</label>
                <input type="number" value={fine} onChange={(e) => setFine(e.target.value)} min="0" step="0.01" placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Paying Amount</label>
                <input type="number" value={payingAmount} onChange={(e) => setPayingAmount(e.target.value)} min="0" step="0.01" placeholder={String(total)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Net Total</label>
                <p className="text-xl font-black text-emerald-700 mt-1">{fmt(payingAmount || total)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
              <div>
                <label className={labelClass}>Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}>
                  {paymentMethodsList.map((m) => (<option key={m}>{m}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Transaction ID</label>
                <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Optional" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Reference No</label>
                <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Optional" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Remarks</label>
                <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" className={inputClass} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Amount to collect</p>
                <p className="text-2xl font-black text-emerald-700">{fmt(payingAmount || total)}</p>
              </div>
              <button onClick={submitPayment} disabled={loading}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                {loading ? (
                  <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Processing...</>
                ) : "Receive Payment"}
              </button>
            </div>
          </div>
        )}

        {/* Payment History */}
        {student && paymentHistory.length > 0 && !loadingData && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Recent Payments</h2>
              <Link to={`/students/${student._id}/ledger`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                View Full Ledger →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Receipt</th>
                    <th className="px-5 py-3 font-semibold">Method</th>
                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    <th className="px-5 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentHistory.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3 text-gray-500 text-xs">{new Date(p.createdAt || p.date).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">{p.receiptNo || "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{p.paymentMethod || "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold text-emerald-700">{fmt(p.totalAmount || p.paidAmount || p.amount)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                          p.status === "Paid" || p.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-500"
                        }`}>{p.status || p.paymentStatus || "Paid"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================
// Student Search Sub-component
// =========================================
const StudentSearchInner = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [show, setShow] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/students/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        setShow(true);
      } catch { setResults([]); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Student ID, Name, or Father's Mobile..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
        />
        {searching && <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full self-center" />}
      </div>
      {show && !searching && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
          {results.map((s) => (
            <button key={s._id} type="button" onClick={() => { onSelect(s); setQuery(s.studentId); setShow(false); }}
              className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition border-b last:border-none flex items-center gap-3"
            >
              {s.photo ? (
                <img src={s.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">👤</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-700">{s.name}</p>
                <p className="text-xs text-gray-400">{s.studentId} — {s.className}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{s.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
