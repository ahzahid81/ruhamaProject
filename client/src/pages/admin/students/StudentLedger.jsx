import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../services/api";
import { bdDateLong } from "../../../utils/bdTime";

export default function StudentLedger() {
  const { id: studentId } = useParams();

  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLedger();
    loadSummary();
  }, []);

  const loadLedger = useCallback(async () => {
    try {
      const res = await api.get(`/ledger/${studentId}`);
      const data = res.data;
      if (Array.isArray(data)) {
        setLedger(data);
      } else if (data?.entries) {
        setLedger(Array.isArray(data.entries) ? data.entries : []);
      } else {
        setLedger([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load ledger");
    }
  }, [studentId]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get(`/ledger/due-summary/${studentId}`);
      const data = res.data || {};
      setSummary({
        openingBalance: data.openingBalance ?? data.currentBalance ?? data.summary?.currentBalance ?? 0,
        totalPaid: data.totalPaid ?? 0,
        totalDue: data.totalDue ?? data.summary?.totalDue ?? 0,
        balance: data.balance ?? data.currentBalance ?? data.summary?.currentBalance ?? 0,
        academicSession: data.academicSession || "2026",
      });
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  const formatCurrency = (val) =>
    `BDT ${Number(val || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (d) =>
    d ? bdDateLong(d, { shortMonth: true }) : "—";

  const typeStyles = {
    Payment: "bg-emerald-100 text-emerald-700",
    Charge: "bg-amber-100 text-amber-700",
    Discount: "bg-blue-100 text-blue-700",
    Fine: "bg-red-100 text-red-700",
    Reversal: "bg-gray-200 text-gray-600",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-2xl font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Financial Ledger
        </h1>
        <div className="flex gap-2">
          <Link to={`/students/${studentId}`}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
          >← Profile</Link>
          <Link to={`/collect-payment?studentId=${studentId}`}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
          >Collect Payment</Link>
          <Link to={`/students/${studentId}/fee-override`}
            className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition border border-amber-200"
          >Fee Override</Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Opening Balance</p>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(summary.openingBalance || 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-emerald-500">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-xl font-bold text-emerald-700">
              {formatCurrency(summary.totalPaid || 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Total Due</p>
            <p className="text-xl font-bold text-red-700">
              {formatCurrency(summary.totalDue || 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Balance</p>
            <p className="text-xl font-bold text-purple-700">
              {formatCurrency(summary.balance || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filter Info */}
      {summary && (
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm text-gray-600">
          Showing entries for session:{" "}
          <span className="font-semibold">{summary.academicSession}</span>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl shadow-lg p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-slate-700 mb-4">
          Transaction History
        </h2>
        {ledger.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No transactions found.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Debit</th>
                <th className="pb-3 font-semibold">Credit</th>
                <th className="pb-3 font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr
                  key={entry._id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="py-3 text-sm">{formatDate(entry.date)}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        typeStyles[entry.type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-3">
                    {entry.feeCategory?.name || entry.otherCategory || "—"}
                  </td>
                  <td className="py-3 text-gray-600 max-w-[200px] truncate">
                    {entry.description || "—"}
                  </td>
                  <td className="py-3 text-red-600 font-semibold">
                    {entry.type === "Payment" || entry.type === "Discount"
                      ? "—"
                      : formatCurrency(Math.abs(entry.debit || 0))}
                  </td>
                  <td className="py-3 text-emerald-600 font-semibold">
                    {entry.type === "Charge" || entry.type === "Fine"
                      ? "—"
                      : formatCurrency(entry.credit || 0)}
                  </td>
                  <td className="py-3 font-bold">
                    {formatCurrency(entry.balance || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
