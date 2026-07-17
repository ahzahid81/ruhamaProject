import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  GraduationCap,
  Wallet,
  IdCard,
  Settings,
  Shield,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  School,
  BookOpen,
  BarChart3,
} from "lucide-react";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "teacher", "account-manager"] },
      { name: "Create Report", path: "/create-report", icon: FileText, roles: ["admin", "teacher", "account-manager"] },
      { name: "Class Reports", path: "/class-report", icon: BookOpen, roles: ["admin", "teacher", "account-manager"] },
    ],
  },
  {
    label: "Students",
    roles: ["admin", "account-manager"],
    items: [
      { name: "All Students", path: "/students", icon: Users, roles: ["admin", "account-manager"] },
      { name: "New Admission", path: "/student-admission", icon: GraduationCap, roles: ["admin", "account-manager"] },
    ],
  },
  {
    label: "Finance",
    roles: ["admin", "account-manager"],
    items: [
      { name: "Collect Payment", path: "/collect-payment", icon: Wallet, roles: ["admin", "account-manager"] },
    ],
  },
  {
    label: "Examination",
    roles: ["admin", "account-manager"],
    items: [
      { name: "Admit Card", path: "/exam/admit-card", icon: IdCard, roles: ["admin", "account-manager"] },
    ],
  },
  {
    label: "Administration",
    roles: ["admin"],
    items: [
      { name: "Admin Panel", path: "/admin", icon: Shield, roles: ["admin"] },
      { name: "Teachers", path: "/teachers", icon: User, roles: ["admin"] },
    ],
  },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const location = useLocation();
  const searchRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const teacher = JSON.parse(localStorage.getItem("teacher"));

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const filteredGroups = navGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) =>
        item.roles.includes(teacher?.role)
      );
      if (!group.roles) {
        return { ...group, items: filteredItems };
      }
      if (group.roles.includes(teacher?.role) && filteredItems.length > 0) {
        return { ...group, items: filteredItems };
      }
      return null;
    })
    .filter(Boolean);

  useEffect(() => {
    const defaultExpanded = {};
    filteredGroups.forEach((group) => {
      const isActive = group.items.some((item) => location.pathname === item.path);
      if (isActive) defaultExpanded[group.label] = true;
    });
    setExpandedGroups((prev) => ({ ...prev, ...defaultExpanded }));
  }, []);

  const toggleGroup = (label) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts;
  };

  const pageTitle = () => {
    for (const group of filteredGroups) {
      for (const item of group.items) {
        if (location.pathname === item.path) return item.name;
      }
    }
    return "Dashboard";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-200">
          <School className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Ruhama</h1>
          <p className="text-xs text-gray-400 font-medium">School Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              {group.label}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expandedGroups[group.label] ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`mt-1 space-y-0.5 overflow-hidden transition-all duration-300 ${
                expandedGroups[group.label] === false ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
              }`}
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 shadow-sm border border-indigo-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${
                        isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                      }`}
                      strokeWidth={1.8}
                    />
                    <span>{item.name}</span>
                    {isActive && <div className="ml-auto w-1.5 h-6 rounded-full bg-indigo-600" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
            {teacher?.name?.charAt(0)?.toUpperCase() || "T"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{teacher?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                  teacher?.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : teacher?.role === "account-manager"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {teacher?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Logout"
          >
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

      {/* Main Content Area */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="flex items-center justify-between px-4 md:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="text-gray-400">Pages</span>
                  {getBreadcrumbs().map((crumb, i) => (
                    <span key={crumb} className="flex items-center gap-2">
                      <span>/</span>
                      <span className={i === getBreadcrumbs().length - 1 ? "text-gray-700 font-medium" : ""}>
                        {crumb.charAt(0).toUpperCase() + crumb.slice(1).replace(/-/g, " ")}
                      </span>
                    </span>
                  ))}
                </div>
                <h1 className="text-lg font-bold text-gray-900 -mt-0.5">{pageTitle()}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-48 lg:w-64 pl-9 pr-4 py-2 bg-gray-100 border border-transparent focus:border-gray-300 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none transition-all"
                />
              </div>
              <button
                className="sm:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* Profile */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {teacher?.name?.charAt(0)?.toUpperCase() || "T"}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{teacher?.name}</p>
                  <p className="text-[11px] text-gray-400">{teacher?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile search expand */}
          {searchOpen && (
            <div className="sm:hidden px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-md">
                  <School className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-bold text-gray-900">Ruhama</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
