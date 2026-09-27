const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

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

    // Track "last active on the website" (throttled to once per minute)
    try {
      const now = new Date();
      const last = teacher.lastActive ? new Date(teacher.lastActive).getTime() : 0;
      if (now.getTime() - last > 60000) {
        teacher.lastActive = now;
        Teacher.updateOne({ _id: teacher._id }, { $set: { lastActive: now } }).catch(() => {});
      }
    } catch {
      // never block a request because of activity tracking
    }

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

// =======================================
// STAFF OR STUDENT
// =======================================
// A few screens are reachable from both portals (a student opens their own
// receipt from the student portal, staff open the same page from payment
// history). This accepts either token and sets req.user or req.student, so the
// controller can still enforce ownership.

const protectStaffOrStudent = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid Token" });
  }

  if (decoded.role === "student") {
    const student = await Student.findById(decoded.id).select("-password -plainPassword");
    if (!student) {
      return res.status(401).json({ message: "Student not found" });
    }
    req.student = student;
    return next();
  }

  const teacher = await Teacher.findById(decoded.id).select("-password");
  if (!teacher) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = teacher;
  return next();
};

module.exports = {
  protect,
  authorizeRoles,
  protectStaffOrStudent,
};