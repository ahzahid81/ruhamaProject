import { LayoutDashboard, BookOpen, ClipboardList, ArrowRight, Clock, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const teacher = JSON.parse(localStorage.getItem("teacher"));

  const assignedClasses = new Set(teacher?.assignments?.map((a) => a.className)).size;
  const subjects = new Set(teacher?.assignments?.map((a) => a.subject)).size;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome back, {teacher?.name?.split(" ")[0] || "Teacher"}
              </h1>
              <p className="mt-1.5 text-indigo-200 text-sm md:text-base">
                Here&apos;s your daily report overview
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
              <Clock className="w-4 h-4 text-indigo-200" />
              <span className="text-sm text-white font-medium">
                {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Assigned Classes</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{assignedClasses}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active this semester</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Subjects</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{subjects}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across all classes</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Today&apos;s Entries</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">0</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Not yet submitted</span>
          </div>
        </div>
      </div>

      {/* Quick Actions + Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <a
                href="/create-report"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium text-sm group"
              >
                <ClipboardList className="w-4.5 h-4.5" />
                <span className="flex-1">Create Daily Report</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
              <a
                href="/class-report"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium text-sm group"
              >
                <BookOpen className="w-4.5 h-4.5" />
                <span className="flex-1">View Class Reports</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
            </div>
          </div>
        </div>

        {/* My Assignments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">My Assignments</h2>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                {teacher?.assignments?.length || 0} total
              </span>
            </div>

            {teacher?.assignments?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {teacher.assignments.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100">
                        {item.subject?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.subject}</p>
                        <p className="text-xs text-gray-400">{item.className}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No assignments yet</p>
              </div>
            )}

            {teacher?.assignments?.length > 0 && (
              <a
                href="/create-report"
                className="mt-4 block w-full text-center py-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-100"
              >
                View All Assignments
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
