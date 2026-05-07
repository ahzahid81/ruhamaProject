import {
  Link,
  Outlet,
  useLocation,
} from "react-router-dom";

const MainLayout = () => {

  const location =
    useLocation();

  const teacher =
    JSON.parse(
      localStorage.getItem(
        "teacher"
      )
    );

  const handleLogout = () => {

    localStorage.clear();

    window.location.href = "/";
  };


  // BASE NAV
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


  // ADMIN NAV
  if (
    teacher?.role ===
    "admin"
  ) {

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
      <div className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-white shadow-sm flex-col z-50">

        {/* Logo */}
        <div className="p-8 border-b">

          <h1 className="text-3xl font-bold text-emerald-600">

            Ruhama

          </h1>

          <p className="text-gray-500 mt-2">

            Daily Report System 

          </p>

        </div>

        {/* Navigation */}
        <div className="flex-1 p-5 space-y-3 overflow-auto">

          {navItems.map(
            (item) => (

              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 p-4 rounded-2xl transition font-medium
                  
                  ${
                    location.pathname ===
                    item.path
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
              >

                <span className="text-2xl">

                  {item.icon}

                </span>

                <span>

                  {item.name}

                </span>

              </Link>

            )
          )}

        </div>

        {/* User */}
        <div className="p-5 border-t">

          <div className="bg-gray-50 rounded-2xl p-4 mb-4">

            <h2 className="font-bold text-lg">

              {teacher?.name}

            </h2>

            <p className="text-gray-500 text-sm mt-1">

              {teacher?.email}

            </p>

            <div className="mt-3">

              <span
                className={`px-4 py-2 rounded-full text-sm font-medium
                  
                  ${
                    teacher?.role ===
                    "admin"
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
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-semibold"
          >

            Logout

          </button>

        </div>

      </div>

      {/* Main Content */}
      <div className="md:ml-72">

        {/* Topbar */}
        <div className="bg-white shadow-sm sticky top-0 z-40 px-5 py-4 flex justify-between items-center">

          <h1 className="text-2xl font-bold">

            Daily Class Report

          </h1>

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">

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
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-lg z-50">

        <div
          className={`grid ${
            teacher?.role ===
            "admin"
              ? "grid-cols-5"
              : "grid-cols-3"
          }`}
        >

          {navItems.map(
            (item) => (

              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-4 transition
                    
                    ${
                      location.pathname ===
                      item.path
                        ? "text-emerald-600"
                        : "text-gray-500"
                    }`}
              >

                <span className="text-2xl">

                  {item.icon}

                </span>

                <span className="text-xs mt-1 font-medium">

                  {item.name}

                </span>

              </Link>

            )
          )}

        </div>

      </div>

    </div>
  );
};

export default MainLayout;