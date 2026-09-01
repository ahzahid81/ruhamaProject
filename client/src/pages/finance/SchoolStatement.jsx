import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const ACCOUNTS = ["Cash", "bKash", "Bank"];

const categorySuggestions = [
  "Rent", "Electricity", "Water", "Staff Salary", "Stationery",
  "Building Repair", "Transport", "Food", "Medical", "Gifts", "Development", "Other",
];

const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const todayInput = () => new Date().toISOString().slice(0, 10);

const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-white";
const labelClass = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

const tabs = [
  { key: "overview", label: "Overview", icon: "▦" },
  { key: "expenses", label: "Expenses", icon: "↘" },
  { key: "transfer", label: "Fund Transfer", icon: "⇄" },
  { key: "history", label: "Audit History", icon: "⊕" },
];

export default function SchoolStatement() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [expenseForm, setExpenseForm] = useState({ account: "Cash", amount: "", category: "", note: "", date: todayInput() });
  const [transferForm, setTransferForm] = useState({ fromAccount: "Cash", toAccount: "bKash", amount: "", charge: "", chargeAccount: "Cash", note: "", date: todayInput() });
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ cash: "", bkash: "", bank: "", note: "" });

  useEffect(() => {
    try {
      const teacher = JSON.parse(localStorage.getItem("teacher"));
      setIsAdmin(teacher?.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const showToast = (text, type = "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStatement = useCallback(async () => {
    try {
      const res = await api.get("/statement");
      if (res.data.success) setData(res.data);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to load statement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  const setExp = (field, value) => setExpenseForm((p) => ({ ...p, [field]: value }));

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!(Number(expenseForm.amount) > 0)) return showToast("Enter a valid expense amount.");
    setSaving(true);
    try {
      await api.post("/statement/expense", {
        account: expenseForm.account,
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.note,
        date: expenseForm.date ? new Date(expenseForm.date).toISOString() : undefined,
      });
      showToast("Expense recorded.", "success");
      setExpenseForm({ ...expenseForm, amount: "", category: "", note: "" });
      await loadStatement();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/statement/expense/${id}`);
      showToast("Expense deleted.", "success");
      await loadStatement();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  const setTr = (field, value) => {
    if (field === "fromAccount") {
      setTransferForm((p) => ({ ...p, fromAccount: value, chargeAccount: p.chargeAccount === p.fromAccount ? value : p.chargeAccount }));
    } else {
      setTransferForm((p) => ({ ...p, [field]: value }));
    }
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    if (transferForm.fromAccount === transferForm.toAccount) return showToast("Source and destination must be different.");
    if (!(Number(transferForm.amount) > 0)) return showToast("Enter a valid transfer amount.");
    setSaving(true);
    try {
      await api.post("/statement/fund-transfer", {
        fromAccount: transferForm.fromAccount,
        toAccount: transferForm.toAccount,
        amount: Number(transferForm.amount),
        charge: Number(transferForm.charge || 0),
        chargeAccount: Number(transferForm.charge || 0) > 0 ? transferForm.chargeAccount : transferForm.fromAccount,
        note: transferForm.note,
        date: transferForm.date ? new Date(transferForm.date).toISOString() : undefined,
      });
      showToast("Fund moved.", "success");
      setTransferForm({ ...transferForm, amount: "", charge: "", note: "" });
      await loadStatement();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to transfer funds.");
    } finally {
      setSaving(false);
    }
  };

  const removeTransfer = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/statement/fund-transfer/${id}`);
      showToast("Transfer deleted.", "success");
      await loadStatement();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete transfer.");
    } finally {
      setDeletingId(null);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    if ([resetForm.cash, resetForm.bkash, resetForm.bank].some((v) => Number(v) < 0 || v === "")) {
      return showToast("Enter valid opening Cash, bKash and Bank amounts.");
    }
    setSaving(true);
    try {
      const res = await api.post("/statement/reset", {
        openingBalances: {
          cash: Number(resetForm.cash),
          bkash: Number(resetForm.bkash),
          bank: Number(resetForm.bank),
        },
        note: resetForm.note,
      });
      showToast(res.data.message || "Account reset.", "success");
      setResetOpen(false);
      setResetForm({ cash: "", bkash: "", bank: "", note: "" });
      await loadStatement();
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to reset account.");
    } finally {
      setSaving(false);
    }
  };

  const accounts = data?.accounts || [];
  const totals = data?.totals || {};
  const period = data?.period || null;

  const accountColor = {
    Cash: { dot: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", line: "from-emerald-500 to-teal-600" },
    bKash: { dot: "bg-pink-500", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", line: "from-pink-500 to-rose-600" },
    Bank: { dot: "bg-sky-500", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", line: "from-sky-500 to-indigo-600" },
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 21h18" />
                <path d="M5 19V8" />
                <path d="M9 19V5" />
                <path d="M13 19v-9" />
                <path d="M17 19V3" />
                <path d="M21 19V10" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">School Statement</h1>
              <p className="text-xs text-slate-400">Cash · bKash · Bank funds, expenses & audit periods</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setResetOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-200 hover:from-rose-600 hover:to-red-700 transition flex items-center gap-2">
              ↻ Close Audit & Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {loading ? (
          <section className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading statement...</p>
          </section>
        ) : (
          <>
            {/* KPI cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {accounts.map((a) => {
                const c = accountColor[a.key] || accountColor.Cash;
                return (
                  <div key={a.key} className={`rounded-2xl p-5 border ${c.border} ${c.bg} shadow-sm relative overflow-hidden`}>
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.line}`} />
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${c.text}`}>{a.key}</p>
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                    </div>
                    <p className="text-2xl font-black text-slate-800 mt-2">{fmt(a.current)}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Opening {fmt(a.opening)}</p>
                  </div>
                );
              })}
              <div className="rounded-2xl p-5 border border-slate-200 bg-slate-900 shadow-md relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-500 to-slate-700" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total In Hand</p>
                <p className="text-2xl font-black text-white mt-2">{fmt(totals.inHand)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Cash + bKash + Bank</p>
              </div>
            </section>

            {/* Period banner */}
            {period && (
              <section className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    <b className="text-slate-800">Audit period active</b> since <b className="text-slate-700">{fmtDate(period.periodStart)}</b>
                    {period.academicSession ? ` · Session ${period.academicSession}` : ""}
                    {period.note ? ` · ${period.note}` : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                  {ACCOUNTS.map((a) => {
                    const k = a === "bKash" ? "bkash" : a.toLowerCase();
                    const v = period.openingBalances?.[k];
                    return <span key={a} className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">Opening {a} · {fmt(v)}</span>;
                  })}
                </div>
              </section>
            )}

            {/* Tabs */}
            <div className="flex gap-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit max-w-full overflow-x-auto">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                    tab === t.key ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:bg-slate-100"
                  }`}>
                  <span className="mr-1.5">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {tab === "overview" && (
              <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Statement Breakdown</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Income counts completed payments only. bKash bucket also holds Nagad/Rocket/Card/Online received funds.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Account</th>
                        <th className="px-4 py-3 font-semibold text-right">Opening</th>
                        <th className="px-4 py-3 font-semibold text-right">Income</th>
                        <th className="px-4 py-3 font-semibold text-right">Expense</th>
                        <th className="px-4 py-3 font-semibold text-right">Transfer In</th>
                        <th className="px-4 py-3 font-semibold text-right">Transfer Out</th>
                        <th className="px-4 py-3 font-semibold text-right">Charges</th>
                        <th className="px-5 py-3 font-semibold text-right">Current</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accounts.map((a) => (
                        <tr key={a.key} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3 font-semibold text-slate-700">{a.key}</td>
                          <td className="px-4 py-3 text-right text-slate-500">{fmt(a.opening)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600">{fmt(a.income)}</td>
                          <td className="px-4 py-3 text-right text-rose-600">{fmt(a.expense)}</td>
                          <td className="px-4 py-3 text-right text-indigo-600">{fmt(a.transferIn)}</td>
                          <td className="px-4 py-3 text-right text-amber-600">− {fmt(a.transferOut)}</td>
                          <td className="px-4 py-3 text-right text-rose-500">{fmt(a.charges)}</td>
                          <td className="px-5 py-3 text-right font-black text-slate-800">{fmt(a.current)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold">
                        <td className="px-5 py-3 text-slate-800">Total</td>
                        <td className="px-4 py-3 text-right text-slate-500">{fmt(totals.opening)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{fmt(totals.income)}</td>
                        <td className="px-4 py-3 text-right text-rose-600">{fmt(totals.expense)}</td>
                        <td className="px-4 py-3 text-right text-indigo-600">{fmt(totals.transferIn)}</td>
                        <td className="px-4 py-3 text-right text-amber-600">− {fmt(totals.transferOut)}</td>
                        <td className="px-4 py-3 text-right text-rose-500">{fmt(totals.charges)}</td>
                        <td className="px-5 py-3 text-right text-slate-900">{fmt(totals.inHand)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* EXPENSES */}
            {tab === "expenses" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 mb-1">Record Expense</h2>
                  <p className="text-xs text-slate-400 mb-4">Money paid out from a fund account</p>
                  <form onSubmit={submitExpense} className="space-y-3.5">
                    <div>
                      <label className={labelClass}>Pay From</label>
                      <select value={expenseForm.account} onChange={(e) => setExp("account", e.target.value)} className={inputClass}>
                        {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Amount (BDT)</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={expenseForm.amount}
                        onChange={(e) => setExp("amount", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Category</label>
                      <input type="text" list="expense-categories" value={expenseForm.category}
                        onChange={(e) => setExp("category", e.target.value)} className={inputClass} placeholder="e.g. Electricity" />
                      <datalist id="expense-categories">
                        {categorySuggestions.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className={labelClass}>Details</label>
                      <textarea rows="2" value={expenseForm.note} onChange={(e) => setExp("note", e.target.value)}
                        className={inputClass} placeholder="What was this expense for?" />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" value={expenseForm.date} onChange={(e) => setExp("date", e.target.value)} className={inputClass} />
                    </div>
                    <button type="submit" disabled={saving}
                      className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition disabled:opacity-50">
                      {saving ? "Saving..." : "Add Expense"}
                    </button>
                  </form>
                </section>

                <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-800">Recent Expenses</h2>
                    <button onClick={loadStatement} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition">↻ Refresh</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                          <th className="px-5 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Category</th>
                          <th className="px-4 py-3 font-semibold">Details</th>
                          <th className="px-4 py-3 font-semibold">Account</th>
                          <th className="px-4 py-3 font-semibold text-right">Amount</th>
                          <th className="px-5 py-3 font-semibold text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(data?.recentExpenses || []).length === 0 ? (
                          <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-300 text-sm font-medium">No expenses recorded yet in this period</td></tr>
                        ) : (data?.recentExpenses || []).map((x) => (
                          <tr key={x._id} className="hover:bg-slate-50/60 transition">
                            <td className="px-5 py-3 whitespace-nowrap text-slate-500">{fmtDate(x.date)}</td>
                            <td className="px-4 py-3">
                              {x.category ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{x.category}</span> : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate">{x.description || "—"}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${accountColor[x.account]?.bg || "bg-slate-100"} ${accountColor[x.account]?.text || "text-slate-600"}`}>{x.account}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-rose-600">− {fmt(x.amount)}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => removeExpense(x._id)} disabled={deletingId === x._id}
                                title="Delete" className="p-1.5 text-slate-300 hover:text-rose-600 transition">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* FUND TRANSFER */}
            {tab === "transfer" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit">
                  <h2 className="text-base font-bold text-slate-800 mb-1">Move Funds</h2>
                  <p className="text-xs text-slate-400 mb-4">Transfer between accounts (transfer charges optional)</p>
                  <form onSubmit={submitTransfer} className="space-y-3.5">
                    <div>
                      <label className={labelClass}>From</label>
                      <select value={transferForm.fromAccount} onChange={(e) => setTr("fromAccount", e.target.value)} className={inputClass}>
                        {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>To</label>
                      <select value={transferForm.toAccount} onChange={(e) => setTr("toAccount", e.target.value)} className={inputClass}>
                        {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Amount (BDT)</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={transferForm.amount}
                        onChange={(e) => setTr("amount", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Transfer Charge (BDT)</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={transferForm.charge}
                        onChange={(e) => setTr("charge", e.target.value)} className={inputClass} />
                    </div>
                    {Number(transferForm.charge) > 0 && (
                      <div>
                        <label className={labelClass}>Charge Deducted From</label>
                        <select value={transferForm.chargeAccount} onChange={(e) => setTr("chargeAccount", e.target.value)} className={inputClass}>
                          {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Note</label>
                      <input type="text" value={transferForm.note} onChange={(e) => setTr("note", e.target.value)}
                        className={inputClass} placeholder="Optional reference" />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input type="date" value={transferForm.date} onChange={(e) => setTr("date", e.target.value)} className={inputClass} />
                    </div>
                    <button type="submit" disabled={saving}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                      {saving ? "Processing..." : "Transfer"}
                    </button>
                  </form>
                </section>

                <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-800">Recent Transfers</h2>
                    <button onClick={loadStatement} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition">↻ Refresh</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                          <th className="px-5 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Route</th>
                          <th className="px-4 py-3 font-semibold">Note</th>
                          <th className="px-4 py-3 font-semibold text-right">Amount</th>
                          <th className="px-4 py-3 font-semibold text-right">Charge</th>
                          <th className="px-5 py-3 font-semibold text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(data?.recentTransfers || []).length === 0 ? (
                          <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-300 text-sm font-medium">No fund transfers yet in this period</td></tr>
                        ) : (data?.recentTransfers || []).map((x) => (
                          <tr key={x._id} className="hover:bg-slate-50/60 transition">
                            <td className="px-5 py-3 whitespace-nowrap text-slate-500">{fmtDate(x.date)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${accountColor[x.fromAccount]?.bg || "bg-slate-100"} ${accountColor[x.fromAccount]?.text || "text-slate-600"}`}>{x.fromAccount}</span>
                              <span className="mx-1.5 text-slate-400">→</span>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${accountColor[x.toAccount]?.bg || "bg-slate-100"} ${accountColor[x.toAccount]?.text || "text-slate-600"}`}>{x.toAccount}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate">{x.note || "—"}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-700">{fmt(x.amount)}</td>
                            <td className="px-4 py-3 text-right text-rose-500">{x.charge > 0 ? `− ${fmt(x.charge)}` : "—"}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={() => removeTransfer(x._id)} disabled={deletingId === x._id}
                                title="Delete" className="p-1.5 text-slate-300 hover:text-rose-600 transition">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* AUDIT HISTORY */}
            {tab === "history" && (
              <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Audit History</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Each reset closes one period and starts the next</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Reset At</th>
                        <th className="px-4 py-3 font-semibold">Session</th>
                        <th className="px-4 py-3 font-semibold text-right">Closed Cash</th>
                        <th className="px-4 py-3 font-semibold text-right">Closed bKash</th>
                        <th className="px-4 py-3 font-semibold text-right">Closed Bank</th>
                        <th className="px-4 py-3 font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.history || []).length === 0 ? (
                        <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-300 text-sm font-medium">No audits closed yet</td></tr>
                      ) : (data?.history || []).map((h) => (
                        <tr key={h._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3 whitespace-nowrap text-slate-600">{fmtDate(h.periodStart)} {new Date(h.periodStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="px-4 py-3 text-slate-500">{h.academicSession || "—"}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{fmt(h.closingBalances?.cash)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{fmt(h.closingBalances?.bkash)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{fmt(h.closingBalances?.bank)}</td>
                          <td className="px-4 py-3 text-slate-500 max-w-[240px] truncate">{h.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* RESET MODAL */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-br from-rose-500 to-red-600 text-white">
              <h2 className="text-lg font-bold">Close Audit & Reset</h2>
              <p className="text-xs text-rose-100 mt-1">Current balances are recorded, then counting restarts from your input</p>
            </div>
            <form onSubmit={submitReset} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: "cash", label: "Opening Cash (BDT)", color: "border-emerald-200 focus:ring-emerald-500/40" },
                  { key: "bkash", label: "Opening bKash (BDT)", color: "border-pink-200 focus:ring-pink-500/40" },
                  { key: "bank", label: "Opening Bank (BDT)", color: "border-sky-200 focus:ring-sky-500/40" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className={labelClass}>{f.label}</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={resetForm[f.key]}
                      onChange={(e) => setResetForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      className={`${inputClass} ${f.color}`} />
                  </div>
                ))}
              </div>
              <div>
                <label className={labelClass}>Note</label>
                <input type="text" value={resetForm.note} onChange={(e) => setResetForm((p) => ({ ...p, note: e.target.value }))}
                  className={inputClass} placeholder="Optional audit note" />
              </div>
              <div className="pt-1 flex gap-3">
                <button type="button" onClick={() => setResetOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition disabled:opacity-50">
                  {saving ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}