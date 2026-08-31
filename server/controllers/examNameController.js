const ExamName = require("../models/ExamName");

// GET ALL EXAM NAMES
const getExamNames = async (
  req,
  res
) => {
  try {

    const examNames =
      await ExamName.find()
        .sort({
          order: 1,
          name: 1,
        });

    res.status(200).json(
      examNames.map((e) => ({
        _id: e._id,
        name: e.name,
        order: e.order,
      }))
    );

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// CREATE EXAM NAME
const createExamName = async (
  req,
  res
) => {
  try {

    const name =
      String(req.body.name || "")
        .trim();

    if (!name) {
      return res.status(400).json({
        message:
          "Exam name is required",
      });
    }

    const existing =
      await ExamName.findOne({
        name,
      });

    if (existing) {
      return res.status(400).json({
        message:
          "Exam name already exists",
      });
    }

    const count =
      await ExamName.countDocuments();

    const examName =
      await ExamName.create({
        name,
        order: count,
      });

    res.status(201).json({
      _id: examName._id,
      name: examName.name,
      order: examName.order,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

// UPDATE EXAM NAME
const updateExamName = async (
  req,
  res
) => {
  try {

    const name =
      String(req.body.name || "")
        .trim();

    if (!name) {
      return res.status(400).json({
        message:
          "Exam name is required",
      });
    }

    const duplicate =
      await ExamName.findOne({
        name,
        _id: {
          $ne: req.params.id,
        },
      });

    if (duplicate) {
      return res.status(400).json({
        message:
          "Exam name already exists",
      });
    }

    const examName =
      await ExamName.findByIdAndUpdate(
        req.params.id,
        { name },
        { new: true }
      );

    if (!examName) {
      return res.status(404).json({
        message:
          "Exam name not found",
      });
    }

    res.status(200).json({
      message: "Exam name updated",
      _id: examName._id,
      name: examName.name,
      order: examName.order,
    });

  } catch (error) {

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        message: "Exam name not found",
      });
    }

    res.status(500).json({
      message: error.message,
    });

  }
};

// DELETE EXAM NAME
const deleteExamName = async (
  req,
  res
) => {
  try {

    const examName =
      await ExamName.findByIdAndDelete(
        req.params.id
      );

    if (!examName) {
      return res.status(404).json({
        message: "Exam name not found",
      });
    }

    res.status(200).json({
      message: "Exam name deleted",
    });

  } catch (error) {

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        message: "Exam name not found",
      });
    }

    res.status(500).json({
      message: error.message,
    });

  }
};

module.exports = {
  getExamNames,
  createExamName,
  updateExamName,
  deleteExamName,
};