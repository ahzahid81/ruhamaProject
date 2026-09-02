import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, Wallet, ArrowRight,
  Clock, TrendingUp, GraduationCap, CheckSquare, Receipt, Landmark,
  CalendarDays, FileText, AlertCircle, RefreshCw, Banknote, CircleDollarSign,
  BadgePercent, Sparkles,
} from "lucide-react";
import api from "../services/api";
import { bdDate, bdDateLong } from "../utils/bdTime";

const fmtMoney = (n) => "৳ " + Number(n || 0).toLocaleString("en-BD");

const THEMES = {
  admin: {
    gradient: "from-indigo-600 via-indigo-700 to-purple-700",
    accent: "#6366f1",
    label: "Administrator",
    chip: "bg-purple-100 text-purple-700",
  },
  "account-manager": {
    gradient: "from-amber-500 via-orange-600 to-rose-600",
    accent: "#f59e0b",
    label: "Accounts Manager",
    chip: "bg-amber-100 text-amber-700",
  },
  teacher: {
    gradient: "from-sky-600 via-blue-600 to-indigo-700",
    accent: "#0ea5e9",
    label: "Teacher",
    chip: "bg-blue-100 text-blue-700",
  },
};

// ============================================================
// MAIN ROLE-AWARE DASHBOARD
// ============================================================
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const teacher = useMemo(
    () => JSON.parse(localStorage.getItem("teacher") || "null"),
    []
  );
  const role = teacher?.role || "teacher";
  const theme = THEMES[role] || THEMES.teacher;

  const load = async () => {
    setError("");
    setLoading((prev) => (data ? prev : true));
    try {
      const res = await api.get("/dashboard/summary");
      setData(res.data);
    } catch (err) {
      const msg = err?.response?.status === 403 || err?.response?.status === 401
        ? "Your session may have expired. Please sign in again."
        : "We couldn't load your dashboard right now.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = (data?.name || teacher?.name || "User").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} p-6 md:p-8`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-6 right-24 w-24 h-24 border border-white/10 rounded-2xl rotate-12 hidden md:block" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border border-white/10">
                <Sparkles className="w-3 h-3" /> {theme.label}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1.5 text-white/80 text-sm md:text-base">
              Here&apos;s your overview at a glance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
              <Clock className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white font-medium">
                {bdDateLong(new Date(), { weekday: true })}
              </span>
            </span>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-xl px-3.5 py-2.5 border border-white/10 transition-colors disabled:opacity-60"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-3 text-sm text-gray-400">Loading your dashboard…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <p className="text-amber-700 text-sm font-medium">{error}</p>
          <button
            onClick={refresh}
            className="mt-3 inline-flex items-center gap-1.5 bg-amber-500 text-white text-sm font-medium rounded-xl px-4 py-2 hover:bg-amber-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      )}

      {/* Role views */}
      {!loading && !error && data && (
        <>
          {role === "teacher" && <TeacherView data={data} />}
          {role === "admin" && <AdminView data={data} />}
          {role === "account-manager" && <AccountView data={data} />}
        </>
      )}
    </div>
  );
};

// ============================================================
// STAT CARD
// ============================================================
const StatCard = ({ icon: Icon, label, value, sub, tone }) => {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    sky: "bg-sky-50 text-sky-600",
    teal: "bg-teal-50 text-teal-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${tones[tone] || tones.indigo} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        </div>
      </div>
      {sub && (
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-500 font-medium">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="truncate">{sub}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SECTION HEADER
// ============================================================
const SectionHeader = ({ title, action, to }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    {action && to && (
      <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 group">
        {action} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    )}
  </div>
);

// ============================================================
// TEACHER VIEW
// ============================================================
const TeacherView = ({ data }) => {
  const s = data.stats || {};

  const quickActions = [
    { label: "Create Daily Report", to: "/create-report", icon: ClipboardList, tone: "bg-indigo-50 text-indigo-700" },
    { label: "View Class Reports", to: "/class-report", icon: BookOpen, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Mark Attendance", to: "/attendance/daily", icon: CheckSquare, tone: "bg-sky-50 text-sky-700" },
    { label: "Hifz Report", to: "/hifz-report", icon: GraduationCap, tone: "bg-purple-50 text-purple-700" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={LayoutDashboard} label="Assigned Classes" value={s.classes ?? 0} sub="Active this semester" tone="indigo" />
        <StatCard icon={BookOpen} label="Subjects" value={s.subjects ?? 0} sub="Across all classes" tone="blue" />
        <StatCard icon={ClipboardList} label="Entries Today" value={s.entriesToday ?? 0} sub="Reports submitted" tone="emerald" />
        <StatCard icon={CalendarDays} label="Pending Today" value={s.pending ?? 0} sub="Awaiting your report" tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <SectionHeader title="Quick Actions" />
            <div className="space-y-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    to={a.to}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm group"
                  >
                    <span className={`w-8 h-8 rounded-lg ${a.tone} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1">{a.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pending tasks */}
          {s.pending > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-amber-800">Pending Reports</h3>
              </div>
              <p className="text-xs text-amber-700">
                You have <span className="font-bold">{s.pending}</span> subject(s) still to submit for today. Submit them to keep the diary complete.
              </p>
              <Link to="/create-report" className="mt-3 inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg px-3 py-2 hover:bg-amber-600 transition-colors">
                Go to report <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <SectionHeader title="My Assignments" to="/create-report" action="View all" />
            {data.assignments?.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {data.assignments.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center text-xs font-bold text-sky-600 border border-sky-100 flex-shrink-0">
                      {item.subject?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.subject}</p>
                      <p className="text-xs text-gray-400 truncate">{item.className}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No assignments yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// ADMIN VIEW
// ============================================================
const AdminView = ({ data }) => {
  const s = data.stats || {};

  const quickActions = [
    { label: "New Admission", to: "/student-admission", icon: GraduationCap, tone: "bg-indigo-50 text-indigo-700" },
    { label: "Collect Payment", to: "/collect-payment", icon: Wallet, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Attendance Report", to: "/attendance/report", icon: CheckSquare, tone: "bg-sky-50 text-sky-700" },
    { label: "Admin Panel", to: "/admin", icon: LayoutDashboard, tone: "bg-purple-50 text-purple-700" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Students" value={s.students ?? 0} sub="Total enrolled" tone="indigo" />
        <StatCard icon={GraduationCap} label="Teachers" value={s.teachers ?? 0} sub="Teaching staff" tone="blue" />
        <StatCard icon={CheckSquare} label="Attendance Today" value={s.todayAttendance ?? 0} sub="Records marked today" tone="sky" />
        <StatCard icon={FileText} label="Pending Reports" value={s.pendingReportsToday ?? 0} sub="Today, not submitted" tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard icon={Landmark} label="Collected (Month)" value={fmtMoney(s.collectedThisMonth)} sub="Non-refunded payments" tone="emerald" />
        <StatCard icon={Banknote} label="Collected Today" value={fmtMoney(s.todayTax)} sub="Today's receipts" tone="teal" />
        <StatCard icon={BadgePercent} label="Outstanding Dues" value={fmtMoney(s.totalOutstanding)} sub="Session total" tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <SectionHeader title="Quick Actions" />
            <div className="space-y-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} to={a.to} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm group">
                    <span className={`w-8 h-8 rounded-lg ${a.tone} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1">{a.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <SectionHeader title="Recent Payments" to="/payment-history" action="View all" />
          {data.recentPayments?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recentPayments.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.studentName}</p>
                      <p className="text-xs text-gray-400 truncate">{p.receiptNo} — {bdDate(p.receiveDate || p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-700">{fmtMoney(p.paidAmount)}</p>
                    <p className="text-[11px] text-gray-400">{p.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No payments yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ============================================================
// ACCOUNT-MANAGER VIEW
// ============================================================
const AccountView = ({ data }) => {
  const s = data.stats || {};

  const quickActions = [
    { label: "Collect Payment", to: "/collect-payment", icon: Wallet, tone: "bg-emerald-50 text-emerald-700" },
    { label: "School Statement", to: "/statement", icon: Landmark, tone: "bg-indigo-50 text-indigo-700" },
    { label: "Payment History", to: "/payment-history", icon: Receipt, tone: "bg-amber-50 text-amber-700" },
    { label: "Student Ledger", to: "/students", icon: Users, tone: "bg-sky-50 text-sky-700" },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Students" value={s.students ?? 0} sub="Currently enrolled" tone="indigo" />
        <StatCard icon={CircleDollarSign} label="Collected Today" value={fmtMoney(s.collectedToday)} sub={`${s.todayPaymentsCount ?? 0} receipts today`} tone="emerald" />
        <StatCard icon={Landmark} label="Collected (Month)" value={fmtMoney(s.collectedThisMonth)} sub={`${s.monthPaymentsCount ?? 0} payments this month`} tone="teal" />
        <StatCard icon={BadgePercent} label="Outstanding Dues" value={fmtMoney(s.totalOutstanding)} sub="Session total" tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <SectionHeader title="Quick Actions" />
            <div className="space-y-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} to={a.to} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm group">
                    <span className={`w-8 h-8 rounded-lg ${a.tone} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1">{a.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-gray-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <SectionHeader title="Recent Payments" to="/payment-history" action="View all" />
          {data.recentPayments?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recentPayments.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.studentName}</p>
                      <p className="text-xs text-gray-400 truncate">{p.receiptNo} — {bdDate(p.receiveDate || p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-700">{fmtMoney(p.paidAmount)}</p>
                    <p className="text-[11px] text-gray-400">{p.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No payments yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
