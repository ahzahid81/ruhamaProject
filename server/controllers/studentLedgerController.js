const StudentLedger = require("../models/StudentLedger");
const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const Student = require("../models/Student");

// ============================================
// GET STUDENT LEDGER
// ============================================

const getStudentLedger = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicSession, limit = 100, page = 1 } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const filter = { student: studentId };
    if (academicSession) filter.academicSession = academicSession;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await StudentLedger.find(filter)
      .populate("createdBy", "name")
      .populate("payment", "receiptNo")
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudentLedger.countDocuments(filter);

    // Calculate current balance
    const balanceResult = await StudentLedger.aggregate([
      { $match: filter },
      { $group: { _id: null, balance: { $last: "$balance" } } },
    ]);

    const currentBalance = balanceResult.length > 0 ? balanceResult[0].balance : 0;

    return res.status(200).json({
      success: true,
      student: { _id: student._id, name: student.name, studentId: student.studentId, className: student.className },
      entries,
      currentBalance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET STUDENT DUE SUMMARY
// ============================================

const getStudentDueSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicSession } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const session = academicSession || student.session || "2026";

    // Get all unpaid/partial payment items for this student in this session
    const dueItems = await PaymentItem.find({
      student: studentId,
      paymentStatus: { $in: ["Unpaid", "Partial"] },
    })
      .populate("feeCategory", "name code category")
      .populate("payment", "receiptNo receiveDate")
      .sort({ createdAt: -1 });

    const totalDue = dueItems.reduce((sum, item) => sum + (item.dueAmount || 0), 0);

    // Get last 5 payments
    const recentPayments = await Payment.find({
      student: studentId,
      isVoided: false,
    })
      .sort({ receiveDate: -1 })
      .limit(5);

    // Get current ledger balance
    const lastLedger = await StudentLedger.findOne({ student: studentId })
      .sort({ createdAt: -1 });

    const balance = lastLedger ? lastLedger.balance : 0;

    return res.status(200).json({
      success: true,
      student: { _id: student._id, name: student.name, studentId: student.studentId, className: student.className },
      academicSession: session,
      summary: {
        totalDue,
        currentBalance: balance,
        dueItemsCount: dueItems.length,
      },
      dueItems,
      recentPayments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CREATE LEDGER ENTRY (internal helper)
// ============================================

const createLedgerEntry = async ({ student, studentId, academicSession, payment, paymentItem, transactionType, description, debit, credit, createdBy, remarks }) => {
  // Get last balance
  const lastEntry = await StudentLedger.findOne({ student }).sort({ createdAt: -1 });
  const previousBalance = lastEntry ? lastEntry.balance : 0;
  const balance = previousBalance + (debit || 0) - (credit || 0);

  const entry = await StudentLedger.create({
    student,
    studentId,
    academicSession: academicSession || "2026",
    payment: payment || null,
    paymentItem: paymentItem || null,
    transactionType: transactionType || "Adjustment",
    description: description || "",
    debit: debit || 0,
    credit: credit || 0,
    balance,
    createdBy: createdBy || null,
    remarks: remarks || "",
  });

  return entry;
};

module.exports = {
  getStudentLedger,
  getStudentDueSummary,
  createLedgerEntry,
};
