const ExamAttendance = require("../models/ExamAttendance");
const ExamSetting = require("../models/ExamSetting");
const Student = require("../models/Student");
const { evaluateAdmitCardEligibility } = require("./paymentController");

const FULL_CATEGORY =
  "name applicableTo defaultAmount frequency isActive";

// ============================================
// HELPERS
// ============================================

const studentShape = (student) => ({
  _id: student._id,
  studentId: student.studentId,
  name: student.name,
  className: student.className,
  section: student.section,
  photo: student.photo,
  fatherName: student.fatherName,
  fatherMobile: student.fatherMobile,
});

const parseQrId = (qrData) => {
  if (typeof qrData === "string") {
    try {
      qrData = JSON.parse(qrData);
    } catch {
      return null;
    }
  }
  if (!qrData || typeof qrData !== "object") return null;
  return qrData.id || qrData.studentId || null;
};

// ============================================
// SCAN ADMIT CARD QR — marks eligible students
// ============================================

const scanQR = async (req, res) => {
  try {
    const { examId, qrData, method = "scan" } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Please select an exam from Exam Management.",
      });
    }

    const studentId = parseQrId(qrData);
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code. Please scan a valid admit card.",
      });
    }

    const exam = await ExamSetting.findById(examId).populate(
      "requiredFees.feeCategory",
      FULL_CATEGORY
    );
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const student = await Student.findOne({ studentId, status: "Active" });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No active student found with ID "${studentId}".`,
      });
    }

    // Only eligible students may enter the exam hall.
    const reasons = await evaluateAdmitCardEligibility(exam, student);
    if (reasons.length > 0) {
      return res.status(200).json({
        success: true,
        marked: false,
        eligible: false,
        reasons,
        student: studentShape(student),
      });
    }

    const existing = await ExamAttendance.findOne({
      exam: exam._id,
      student: student._id,
    });
    if (existing) {
      return res.status(200).json({
        success: true,
        marked: false,
        alreadyMarked: true,
        record: existing,
        student: studentShape(student),
      });
    }

    const record = await ExamAttendance.create({
      exam: exam._id,
      examName: exam.examName,
      academicSession: exam.academicSession,
      student: student._id,
      studentId: student.studentId,
      name: student.name,
      className: student.className,
      section: student.section || "",
      status: "Present",
      markedBy: req.user ? req.user._id : null,
      markedByName: req.user ? req.user.name : "",
      method: method === "manual" ? "manual" : "scan",
    });

    return res.status(200).json({
      success: true,
      marked: true,
      eligible: true,
      record,
      student: studentShape(student),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ATTENDANCE RECORDS FOR AN EXAM
// ============================================

const getAttendanceForExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const [records, count] = await Promise.all([
      ExamAttendance.find({ exam: examId })
        .sort({ scannedAt: -1 })
        .lean(),
      ExamAttendance.countDocuments({ exam: examId }),
    ]);
    const present = await ExamAttendance.countDocuments({
      exam: examId,
      status: "Present",
    });

    return res.status(200).json({
      success: true,
      examId,
      total: count,
      present,
      records,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ELIGIBLE ROSTER + MARKED STATUS FOR AN EXAM
// ============================================

const getRoster = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await ExamSetting.findById(examId).populate(
      "requiredFees.feeCategory",
      FULL_CATEGORY
    );
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const [students, records] = await Promise.all([
      Student.find({ status: "Active" })
        .select("studentId name className section photo fatherName fatherMobile")
        .sort({ className: 1, name: 1 }),
      ExamAttendance.find({ exam: examId })
        .select("student status scannedAt method markedByName")
        .lean(),
    ]);

    const recordMap = {};
    records.forEach((r) => {
      recordMap[String(r.student)] = r;
    });

    const roster = [];
    let presentCount = 0;
    for (const student of students) {
      const reasons = await evaluateAdmitCardEligibility(exam, student);
      if (reasons.length > 0) continue;

      const record = recordMap[String(student._id)] || null;
      let status = "Not Marked";
      if (record) {
        status = record.status;
        if (status === "Present") presentCount += 1;
      }

      roster.push({
        ...studentShape(student),
        status,
        record,
      });
    }

    return res.status(200).json({
      success: true,
      exam: {
        _id: exam._id,
        examName: exam.examName,
        academicSession: exam.academicSession,
      },
      total: roster.length,
      present: presentCount,
      roster,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE STATUS / DELETE (ADMIN)
// ============================================

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!["Present", "Absent", "Late", "Leave"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const record = await ExamAttendance.findByIdAndUpdate(
      id,
      { status, ...(remarks !== undefined ? { remarks } : {}) },
      { new: true }
    );
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    return res.status(200).json({ success: true, record });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await ExamAttendance.findByIdAndDelete(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }
    return res.status(200).json({ success: true, message: "Record deleted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const clearForExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const result = await ExamAttendance.deleteMany({ exam: examId });
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} attendance record(s).`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  scanQR,
  getAttendanceForExam,
  getRoster,
  updateStatus,
  deleteRecord,
  clearForExam,
};