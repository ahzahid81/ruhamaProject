import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import StudentPicker from "../../components/StudentPicker";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const findStudents = async (query) => {
  const q = (query || "").trim();
  if (!q) return [];
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

export default function DiscountManagement() {
  const [searchParams] = useSearchParams();
  const { studentId: studentIdRoute } = useParams();
  const navigate = useNavigate();
  const isDedicated = Boolean(studentIdRoute);
  const studentIdParam = searchParams.get("studentId")
    ? searchParams.get("studentId")
    : studentIdRoute;

  const [student, setStudent] = useState(null);
  const [feeLedger, setFeeLedger] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [toast, setToast] = useState(null);
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    setStudent(null);
    setFeeLedger([]);
    setDrafts({});
  }, [studentIdRoute]);

  useEffect(() => {
    if (!studentIdParam) return;
    findStudents(studentIdParam).then((list) => {
      if (list.length > 0) setStudent(list[0]);
    }).catch(() => {});
  }, [studentIdParam]);

  const loadStudentData = useCallback(async () => {
    if (!student) return;
    setLoadingData(true);
    try {
      const dueRes = await api.get(`/payments/due-items/${student._id}`);
      if (dueRes.data.success) {
        setFeeLedger(dueRes.data.feeLedger || []);
      }
      setDrafts({});
    } catch {
      // silent
    } finally {
      setLoadingData(false);
    }
  }, [student]);

  useEffect(() => {
    if (!student) return;
    loadStudentData();
  }, [student, loadStudentData]);

  const handleStudentSelect = (studentData) => {
    setStudent(studentData);
    setFeeLedger([]);
    setDrafts({});
  };

  const showToast = (text, type = "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const rows = useMemo(() => {
    const list = [];
    (feeLedger || []).forEach((group) => {
      if (group.applicableType === "Month") {
        (group.months || []).forEach((m) => {
          list.push({
            key: `o-${group._id}-m${m.month}`,
            feeName: group.feeName,
            frequency: "Monthly",
            period: `${months[m.month - 1]} ${m.year}`,
            amount: Number(m.amount || 0),
            paid: Number(m.paidAmount ?? 0),
            due: Number(m.dueAmount || 0),
            discount: Number(m.discount || 0),
            discountId: m.discountId || null,
            discountReason: m.discountReason || "",
            waived: Boolean(m.waived),
            status: m.status,
            instance: {
              feeCategory: group.feeCategory,
              applicableType: "Month",
              month: m.month,
              year: m.year,
              examName: "",
              period: `${months[m.month - 1]} ${m.year}`,
            },
          });
        });
      } else if (group.applicableType === "Exam") {
        (group.exams || []).forEach((e) => {
          list.push({
            key: `o-${group._id}-e${e.examName}`,
            feeName: group.feeName,
            frequency: "Per Exam",
            period: e.examName,
            amount: Number(e.amount || 0),
            paid: Number(e.paidAmount ?? 0),
            due: Number(e.dueAmount || 0),
            discount: Number(e.discount || 0),
            discountId: e.discountId || null,
            discountReason: e.discountReason || "",
            waived: Boolean(e.waived),
            status: e.status,
            instance: {
              feeCategory: group.feeCategory,
              applicableType: "Exam",
              month: null,
              year: e.year,
              examName: e.examName,
              period: e.examName,
            },
          });
        });
      } else {
        list.push({
          key: `o-${group._id}-x`,
          feeName: group.feeName,
          frequency: group.frequency || group.applicableType,
          period: group.period || "One Time",
          amount: Number(group.amount || 0),
          paid: Number(group.paidAmount ?? 0),
          due: Number(group.dueAmount || 0),
          discount: Number(group.discount || 0),
          discountId: group.discountId || null,
          discountReason: group.discountReason || "",
          waived: Boolean(group.waived),
          status: group.status,
          instance: {
            feeCategory: group.feeCategory,
            applicableType: group.applicableType,
            month: null,
            year: group.year,
            examName: "",
            period: group.period || "One Time",
          },
        });
      }
    });
    return list;
  }, [feeLedger]);

  const totals = useMemo(() => ({
    fees: rows.reduce((s, r) => s + r.amount, 0),
    paid: rows.reduce((s, r) => s + r.paid, 0),
    discount: rows.reduce((s, r) => s + r.discount, 0),
    due: rows.reduce((s, r) => s + r.due, 0),
  }), [rows]);

  const setDraft = (key, field, value) => {
    setDrafts((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  const saveDiscount = async (row) => {
    const draft = drafts[row.key] || {};
    const amount = Number(draft.amount);
    if (!(amount > 0)) return showToast("Enter a discount amount greater than 0.");
    const teacher = JSON.parse(localStorage.getItem("teacher"));
    setSavingKey(row.key);
    try {
      await api.post("/discounts", {
        student: student._id,
        academicSession: student.session,
        feeCategory: row.instance.feeCategory,
        feeName: row.feeName,
        applicableType: row.instance.applicableType,
        month: row.instance.month || null,
        year: row.instance.year || null,
        examName: row.instance.examName || "",
        period: row.instance.period || "",
        discountAmount: amount,
        reason: draft.reason || "",
        createdBy: teacher?._id,
      });
      showToast("Discount saved. Balances updated everywhere.", "success");
      await loadStudentData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save discount.");
    } finally {
      setSavingKey(null);
    }
  };

  const removeDiscount = async (row) => {
    if (!row.discountId) return;
    setSavingKey(row.key);
    try {
      await api.delete(`/discounts/${row.discountId}`);
      showToast("Discount removed.", "success");
      await loadStudentData();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to remove discount.");
    } finally {
      setSavingKey(null);
    }
  };

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

  const inputClass = "w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-white";
  const labelClass = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-slate-100">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-semibold text-sm ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                <path d="m15 9-6 6" />
                <path d="M9.5 9.5h.01" /><path d="M14.5 14.5h.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Discount Management</h1>
              <p className="text-xs text-slate-400">Give discounts on student due fees with a reason</p>
            </div>
          </div>
          {isDedicated && (
            <button onClick={() => navigate("/discounts")}
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
              onOpen={(s) => navigate(`/discounts/${s.studentId}`)}
              selectedId={student?._id}
              title="Search or browse students by class"
            />
          </section>
        )}

        {/* Loading State */}
        {loadingData && (
          <section className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading student fees...</p>
          </section>
        )}

        {/* Student + Fees */}
        {student && !loadingData && (
          <>
            {/* Student card */}
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
                    <span>{student.className}{student.section ? " • " + student.section : ""}</span>
                    {student.fatherMobile && <span>📞 {student.fatherMobile}</span>}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Discounts apply to the student's due fees only (excluding paid fees) and reduce balances everywhere automatically.
                  </div>
                </div>
                <button onClick={() => (isDedicated ? navigate("/discounts") : (setStudent(null), setFeeLedger([]), setDrafts({})))}
                  className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-200 transition flex-shrink-0"
                >Change</button>
              </div>
            </section>

            {/* Summary */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Fees", value: totals.fees, bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-600", textBold: "text-sky-800", dot: "bg-sky-500" },
                { label: "Total Paid", value: totals.paid, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", textBold: "text-emerald-800", dot: "bg-emerald-500" },
                { label: "Total Discount", value: totals.discount, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", textBold: "text-amber-800", dot: "bg-amber-500" },
                { label: "Net Due", value: totals.due, bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-600", textBold: "text-rose-800", dot: "bg-rose-500" },
              ].map(({ label, value, bg, border, text, textBold, dot }) => (
                <div key={label} className={`rounded-2xl p-4 border ${border} ${bg} shadow-sm`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${dot} mb-2`} />
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${text}`}>{label}</p>
                  <p className={`text-xl font-black mt-0.5 ${textBold}`}>{fmt(value)}</p>
                </div>
              ))}
            </section>

            {/* Discount table */}
            <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Student Fees & Discounts</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Enter a discount amount and reason for any due fee</p>
                </div>
                <button onClick={loadStudentData}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
                >↻ Refresh</button>
              </div>

              {rows.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-slate-400 text-sm font-medium">No fees configured</p>
                  <p className="text-slate-300 text-xs mt-1">No fee categories apply to this student</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Fee</th>
                        <th className="px-4 py-3 font-semibold">Period</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                        <th className="px-4 py-3 font-semibold text-right">Paid</th>
                        <th className="px-4 py-3 font-semibold text-right">Due</th>
                        <th className="px-4 py-3 font-semibold text-right">Discount</th>
                        <th className="px-4 py-3 font-semibold text-right">Status</th>
                        <th className="px-5 py-3 font-semibold">Apply Discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row) => {
                        const isPaid = row.status === "Paid";
                        const draft = drafts[row.key] || {};
                        const maxDiscount = row.due + (row.discount || 0);
                        return (
                          <tr key={row.key} className="hover:bg-slate-50/60 transition">
                            <td className="px-5 py-3">
                              <p className={`font-medium ${isPaid ? "text-slate-400" : "text-slate-700"}`}>{row.feeName}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{row.frequency}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{row.period}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{fmt(row.amount)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600">{row.paid > 0 ? fmt(row.paid) : "—"}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${row.due > 0 ? "text-rose-500" : "text-slate-300"}`}>{row.due > 0 ? fmt(row.due) : "—"}</td>
                            <td className={`px-4 py-3 text-right ${row.discount > 0 ? "text-amber-600 font-semibold" : "text-slate-300"}`}>
                              {row.discount > 0 ? `− ${fmt(row.discount)}` : "—"}
                              {row.discountReason && row.discount > 0 && (
                                <p className="text-[10px] text-slate-400 font-normal max-w-[150px] ml-auto truncate" title={row.discountReason}>{row.discountReason}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✓ Paid</span>
                              ) : row.waived ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-600">Waived</span>
                              ) : row.status === "Partial" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Partial</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">Due</span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {isPaid ? (
                                <span className="text-xs text-slate-300">Not applicable (paid)</span>
                              ) : (
                                <div className="flex flex-col gap-1.5 min-w-[240px]">
                                  <div className="flex gap-1.5">
                                    <input type="number" min="0" max={maxDiscount || undefined} step="0.01"
                                      value={draft.amount ?? ""} placeholder={`Max ${row.amount}`}
                                      onChange={(e) => setDraft(row.key, "amount", e.target.value)}
                                      className={`${inputClass} w-24 text-right`} />
                                    <input type="text" value={draft.reason ?? ""} placeholder="Reason (optional)"
                                      onChange={(e) => setDraft(row.key, "reason", e.target.value)}
                                      className={`${inputClass} flex-1`} />
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button onClick={() => saveDiscount(row)} disabled={savingKey === row.key}
                                      className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                                      {savingKey === row.key ? "Saving..." : (row.discountId ? "Update" : "Apply")}
                                    </button>
                                    {row.discountId && (
                                      <button onClick={() => removeDiscount(row)} disabled={savingKey === row.key}
                                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-100 transition border border-rose-100 disabled:opacity-50">
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}