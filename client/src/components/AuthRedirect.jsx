import {
  Navigate,
} from "react-router-dom";

const AuthRedirect = ({
  children,
}) => {

  const teacher =
    JSON.parse(
      localStorage.getItem(
        "teacher"
      )
    );

  // Already logged in
  if (teacher) {

    if (
      teacher.role ===
      "admin"
    ) {

      return (
        <Navigate
          to="/admin"
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
      />
    );
  }

  return children;
};

export default AuthRedirect;