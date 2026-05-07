const Teacher = require("../models/Teacher");

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

module.exports = {
  registerTeacher,
  loginTeacher,
};