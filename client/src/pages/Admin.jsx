import { useEffect, useState } from "react";
import api from "../services/api";
import {
  FileText,
  ClipboardList,
  BookOpen,
  AlertTriangle,
  Edit3,
  Trash2,
  Loader2,
  BarChart3,
} from "lucide-react";

const Admin = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingData, setPendingData] = useState({});

  const getPending = async (className, date) => {
    try {
      const res = await api.get(`/reports/pending?className=${className}&date=${date}`);
      setPendingData((prev) => ({
        ...prev,
        [className + date]: res.data,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const deleteEntry = async (reportId, entryId) => {
    const confirmDelete = window.confirm("Delete this entry?");
    if (!confirmDelete) return;
    try {
      await api.delete(`/reports/${reportId}/${entryId}`);
      alert("Entry Deleted");
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const editEntry = async (reportId, entry) => {
    const classWork = prompt("Edit Class Work", entry.classWork);
    const homeWork = prompt("Edit Home Work", entry.homeWork);
    if (!classWork || !homeWork) return;
    try {
      await api.put(`/reports/${reportId}/${entry._id}`, {
        classWork,
        homeWork,
      });
      alert("Entry Updated");
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get("/reports/all");
        setReports(res.data);
        res.data.forEach((report) => {
          getPending(report.className, report.date);
        });
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalReports = reports.length;
  const totalEntries = reports.reduce((acc, report) => acc + report.entries.length, 0);
  const totalClasses = new Set(reports.map((report) => report.className)).size;
  const totalPending = Object.values(pendingData).reduce(
    (acc, item) => acc + item.pendingSubjects.length,
    0
  );

  const statCards = [
    {
      label: "Total Reports",
      value: totalReports,
      icon: FileText,
      color: "indigo",
    },
    {
      label: "Submitted Entries",
      value: totalEntries,
      icon: ClipboardList,
      color: "emerald",
    },
    {
      label: "Classes",
      value: totalClasses,
      icon: BookOpen,
      color: "blue",
    },
    {
      label: "Pending Subjects",
      value: totalPending,
      icon: AlertTriangle,
      color: "red",
    },
  ];

  const colorMap = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      icon: "text-indigo-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      icon: "text-emerald-600",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      icon: "text-blue-600",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      icon: "text-red-600",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1.5 text-indigo-200 text-sm md:text-base">
            School Report Management System
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading Reports...</span>
        </div>
      )}

      {/* Reports */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report._id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Report Header */}
            <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{report.className}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{report.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {report.entries.length} Subjects Submitted
                </span>
              </div>
            </div>

            {/* Entries */}
            <div className="px-6 py-4 space-y-3">
              {report.entries.map((entry, index) => (
                <div key={index} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                        {entry.subject?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <h3 className="font-semibold text-gray-900">{entry.subject}</h3>
                    </div>
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg w-fit">
                      {entry.teacherId?.name}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        Class Work
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{entry.classWork}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        Home Work
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{entry.homeWork}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => editEntry(report._id, entry)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(report._id, entry._id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Subjects */}
            {pendingData[report.className + report.date] && (
              <div className="px-6 py-4 bg-amber-50/50 border-t border-amber-100">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">Pending Subjects</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingData[report.className + report.date]?.pendingSubjects?.length > 0 ? (
                    pendingData[report.className + report.date].pendingSubjects.map((subject, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-medium"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium">
                      All Subjects Submitted
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
