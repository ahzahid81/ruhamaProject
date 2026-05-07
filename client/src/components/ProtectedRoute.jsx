import {
  Navigate,
} from "react-router-dom";

const ProtectedRoute = ({
  children,
  adminOnly = false,
}) => {

  const teacher =
    JSON.parse(
      localStorage.getItem(
        "teacher"
      )
    );

  // Not logged in
  if (!teacher) {

    return (
      <Navigate to="/" />
    );
  }

  // Admin only
  if (
    adminOnly &&
    teacher.role !== "admin"
  ) {

    return (
      <Navigate
        to="/dashboard"
      />
    );
  }

  return children;
};

export default ProtectedRoute;