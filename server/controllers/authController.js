const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER
const registerTeacher = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      assignments,
    } = req.body;

    const existingTeacher =
      await Teacher.findOne({ email });

    if (existingTeacher) {
      return res.status(400).json({
        message: "Teacher already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const teacher = await Teacher.create({
      name,
      email,
      password: hashedPassword,
      assignments,
    });

    res.status(201).json({
      message: "Teacher Registered",
      teacher,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// LOGIN
const loginTeacher = async (req, res) => {
  try {

    const { email, password } = req.body;

    const teacher =
      await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(400).json({
        message: "Invalid Email",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        teacher.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: teacher._id,
        role: teacher.role,
        email: teacher.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      teacher,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

// STUDENT LOGIN
const loginStudent = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({ message: "Student ID and password are required." });
    }

    const student = await Student.findOne({ studentId, status: "Active" });

    if (!student) {
      return res.status(400).json({ message: "Invalid Student ID or student is not active." });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    const token = jwt.sign(
      { id: student._id, role: "student", studentId: student.studentId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        section: student.section,
        photo: student.photo,
        session: student.session,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerTeacher,
  loginTeacher,
  loginStudent,
};