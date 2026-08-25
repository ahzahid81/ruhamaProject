const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const protectStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "student") {
      return res.status(403).json({ message: "Access denied. Student token required." });
    }

    const student = await Student.findById(decoded.id).select("-password -plainPassword");
    if (!student) {
      return res.status(401).json({ message: "Student not found." });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid or expired." });
  }
};

module.exports = { protectStudent };
