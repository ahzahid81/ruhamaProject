import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import { Search, Filter, Receipt, Eye, Pencil, Trash2, X, CheckCircle2 } from "lucide-react";
import { bdDate } from "../../utils/bdTime";

const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

const METHOD_LABELS = [
  "Cash", "bKash", "Nagad", "Rocket", "Bank", "Cheque", "Card", "Online", "Other",
];

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [filters, setFilters] = useState({
    search: searchParams.get("student") || "",
    className: "",
    paymentMethod: "",
    status: "",
  });

  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getSettings().then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.className) params.set("className", filters.className);
      if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
      if (filters.status) params.set("status", filters.status);
      const res = await api.get(`/payments?${params.toString()}`);
      setPayments(res.data.payments || []);
      setTotal(res.data.total || 0);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleCancel = async (p) => {
    setBusy(true);
    try {
      const res = await api.patch(`/payments/cancel/${p._id}`, {
        reason: "Cancelled by admin from Payment History",
      });
      if (res.data.success !== false) {
        showToast("Payment cancelled and allocations reversed.");
        setDeleteTarget(null);
        loadPayments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel payment", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload) => {
    setBusy(true);
    try {
      const res = await api.put(`/payments/${editTarget._id}`, payload);
      if (res.data.success !== false) {
        showToast("Payment updated successfully.");
        setEditTarget(null);
        loadPayments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update payment", "error");
    } finally {
      setBusy(false);
    }
  };

  const classes = settings?.classes || [];
  const paymentMethods = settings?.paymentMethods || METHOD_LABELS;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-semibold text-sm ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>{toast.msg}</div>
      )}

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Payment History</h1>
            <p className="text-sm text-gray-400 mt-0.5">All students · view, edit, or cancel payment records</p>
          </div>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg">{total} records</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search student ID, name, or receipt..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              />
            </div>
            <select
              value={filters.className}
              onChange={(e) => setFilters({ ...filters, className: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              <option value="">All Methods</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              <option value="">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Payments</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No payment records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Receipt Id</th>
                    <th className="px-5 py-3 font-semibold">Fee Details</th>
                    <th className="px-5 py-3 font-semibold">Receiver</th>
                    <th className="px-5 py-3 font-semibold">Payment Type</th>
                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    <th className="px-5 py-3 font-semibold text-right">Status</th>
                    <th className="px-5 py-3 font-semibold text-center">View</th>
                    <th className="px-5 py-3 font-semibold text-center">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{bdDate(p.receiveDate || p.createdAt)}</td>
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">{p.receiptNo || "—"}</td>
                      <td className="px-5 py-3">
                        <p className="text-slate-700 font-medium">{p.studentName}</p>
                        <p className="text-xs font-mono text-gray-400">{p.studentId}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.feeDetails || "—"}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{p.receivedBy?.name || "—"}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-semibold">
                          {p.paymentMethod || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(p.paidAmount)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                          p.paymentStatus === "Completed" ? "bg-emerald-50 text-emerald-600"
                            : p.paymentStatus === "Pending" ? "bg-amber-50 text-amber-600"
                            : p.paymentStatus === "Cancelled" ? "bg-red-50 text-red-600"
                            : "bg-gray-50 text-gray-600"
                        }`}>{p.paymentStatus || "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => navigate(`/payment/receipt/${p._id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                          title="View receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditTarget(p)}
                            disabled={p.isVoided}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold hover:bg-amber-100 transition disabled:opacity-40"
                            title="Edit payment"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            disabled={p.isVoided}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition disabled:opacity-40"
                            title="Cancel payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <EditModal
          payment={editTarget}
          paymentMethods={paymentMethods}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdate}
          busy={busy}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Cancel this payment?</h3>
                <p className="text-xs text-gray-400">Reverses allocations & ledger</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Receipt <b className="font-mono text-indigo-600">{deleteTarget.receiptNo}</b> for{" "}
              <b>{deleteTarget.studentName}</b> ({fmt(deleteTarget.paidAmount)}). This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition">
                Keep
              </button>
              <button
                onClick={() => handleCancel(deleteTarget)}
                disabled={busy}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {busy ? "Cancelling..." : "Cancel Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// EDIT PAYMENT MODAL
// ============================================
function EditModal({ payment, paymentMethods, onClose, onSave, busy }) {
  const [form, setForm] = useState({
    paymentMethod: payment.paymentMethod || "Cash",
    senderNumber: payment.senderNumber || "",
    transactionId: payment.transactionId || "",
    bankName: payment.bankName || "",
    bankBranch: payment.bankBranch || "",
    chequeNo: payment.chequeNo || "",
    referenceNo: payment.referenceNo || "",
    remarks: payment.remarks || "",
    paymentStatus: payment.paymentStatus || "Completed",
    receiveDate: payment.receiveDate ? payment.receiveDate.slice(0, 10) : "",
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const input = "w-full border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition";

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <form onSubmit={submit} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h3 className="font-bold text-slate-800">Edit Payment</h3>
            <p className="text-xs text-gray-400 font-mono">Receipt {payment.receiptNo}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Payment Type</label>
              <select value={form.paymentMethod} onChange={set("paymentMethod")} className={input}>
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
              <select value={form.paymentStatus} onChange={set("paymentStatus")} className={input}>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Receive Date</label>
              <input type="date" value={form.receiveDate} onChange={set("receiveDate")} className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Transaction ID</label>
              <input type="text" value={form.transactionId} onChange={set("transactionId")} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sender / Account No</label>
              <input type="text" value={form.senderNumber} onChange={set("senderNumber")} className={input} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Reference No</label>
              <input type="text" value={form.referenceNo} onChange={set("referenceNo")} className={input} />
            </div>
          </div>
          {(form.paymentMethod === "Bank") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Bank Name</label>
                <input type="text" value={form.bankName} onChange={set("bankName")} className={input} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Branch</label>
                <input type="text" value={form.bankBranch} onChange={set("bankBranch")} className={input} />
              </div>
            </div>
          )}
          {form.paymentMethod === "Cheque" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cheque No</label>
              <input type="text" value={form.chequeNo} onChange={set("chequeNo")} className={input} />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Remarks</label>
            <textarea value={form.remarks} onChange={set("remarks")} rows={2} className={input} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {busy ? "Saving..." : (<><CheckCircle2 className="w-4 h-4" /> Save Changes</>)}
          </button>
        </div>
      </form>
    </div>
  );
}