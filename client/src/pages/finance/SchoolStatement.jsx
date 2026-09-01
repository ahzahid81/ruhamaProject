import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";

const categorySuggestions = [
  "Rent", "Electricity", "Water", "Staff Salary", "Stationery",
  "Building Repair", "Transport", "Food", "Medical", "Gifts", "Development", "Other",
];

const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition bg-white";
const labelClass = "block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5";

const tabs = [
  { key: "overview", label: "Overview", icon: "▦" },
  { key: "payments", label: "Payments", icon: "↗" },
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

  const [expenseForm, setExpenseForm] = useState({ account: "", amount: "", category: "", note: "", date: "" });
  const [transferForm, setTransferForm] = useState({ fromAccount: "", toAccount: "", amount: "", charge: "", chargeAccount: "", note: "", date: "" });
  const [dlFrom, setDlFrom] = useState("");
  const [dlTo, setDlTo] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ note: "" });
  const [resetBalances, setResetBalances] = useState({});

  const accountList = (data?.accounts || []).map((a) => a.key);

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

  const applyPayload = (payload) => {
    if (payload && payload.accounts) setData(payload);
  };

  const downloadCSV = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (dlFrom) params.set("from", dlFrom);
      if (dlTo) params.set("to", dlTo);
      const res = await api.get(`/statement/export?${params.toString()}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `school-statement-${dlFrom || "all"}-${dlTo || "now"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Statement downloaded.", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const openPrint = () => {
    if (!data) return;
    setPrintOpen(true);
  };

  // Send no date for today's entries so the server stamps the real current
  // time (entries stay inside the current audit period no matter timezone).
  const nextDate = (date) => {
    if (!date) return undefined;
    const d = new Date(date);
    const t = new Date();
    if (d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()) {
      return undefined;
    }
    return d.toISOString();
  };

  useEffect(() => {
    if (!printOpen || !data) return;
    const accounts = data.accounts || [];
    const totals = data.totals || {};
    const rows = (list, mapper) => (list || []).map(mapper).join("") || `<tr><td colspan="100%" class="empty">No entries</td></tr>`;
    const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const accBody = rows(accounts, (a) => `
      <tr>
        <td>${esc(a.key)}</td>
        <td class="num">${fmt(a.opening)}</td>
        <td class="num">${fmt(a.income)}</td>
        <td class="num">${fmt(a.expense)}</td>
        <td class="num">${fmt(a.transferIn)}</td>
        <td class="num">${fmt(a.transferOut)}</td>
        <td class="num">${fmt(a.charges)}</td>
        <td class="num strong">${fmt(a.current)}</td>
      </tr>`);

    const payBody = rows(data.recentPayments, (p) => `
      <tr>
        <td class="muted">${esc(fmtDate(p.receiveDate))}</td>
        <td>${esc(p.receiptNo || "—")}</td>
        <td>${esc(p.studentName || p.studentId || "—")}</td>
        <td>${esc(p.paymentMethod || "—")}</td>
        <td class="num">${fmt(p.paidAmount)}</td>
      </tr>`);

    const expenseBody = rows(data.recentExpenses, (x) => `
      <tr>
        <td class="muted">${esc(fmtDate(x.date))}</td>
        <td>${esc(x.category || "—")}</td>
        <td>${esc(x.description || "—")}</td>
        <td>${esc(x.account)}</td>
        <td class="num">${fmt(x.amount)}</td>
      </tr>`);

    const transferBody = rows(data.recentTransfers, (x) => `
      <tr>
        <td class="muted">${esc(fmtDate(x.date))}</td>
        <td>${esc(x.fromAccount)} → ${esc(x.toAccount)}</td>
        <td>${esc(x.note || "—")}</td>
        <td class="num">${fmt(x.amount)}</td>
        <td class="num">${x.charge > 0 ? fmt(x.charge) : "—"}</td>
      </tr>`);

    const accNames = accounts.map((a) => a.key).join(" · ");

    const w = window.open("", "_blank", "width=1000,height=750");
    if (!w) {
      showToast("Popup blocked. Please allow popups for this site.", "error");
      setPrintOpen(false);
      return;
    }
    w.document.open();
    w.document.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 28px 36px; font-size: 12px; }
  h1 { margin: 0; font-size: 22px; }
  .sub { color: #64748b; font-size: 11px; margin-top: 2px; }
  .head { border-bottom: 3px solid #4f46e5; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .05em; color: #4f46e5; margin: 22px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f5f9; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #475569; padding: 6px 8px; border: 1px solid #cbd5e1; }
  td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .strong { font-weight: bold; }
  .muted { color: #64748b; }
  .tot td { background: #f8fafc; font-weight: bold; }
  .empty { text-align: center; color: #94a3b8; padding: 14px; }
  .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; margin-top: 12px; }
  .meta div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; }
  .meta .l { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; }
  .meta .v { font-size: 14px; font-weight: bold; margin-top: 2px; }
  .printbar { position: fixed; top: 0; left: 0; right: 0; background: #111827; color: #fff; padding: 10px 16px; display: flex; align-items: center; gap: 12px; z-index: 999; }
  .printbar button { background: #4f46e5; border: 0; color: #fff; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
  @media print { .printbar { display: none; } body { margin: 10mm; } }
</style></head><body>
<div class="printbar">
  <span>Statement preview</span>
  <button onclick="window.print()">🖨 Print</button>
</div>
<div class="head">
  <div><h1>School Financial Statement</h1><div class="sub">${esc(accNames)} — generated on ${esc(fmtDate(new Date()))} ${esc(fmtTime(new Date()))}</div></div>
  <div class="sub">Audit period active since ${esc(fmtDate(data.period?.periodStart || new Date()))} ${esc(fmtTime(data.period?.periodStart))}${data.period?.academicSession ? ` · Session ${esc(data.period.academicSession)}` : ""}</div>
</div>

<div class="meta">
  ${accounts.map((a) => `<div><div class="l">Opening ${esc(a.key)}</div><div class="v">${fmt(a.opening)}</div></div>`).join("")}
  ${accounts.map((a) => `<div><div class="l">Current ${esc(a.key)}</div><div class="v">${fmt(a.current)}</div></div>`).join("")}
  <div><div class="l">Total In Hand</div><div class="v">${fmt(totals.inHand)}</div></div>
</div>

<h2>Statement Breakdown</h2>
<table><thead><tr><th>Account</th><th class="num">Opening</th><th class="num">Income</th><th class="num">Expense</th><th class="num">Transfer In</th><th class="num">Transfer Out</th><th class="num">Charges</th><th class="num">Current</th></tr></thead>
<tbody>${accBody}<tr class="tot"><td>Total</td><td class="num">${fmt(totals.opening)}</td><td class="num">${fmt(totals.income)}</td><td class="num">${fmt(totals.expense)}</td><td class="num">${fmt(totals.transferIn)}</td><td class="num">${fmt(totals.transferOut)}</td><td class="num">${fmt(totals.charges)}</td><td class="num">${fmt(totals.inHand)}</td></tr></tbody></table>

<h2>Payments Received (recent ${(data.recentPayments || []).length})</h2>
<table><thead><tr><th>Date</th><th>Receipt</th><th>Student</th><th>Method</th><th class="num">Amount</th></tr></thead><tbody>${payBody}</tbody></table>

<h2>Expenses (recent ${(data.recentExpenses || []).length})</h2>
<table><thead><tr><th>Date</th><th>Category</th><th>Details</th><th>Account</th><th class="num">Amount</th></tr></thead><tbody>${expenseBody}</tbody></table>

<h2>Fund Transfers (recent ${(data.recentTransfers || []).length})</h2>
<table><thead><tr><th>Date</th><th>Route</th><th>Note</th><th class="num">Amount</th><th class="num">Charge</th></tr></thead><tbody>${transferBody}</tbody></table>

</body></html>`);
    w.document.close();
    setPrintOpen(false);
  }, [printOpen, data]);

  const setExp = (field, value) => setExpenseForm((p) => ({ ...p, [field]: value }));

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!(Number(expenseForm.amount) > 0)) return showToast("Enter a valid expense amount.");
    setSaving(true);
    try {
      const res = await api.post("/statement/expense", {
        account: expenseForm.account || accountList[0],
        amount: Number(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.note,
        date: nextDate(expenseForm.date),
      });
      showToast(res.data.message || "Expense recorded.", "success");
      applyPayload(res.data);
      setExpenseForm({ ...expenseForm, amount: "", category: "", note: "" });
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (id) => {
    setDeletingId(id);
    try {
      const res = await api.delete(`/statement/expense/${id}`);
      showToast(res.data.message || "Expense deleted.", "success");
      applyPayload(res.data);
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
      const res = await api.post("/statement/fund-transfer", {
        fromAccount: transferForm.fromAccount || accountList[0],
        toAccount: transferForm.toAccount || accountList[1] || accountList[0],
        amount: Number(transferForm.amount),
        charge: Number(transferForm.charge || 0),
        chargeAccount: (Number(transferForm.charge || 0) > 0 ? transferForm.chargeAccount : transferForm.fromAccount) || accountList[0],
        note: transferForm.note,
        date: nextDate(transferForm.date),
      });
      showToast(res.data.message || "Fund moved.", "success");
      applyPayload(res.data);
      setTransferForm({ ...transferForm, amount: "", charge: "", note: "" });
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to transfer funds.");
    } finally {
      setSaving(false);
    }
  };

  const removeTransfer = async (id) => {
    setDeletingId(id);
    try {
      const res = await api.delete(`/statement/fund-transfer/${id}`);
      showToast(res.data.message || "Transfer deleted.", "success");
      applyPayload(res.data);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to delete transfer.");
    } finally {
      setDeletingId(null);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    const names = (data?.accounts || []).map((a) => a.key);
    for (const name of names) {
      const v = resetBalances[name];
      if (v === undefined || v === null || v === "" || !(Number(v) >= 0)) {
        return showToast(`Enter a valid opening balance for ${name}.`);
      }
    }
    setSaving(true);
    try {
      const res = await api.post("/statement/reset", {
        openingBalances: Object.fromEntries(names.map((n) => [n, Number(resetBalances[n])])),
        note: resetForm.note,
      });
      showToast(res.data.message || "Account reset.", "success");
      applyPayload(res.data);
      setResetOpen(false);
      setResetForm({ note: "" });
      setResetBalances({});
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to reset account.");
    } finally {
      setSaving(false);
    }
  };

  const accounts = data?.accounts || [];
  const totals = data?.totals || {};
  const period = data?.period || null;

  const CHIP = [
    { dot: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", line: "from-emerald-500 to-teal-600" },
    { dot: "bg-pink-500", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", line: "from-pink-500 to-rose-600" },
    { dot: "bg-sky-500", bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", line: "from-sky-500 to-indigo-600" },
    { dot: "bg-amber-500", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", line: "from-amber-500 to-orange-600" },
    { dot: "bg-violet-500", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", line: "from-violet-500 to-purple-600" },
    { dot: "bg-teal-500", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", line: "from-teal-500 to-cyan-600" },
  ];
  const colorOf = (name) => CHIP[((accounts.map((a) => a.key).indexOf(name) % CHIP.length) + CHIP.length) % CHIP.length];

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
              <p className="text-xs text-slate-400">Payment-method accounts, expenses, transfers & audit periods</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openPrint} disabled={!data}
              className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition flex items-center gap-2 disabled:opacity-50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" rx="1" />
              </svg>
              Print Statement
            </button>
            {isAdmin && (
              <button onClick={() => setResetOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-200 hover:from-rose-600 hover:to-red-700 transition flex items-center gap-2">
                ↻ Close Audit & Reset
              </button>
            )}
          </div>
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
                const c = colorOf(a.key);
                return (
                  <div key={a.key} className={`rounded-2xl p-5 border ${c.border} ${c.bg} shadow-sm relative overflow-hidden`}>
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.line}`} />
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[11px] font-bold uppercase tracking-wider ${c.text}`}>{a.key}</p>
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                    </div>
                    <p className="text-2xl font-black text-slate-800 mt-2">{fmt(a.current)}</p>
                    <p className="text-[11px] text-slate-500 mt-1">Opening {fmt(a.opening)} · Trans +{fmt(a.transferIn)} / −{fmt(a.transferOut + a.charges)}</p>
                  </div>
                );
              })}
              <div className="rounded-2xl p-5 border border-slate-200 bg-slate-900 shadow-md relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-500 to-slate-700" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total In Hand</p>
                <p className="text-2xl font-black text-white mt-2">{fmt(totals.inHand)}</p>
                <p className="text-[11px] text-slate-500 mt-1">Sum of all payment methods</p>
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
                  {accounts.map((a) => {
                    const v = period.openingBalances?.[a.key];
                    return <span key={a.key} className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg">Opening {a.key} · {fmt(v)}</span>;
                  })}
                </div>
              </section>
            )}

            {/* Download */}
            <section className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-wrap items-end gap-3 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <label className={labelClass}>From Date</label>
                <input type="date" value={dlFrom} onChange={(e) => setDlFrom(e.target.value)} className={inputClass} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className={labelClass}>To Date</label>
                <input type="date" value={dlTo} onChange={(e) => setDlTo(e.target.value)} className={inputClass} />
              </div>
              <button onClick={downloadCSV} disabled={downloading}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                {downloading ? "Downloading..." : "Download Statement (CSV)"}
              </button>
              <p className="w-full text-[11px] text-slate-400">
                Leave dates empty for the whole audit period. Downloads payments, expenses, fund transfers and charges with running balance.
              </p>
            </section>

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
                    Every payment method saved in System Settings is its own account — income, expenses and transfers are tracked per method.
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

            {/* PAYMENTS */}
            {tab === "payments" && (
              <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Payments Received</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Collected via Collect Payment — the payment method is the income account</p>
                  </div>
                  <button onClick={loadStatement} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition">↻ Refresh</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Receipt</th>
                        <th className="px-4 py-3 font-semibold">Student</th>
                        <th className="px-4 py-3 font-semibold">Method</th>
                        <th className="px-5 py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.recentPayments || []).length === 0 ? (
                        <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-300 text-sm font-medium">No payments collected yet</td></tr>
                      ) : (data?.recentPayments || []).map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3 whitespace-nowrap text-slate-500">{fmtDate(p.receiveDate)}</td>
                          <td className="px-4 py-3 font-mono text-[12px] font-semibold text-slate-600">{p.receiptNo || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.studentName || p.studentId}</td>
                          <td className="px-4 py-3"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.paymentMethod || "Cash"}</span></td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-600">{fmt(p.paidAmount)}</td>
                        </tr>
                      ))}
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
                  <p className="text-xs text-slate-400 mb-4">Money paid out of a payment-method account</p>
                  <form onSubmit={submitExpense} className="space-y-3.5">
                    <div>
                      <label className={labelClass}>Pay From</label>
                      <select value={expenseForm.account || accountList[0] || ""} onChange={(e) => setExp("account", e.target.value)} className={inputClass}>
                        {accountList.map((a) => <option key={a} value={a}>{a}</option>)}
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
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colorOf(x.account)?.bg || "bg-slate-100"} ${colorOf(x.account)?.text || "text-slate-600"}`}>{x.account}</span>
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
                      <select value={transferForm.fromAccount || accountList[0] || ""} onChange={(e) => setTr("fromAccount", e.target.value)} className={inputClass}>
                        {accountList.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>To</label>
                      <select value={transferForm.toAccount || accountList[0] || ""} onChange={(e) => setTr("toAccount", e.target.value)} className={inputClass}>
                        {accountList.map((a) => <option key={a} value={a}>{a}</option>)}
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
                        <select value={transferForm.chargeAccount || transferForm.fromAccount || accountList[0] || ""} onChange={(e) => setTr("chargeAccount", e.target.value)} className={inputClass}>
                          {accountList.map((a) => <option key={a} value={a}>{a}</option>)}
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
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colorOf(x.fromAccount)?.bg || "bg-slate-100"} ${colorOf(x.fromAccount)?.text || "text-slate-600"}`}>{x.fromAccount}</span>
                              <span className="mx-1.5 text-slate-400">→</span>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colorOf(x.toAccount)?.bg || "bg-slate-100"} ${colorOf(x.toAccount)?.text || "text-slate-600"}`}>{x.toAccount}</span>
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
                        <th className="px-4 py-3 font-semibold text-right">Closed Balances</th>
                        <th className="px-4 py-3 font-semibold">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.history || []).length === 0 ? (
                        <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-300 text-sm font-medium">No audits closed yet</td></tr>
                      ) : (data?.history || []).map((h) => (
                        <tr key={h._id} className="hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3 whitespace-nowrap text-slate-600">{fmtDate(h.periodStart)} {new Date(h.periodStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="px-4 py-3 text-slate-500">{h.academicSession || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              {Object.entries(h.closingBalances || {}).map(([k, v]) => (
                                <span key={k} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{k}: {fmt(v)}</span>
                              ))}
                              {Object.keys(h.closingBalances || {}).length === 0 ? <span className="text-slate-300">—</span> : null}
                            </div>
                          </td>
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
                {accounts.map((a) => {
                  const c = colorOf(a.key);
                  return (
                    <div key={a.key}>
                      <label className={labelClass}>Opening {a.key} (BDT)</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" value={resetBalances[a.key] ?? ""}
                        onChange={(e) => setResetBalances((p) => ({ ...p, [a.key]: e.target.value }))}
                        className={inputClass} />
                    </div>
                  );
                })}
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