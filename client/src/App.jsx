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