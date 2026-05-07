const Teacher = require("../models/Teacher");

const bcrypt = require("bcryptjs");


// GET ALL TEACHERS
const getTeachers = async (
  req,
  res
) => {
  try {

    const teachers =
      await Teacher.find()
        .sort({
          createdAt: -1,
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

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const teacher =
      await Teacher.create({
        name,
        email,
        password:
          hashedPassword,
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
  createTeacher,
  deleteTeacher,
  updateTeacher,
};