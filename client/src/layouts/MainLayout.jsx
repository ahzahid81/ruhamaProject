import {
  Link,
  Outlet,
  useLocation,
} from "react-router-dom";

const MainLayout = () => {
  const location = useLocation();

  const teacher = JSON.parse(localStorage.getItem("teacher"));

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // Helper function to get the correct grid-cols class for mobile navigation
  // মোবাইল নেভিগেশনের জন্য সঠিক গ্রিড-কলাম ক্লাস পেতে একটি সহায়ক ফাংশন
  const getGridColsClass = (itemCount) => {
    switch (itemCount) {
      case 3:
        return 'grid-cols-3';
      case 5:
        return 'grid-cols-5';
      case 7:
        return 'grid-cols-7';
      default:
        return 'grid-cols-1'; // Fallback for unexpected item counts
    }
  };

  // BASE NAV ITEMS
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "🏠",
    },
    {
      name: "Create Report",
      path: "/create-report",
      icon: "➕",
    },
    {
      name: "Class Reports",
      path: "/class-report",
      icon: "📄",
    },
  ];

  // STUDENT MANAGEMENT NAV ITEMS (Conditional)
  if (teacher?.role === "admin" || teacher?.role === "account_manager") {
    navItems.push(
      {
        name: "Students",
        path: "/students",
        icon: "👨‍🎓"
      },
      {
        name: "Admission",
        path: "/student-admission",
        icon: "➕"
      }
    );
  }

  // ADMIN SPECIFIC NAV ITEMS (Conditional)
  if (teacher?.role === "admin") {
    navItems.push(
      {
        name: "Admin",
        path: "/admin",
        icon: "📊",
      },
      {
        name: "Teachers",
        path: "/teachers",
        icon: "👨‍🏫",
      }
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-white shadow-lg flex-col z-50"> {/* শ্যাডো বৃদ্ধি করা হয়েছে */}
        {/* Logo */}
        <div className="p-8 border-b border-gray-100"> {/* সূক্ষ্ম বর্ডার যোগ করা হয়েছে */}
          <h1 className="text-3xl font-extrabold text-emerald-700"> {/* শক্তিশালী ফন্ট এবং গাঢ় রঙ */}
            Ruhama
          </h1>
          <p className="text-gray-600 mt-2 tracking-wide"> {/* গাঢ় ধূসর রঙ, সূক্ষ্ম লেটার স্পেসিং */}
            Daily Report System
          </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-5 space-y-3 overflow-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              // আইকন অ্যানিমেশনের জন্য 'group' যোগ করা হয়েছে, হোভার এবং ট্রানজিশন উন্নত করা হয়েছে
              className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ease-in-out
                ${location.pathname === item.path
                  ? "bg-emerald-600 text-white shadow-xl" // অ্যাক্টিভ অবস্থার জন্য শক্তিশালী শ্যাডো
                  : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700" // উন্নত হোভার ইফেক্ট
                }`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200"> {/* আইকনে হোভার ইফেক্ট */}
                {item.icon}
              </span>
              <span className="font-medium"> {/* টেক্সটের জন্য সামঞ্জস্যপূর্ণ ফন্ট ওয়েট */}
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* User */}
        <div className="p-5 border-t border-gray-100"> {/* বর্ডার-গ্রে-১০০ যোগ করা হয়েছে */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 shadow-sm"> {/* সূক্ষ্ম শ্যাডো যোগ করা হয়েছে */}
            <h2 className="font-bold text-lg text-gray-800"> {/* নামের জন্য গাঢ় টেক্সট */}
              {teacher?.name}
            </h2>
            <p className="text-gray-600 text-sm mt-1"> {/* ইমেলের জন্য গাঢ় টেক্সট */}
              {teacher?.email}
            </p>
            <div className="mt-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold
                  ${teacher?.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                  }`}
              >
                {teacher?.role}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold transition-colors duration-200" // ট্রানজিশন যোগ করা হয়েছে
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-72">
        {/* Topbar */}
        <div className="bg-white shadow-lg sticky top-0 z-40 px-5 py-4 flex justify-between items-center border-b border-gray-100"> {/* শ্যাডো বৃদ্ধি করা হয়েছে, সূক্ষ্ম বর্ডার যোগ করা হয়েছে */}
          <h1 className="text-2xl font-extrabold text-gray-800"> {/* শক্তিশালী ফন্ট এবং গাঢ় রঙ */}
            Daily Class Report
          </h1>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-md"> {/* রঙ পরিবর্তন করা হয়েছে, শ্যাডো যোগ করা হয়েছে */}
              {
                teacher?.name
                  ?.charAt(0)
              }
            </div>
          </div>
        </div>

        {/* Pages */}
        <div className="p-3 md:p-6 pb-28">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-xl z-50 py-2"> {/* শ্যাডো বৃদ্ধি করা হয়েছে, সূক্ষ্ম প্যাডিং, বর্ডার-গ্রে-১০০ */}
        <div
          className={`grid ${getGridColsClass(navItems.length)}`}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              // প্রিমিয়াম অনুভূতির জন্য মোবাইল লিঙ্কের স্টাইল পরিমার্জিত করা হয়েছে
              className={`flex flex-col items-center justify-center py-3 px-1 transition-all duration-200 ease-in-out
                ${location.pathname === item.path
                  ? "text-emerald-600 font-semibold bg-emerald-50 rounded-xl mx-1" // সূক্ষ্ম ব্যাকগ্রাউন্ড এবং রাউন্ডিং সহ অ্যাক্টিভ অবস্থা
                  : "text-gray-500 hover:text-emerald-700 hover:bg-gray-50 rounded-xl mx-1" // হোভার ইফেক্ট
                }`}
            >
              <span className="text-2xl">
                {item.icon}
              </span>
              <span className="text-xs mt-1 font-medium"> {/* সামঞ্জস্যপূর্ণ ফন্ট ওয়েট */}
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;