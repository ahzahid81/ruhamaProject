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

const parseDay = (value) => Math.max(1, parseInt(value, 10) || 1);

// Midnight of the current day (server runs in Asia/Dhaka).
const bdMidnight = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const buildPerDay = (records) => {
  const map = {};
  records.forEach((r) => {
    const day = r.day || 1;
    map[day] = map[day] || { day, total: 0, present: 0 };
    map[day].total += 1;
    if (r.status === "Present") map[day].present += 1;
  });
  return Object.values(map).sort((a, b) => a.day - b.day);
};

// ============================================
// SCAN ADMIT CARD QR — marks eligible students for the current exam day
// ============================================

const scanQR = async (req, res) => {
  try {
    const { examId, qrData, method = "scan", day } = req.body;

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

    const attendanceDays = exam.attendanceDays || 1;
    const dayNumber = parseDay(day);
    if (dayNumber > attendanceDays) {
      return res.status(400).json({
        success: false,
        message: `This exam only runs for ${attendanceDays} day(s). Received day ${dayNumber}.`,
      });
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
        day: dayNumber,
        reasons,
        student: studentShape(student),
      });
    }

    // A student may be marked once per exam day. Records created before the
    // multi-day feature have no `day`, which is treated as day 1.
    const match = [{ day: dayNumber }];
    if (dayNumber === 1) match.push({ day: { $exists: false } }, { day: null });

    const existing = await ExamAttendance.findOne({
      exam: exam._id,
      student: student._id,
      $or: match,
    });
    if (existing) {
      return res.status(200).json({
        success: true,
        marked: false,
        alreadyMarked: true,
        day: dayNumber,
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
      day: dayNumber,
      attendanceDate: bdMidnight(),
      markedBy: req.user ? req.user._id : null,
      markedByName: req.user ? req.user.name : "",
      method: method === "manual" ? "manual" : "scan",
    });

    return res.status(200).json({
      success: true,
      marked: true,
      eligible: true,
      day: dayNumber,
      attendanceDays,
      record,
      student: studentShape(student),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ATTENDANCE RECORDS FOR AN EXAM (all days)
// ============================================

const getAttendanceForExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const [records, exam] = await Promise.all([
      ExamAttendance.find({ exam: examId }).sort({ scannedAt: -1 }).lean(),
      ExamSetting.findById(examId).select("attendanceDays examName academicSession").lean(),
    ]);

    const count = records.length;
    const present = records.filter((r) => r.status === "Present").length;

    return res.status(200).json({
      success: true,
      examId,
      attendanceDays: exam?.attendanceDays || 1,
      total: count,
      present,
      perDay: buildPerDay(records),
      records,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ELIGIBLE ROSTER + STATUS FOR AN EXAM DAY
// ============================================

const getRoster = async (req, res) => {
  try {
    const { examId } = req.params;
    const day = parseDay(req.query.day);

    const exam = await ExamSetting.findById(examId).populate(
      "requiredFees.feeCategory",
      FULL_CATEGORY
    );
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }
    const attendanceDays = exam.attendanceDays || 1;

    const [students, records] = await Promise.all([
      Student.find({ status: "Active" })
        .select("studentId name className section photo fatherName fatherMobile")
        .sort({ className: 1, name: 1 }),
      ExamAttendance.find({ exam: examId })
        .select("student status day scannedAt method markedByName")
        .lean(),
    ]);

    const recordsByStudent = {};
    records.forEach((r) => {
      const sid = String(r.student);
      (recordsByStudent[sid] = recordsByStudent[sid] || []).push(r);
    });

    const roster = [];
    let presentCount = 0;
    for (const student of students) {
      const reasons = await evaluateAdmitCardEligibility(exam, student);
      if (reasons.length > 0) continue;

      const dayRecords = recordsByStudent[String(student._id)] || [];
      const record = dayRecords.find((r) => (r.day || 1) === day) || null;
      let status = "Not Marked";
      if (record) {
        status = record.status;
        if (status === "Present") presentCount += 1;
      }

      roster.push({
        ...studentShape(student),
        status,
        record,
        day,
        daysPresent: dayRecords.filter((r) => r.status === "Present").length,
        markedDays: dayRecords.length,
      });
    }

    return res.status(200).json({
      success: true,
      day,
      attendanceDays,
      exam: {
        _id: exam._id,
        examName: exam.examName,
        academicSession: exam.academicSession,
        attendanceDays,
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