import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";

import CreateReport from "./pages/CreateReport";

import ClassReport from "./pages/ClassReport";

import Admin from "./pages/Admin";

import Teachers from "./pages/Teachers";

import MainLayout from "./layouts/MainLayout";

import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import Students from "./pages/admin/Students";
import EditStudent from "./pages/admin/EditStudent";
import StudentAdmission from "./pages/admin/StudentAdmission";
import StudentDetails from "./pages/admin/StudentDetails";
import AdmitCard from "./pages/exam/AdmitCard";
import CollectPayment from "./pages/payment/CollectPayment";

function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route
          path="/"
          element={
            <AuthRedirect>

              <Login />

            </AuthRedirect>
          }
        />

        {/* Protected Layout */}
        <Route
          element={
            <ProtectedRoute>

              <MainLayout />

            </ProtectedRoute>
          }
        >

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Create Report */}
          <Route
            path="/create-report"
            element={<CreateReport />}
          />

          {/* Class Report */}
          <Route
            path="/class-report"
            element={<ClassReport />}
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute
                adminOnly={false}
              >
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute>
                <StudentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/edit/:id"
            element={
              <ProtectedRoute>
                <EditStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-admission"
            element={
              <ProtectedRoute>
                <StudentAdmission />
              </ProtectedRoute>
            }
          />
          <Route

            path="/exam/admit-card"

            element={<AdmitCard />}

          />
          <Route

            path="/collect-payment"

            element={<CollectPayment></CollectPayment>}

          />
          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <Admin />

              </ProtectedRoute>
            }
          />
          {/* Teachers */}
          <Route
            path="/teachers"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <Teachers />

              </ProtectedRoute>
            }
          />

        </Route>


      </Routes>

    </BrowserRouter>
  );
}

export default App;