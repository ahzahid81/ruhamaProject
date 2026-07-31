const ExamSubject = require("../models/ExamSubject");
const ExamSetting = require("../models/ExamSetting");

const toCode = (name) =>
  name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");

// ==========================================
// CREATE SUBJECT
// ==========================================

const createSubject = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await ExamSetting.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const { className, subjectName } = req.body;
    if (!className || !subjectName) {
      return res.status(400).json({ success: false, message: "Class and subject name are required." });
    }

    const exists = await ExamSubject.findOne({ exam: examId, className, subjectName });
    if (exists) {
      return res.status(400).json({ success: false, message: "Subject already exists for this class." });
    }

    const subject = await ExamSubject.create({
      exam: examId,
      className,
      subjectName,
      subjectCode: req.body.subjectCode || toCode(subjectName),
      fullMarks: req.body.fullMarks || 100,
      passMarks: req.body.passMarks !== undefined ? req.body.passMarks : 33,
      order: req.body.order || 0,
    });

    return res.status(201).json({ success: true, message: "Subject added successfully.", subject });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET SUBJECTS (by exam, optional class)
// ==========================================

const getSubjects = async (req, res) => {
  try {
    const { examId } = req.params;
    const { className } = req.query;

    const filter = { exam: examId };
    if (className) filter.className = className;

    const subjects = await ExamSubject.find(filter).sort({ className: 1, order: 1, subjectName: 1 });

    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// UPDATE SUBJECT
// ==========================================

const updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await ExamSubject.findByIdAndUpdate(subjectId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }

    return res.status(200).json({ success: true, message: "Subject updated successfully.", subject });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DELETE SUBJECT
// ==========================================

const deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await ExamSubject.findByIdAndDelete(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }

    return res.status(200).json({ success: true, message: "Subject deleted successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// BULK SET SUBJECTS FOR A CLASS
// ==========================================

const bulkSetSubjects = async (req, res) => {
  try {
    const { examId } = req.params;
    const { className, subjects } = req.body;

    const exam = await ExamSetting.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }
    if (!className || !Array.isArray(subjects)) {
      return res.status(400).json({ success: false, message: "className and subjects array are required." });
    }

    await ExamSubject.deleteMany({ exam: examId, className });

    const docs = subjects.map((s, i) => ({
      exam: examId,
      className,
      subjectName: s.subjectName,
      subjectCode: s.subjectCode || toCode(s.subjectName),
      fullMarks: Number(s.fullMarks) || 100,
      passMarks: s.passMarks !== undefined ? Number(s.passMarks) : 33,
      order: Number(s.order) || i + 1,
    }));

    const created = await ExamSubject.insertMany(docs);

    return res.status(201).json({
      success: true,
      message: "Subjects saved successfully.",
      subjects: created,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
  bulkSetSubjects,
};
