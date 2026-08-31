const Teacher = require("../models/Teacher");

const bcrypt = require("bcryptjs");

const DEFAULT_TEACHER_PASSWORD =
  "Ruhama2026";


// GET ALL TEACHERS
const getTeachers = async (
  req,
  res
) => {
  try {

    const teachers =
      await Teacher.find()
        .select(
          "_id name role assignments"
        )
        .sort({
          createdAt: 1,
        });

    res.status(200).json(
      teachers
    );

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// GET ALL TEACHERS (admin view: email, password, last login)
const getTeachersManage = async (
  req,
  res
) => {
  try {

    const teachers =
      await Teacher.find()
        .select(
          "_id name email role assignments lastLogin plainPassword"
        )
        .sort({
          createdAt: 1,
        });

    res.status(200).json(
      teachers
    );

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};


// CREATE TEACHER
const createTeacher = async (
  req,
  res
) => {
  try {

    const {
      name,
      email,
      password,
      assignments,
      role,
    } = req.body;

    const existingTeacher =
      await Teacher.findOne({
        email,
      });

    if (existingTeacher) {

      return res.status(400).json({
        message:
          "Teacher already exists",
      });
    }

    const finalPassword =
      password || DEFAULT_TEACHER_PASSWORD;

    const hashedPassword =
      await bcrypt.hash(finalPassword, 10);

    const teacher =
      await Teacher.create({
        name,
        email,
        password:
          hashedPassword,
        plainPassword: finalPassword,
        role,
        assignments,
      });

    res.status(201).json({
      message:
        "Teacher Created",
      teacher,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE TEACHER
const deleteTeacher = async (
  req,
  res
) => {
  try {

    await Teacher.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message:
        "Teacher Deleted",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

// RESET A SINGLE TEACHER PASSWORD (to the fixed default)
const resetTeacherPassword = async (
  req,
  res
) => {
  try {

    const teacher =
      await Teacher.findById(
        req.params.id
      );

    if (!teacher) {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    teacher.password =
      await bcrypt.hash(
        DEFAULT_TEACHER_PASSWORD,
        10
      );

    teacher.plainPassword =
      DEFAULT_TEACHER_PASSWORD;

    await teacher.save();

    res.status(200).json({
      message:
        "Password reset to the default",
      plainPassword: DEFAULT_TEACHER_PASSWORD,
    });

  } catch (error) {

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        message: "Teacher not found",
      });
    }

    res.status(500).json({
      message: error.message,
    });

  }
};

// RESET ALL TEACHERS PASSWORD (to the fixed default)
const resetAllTeacherPasswords = async (
  req,
  res
) => {
  try {

    const hashed =
      await bcrypt.hash(
        DEFAULT_TEACHER_PASSWORD,
        10
      );

    const result =
      await Teacher.updateMany(
        {},

        {
          password: hashed,
          plainPassword: DEFAULT_TEACHER_PASSWORD,
        }
      );

    res.status(200).json({
      message:
        "All teacher passwords reset to the default",
      count: result.modifiedCount,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// UPDATE TEACHER
const updateTeacher = async (
  req,
  res
) => {
  try {

    const {
      name,
      email,
      assignments,
    } = req.body;

    const teacher =
      await Teacher.findByIdAndUpdate(
        req.params.id,

        {
          name,
          email,
          assignments,
        },

        {
          new: true,
        }
      );

    res.status(200).json({
      message:
        "Teacher Updated",

      teacher,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getTeachers,
  getTeachersManage,
  resetTeacherPassword,
  resetAllTeacherPasswords,
  createTeacher,
  deleteTeacher,
  updateTeacher,
};