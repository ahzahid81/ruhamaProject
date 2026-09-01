import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import StudentPicker from "../../components/StudentPicker";
import { bdYear, bdDate } from "../../utils/bdTime";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const findStudents = async (query) => {
  const q = (query || "").trim();
  if (!q) return [];
  // Direct Mongo id lookup (deep links that pass _id)
  if (/^[0-9a-fA-F]{24}$/.test(q)) {
    try {
      const res = await api.get(`/students/${q}`);
      return res.data ? [res.data] : [];
    } catch {
      /* fall through to search */
    }
  }
  try {
    const res = await api.get(`/students/search?q=${encodeURIComponent(q)}`);
    return res.data;
  } catch {
    const res = await api.get(`/students?search=${encodeURIComponent(q)}`);
    return res.data;
  }
};

export default function CollectPayment() {
  const [searchParams] = useSearchParams();
  const { studentId: studentIdRoute } = useParams();
  const navigate = useNavigate();
  const isDedicated = Boolean(studentIdRoute);
  const studentIdParam = searchParams.get("studentId")
    ? searchParams.get("studentId")
    : studentIdRoute;

  const [student, setStudent] = useState(null);
  const [dueItems, setDueItems] = useState([]);
  const [feeLedger, setFeeLedger] = useState([]);
  const [feeStructure, setFeeStructure] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [toast, setToast] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentMethodsList, setPaymentMethodsList] = useState(["Cash", "bKash", "Nagad", "Rocket", "Bank", "Cheque", "Card", "Online", "Other"]);
  const [transactionId, setTransactionId] = useState("");
  const [fine, setFine] = useState(0);

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
    // Whenever the dedicated route changes (or we return to browse mode),
    // reset the loaded student so stale data doesn't linger.
    setStudent(null);
    setDueItems([]);
    setFeeLedger([]);
    setFeeStructure([]);
    setPaymentHistory([]);
    setSelectedItems([]);
    setFine(0);
  }, [studentIdRoute]);

  useEffect(() => {
    if (!studentIdParam) return;
    findStudents(studentIdParam).then((list) => {
      if (list.length > 0) setStudent(list[0]);
    }).catch(() => {});
  }, [studentIdParam]);

  const loadAllStudentData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [dueRes, historyRes] = await Promise.allSettled([
        api.get(`/payments/due-items/${student._id}`),
        api.get(`/payments/history/${student._id}`),
      ]);

      if (dueRes.status === "fulfilled" && dueRes.value.data.success) {
        setDueItems(dueRes.value.data.dueItems || []);
        setFeeLedger(dueRes.value.data.feeLedger || []);
        setFeeStructure(dueRes.value.data.feeStructure || []);
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

  const selectedFees = useMemo(() => {
    return dueItems.filter((_, i) => selectedItems.includes(i));
  }, [dueItems, selectedItems]);

  const subtotal = useMemo(() => {
    return selectedFees.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [selectedFees]);

  const total = useMemo(() => {
    return subtotal + Number(fine || 0);
  }, [subtotal, fine]);

  // Flatten the fee ledger into professional line items (every fee, every month)
  // Ordered: paid one-time fees on top, then new (unpaid) one-time fees,
  // then monthly fees sorted by year + month.
  const ledgerRows = useMemo(() => {
    const rows = [];
    (feeLedger || []).forEach((group) => {
      const isOneTime = group.applicableType !== "Month";
      if (group.applicableType === "Month") {
        (group.months || []).forEach((m) => {
          rows.push({
            key: `o-${group._id}-m${m.month}`,
            feeName: group.feeName,
            frequency: "Monthly",
            period: `${months[m.month - 1]} ${m.year}`,
            amount: Number(m.amount || 0),
            paid: Number(m.paidAmount ?? 0),
            due: Number(m.dueAmount || 0),
            discount: Number(m.discount || 0),
            waived: Boolean(m.waived),
            status: m.status,
            dueIndex: m.dueIndex,
            sortKind: "month",
            sortYear: Number(m.year || 0),
            sortMonth: Number(m.month || 0),
          });
        });
      } else if (group.applicableType === "Exam") {
        (group.exams || []).forEach((e) => {
          rows.push({
            key: `o-${group._id}-e${e.examName}`,
            feeName: group.feeName,
            frequency: "Per Exam",
            period: e.examName,
            amount: Number(e.amount || 0),
            paid: Number(e.paidAmount ?? 0),
            due: Number(e.dueAmount || 0),
            discount: Number(e.discount || 0),
            waived: Boolean(e.waived),
            status: e.status,
            dueIndex: e.dueIndex,
            sortKind: "onetime",
            sortPaid: e.status === "Paid" ? 0 : 1,
            sortName: group.feeName || "",
          });
        });
      } else {
        rows.push({
          key: `o-${group._id}-x`,
          feeName: group.feeName,
          frequency: group.frequency || group.applicableType,
          period: group.period || "One Time",
          amount: Number(group.amount || 0),
          paid: Number(group.paidAmount ?? 0),
          due: Number(group.dueAmount || 0),
          discount: Number(group.discount || 0),
          waived: Boolean(group.waived),
          status: group.status,
          dueIndex: group.dueIndex,
          sortKind: "onetime",
          sortPaid: group.status === "Paid" ? 0 : 1,
          sortName: group.feeName || "",
        });
      }
    });

    rows.sort((a, b) => {
      if (a.sortKind !== b.sortKind) return a.sortKind === "onetime" ? -1 : 1;
      if (a.sortKind === "onetime") {
        if (a.sortPaid !== b.sortPaid) return a.sortPaid - b.sortPaid;
        return String(a.sortName || "").localeCompare(String(b.sortName || ""));
      }
      if (a.sortYear !== b.sortYear) return a.sortYear - b.sortYear;
      if (a.sortMonth !== b.sortMonth) return a.sortMonth - b.sortMonth;
      return String(a.feeName || "").localeCompare(String(b.feeName || ""));
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
    setPaymentHistory([]);
    setSelectedItems([]);
    setFine(0);
  };

  const showToast = (text, type = "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const submitPayment = async () => {
    if (!student) return showToast("Select a student first.");
    if (selectedFees.length === 0) return showToast("Select at least one fee item.");
    if (paymentMethod !== "Cash" && !transactionId.trim())
      return showToast("Transaction ID is required for " + paymentMethod + " payments.");
    setLoading(true);
    try {
      const paidAmount = total;
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
          year: fee.year || bdYear(),
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
        totalFine: Number(fine),
        paidAmount,
        items,
      };
      const res = await api.post("/payments/collect", payload);
      navigate(`/payment/receipt/${res.data.paymentId}`, {
        state: { receipt: { ...res.data, paymentMethod, transactionId }, student },
      });
      setFine(0); setTransactionId("");
      loadAllStudentData();
    } catch (error) {
      showToast(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

  const inputClass = "w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-white";
  const labelClass = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5";
  const selectClass = inputClass;

  return (
    <div className="min-h-screen bg-slate-100">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-semibold text-sm ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M21 12V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.27 6.96 12 12.01l8.73-5.05" />
                <path d="M12 22.08V12" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Collect Payment</h1>
              <p className="text-xs text-slate-400">Student fee collection & receipt management</p>
            </div>
          </div>
          {isDedicated && (
            <button onClick={() => navigate("/collect-payment")}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition flex items-center gap-1.5">
              ← All Students
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* Student Search (only in browse mode) */}
        {!isDedicated && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <label className={labelClass}>Select Student</label>
            <StudentPicker
              onSelect={handleStudentSelect}
              onOpen={(s) => navigate(`/collect-payment/${s.studentId}`)}
              selectedId={student?._id}
              title="Search or browse students by class"
            />
          </section>
        )}

        {/* Loading State */}
        {loadingData && (
          <section className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading student data...</p>
          </section>
        )}

        {/* Student Profile + Fee Structure */}
        {student && !loadingData && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 flex items-start gap-4">
              {student.photo ? (
                <img src={student.photo} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-100 ring-1 ring-slate-100" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">👤</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 truncate">{student.name}</h2>
                  <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{student.studentId}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${student.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{student.status}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[13px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-400"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    {student.className}{student.section ? " • " + student.section : ""}
                  </span>
                  {student.fatherMobile && (
                    <span className="inline-flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {student.fatherMobile}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link to={`/students/${student._id}`}
                    className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition border border-indigo-100"
                  >View Profile</Link>
                </div>
              </div>
              <button onClick={() => { setStudent(null); setDueItems([]); setFeeLedger([]); setSelectedItems([]); setPaymentHistory([]); }}
                className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-200 transition flex-shrink-0"
              >Change</button>
            </div>

            {/* Fee Structure Tags */}
            {feeStructure.length > 0 && (
              <div className="px-5 pb-4 pt-1 flex flex-wrap gap-1.5">
                {feeStructure.map((fs, i) => (
                  <span key={i} className="text-xs bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
                    {fs.feeCategory?.name || fs.feeName} — <b className="text-emerald-600">{fmt(fs.effectiveAmount || fs.amount)}</b>
                    <span className="text-slate-400 ml-1">({fs.frequency})</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Main two-column layout */}
        {student && !loadingData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* LEFT: Due fees + recent payments */}
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {/* Due Fees */}
              <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Due Fees</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {dueItems.length === 0 ? "All fees settled" : `${dueItems.length} unpaid item${dueItems.length !== 1 ? "s" : ""} due`}
                    </p>
                  </div>
                  <button onClick={loadAllStudentData}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
                  >↻ Refresh</button>
                </div>

                {ledgerRows.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-slate-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">No fees configured</p>
                    <p className="text-slate-300 text-xs mt-1">No fee categories apply to this student</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {/* Session totals */}
                    <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Session Fees</p>
                        <p className="text-lg font-black text-slate-800 mt-1">{fmt(totals.fees)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Paid</p>
                        <p className="text-lg font-black text-emerald-700 mt-1">{fmt(totals.paid)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Due</p>
                        <p className="text-lg font-black text-rose-600 mt-1">{fmt(totals.due)}</p>
                      </div>
                    </div>

                    {/* Line items — every fee, every month; paid rows have no selection */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                            <th className="px-5 py-3 w-12">
                              <input type="checkbox" checked={allUnpaidSelected} onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
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
                        <tbody className="divide-y divide-slate-100">
                          {ledgerRows.map((row) => {
                            const isPaid = row.status === "Paid";
                            const isWaived = row.waived;
                            const on = !isPaid && !isWaived && row.dueIndex >= 0 && selectedItems.includes(row.dueIndex);
                            return (
                              <tr key={row.key} className={`transition ${on ? "bg-emerald-50/50" : "hover:bg-slate-50/60"}`}>
                                <td className="px-5 py-3">
                                  {isPaid ? (
                                    <span title="Paid" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black">✓</span>
                                  ) : isWaived ? (
                                    <span title="Waived" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-black">−</span>
                                  ) : (
                                    <input type="checkbox" checked={on} onChange={() => toggleItem(row.dueIndex)}
                                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <p className={`font-medium ${isPaid || isWaived ? "text-slate-400" : "text-slate-700"}`}>{row.feeName}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{row.frequency}</p>
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap ${isPaid || isWaived ? "text-slate-400" : "text-slate-600"}`}>{row.period}</td>
                                <td className={`px-4 py-3 text-right ${isPaid || isWaived ? "text-slate-400" : "text-slate-600"}`}>{fmt(row.amount)}</td>
                                <td className={`px-4 py-3 text-right ${row.paid > 0 ? "text-emerald-600" : "text-slate-300"}`}>{row.paid > 0 ? fmt(row.paid) : "—"}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${row.due > 0 ? "text-rose-500" : "text-slate-300"}`}>{row.due > 0 ? fmt(row.due) : "—"}</td>
                                <td className="px-5 py-3 text-right">
                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Paid</span>
                                  ) : isWaived ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-600">Waived</span>
                                  ) : row.status === "Partial" ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Partial</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">Due</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        {selectedItems.length} of {dueItems.length} unpaid item{dueItems.length !== 1 ? "s" : ""} selected
                      </span>
                      <span className="font-bold text-slate-800">
                        Subtotal: <span className="text-emerald-700">{fmt(subtotal)}</span>
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* Recent Payments */}
              {paymentHistory.length > 0 && (
                <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-800">Recent Payments</h2>
                    <Link to={`/students/${student._id}/ledger`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                      View Full Ledger →
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                          <th className="px-5 py-3 font-semibold">Date</th>
                          <th className="px-5 py-3 font-semibold">Receipt</th>
                          <th className="px-5 py-3 font-semibold">Method</th>
                          <th className="px-5 py-3 font-semibold text-right">Amount</th>
                          <th className="px-5 py-3 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map((p) => (
                          <tr key={p._id} className="hover:bg-slate-50/60 transition">
                            <td className="px-5 py-3 text-slate-500 text-xs">{bdDate(p.createdAt || p.date)}</td>
                            <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">{p.receiptNo || "—"}</td>
                            <td className="px-5 py-3 text-xs text-slate-500">{p.paymentMethod || "—"}</td>
                            <td className="px-5 py-3 text-right font-semibold text-emerald-700">{fmt(p.totalAmount || p.paidAmount || p.amount)}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                                p.status === "Paid" || p.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                              }`}>{p.status || p.paymentStatus || "Paid"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT: Checkout summary */}
            <aside className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Payment Summary</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Confirm details & collect</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Breakdown */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-semibold text-slate-700">{fmt(subtotal)}</span>
                    </div>
                    {selectedFees.length > 0 && (
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500 shrink-0">Fine</span>
                        <input type="number" value={fine} onChange={(e) => setFine(e.target.value)} min="0" step="0.01" placeholder="0"
                          className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-right text-sm font-semibold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition bg-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-3.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Total</span>
                    <span className="text-2xl font-black text-emerald-700">{fmt(total)}</span>
                  </div>

                  {selectedFees.length > 0 ? (
                    <>
                      <div>
                        <label className={labelClass}>Payment Method</label>
                        <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setTransactionId(""); }} className={selectClass}>
                          {paymentMethodsList.map((m) => (<option key={m}>{m}</option>))}
                        </select>
                      </div>

                      {paymentMethod !== "Cash" && (
                        <div>
                          <label className={labelClass}>Transaction ID *</label>
                          <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder={`Required for ${paymentMethod}`} className={inputClass} />
                        </div>
                      )}

                      <button onClick={submitPayment} disabled={loading}
                        className="w-full px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Processing...</>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            Receive Payment
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 text-center">
                        {paymentMethod !== "Cash"
                          ? `Transaction ID required for ${paymentMethod} payments`
                          : "Cash payment — no transaction ID needed"}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mx-auto text-slate-300 mb-2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="m9 9 6 6" /><path d="m15 9-6 6" />
                      </svg>
                      <p className="text-sm font-medium text-slate-500">Select fee items to collect</p>
                      <p className="text-xs text-slate-400 mt-1">Tick the fee rows on the left to build a payment</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};