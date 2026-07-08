const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");

// =======================================
// VERIFY LOGIN
// =======================================

const protect = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const teacher =
      await Teacher.findById(decoded.id)
        .select("-password");

    if (!teacher) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = teacher;

    next();

  } catch (error) {

    return res.status(401).json({
      message: "Invalid Token",
    });

  }
};

// =======================================
// ROLE
// =======================================

const authorizeRoles =
  (...roles) => {

    return (req, res, next) => {

      if (!roles.includes(req.user.role)) {

        return res.status(403).json({

          message:
            "Access Denied",

        });

      }

      next();

    };

  };

module.exports = {
  protect,
  authorizeRoles,
};