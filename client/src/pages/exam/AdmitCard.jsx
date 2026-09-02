import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import { bdYear } from "../../utils/bdTime";
import Toast from "../../components/Toast";

import StudentPicker from "../../components/StudentPicker";
import EligibilityCard from "../../components/exam/EligibilityCard";
import AdmitCardPreview from "../../components/exam/AdmitCardPreview";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AdmitCard = () => {
    const [searchParams] = useSearchParams();
    const { studentId: studentIdRoute } = useParams();
    const navigate = useNavigate();
    const isDedicated = Boolean(studentIdRoute);
    const studentId = searchParams.get("studentId")
        ? searchParams.get("studentId")
        : studentIdRoute;

    const [student, setStudent] = useState(null);
    const [eligibility, setEligibility] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [systemSettings, setSystemSettings] = useState(null);
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [toast, setToast] = useState(null);

    const [dueItems, setDueItems] = useState([]);
    const [feeLedger, setFeeLedger] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [fine, setFine] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [paymentMethodsList, setPaymentMethodsList] = useState(["Cash"]);
    const [transactionId, setTransactionId] = useState("");
    const [collecting, setCollecting] = useState(false);

    const printTimeoutRef = useRef(null);

    useEffect(() => {
        getSettings().then((res) => {
            setSystemSettings(res.data);
            if (res.data.paymentMethods?.length) setPaymentMethodsList(res.data.paymentMethods);
        }).catch(() => {
            setSystemSettings({ currentSession: "", academicSessions: [], paymentMethods: ["Cash"] });
        });
        api.get("/exams").then((res) => {
            const list = res.data?.exams || [];
            setExams(list);
            const active = list.find((e) => e.isActive);
            setSelectedExamId((prev) => prev || active?._id || list[0]?._id || "");
        }).catch(() => setExams([]));
    }, []);

    const selectedExam = exams.find((e) => e._id === selectedExamId) || null;

    const exam = {
        examName: selectedExam?.examName || "",
        academicSession: selectedExam?.academicSession || systemSettings?.currentSession || "",
    };

    const examRequiredFeeIds = useMemo(() => {
        if (!selectedExam?.requiredFees) return [];
        return selectedExam.requiredFees.map((r) => ({
            feeCategory: r.feeCategory?._id || r.feeCategory,
            applicableType: r.applicableType,
            month: r.month || null,
            year: r.year || null,
            examName: r.applicableType === "Exam" ? exam.examName : "",
            customTitle: r.customTitle || "",
        }));
    }, [selectedExam, exam.examName]);

    const filteredDueItems = useMemo(() => {
        if (examRequiredFeeIds.length === 0) return [];
        return dueItems.filter((d) => {
            return examRequiredFeeIds.some((r) => {
                if (r.feeCategory && String(d.feeCategory) !== String(r.feeCategory)) return false;
                if (r.applicableType !== d.applicableType) return false;
                if (r.applicableType === "Month") {
                    return Number(d.month) === Number(r.month) && Number(d.year) === Number(r.year);
                }
                if (r.applicableType === "Exam") {
                    return d.examName === r.examName;
                }
                return true;
            });
        });
    }, [dueItems, examRequiredFeeIds]);

    const selectedFees = useMemo(() => filteredDueItems.filter((_, i) => selectedItems.includes(i)), [filteredDueItems, selectedItems]);
    const subtotal = useMemo(() => selectedFees.reduce((s, f) => s + Number(f.amount || 0), 0), [selectedFees]);
    const total = subtotal + Number(fine || 0);

    const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

    const inputClass = "w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition bg-white";
    const labelClass = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

    // ==========================
    // LOAD ELIGIBILITY
    // ==========================
    const loadEligibility = async (selectedStudent) => {
        try {
            setLoading(true);
            setStudent(selectedStudent);
            if (!selectedExamId) { setLoading(false); return; }
            const res = await api.get(
                `/payments/admit-card/${selectedStudent.studentId}?examId=${selectedExamId}`
            );
            setEligibility({ reasons: [], ...res.data });
        }
        catch (error) {
            console.log(error);
            setToast({ message: error.response?.data?.message || "Failed to check eligibility.", type: "error" });
        }
        finally { setLoading(false); }
    };

    const loadDueItems = async (selectedStudent) => {
        if (!selectedStudent?._id) return;
        setLoadingData(true);
        try {
            const res = await api.get(`/payments/due-items/${selectedStudent._id}`);
            if (res.data.success) {
                setDueItems(res.data.dueItems || []);
                setFeeLedger(res.data.feeLedger || []);
            }
        } catch { /* silent */ }
        finally { setLoadingData(false); }
    };

    useEffect(() => {
        if (!studentId) { setStudent(null); setEligibility(null); setDueItems([]); return; }
        const loadStudent = async () => {
            if (/^[0-9a-fA-F]{24}$/.test(studentId)) {
                try {
                    const res = await api.get(`/students/${studentId}`);
                    setStudent(res.data);
                    await Promise.all([loadEligibility(res.data), loadDueItems(res.data)]);
                    return;
                } catch { /* fall through */ }
            }
            let list = [];
            try { const res = await api.get(`/students/search?q=${studentId}`); list = res.data || []; }
            catch { const res = await api.get(`/students?search=${encodeURIComponent(studentId)}`); list = res.data || []; }
            if (list.length > 0) {
                setStudent(list[0]);
                await Promise.all([loadEligibility(list[0]), loadDueItems(list[0])]);
            }
        };
        loadStudent();
    }, [studentId, selectedExamId]);

    const handleStudentSelect = (s) => {
        setStudent(s);
        setSelectedItems([]);
        setFine(0);
        setDueItems([]);
        loadEligibility(s);
        loadDueItems(s);
    };

    const toggleSelectAll = () => {
        const allIndices = filteredDueItems.map((_, i) => i);
        setSelectedItems((prev) => prev.length === allIndices.length ? [] : allIndices);
    };

    const toggleItem = (index) => {
        setSelectedItems((prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]);
    };

    // ==========================
    // COLLECT REQUIRED FEES
    // ==========================
    const submitPayment = async () => {
        if (!student) return showToast("Select a student first.", "error");
        if (selectedFees.length === 0) return showToast("Select at least one required fee.", "error");
        if (paymentMethod !== "Cash" && !transactionId.trim())
            return showToast(`Transaction ID is required for ${paymentMethod} payments.`, "error");

        setCollecting(true);
        try {
            let remaining = total;
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
                    examName: fee.applicableType === "Exam" ? (fee.examName || exam.examName) : "",
                    payableAmount: payable,
                    paidAmount: paid,
                    dueAmount: payable - paid,
                    discount: 0,
                    fine: 0,
                    eligibleForAdmitCard: true,
                };
            });

            await api.post("/payments/collect", {
                student: student._id,
                receivedBy: JSON.parse(localStorage.getItem("teacher"))?._id,
                paymentMethod,
                transactionId,
                totalFine: Number(fine),
                paidAmount: total,
                items,
            });

            showToast("Required fees collected successfully.", "success");
            setFine(0);
            setTransactionId("");
            setSelectedItems([]);
            await Promise.all([loadEligibility(student), loadDueItems(student)]);
        }
        catch (error) {
            console.log(error);
            showToast(error.response?.data?.message || "Payment failed.", "error");
        }
        finally { setCollecting(false); }
    };

    const showToast = (message, type = "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ==========================
    // PRINT
    // ==========================
    const handlePrint = () => {
        setIsPrinting(true);
        requestAnimationFrame(() => { setTimeout(() => { window.print(); }, 500); });
    };

    useEffect(() => {
        const afterPrint = () => { setIsPrinting(false); };
        window.addEventListener("afterprint", afterPrint);
        return () => { window.removeEventListener("afterprint", afterPrint); };
    }, []);

    useEffect(() => {
        return () => { if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current); };
    }, []);

    const showCollectPanel = selectedExam && student && filteredDueItems.length > 0;

    return (
        <>
            <div className="min-h-screen bg-slate-100">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white">
                    <div className="max-w-7xl mx-auto px-6 py-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-5xl font-black">Admit Card</h1>
                                <p className="mt-3 text-white/80 text-lg">Generate Student Admit Card</p>
                            </div>
                            {isDedicated && (
                                <button onClick={() => navigate("/exam/admit-card")}
                                    className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-white/90 text-sm font-semibold transition">
                                    ← All Students
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* EXAM SELECTOR */}
                    <div className="bg-white rounded-3xl shadow-xl p-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="min-w-[280px] flex-1">
                                <label className="block text-sm font-bold text-slate-600 mb-2">Select Exam</label>
                                <select value={selectedExamId} onChange={(e) => {
                                    setSelectedExamId(e.target.value);
                                    setSelectedItems([]);
                                    setDueItems([]);
                                    if (student) { loadEligibility(student); loadDueItems(student); }
                                }} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition">
                                    {exams.length === 0 && <option value="">No exams found</option>}
                                    {exams.map((ex) => (
                                        <option key={ex._id} value={ex._id}>
                                            {ex.examName}{ex.examCode ? ` (${ex.examCode})` : ""} — {ex.academicSession}{ex.isActive ? "" : " (inactive)"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-[220px]">
                                <label className="block text-sm font-bold text-slate-600 mb-2">Required Fees</label>
                                <div className="px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-semibold text-slate-600">
                                    {selectedExam?.requiredFees?.length > 0
                                        ? `${selectedExam.requiredFees.length} fee${selectedExam.requiredFees.length !== 1 ? "s" : ""} configured`
                                        : "No required fees"}
                                </div>
                            </div>
                            <div className="min-w-[220px]">
                                <label className="block text-sm font-bold text-slate-600 mb-2">Admit Card Window</label>
                                <div className="px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-sm font-semibold text-slate-600">
                                    {selectedExam && (selectedExam.admitCardStart || selectedExam.admitCardEnd)
                                        ? `${selectedExam.admitCardStart ? new Date(selectedExam.admitCardStart).toLocaleDateString("en-GB") : "any"} → ${selectedExam.admitCardEnd ? new Date(selectedExam.admitCardEnd).toLocaleDateString("en-GB") : "any"}`
                                        : "Not set"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isDedicated && (
                        <StudentPicker
                            title="Search or browse students by class"
                            onSelect={handleStudentSelect}
                            onOpen={(s) => navigate(`/admit-card/${s.studentId}`)}
                            selectedId={student?._id}
                        />
                    )}

                    {/* ELIGIBILITY */}
                    <div className="mt-8">
                        <EligibilityCard
                            eligibility={eligibility}
                            loading={loading}
                            onGenerate={() => {
                                setTimeout(() => {
                                    document.getElementById("admit-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }, 100);
                            }}
                        />
                    </div>

                    {/* REQUIRED FEES COLLECTION TABLE */}
                    {showCollectPanel && (
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* LEFT: Required Fees Table */}
                            <div className="lg:col-span-2">
                                <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-base font-bold text-slate-800">Required Fees for Admit Card</h2>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {filteredDueItems.length === 0
                                                    ? "All required fees settled"
                                                    : `${filteredDueItems.length} unpaid required fee${filteredDueItems.length !== 1 ? "s" : ""}`
                                                }
                                            </p>
                                        </div>
                                        <button onClick={() => loadDueItems(student)}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5">
                                            ↻ Refresh
                                        </button>
                                    </div>

                                    {loadingData ? (
                                        <div className="p-12 text-center">
                                            <div className="animate-spin w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                                            <p className="text-xs text-slate-400">Loading student fees...</p>
                                        </div>
                                    ) : filteredDueItems.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-400"><path d="M20 6 9 17l-5-5" /></svg>
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium">All required fees are paid</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                                                        <th className="px-5 py-3 w-12">
                                                            <input type="checkbox"
                                                                checked={selectedItems.length === filteredDueItems.length && filteredDueItems.length > 0}
                                                                onChange={toggleSelectAll}
                                                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                                        </th>
                                                        <th className="px-4 py-3 font-semibold">Fee</th>
                                                        <th className="px-4 py-3 font-semibold">Period</th>
                                                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                                                        <th className="px-4 py-3 font-semibold text-right">Discount</th>
                                                        <th className="px-5 py-3 font-semibold text-right">Due</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {filteredDueItems.map((item, idx) => {
                                                        const on = selectedItems.includes(idx);
                                                        const period = item.applicableType === "Month"
                                                            ? `${months[(item.month || 1) - 1]} ${item.year}`
                                                            : item.applicableType === "Exam"
                                                                ? item.examName
                                                                : item.applicableType;
                                                        return (
                                                            <tr key={idx} className={`transition ${on ? "bg-emerald-50/50" : "hover:bg-slate-50/60"}`}>
                                                                <td className="px-5 py-3">
                                                                    <input type="checkbox" checked={on} onChange={() => toggleItem(idx)}
                                                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-slate-700">{item.feeName}</td>
                                                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{period}</td>
                                                                <td className="px-4 py-3 text-right text-slate-600">{fmt(item.amount)}</td>
                                                                <td className="px-4 py-3 text-right text-slate-400">{item.discount > 0 ? fmt(item.discount) : "—"}</td>
                                                                <td className="px-5 py-3 text-right font-semibold text-rose-500">{fmt(item.amount)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {filteredDueItems.length > 0 && (
                                        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm">
                                            <span className="text-slate-500">
                                                {selectedItems.length} of {filteredDueItems.length} item{filteredDueItems.length !== 1 ? "s" : ""} selected
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                Subtotal: <span className="text-emerald-700">{fmt(subtotal)}</span>
                                            </span>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* RIGHT: Payment Summary */}
                            <aside className="lg:sticky lg:top-24">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-800">Payment Summary</h2>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Collect required fees</p>
                                        </div>
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                            {selectedItems.length} {selectedItems.length === 1 ? "item" : "items"}
                                        </span>
                                    </div>
                                    <div className="p-5 space-y-5">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Subtotal</span>
                                                <span className="font-semibold text-slate-700">{fmt(subtotal)}</span>
                                            </div>
                                            {selectedFees.length > 0 && (
                                                <div className="flex items-center justify-between gap-3 text-sm">
                                                    <span className="text-slate-500 shrink-0">Fine</span>
                                                    <input type="number" value={fine} onChange={(e) => setFine(e.target.value)} min="0" step="0.01" placeholder="0"
                                                        className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-right text-sm font-semibold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition bg-white" />
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
                                                    <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setTransactionId(""); }} className={inputClass}>
                                                        {paymentMethodsList.map((m) => (<option key={m}>{m}</option>))}
                                                    </select>
                                                </div>

                                                {paymentMethod !== "Cash" && (
                                                    <div>
                                                        <label className={labelClass}>Transaction ID *</label>
                                                        <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                                                            placeholder={`Required for ${paymentMethod}`} className={inputClass} />
                                                    </div>
                                                )}

                                                <button onClick={submitPayment} disabled={collecting}
                                                    className="w-full px-8 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                                                    {collecting ? (
                                                        <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Processing...</>
                                                    ) : (
                                                        <>
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                                <path d="M20 6 9 17l-5-5" />
                                                            </svg>
                                                            Collect Required Fees
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

                    {/* ADMIT CARD PREVIEW */}
                    {eligibility?.eligible && student && (
                        <div id="admit-preview" className="mt-10">
                            <AdmitCardPreview student={student} exam={exam} onPrint={handlePrint} isPrinting={isPrinting} />
                        </div>
                    )}

                    {/* NOT ELIGIBLE MESSAGE */}
                    {eligibility && !eligibility.eligible && (
                        <div className="mt-8 bg-red-50 border border-red-200 rounded-3xl p-8">
                            <h2 className="text-2xl font-bold text-red-700">Admit Card Cannot Be Generated</h2>
                            <p className="mt-3 text-red-600">Please clear the following issues before generating the Admit Card.</p>
                            <ul className="mt-6 space-y-3">
                                {(eligibility.reasons || []).map((reason, index) => (
                                    <li key={index} className="flex items-center gap-3 text-red-700 font-medium">❌ {reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
            {/* PRINT STYLE */}
            <style>{`
                @page { size: A4 portrait; margin: 0; }
                @media print {
                    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: white; overflow: hidden; }
                    body * { visibility: hidden; }
                    #admit-card, #admit-card * { visibility: visible; }
                    #admit-card { position: absolute; left: 0; top: 0; width: 210mm; min-height: 149mm; height: auto; overflow: visible; background: white; box-shadow: none !important; border: none !important; page-break-after: avoid; page-break-inside: avoid; }
                    #admit-card > * { page-break-inside: avoid; break-inside: avoid; }
                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    #admit-card .text-4xl { font-size: 2.25rem !important; }
                    #admit-card .text-3xl { font-size: 1.875rem !important; }
                    #admit-card .text-2xl { font-size: 1.5rem !important; }
                    #admit-card .grid { display: grid !important; }
                    #admit-card .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
                    #admit-card .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                    #admit-card .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    #admit-card .col-span-3 { grid-column: span 3 / span 3 !important; }
                    #admit-card .col-span-9 { grid-column: span 9 / span 9 !important; }
                    #admit-card img { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
                    #admit-card svg { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
                    #admit-card .react-barcode { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
                }
            `}</style>
        </>
    );
};

export default AdmitCard;
