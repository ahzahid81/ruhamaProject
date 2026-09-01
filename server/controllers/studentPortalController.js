const Attendance = require("../models/Attendance");
const ExamResult = require("../models/ExamResult");
const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const StudentLedger = require("../models/StudentLedger");
const FeeCategory = require("../models/FeeCategory");
const ClassFeeSetting = require("../models/ClassFeeSetting");
const StudentFeeOverride = require("../models/StudentFeeOverride");
const StudentFeeAssignment = require("../models/StudentFeeAssignment");
const Report = require("../models/Report");
const HifzReport = require("../models/HifzReport");

// ============================================
// STUDENT DASHBOARD
// ============================================

const getDashboard = async (req, res) => {
  try {
    const student = req.student;
    const session = student.session || "2026";

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [attendanceRes, resultsRes, paymentsRes, ledgerRes, feeCategories] = await Promise.all([
      Attendance.find({ student: student._id, academicSession: session }),
      ExamResult.find({ student: student._id, academicSession: session }).populate("exam", "examName"),
      Payment.find({ student: student._id, isVoided: false }).sort({ createdAt: -1 }).limit(5),
      StudentLedger.find({ student: student._id, academicSession: session }),
      FeeCategory.find({ isActive: true }),
    ]);

    const totalDays = attendanceRes.length;
    const presentDays = attendanceRes.filter((r) => r.status === "Present" || r.status === "Late").length;
    const absentDays = attendanceRes.filter((r) => r.status === "Absent").length;

    const totalDue = ledgerRes
      .filter((e) => e.transactionType === "Charge")
      .reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalPaid = ledgerRes
      .filter((e) => e.transactionType === "Payment")
      .reduce((sum, e) => sum + (e.credit || 0), 0);

    return res.status(200).json({
      success: true,
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        section: student.section,
        photo: student.photo,
        studentType: student.studentType || "Regular",
      },
      attendance: {
        totalDays,
        presentDays,
        absentDays,
        percentage: totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0,
      },
      results: resultsRes.map((r) => ({
        examName: r.exam?.examName || "Exam",
        percentage: r.percentage,
        gpa: r.gpa,
        grade: r.grade,
        division: r.division,
        status: r.status,
      })),
      recentPayments: paymentsRes,
      feeSummary: {
        totalPaid: totalPaid - totalDue > 0 ? totalPaid - totalDue : 0,
        totalDue: totalDue - totalPaid > 0 ? totalDue - totalPaid : 0,
        balance: totalPaid - totalDue,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ============================================
// STUDENT ATTENDANCE
// ============================================

const getAttendance = async (req, res) => {
  try {
    const student = req.student;
    const { month, year } = req.query;

    const filter = { student: student._id };
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === "Present").length;
    const absentDays = records.filter((r) => r.status === "Absent").length;
    const lateDays = records.filter((r) => r.status === "Late").length;
    const leaveDays = records.filter((r) => r.status === "Leave").length;

    return res.status(200).json({
      success: true,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        percentage: totalDays > 0 ? Number((((presentDays + lateDays) / totalDays) * 100).toFixed(1)) : 0,
      },
      records,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ============================================
// STUDENT RESULTS
// ============================================

const getResults = async (req, res) => {
  try {
    const student = req.student;
    const { examId } = req.query;

    const filter = { student: student._id };
    if (examId) filter.exam = examId;

    const results = await ExamResult.find(filter)
      .populate("exam", "examName examCode startDate endDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ============================================
// STUDENT PAYMENT / FEE INFO
// ============================================

const getPaymentInfo = async (req, res) => {
  try {
    const student = req.student;
    const session = student.session || "2026";

    const [payments, ledger, categories, classSettings, overrides, assignments] = await Promise.all([
      Payment.find({ student: student._id, isVoided: false }).sort({ createdAt: -1 }),
      StudentLedger.find({ student: student._id, academicSession: session }),
      FeeCategory.find({ isActive: true }),
      ClassFeeSetting.find({ className: student.className, academicSession: session, isActive: true }),
      StudentFeeOverride.find({ student: student._id, academicSession: session, isActive: { $ne: false } }),
      StudentFeeAssignment.find({ student: student._id, academicSession: session, isActive: { $ne: false } }),
    ]);

    const overrideMap = {};
    overrides.forEach((o) => { overrideMap[o.feeCategory.toString()] = o; });
    const assignmentMap = {};
    assignments.forEach((a) => { assignmentMap[a.feeCategory.toString()] = a; });
    const classSettingMap = {};
    classSettings.forEach((s) => { classSettingMap[s.feeCategory.toString()] = s; });

    const feeBreakdown = categories
      .map((cat) => {
        const catId = cat._id.toString();
        const override = overrideMap[catId];
        const assignment = assignmentMap[catId];
        const classSetting = classSettingMap[catId];

        // Specific fees only show when manually activated for this student.
        // Global / Class Wise fees apply automatically from their amounts.
        if (cat.applicableTo === "Specific" && !assignment && !override) return null;

        let effectiveAmount = cat.defaultAmount || 0;
        let source = "System Default";
        if (override) { effectiveAmount = override.amount; source = "Student Override"; }
        else if (assignment && assignment.amount > 0) { effectiveAmount = assignment.amount; source = "Student Assignment"; }
        else if (classSetting) { effectiveAmount = classSetting.amount; source = "Class Setting"; }
        return { name: cat.name, code: cat.code, frequency: cat.frequency, amount: effectiveAmount, source };
      })
      .filter(Boolean)
      .filter((f) => f.amount > 0);

    const totalDue = ledger
      .filter((e) => e.transactionType === "Charge")
      .reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalPaid = ledger
      .filter((e) => e.transactionType === "Payment")
      .reduce((sum, e) => sum + (e.credit || 0), 0);

    // Attach fee details + receiver to payment history for the student
    let recentPayments = payments.slice(0, 20);
    if (recentPayments.length > 0) {
      const ids = recentPayments.map((p) => p._id);
      await Payment.populate(recentPayments, "receivedBy");
      const items = await PaymentItem.find({ payment: { $in: ids } }).populate("feeCategory", "name");

      const itemMap = {};
      if (items) {
        items.forEach((it) => {
          const key = it.payment?._id?.toString?.() || it.payment?.toString?.();
          if (!itemMap[key]) itemMap[key] = [];
          itemMap[key].push(it);
        });
      }

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      recentPayments = recentPayments.map((p) => {
        const po = p.toObject ? p.toObject() : p;
        const details = (itemMap[p._id.toString()] || []).map((it) => {
          let label = it.feeName || it.feeCategory?.name || "Fee";
          if (it.applicableType === "Month" && it.month) label += ` (${monthNames[(it.month || 1) - 1]} ${it.year || ""})`;
          else if (it.applicableType === "Exam" && it.examName) label += ` (${it.examName})`;
          else if (it.applicableType !== "Month" && it.customTitle) label += ` (${it.customTitle})`;
          return label;
        });
        return { ...po, feeDetails: details.join(", "), receivedBy: po.receivedBy || null };
      });
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalPaid,
        totalDue: totalDue - totalPaid > 0 ? totalDue - totalPaid : 0,
        balance: totalPaid - totalDue,
      },
      feeBreakdown,
      recentPayments,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ============================================
// STUDENT DAILY DIARY (Class Reports)
// ============================================

const getDailyDiary = async (req, res) => {
  try {
    const student = req.student;

    const reports = await Report.find({ className: student.className })
      .sort({ date: -1 })
      .limit(30);

    return res.status(200).json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ============================================
// STUDENT HIFZ PROGRESS (own reports only)
// ============================================

const getHifzProgress = async (req, res) => {
  try {
    const student = req.student;
    const { month, year } = req.query;

    const filter = { student: student._id };
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const reports = await HifzReport.find(filter)
      .populate("teacherId", "name")
      .sort({ date: -1 });

    const totalDays = reports.length;
    const hasAny = (l) => (l?.juz || l?.page || l?.verse) ? true : false;
    const filledDays = reports.filter(
      (r) => hasAny(r.lesson) || hasAny(r.sevenLessons) || hasAny(r.memorizationReview)
    ).length;

    return res.status(200).json({
      success: true,
      marks: totalDays,
      filledDays,
      reports,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboard,
  getAttendance,
  getResults,
  getPaymentInfo,
  getDailyDiary,
  getHifzProgress,
};
