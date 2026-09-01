import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import { bdDate, bdWeekday, bdMonth, bdYear } from "../../utils/bdTime";
import {
  LayoutDashboard, User, CheckSquare, BarChart3, Wallet,
  BookOpen, LogOut, Menu, X, Eye, GraduationCap,
} from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: User },
  { id: "attendance", label: "Attendance", icon: CheckSquare },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "payments", label: "Fees & Payments", icon: Wallet },
  { id: "diary", label: "Daily Diary", icon: BookOpen },
];

const hifzTab = { id: "hifz", label: "Hifz Progress", icon: GraduationCap };

export default function StudentPortal() {
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHifzStudent, setIsHifzStudent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("student");
    const token = localStorage.getItem("studentToken");
    if (!stored || !token) {
      navigate("/student-login");
      return;
    }
    const parsed = JSON.parse(stored);
    setStudent(parsed);
    setIsHifzStudent(parsed.studentType === "Hifzul Quran");

    api
      .get("/student-portal/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const type = res.data?.student?.studentType;
        if (type) {
          setIsHifzStudent(type === "Hifzul Quran");
          setStudent((prev) => (prev ? { ...prev, studentType: type } : prev));
        }
      })
      .catch(() => { /* silent */ });
  }, [navigate]);

  const activeTabs = isHifzStudent ? [...tabs, hifzTab] : tabs;

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("student");
    window.location.href = "/";
  };

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

  if (!student) return null;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <img src={logo} alt="Ruhama" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Ruhama</h1>
          <p className="text-[10px] text-gray-400 font-medium">Student Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {activeTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
            className={`group flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 shadow-sm border border-emerald-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Icon className={`w-4.5 h-4.5 ${activeTab === id ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"}`} strokeWidth={1.8} />
            <span>{label}</span>
            {activeTab === id && <div className="ml-auto w-1.5 h-6 rounded-full bg-emerald-600" />}
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
            {student.name?.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
            <p className="text-[11px] text-gray-400">{student.studentId}</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex-col">
        {sidebarContent}
      </aside>

      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{activeTabs.find((t) => t.id === activeTab)?.label || "Dashboard"}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {student.name?.charAt(0)?.toUpperCase() || "S"}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{student.name}</p>
                  <p className="text-[11px] text-gray-400">{student.className} — {student.studentId}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {activeTab === "dashboard" && <Dashboard student={student} fmt={fmt} />}
          {activeTab === "profile" && <Profile student={student} />}
          {activeTab === "attendance" && <Attendance student={student} />}
          {activeTab === "results" && <Results student={student} />}
          {activeTab === "payments" && <Payments student={student} fmt={fmt} />}
          {activeTab === "diary" && <Diary student={student} />}
          {activeTab === "hifz" && isHifzStudent && <HifzPortal student={student} />}
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-3 z-10 p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ fmt }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/student-portal/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        setData(res.data);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-400">Unable to load dashboard</div>;

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome, {data.student?.name}</h2>
        <p className="text-emerald-100 mt-1">{data.student?.className}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 border border-blue-200 bg-blue-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Attendance</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{data.attendance?.percentage || 0}%</p>
        </div>
        <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Paid</p>
          <p className="text-xl font-bold text-emerald-800 mt-1">{fmt(data.feeSummary?.totalPaid)}</p>
        </div>
        <div className="rounded-xl p-4 border border-red-200 bg-red-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Total Due</p>
          <p className="text-xl font-bold text-red-800 mt-1">{fmt(data.feeSummary?.totalDue)}</p>
        </div>
        <div className="rounded-xl p-4 border border-purple-200 bg-purple-50">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Exams Taken</p>
          <p className="text-2xl font-bold text-purple-800 mt-1">{data.results?.length || 0}</p>
        </div>
      </div>

      {/* Recent Results */}
      {data.results?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-slate-800">Recent Results</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.results.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{r.examName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{r.percentage}%</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    r.status === "Pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}>{r.grade}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {data.recentPayments?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-slate-800">Recent Payments</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentPayments.map((p) => (
              <div key={p._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.receiptNo}</p>
                  <p className="text-xs text-gray-400">{bdDate(p.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-700">{fmt(p.paidAmount)}</p>
                  <p className="text-xs text-gray-400">{p.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PROFILE ============
function Profile({ student }) {
  const fields = [
    { label: "Student ID", value: student.studentId },
    { label: "Name", value: student.name },
    { label: "Class", value: student.className },
    { label: "Section", value: student.section },
    { label: "Session", value: student.session },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-5">
          {student.photo ? (
            <img src={student.photo} alt="" className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl">👤</div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
            <p className="text-sm text-gray-400">{student.studentId} — {student.className}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-slate-800">Student Information</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {fields.map(({ label, value }) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-semibold text-slate-700">{value || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ ATTENDANCE ============
function Attendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(bdMonth());
  const [year, setYear] = useState(bdYear());
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/student-portal/attendance?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        setData(res.data);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, [month, year]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-4">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition">
            {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl p-4 border border-blue-200 bg-blue-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Total Days</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{data.summary.totalDays}</p>
          </div>
          <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Present</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{data.summary.presentDays}</p>
          </div>
          <div className="rounded-xl p-4 border border-red-200 bg-red-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Absent</p>
            <p className="text-2xl font-bold text-red-800 mt-1">{data.summary.absentDays}</p>
          </div>
          <div className="rounded-xl p-4 border border-amber-200 bg-amber-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Late</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{data.summary.lateDays}</p>
          </div>
          <div className="rounded-xl p-4 border border-purple-200 bg-purple-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Percentage</p>
            <p className="text-2xl font-bold text-purple-800 mt-1">{data.summary.percentage}%</p>
          </div>
        </div>
      )}

      {data?.records?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-slate-800">Daily Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Day</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.records.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3 text-gray-700">{bdDate(r.date)}</td>
                    <td className="px-5 py-3 text-gray-500">{bdWeekday(r.date)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        r.status === "Present" ? "bg-emerald-100 text-emerald-700"
                          : r.status === "Absent" ? "bg-red-100 text-red-700"
                          : r.status === "Late" ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && data?.records?.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No attendance records for this period</p>
        </div>
      )}
    </div>
  );
}

// ============ RESULTS ============
function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/student-portal/results", {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        setResults(res.data.results || []);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {results.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No results available yet</p>
        </div>
      ) : (
        results.map((r) => (
          <div key={r._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">{r.exam?.examName || "Exam"}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Class: {r.className}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-800">{r.percentage}%</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  r.status === "Pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>{r.grade} — {r.division}</span>
              </div>
            </div>
            {r.entries?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Subject</th>
                      <th className="px-5 py-3 font-semibold text-center">Full</th>
                      <th className="px-5 py-3 font-semibold text-center">Obtained</th>
                      <th className="px-5 py-3 font-semibold text-center">Grade</th>
                      <th className="px-5 py-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {r.entries.map((e, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3 font-medium text-slate-700">{e.subjectName}</td>
                        <td className="px-5 py-3 text-center text-gray-500">{e.fullMarks}</td>
                        <td className="px-5 py-3 text-center font-bold text-slate-800">{e.obtainedMarks}</td>
                        <td className="px-5 py-3 text-center text-indigo-600 font-semibold">{e.grade}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            e.status === "Pass" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ============ PAYMENTS ============
function Payments({ student, fmt }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/student-portal/payments", {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        setData(res.data);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 border border-emerald-200 bg-emerald-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{fmt(data.summary.totalPaid)}</p>
          </div>
          <div className="rounded-xl p-5 border border-red-200 bg-red-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Total Due</p>
            <p className="text-2xl font-bold text-red-800 mt-1">{fmt(data.summary.totalDue)}</p>
          </div>
          <div className="rounded-xl p-5 border border-purple-200 bg-purple-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">Balance</p>
            <p className={`text-2xl font-bold mt-1 ${data.summary.balance >= 0 ? "text-purple-800" : "text-red-800"}`}>{fmt(data.summary.balance)}</p>
          </div>
        </div>
      )}

      {/* Fee Structure */}
      {data?.feeBreakdown?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-slate-800">Applicable Fees</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.feeBreakdown.map((f, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.frequency} — {f.source}</p>
                </div>
                <span className="text-sm font-bold text-slate-800">{fmt(f.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      {data?.recentPayments?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-slate-800">Payment History</h3>
          </div>
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
                  <th className="px-5 py-3 font-semibold text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">{bdDate(p.receiveDate || p.createdAt)}</td>
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-indigo-600">{p.receiptNo}</td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-600 max-w-xs">{p.feeDetails || "—"}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      {p.receivedBy?.name || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg font-semibold">{p.paymentMethod || "—"}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700">{fmt(p.paidAmount)}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => navigate(`/payment/receipt/${p._id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                        title="View receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ HIFZ PROGRESS (own reports) ============
function HifzPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/student-portal/hifz", {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        setData(res.data);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const cls = (l) => {
    const parts = [];
    if (l?.juz) parts.push(`Juz ${l.juz}`);
    if (l?.page) parts.push(`P.${l.page}`);
    if (l?.verse) parts.push(`V.${l.verse}`);
    return parts.join(", ") || "—";
  };

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" /></div>;

  return (
    <div className="space-y-5">
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Marked Days</p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{data.marks}</p>
          </div>
          <div className="rounded-xl p-4 border border-teal-200 bg-teal-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">Days with Lesson</p>
            <p className="text-2xl font-bold text-teal-800 mt-1">{data.filledDays}</p>
          </div>
          <div className="rounded-xl p-4 border border-indigo-200 bg-indigo-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Teacher Marks</p>
            <p className="text-2xl font-bold text-indigo-800 mt-1">{data.reports?.length || 0}</p>
          </div>
        </div>
      )}

      {data?.reports?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-slate-800">My Hifz Progress</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Lesson</th>
                  <th className="px-5 py-3 font-semibold">Seven Lessons</th>
                  <th className="px-5 py-3 font-semibold">Memorization Review</th>
                  <th className="px-5 py-3 font-semibold">Remarks</th>
                  <th className="px-5 py-3 font-semibold">Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.reports.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3 text-gray-700 whitespace-nowrap text-xs">{bdDate(r.date)}</td>
                    <td className="px-5 py-3 text-xs text-slate-700">{cls(r.lesson)}</td>
                    <td className="px-5 py-3 text-xs text-slate-700">{cls(r.sevenLessons)}</td>
                    <td className="px-5 py-3 text-xs text-slate-700">{cls(r.memorizationReview)}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 max-w-[160px] truncate">{r.remarks || "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{r.teacherId?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No hifz progress recorded yet</p>
          </div>
        )
      )}
    </div>
  );
}

// ============ DAILY DIARY ============
function Diary({ student }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/student-portal/diary", {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        setReports(res.data.reports || []);
      } catch { /* silent */ } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto" /></div>;

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No diary entries available</p>
        </div>
      ) : (
        reports.map((report) => (
          <div key={report._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{report.className}</h3>
              <span className="text-xs text-gray-400">{bdDate(report.date)}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {report.entries?.map((entry, i) => (
                <div key={i} className="px-5 py-3">
                  <p className="text-sm font-semibold text-indigo-600">{entry.subject}</p>
                  {entry.classWork && <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Class Work:</span> {entry.classWork}</p>}
                  {entry.homeWork && <p className="text-xs text-gray-500 mt-0.5"><span className="font-medium">Home Work:</span> {entry.homeWork}</p>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
