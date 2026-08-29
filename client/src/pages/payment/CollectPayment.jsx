import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CollectPayment() {
  const [searchParams] = useSearchParams();
  const studentIdParam = searchParams.get("studentId");

  const [student, setStudent] = useState(null);
  const [dueItems, setDueItems] = useState([]);
  const [feeLedger, setFeeLedger] = useState([]);
  const [feeStructure, setFeeStructure] = useState([]);
  const [dueSummary, setDueSummary] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
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
  const [selectAll, setSelectAll] = useState(true);

  const receiptRef = useRef();

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
      const [dueRes, summaryRes, historyRes] = await Promise.all([
        api.get(`/payments/due-items/${student._id}`),
        api.get(`/ledger/due-summary/${student._id}`),
        api.get(`/payments/history/${student._id}`),
      ]);

      if (dueRes.data.success) {
        setDueItems(dueRes.data.dueItems || []);
        setFeeLedger(dueRes.data.feeLedger || []);
        setFeeStructure(dueRes.data.feeStructure || []);
      }
      const sd = summaryRes.data || {};
      setDueSummary({
        openingBalance: sd.summary?.openingBalance ?? 0,
        totalPaid: sd.summary?.totalPaid ?? 0,
        totalDue: sd.summary?.totalDue ?? 0,
        balance: sd.summary?.currentBalance ?? 0,
      });
      setPaymentHistory(Array.isArray(historyRes.data) ? historyRes.data.slice(0, 10) : (historyRes.data.payments?.slice(0, 10) || []));
    } catch {
      // silent
    } finally {
      setLoadingData(false);
    }
  }, [student]);

  const loadPaymentMethods = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data.paymentMethods?.length) setPaymentMethodsList(res.data.paymentMethods);
    } catch {
      // silent
    }
  };

  // Toggle select all when dueItems change
  useEffect(() => {
    if (selectAll && dueItems.length > 0) {
      setSelectedItems(dueItems.map((_, i) => i));
    }
  }, [dueItems]);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(dueItems.map((_, i) => i));
    }
    setSelectAll(!selectAll);
  };

  const toggleItem = (index) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // ---- Grouped fee ledger helpers (month/exam chips) ----

  const groupSelectedCount = (group) => {
    if (group.applicableType === "Month") {
      return (group.months || []).filter((m) => m.dueIndex >= 0 && selectedItems.includes(m.dueIndex)).length;
    }
    if (group.applicableType === "Exam") {
      return (group.exams || []).filter((e) => e.dueIndex >= 0 && selectedItems.includes(e.dueIndex)).length;
    }
    return group.dueIndex >= 0 && selectedItems.includes(group.dueIndex) ? 1 : 0;
  };

  const groupSelectableCount = (group) => {
    if (group.applicableType === "Month") {
      return (group.months || []).filter((m) => m.dueIndex >= 0).length;
    }
    if (group.applicableType === "Exam") {
      return (group.exams || []).filter((e) => e.dueIndex >= 0).length;
    }
    return group.dueIndex >= 0 ? 1 : 0;
  };

  const groupSubtotal = (group) => {
    if (group.applicableType === "Month") {
      return (group.months || [])
        .filter((m) => m.dueIndex >= 0 && selectedItems.includes(m.dueIndex))
        .reduce((sum, m) => sum + Number(m.dueAmount || m.amount || 0), 0);
    }
    if (group.applicableType === "Exam") {
      return (group.exams || [])
        .filter((e) => e.dueIndex >= 0 && selectedItems.includes(e.dueIndex))
        .reduce((sum, e) => sum + Number(e.dueAmount || 0), 0);
    }
    return group.dueIndex >= 0 && selectedItems.includes(group.dueIndex) ? Number(group.dueAmount || group.amount || 0) : 0;
  };

  const toggleGroup = (group) => {
    const indices = group.applicableType === "Month"
      ? (group.months || []).filter((m) => m.dueIndex >= 0).map((m) => m.dueIndex)
      : group.applicableType === "Exam"
        ? (group.exams || []).filter((e) => e.dueIndex >= 0).map((e) => e.dueIndex)
        : (group.dueIndex >= 0 ? [group.dueIndex] : []);
    if (indices.length === 0) return;
    const allSelected = indices.every((i) => selectedItems.includes(i));
    setSelectedItems((prev) => (allSelected ? prev.filter((i) => !indices.includes(i)) : Array.from(new Set([...prev, ...indices]))));
  };

  const selectedFees = useMemo(() => {
    return dueItems.filter((_, i) => selectedItems.includes(i));
  }, [dueItems, selectedItems]);

  const subtotal = useMemo(() => {
    return selectedFees.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [selectedFees]);

  const total = useMemo(() => {
    return subtotal + Number(fine || 0) - Number(discount || 0);
  }, [subtotal, fine, discount]);

  const handleStudentSelect = (studentData) => {
    setStudent(studentData);
    setDueItems([]);
    setFeeLedger([]);
    setDueSummary(null);
    setPaymentHistory([]);
    setSelectedItems([]);
    setSelectAll(true);
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
      setReceipt({ ...res.data, student, items, paidAmount });
      setShowReceipt(true);
      setDiscount(0); setFine(0); setTransactionId(""); setReferenceNo(""); setRemarks(""); setPayingAmount("");
      loadAllStudentData();
    } catch (error) {
      showToast(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receipt?.receiptNo || "Receipt",
  });

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
              <button onClick={() => { setStudent(null); setDueItems([]); setFeeLedger([]); setSelectedItems([]); setSelectAll(true); setDueSummary(null); setPaymentHistory([]); }}
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
                  {dueItems.length === 0 ? "All fees cleared" : `${dueItems.length} unpaid item${dueItems.length !== 1 ? "s" : ""} due`}
                </p>
              </div>
              <button onClick={loadAllStudentData}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
              >↻ Refresh</button>
            </div>

            {dueItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-gray-400 text-sm font-medium">All fees cleared</p>
                <p className="text-gray-300 text-xs mt-1">No pending dues for this student</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {/* Global select all */}
                <div className="px-5 py-3 bg-gray-50/50 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={selectAll && selectedItems.length === dueItems.length} onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Select all unpaid fees
                  </label>
                  <span className="text-xs text-gray-400">{selectedItems.length} selected</span>
                </div>

                {feeLedger.map((group, gi) => {
                  const selectable = groupSelectableCount(group);
                  const selected = groupSelectedCount(group);
                  const allOn = selectable > 0 && selected === selectable;

                  if (group.applicableType === "Month") {
                    return (
                      <div key={gi} className="px-5 py-4 hover:bg-gray-50/40 transition">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={allOn} onChange={() => toggleGroup(group)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <p className="font-semibold text-slate-800">{group.feeName}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-wide">Monthly</span>
                              <span className="text-xs text-gray-500 font-medium">{fmt(group.amount)}/month</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {(group.months || []).map((m, mi) => {
                                const label = `${shortMonths[m.month - 1]} ${String(m.year || "").slice(2)}`;
                                if (m.status === "Paid") {
                                  return (
                                    <span key={mi} title={`${months[m.month - 1]} paid`}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    >✓ {label}</span>
                                  );
                                }
                                const on = selectedItems.includes(m.dueIndex);
                                return (
                                  <button key={mi} type="button" onClick={() => toggleItem(m.dueIndex)}
                                    title={m.status === "Partial" ? `${months[m.month - 1]} — partial payment due ${fmt(m.dueAmount)}` : months[m.month - 1]}
                                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                                      on
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : m.status === "Partial"
                                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                                    }`}
                                  >
                                    {on && "✓ "}{label}
                                    {m.status === "Partial" && <span className="opacity-80">· {Number(Math.round(m.dueAmount)).toLocaleString("en-BD")}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-emerald-700">{selected > 0 ? fmt(groupSubtotal(group)) : "—"}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{selected ? `${selected} month${selected !== 1 ? "s" : ""}` : "none"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (group.applicableType === "Exam") {
                    return (
                      <div key={gi} className="px-5 py-4 hover:bg-gray-50/40 transition">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={allOn} onChange={() => toggleGroup(group)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <p className="font-semibold text-slate-800">{group.feeName}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-wide">Per Exam</span>
                              <span className="text-xs text-gray-500 font-medium">{fmt(group.amount)}/exam</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {(group.exams || []).map((ex, ei) => {
                                if (ex.status === "Paid") {
                                  return (
                                    <span key={ei} title="Paid"
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    >✓ {ex.examName}</span>
                                  );
                                }
                                const on = ex.dueIndex >= 0 && selectedItems.includes(ex.dueIndex);
                                return (
                                  <button key={ei} type="button" onClick={() => ex.dueIndex >= 0 && toggleItem(ex.dueIndex)}
                                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                                      on
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : ex.status === "Partial"
                                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                                    }`}
                                  >
                                    {on && "✓ "}{ex.examName}
                                    {ex.status === "Partial" && <span className="opacity-80">· {Number(Math.round(ex.dueAmount)).toLocaleString("en-BD")}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-emerald-700">{selected > 0 ? fmt(groupSubtotal(group)) : "—"}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{selected ? `${selected} selected` : "none"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // One Time / Yearly / Custom
                  return (
                    <div key={gi} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/40 transition">
                      <input type="checkbox" checked={group.dueIndex >= 0 && selectedItems.includes(group.dueIndex)} onChange={() => group.dueIndex >= 0 && toggleItem(group.dueIndex)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0 flex items-center flex-wrap gap-2">
                        <p className={`font-semibold ${group.status === "Paid" ? "text-gray-400 line-through" : "text-slate-800"}`}>{group.feeName}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-wide">{group.frequency}</span>
                        <span className="text-xs text-gray-500">{group.period}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {group.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">✓ Paid</span>
                        ) : (
                          <p className="text-sm font-bold text-emerald-700">{fmt(group.dueAmount)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

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

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowReceipt(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div ref={receiptRef} className="p-8">
              <h2 className="text-center text-xl font-black text-slate-800">RUHAMA UNITED SCHOOL</h2>
              <p className="text-center text-xs text-gray-400 mt-0.5">Money Receipt</p>
              <div className="flex justify-center my-4">
                <div className="bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-xs font-bold border border-emerald-200">Payment Successful</div>
              </div>
              <hr />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Receipt No</span><b className="text-slate-800">{receipt.receiptNo}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Date</span><b className="text-slate-800">{new Date().toLocaleDateString("en-IN")}</b></div>
                <hr />
                <div className="flex justify-between"><span className="text-gray-400">Student</span><b className="text-slate-800">{receipt.student?.name}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Student ID</span><b className="text-slate-800">{receipt.student?.studentId}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Class</span><b className="text-slate-800">{receipt.student?.className}</b></div>
                <hr />
                <div className="flex justify-between"><span className="text-gray-400">Total Amount</span><b className="text-slate-800">{fmt(receipt.totalAmount)}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Discount</span><b className="text-slate-800">{fmt(receipt.totalDiscount || 0)}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Fine</span><b className="text-slate-800">{fmt(receipt.totalFine || 0)}</b></div>
                <div className="flex justify-between text-base"><span className="font-semibold">Paid</span><b className="text-emerald-700">{fmt(receipt.paidAmount)}</b></div>
                <div className="flex justify-between"><span className="text-gray-400">Payment Method</span><b className="text-slate-800">{receipt.paymentMethod || paymentMethod}</b></div>
                {receipt.transactionId && <div className="flex justify-between"><span className="text-gray-400">Transaction ID</span><b className="text-slate-800">{receipt.transactionId}</b></div>}
              </div>
              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-gray-400">Thank you</p>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={handlePrintReceipt}
                className="flex-1 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
              >Print Receipt</button>
              <button onClick={() => { setShowReceipt(false); setReceipt(null); }}
                className="flex-1 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >Close</button>
            </div>
          </div>
        </div>
      )}
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
