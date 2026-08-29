const StudentFeeAssignment = require("../models/StudentFeeAssignment");
const Student = require("../models/Student");
const FeeCategory = require("../models/FeeCategory");

// ============================================
// LIST STUDENT FEE ASSIGNMENTS
// ============================================

const getStudentFeeAssignments = async (req, res) => {
  try {
    const { student, academicSession } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (academicSession) filter.academicSession = academicSession;

    const assignments = await StudentFeeAssignment.find(filter)
      .populate("feeCategory", "name code category isRequired defaultAmount")
      .populate("createdBy", "name")
      .populate("modifiedBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPSERT STUDENT FEE ASSIGNMENT
// (keeps optional fees applicable per student)
// ============================================

const upsertStudentFeeAssignment = async (req, res) => {
  try {
    const { student: studentId, academicSession, feeCategory, amount, frequency, isActive, reason } = req.body;

    if (!studentId || !feeCategory) {
      return res.status(400).json({ success: false, message: "student and feeCategory are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const session = academicSession || student.session || "2026";

    const cat = await FeeCategory.findById(feeCategory);
    if (!cat) {
      return res.status(404).json({ success: false, message: "Fee category not found." });
    }

    const existing = await StudentFeeAssignment.findOne({
      student: studentId,
      academicSession: session,
      feeCategory,
    });

    if (existing) {
      if (amount !== undefined) existing.amount = Number(amount) || 0;
      if (frequency !== undefined) existing.frequency = frequency;
      if (isActive !== undefined) existing.isActive = isActive;
      if (reason !== undefined) existing.reason = reason || "";
      existing.modifiedBy = req.user?._id || null;
      await existing.save();
      return res.status(200).json({ success: true, message: "Fee assignment updated.", assignment: existing });
    }

    const assignment = await StudentFeeAssignment.create({
      student: studentId,
      studentId: student.studentId,
      academicSession: session,
      feeCategory,
      amount: Number(amount) || 0,
      frequency: frequency || cat.frequency || "Monthly",
      isActive: isActive !== undefined ? isActive : true,
      reason: reason || "",
      createdBy: req.user?._id || null,
      modifiedBy: req.user?._id || null,
    });

    return res.status(201).json({ success: true, message: "Fee assignment created.", assignment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE STUDENT FEE ASSIGNMENT (by id)
// ============================================

const updateStudentFeeAssignment = async (req, res) => {
  try {
    const assignment = await StudentFeeAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Fee assignment not found." });
    }

    const { amount, frequency, isActive, reason } = req.body;
    if (amount !== undefined) assignment.amount = Number(amount) || 0;
    if (frequency !== undefined) assignment.frequency = frequency;
    if (isActive !== undefined) assignment.isActive = isActive;
    if (reason !== undefined) assignment.reason = reason || "";
    assignment.modifiedBy = req.user?._id || null;
    await assignment.save();

    return res.status(200).json({ success: true, message: "Fee assignment updated.", assignment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE STUDENT FEE ASSIGNMENT
// ============================================

const deleteStudentFeeAssignment = async (req, res) => {
  try {
    const assignment = await StudentFeeAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Fee assignment not found." });
    }
    return res.status(200).json({ success: true, message: "Fee assignment removed." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentFeeAssignments,
  upsertStudentFeeAssignment,
  updateStudentFeeAssignment,
  deleteStudentFeeAssignment,
};