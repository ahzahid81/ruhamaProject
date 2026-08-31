import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";
import { Search, Filter, Receipt } from "lucide-react";
import { bdDate } from "../../utils/bdTime";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [filters, setFilters] = useState({
    studentSearch: "",
    className: "",
    paymentMethod: "",
    status: "",
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setSettings(res.data);
    } catch {
      // silent
    }
  };

  const loadPayments = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      let allPayments = [];

      if (filters.studentSearch) {
        let students = [];
        try {
          const res = await api.get(`/students/search?q=${encodeURIComponent(filters.studentSearch)}`);
          students = res.data || [];
        } catch {
          const res = await api.get(`/students?search=${encodeURIComponent(filters.studentSearch)}`);
          students = res.data || [];
        }

        for (const s of students) {
          try {
            const histRes = await api.get(`/payments/history/${s.studentId}`);
            const items = histRes.data.payments || histRes.data || [];
            allPayments.push(...(Array.isArray(items) ? items : []));
          } catch {
            // silent
          }
        }
      }

      if (allPayments.length === 0 && !filters.studentSearch) {
        allPayments = [];
      }

      let filtered = allPayments;

      if (filters.className) {
        filtered = filtered.filter((p) => p.className === filters.className);
      }
      if (filters.paymentMethod) {
        filtered = filtered.filter((p) => p.paymentMethod === filters.paymentMethod);
      }
      if (filters.status) {
        filtered = filtered.filter((p) => p.paymentStatus === filters.status);
      }

      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const start = (pageNum - 1) * limit;
      const paged = filtered.slice(start, start + limit);

      if (append) {
        setPayments((prev) => [...prev, ...paged]);
      } else {
        setPayments(paged);
      }
      setHasMore(start + limit < filtered.length);
    } catch {
      if (!append) setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setPage(1);
    loadPayments(1, false);
  }, [loadPayments]);

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");
  const classes = settings?.classes || [];
  const paymentMethods = settings?.paymentMethods || ["Cash", "bKash", "Nagad", "Rocket", "Bank", "Cheque", "Card", "Online", "Other"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Payment History</h1>
            <p className="text-sm text-gray-400 mt-0.5">View and filter all payment records</p>
          </div>
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
                value={filters.studentSearch}
                onChange={(e) => setFilters({ ...filters, studentSearch: e.target.value })}
                placeholder="Search student ID or name..."
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
            <div>
              <h2 className="text-base font-bold text-slate-800">Payments</h2>
              <p className="text-xs text-gray-400 mt-0.5">{payments.length} record{payments.length !== 1 && "s"} found</p>
            </div>
          </div>

          {loading && payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No payment records found</p>
              <p className="text-gray-300 text-xs mt-1">Try searching by student ID or name</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Receipt</th>
                      <th className="px-5 py-3 font-semibold">Student</th>
                      <th className="px-5 py-3 font-semibold">Class</th>
                      <th className="px-5 py-3 font-semibold">Method</th>
                      <th className="px-5 py-3 font-semibold text-right">Amount</th>
                      <th className="px-5 py-3 font-semibold text-right">Paid</th>
                      <th className="px-5 py-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {bdDate(p.createdAt || p.receiveDate)}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">
                          {p.receiptNo || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-700">{p.studentName}</p>
                          <p className="text-xs text-gray-400">{p.studentId}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{p.className}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-semibold">
                            {p.paymentMethod || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500">{fmt(p.totalAmount)}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-700">{fmt(p.paidAmount)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            p.paymentStatus === "Completed" ? "bg-emerald-50 text-emerald-600"
                              : p.paymentStatus === "Pending" ? "bg-amber-50 text-amber-600"
                              : p.paymentStatus === "Cancelled" ? "bg-red-50 text-red-600"
                              : "bg-gray-50 text-gray-600"
                          }`}>
                            {p.paymentStatus || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="px-5 py-4 border-t border-gray-100 flex justify-center">
                  <button
                    onClick={() => { const next = page + 1; setPage(next); loadPayments(next, true); }}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
