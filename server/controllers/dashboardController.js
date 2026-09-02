const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Payment = require("../models/Payment");
const StudentLedger = require("../models/StudentLedger");
const Attendance = require("../models/Attendance");
const Report = require("../models/Report");
const ExamResult = require("../models/ExamResult");

// ============================================
// SMART DASHBOARD SUMMARY (role-aware)
// ============================================

const dayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const monthRange = () => {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const collectSummary = async ({ monthStart, monthEnd, session }) => {
  const payments = await Payment.find({
    isVoided: false,
    receiveDate: { $gte: monthStart, $lte: monthEnd },
  });

  const collected = payments
    .filter((p) => p.paymentStatus !== "Refunded")
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  const ledger = await StudentLedger.find({
    academicSession: session,
    transactionType: { $in: ["Charge", "Payment", "Advance", "Advance Used", "Discount", "Waiver", "Refund", "Fine", "Adjustment"] },
  });

  let charged = 0;
  let paid = 0;
  let waived = 0;
  ledger.forEach((e) => {
    if (["Charge", "Fine"].includes(e.transactionType)) charged += e.debit || 0;
    else if (["Payment", "Advance", "Advance Used"].includes(e.transactionType) && e.credit) paid += e.credit || 0;
    else if (["Discount", "Waiver", "Refund", "Adjustment"].includes(e.transactionType)) waived += e.credit || 0;
  });

  const totalOutstanding = Math.max(charged - paid - waived, 0);
  const refundedCount = payments.filter((p) => p.paymentStatus === "Refunded").length;

  return { collected, totalOutstanding, refundedCount };
};

// Teacher-specific pending report computation
const teacherPending = async (teacher) => {
  const today = new Date();
  const dateStr =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const assignments = teacher.assignments || [];
  const classes = [...new Set(assignments.map((a) => a.className))];

  const todaysReports = await Report.find({
    className: { $in: classes },
    date: dateStr,
  }).lean();

  const submitted = new Set();
  todaysReports.forEach((r) => {
    (r.entries || []).forEach((e) => {
      if (String(e.teacherId) === String(teacher._id)) {
        submitted.add(`${e.subject}::${r.className}`);
      }
    });
  });

  const pending = assignments.filter(
    (a) => !submitted.has(`${a.subject}::${a.className}`)
  );

  return { pending, dateStr };
};

// ============================================
// GET SUMMARY
// ============================================

const getSummary = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;
    const session = "2026";
    const { start: dayStart, end: dayEnd } = dayRange();
    const { start: monthStart, end: monthEnd } = monthRange();

    const base = { role, name: user.name };

    // ---- TEACHER ----
    if (role === "teacher") {
      const assignments = user.assignments || [];
      const classes = new Set(assignments.map((a) => a.className));
      const subjects = new Set(assignments.map((a) => a.subject));

      const entriesToday = await Report.aggregate([
        { $unwind: "$entries" },
        { $match: { "entries.teacherId": user._id } },
        { $count: "total" },
      ]);

      const { pending } = await teacherPending(user);

      const todaysReports = await Report.find({
        className: { $in: [...classes] },
        date: { $ne: null },
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("className date entries.teacherId")
        .lean();

      return res.status(200).json({
        success: true,
        ...base,
        stats: {
          classes: classes.size,
          subjects: subjects.size,
          entriesToday: entriesToday[0]?.total || 0,
          pending: pending.length,
        },
        assignments: assignments.slice(0, 8),
        recentActivity: todaysReports.map((r) => ({
          _id: r._id,
          className: r.className,
          date: r.date,
          entries: (r.entries || []).length,
        })),
      });
    }

    // ---- ADMIN / ACCOUNT-MANAGER (shared financial base) ----
    const [studentCount, teacherCount, todayAttendance, examCount, finance] =
      await Promise.all([
        Student.countDocuments({ status: "Active" }),
        Teacher.countDocuments(),
        Attendance.countDocuments({ date: { $gte: dayStart, $lte: dayEnd } }),
        ExamResult.distinct("exam"),
        collectSummary({ monthStart, monthEnd, session }),
      ]);

    const todayPayments = await Payment.find({
      isVoided: false,
      receiveDate: { $gte: dayStart, $lte: dayEnd },
      paymentStatus: { $ne: "Refunded" },
    })
      .sort({ receiveDate: -1 })
      .limit(6)
      .populate("receivedBy", "name")
      .lean();

    const recentPayments = await Payment.find({ isVoided: false })
      .sort({ receiveDate: -1 })
      .limit(6)
      .populate("receivedBy", "name")
      .lean();

    // Admin-only extras
    let pendingReportsToday = null;
    if (role === "admin") {
      const today = new Date();
      const dateStr =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const teachers = await Teacher.find({}).lean();
      const allAssignments = [];
      teachers.forEach((t) => {
        (t.assignments || []).forEach((a) => {
          allAssignments.push({ ...a, by: t.name });
        });
      });

      const classes = [...new Set(allAssignments.map((a) => a.className))];
      const todaysReports = await Report.find({
        className: { $in: classes },
        date: dateStr,
      }).lean();

      const submittedSet = new Set();
      todaysReports.forEach((r) =>
        (r.entries || []).forEach((e) => submittedSet.add(`${e.subject}::${r.className}`))
      );

      pendingReportsToday = allAssignments.filter(
        (a) => !submittedSet.has(`${a.subject}::${a.className}`)
      ).length;
    }

    if (role === "admin") {
      return res.status(200).json({
        success: true,
        ...base,
        stats: {
          students: studentCount,
          teachers: teacherCount,
          todayAttendance,
          collectedThisMonth: finance.collected,
          totalOutstanding: finance.totalOutstanding,
          todayTax: todayPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
          pendingReportsToday: pendingReportsToday || 0,
          exams: examCount.length,
        },
        todayPayments,
        recentPayments,
      });
    }

    // ---- ACCOUNT-MANAGER ----
    return res.status(200).json({
      success: true,
      ...base,
      stats: {
        students: studentCount,
        collectedToday: todayPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0),
        collectedThisMonth: finance.collected,
        totalOutstanding: finance.totalOutstanding,
        todayPaymentsCount: todayPayments.length,
        monthPaymentsCount: await Payment.countDocuments({
          isVoided: false,
          receiveDate: { $gte: monthStart, $lte: monthEnd },
          paymentStatus: { $ne: "Refunded" },
        }),
      },
      recentPayments,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummary };
