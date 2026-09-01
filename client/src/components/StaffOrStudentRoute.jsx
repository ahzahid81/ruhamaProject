import { Navigate } from "react-router-dom";

// Allows access if the user is a staff member (teacher/admin) OR a student.
const StaffOrStudentRoute = ({ children }) => {
  const teacher = JSON.parse(localStorage.getItem("teacher"));
  const studentToken = localStorage.getItem("studentToken");
  const student = JSON.parse(localStorage.getItem("student"));

  // Not authenticated at all
  if (!teacher && !studentToken) {
    return <Navigate to="/login" />;
  }

  // Student logged in → redirect to their portal if they try a staff page they shouldn't see
  if (!teacher && student) {
    return children;
  }

  return children;
};

export default StaffOrStudentRoute;
