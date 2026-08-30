import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { getSettings } from "./services/settingsCache";

import Login from "./pages/Login";
import LandingPage from "./pages/public/LandingPage";
import StudentLogin from "./pages/student/StudentLogin";
import StudentPortal from "./pages/student/StudentPortal";

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
import ExamManagement from "./pages/exam/ExamManagement";
import MarksEntry from "./pages/exam/MarksEntry";
import ExamResults from "./pages/exam/ExamResults";
import ReportCard from "./pages/exam/ReportCard";
import ResultSheet from "./pages/exam/ResultSheet";
import CollectPayment from "./pages/payment/CollectPayment";
import FeeSettings from "./pages/admin/FeeSettings";
import SystemSettings from "./pages/admin/SystemSettings";
import StudentLedger from "./pages/admin/students/StudentLedger";
import StudentFeeOverride from "./pages/admin/students/StudentFeeOverride";
import StudentFeeAssignments from "./pages/admin/students/StudentFeeAssignments";
import DailyAttendance from "./pages/attendance/DailyAttendance";
import AttendanceReport from "./pages/attendance/AttendanceReport";
import PaymentHistory from "./pages/payment/PaymentHistory";
import FeeCategories from "./pages/admin/FeeCategories";
import FeeCategoryForm from "./pages/admin/FeeCategoryForm";
import ClassRateForm from "./pages/admin/ClassRateForm";
import ExamForm from "./pages/exam/ExamForm";
import ExamSubjects from "./pages/exam/ExamSubjects";
import TeacherEdit from "./pages/TeacherEdit";
import AdminEntryEdit from "./pages/AdminEntryEdit";
import PaymentReceipt from "./pages/payment/PaymentReceipt";
import AdmissionSuccess from "./pages/admin/AdmissionSuccess";

function App() {

  useEffect(() => {
    getSettings().catch(() => {});
  }, []);

  return (
    <BrowserRouter>

      <Routes>

        {/* Public Website */}
        <Route path="/" element={<LandingPage />} />

        {/* Staff Login */}
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <Login />
            </AuthRedirect>
          }
        />

        {/* Student Login */}
        <Route path="/student-login" element={<StudentLogin />} />

        {/* Student Portal */}
        <Route path="/student-portal" element={<StudentPortal />} />

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

            path="/exam/management"

            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <ExamManagement />

              </ProtectedRoute>
            }

          />
          <Route

            path="/exam/marks-entry"

            element={<MarksEntry />}

          />
          <Route

            path="/exam/results"

            element={<ExamResults />}

          />
          <Route

            path="/exam/report-card"

            element={
              <ProtectedRoute>
                <ReportCard />
              </ProtectedRoute>
            }

          />
          <Route

            path="/exam/result-sheet"

            element={
              <ProtectedRoute>
                <ResultSheet />
              </ProtectedRoute>
            }

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

          {/* Fee Settings */}
          <Route
            path="/fees/settings"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <FeeSettings />

              </ProtectedRoute>
            }
          />

          {/* Fee Category Form */}
          <Route
            path="/fees/settings/categories/new"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <FeeCategoryForm />

              </ProtectedRoute>
            }
          />
          <Route
            path="/fees/settings/categories/:id/edit"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <FeeCategoryForm />

              </ProtectedRoute>
            }
          />

          {/* Class Rate Form */}
          <Route
            path="/fees/settings/rates/new"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <ClassRateForm />

              </ProtectedRoute>
            }
          />
          <Route
            path="/fees/settings/rates/:id/edit"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <ClassRateForm />

              </ProtectedRoute>
            }
          />

          {/* Exam Form / Subjects */}
          <Route
            path="/exam/management/new"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <ExamForm />

              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/management/:id/edit"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <ExamForm />

              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/management/:id/subjects"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <ExamSubjects />

              </ProtectedRoute>
            }
          />

          {/* Teacher Edit */}
          <Route
            path="/teachers/:id/edit"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <TeacherEdit />

              </ProtectedRoute>
            }
          />

          {/* Admin Entry Edit */}
          <Route
            path="/admin/report-entry"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <AdminEntryEdit />

              </ProtectedRoute>
            }
          />

          {/* Payment Receipt */}
          <Route
            path="/payment/receipt/:id"
            element={
              <ProtectedRoute>

                <PaymentReceipt />

              </ProtectedRoute>
            }
          />

          {/* Admission Success */}
          <Route
            path="/student-admission/success"
            element={
              <ProtectedRoute>

                <AdmissionSuccess />

              </ProtectedRoute>
            }
          />


          {/* System Settings */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute
                adminOnly={true}
              >

                <SystemSettings />

              </ProtectedRoute>
            }
          />

          {/* Student Fee Override */}
          <Route
            path="/students/:id/fee-override"
            element={
              <ProtectedRoute
                adminOnly={true}
              >
                <StudentFeeOverride></StudentFeeOverride>

              </ProtectedRoute>
            }
          />

          {/* Student Optional Fee Assignments */}
          <Route
            path="/students/:id/fees"
            element={
              <ProtectedRoute
                adminOnly={true}
              >
                <StudentFeeAssignments></StudentFeeAssignments>

              </ProtectedRoute>
            }
          />

          {/* Student Ledger */}
          <Route
            path="/students/:id/ledger"
            element={
              <ProtectedRoute
                adminOnly={false}
              >
                <StudentLedger></StudentLedger>
              </ProtectedRoute>
            }
          />

          {/* Attendance */}
          <Route
            path="/attendance/daily"
            element={<DailyAttendance />}
          />
          <Route
            path="/attendance/report"
            element={
              <ProtectedRoute adminOnly={true}>
                <AttendanceReport />
              </ProtectedRoute>
            }
          />

          {/* Payment History */}
          <Route
            path="/payment-history"
            element={
              <ProtectedRoute adminOnly={true}>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />

          {/* Fee Categories */}
          <Route
            path="/fees/categories"
            element={
              <ProtectedRoute adminOnly={true}>
                <FeeCategories />
              </ProtectedRoute>
            }
          />

        </Route>


      </Routes>

    </BrowserRouter>
  );
}

export default App;