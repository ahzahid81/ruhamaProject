const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const Student = require("../models/Student");
const FeeCategory = require("../models/FeeCategory");
const StudentLedger = require("../models/StudentLedger");
const ClassFeeSetting = require("../models/ClassFeeSetting");
const StudentFeeOverride = require("../models/StudentFeeOverride");
const StudentFeeAssignment = require("../models/StudentFeeAssignment");
const StudentFeeDiscount = require("../models/StudentFeeDiscount");
const ExamName = require("../models/ExamName");
const ExamSetting = require("../models/ExamSetting");

const { createLedgerEntry } = require("./studentLedgerController");

// ============================================
// GENERATE RECEIPT NUMBER
// Example: RUS-2026-000001
// ============================================

const generateReceiptNo = async () => {
  const year = new Date().getFullYear();
  const prefix = `RUS-${year}`;
  const lastPayment = await Payment.findOne({ receiptNo: { $regex: `^${prefix}` } }).sort({ createdAt: -1 });

  if (!lastPayment) {
    return `${prefix}-000001`;
  }

  const lastNumber = parseInt(lastPayment.receiptNo.split("-")[2]) || 0;
  const nextNumber = (lastNumber + 1).toString().padStart(6, "0");
  return `${prefix}-${nextNumber}`;
};

// ============================================
// DUPLICATE PAYMENT CHECK
// ============================================

const checkDuplicatePayment = async (studentId, items, academicSession) => {
  const errors = [];

  for (const item of items) {
    const match = {
      student: studentId,
      paymentStatus: { $in: ["Paid", "Partial"] },
      feeName: item.feeName,
      applicableType: item.applicableType,
    };

    if (item.applicableType === "Month") {
      match.month = item.month;
      match.year = item.year || new Date().getFullYear();
    }

    if (item.applicableType === "Exam") {
      match.examName = item.examName || "";
    }

    if (item.applicableType === "One Time") {
      match.feeName = item.feeName;
    }

    const existing = await PaymentItem.findOne(match);

    if (existing) {
      let label = item.feeName;
      if (item.applicableType === "Month") {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        label = `${item.feeName} - ${monthNames[(item.month || 1) - 1]} ${item.year || ""}`;
      }
      if (item.applicableType === "Exam") {
        label = `${item.feeName} - ${item.examName || ""}`;
      }
      errors.push(`${label} already paid.`);
    }
  }

  return errors;
};

// ============================================
// GET OPENING BALANCE (before this payment)
// ============================================

const getOpeningBalance = async (studentId) => {
  const lastEntry = await StudentLedger.findOne({ student: studentId }).sort({ createdAt: -1 });
  return lastEntry ? lastEntry.balance : 0;
};

// ============================================
// COLLECT PAYMENT
// ============================================

const collectPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      student,
      items,
      paymentMethod,
      senderNumber,
      transactionId,
      bankName,
      bankBranch,
      chequeNo,
      referenceNo,
      remarks,
      receivedBy,
      academicSession,
      totalDiscount,
      totalFine,
      advanceUsed,
      advanceReceived,
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Student is required." });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "No fee item selected." });
    }

    if (paymentMethod && paymentMethod !== "Cash" && !transactionId?.toString().trim()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Transaction ID is required for ${paymentMethod} payments.`,
      });
    }

    // ===============================
    // LOAD STUDENT
    // ===============================

    const studentInfo = await Student.findById(student);

    if (!studentInfo) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // ===============================
    // DUPLICATE CHECK
    // ===============================

    const duplicateErrors = await checkDuplicatePayment(student, items, academicSession || studentInfo.session);
    if (duplicateErrors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Duplicate payment detected.",
        duplicates: duplicateErrors,
      });
    }

    // ===============================
    // OPENING BALANCE
    // ===============================

    const openingBalance = await getOpeningBalance(student);

    // ===============================
    // RECEIPT
    // ===============================

    const receiptNo = await generateReceiptNo();

    let totalAmount = 0;
    let paidAmount = 0;
    let dueAmount = 0;

    items.forEach((item) => {
      totalAmount += Number(item.payableAmount || 0);
      paidAmount += Number(item.paidAmount || 0);
      dueAmount += Number(item.dueAmount || 0);
    });

    // ===============================
    // CREATE PAYMENT HEADER
    // ===============================

    const payment = await Payment.create(
      [
        {
          student: studentInfo._id,
          studentId: studentInfo.studentId,
          studentName: studentInfo.name,
          className: studentInfo.className,
          receiptNo,
          academicSession: academicSession || studentInfo.session,
          totalAmount,
          totalDiscount: totalDiscount || 0,
          totalFine: totalFine || 0,
          advanceUsed: advanceUsed || 0,
          advanceReceived: advanceReceived || 0,
          paidAmount,
          dueAmount,
          paymentMethod,
          senderNumber,
          transactionId,
          bankName,
          bankBranch,
          chequeNo,
          referenceNo,
          remarks,
          receivedBy,
        },
      ],
      { session }
    );

    const paymentHeader = payment[0];

    // ===============================
    // SAVE PAYMENT ITEMS
    // ===============================

    const paymentItems = [];

    for (const item of items) {
      let feeCategory = null;
      if (item.feeCategory) {
        feeCategory = await FeeCategory.findById(item.feeCategory);
      }

      let paymentStatus = "Paid";
      const payable = Number(item.payableAmount || 0);
      const paid = Number(item.paidAmount || 0);
      const due = Number(item.dueAmount || 0);

      if (paid <= 0) {
        paymentStatus = "Unpaid";
      } else if (due > 0) {
        paymentStatus = "Partial";
      }

      paymentItems.push({
        payment: paymentHeader._id,
        student: studentInfo._id,
        feeName: item.feeName,
        feeCategory: feeCategory?._id || null,
        applicableType: item.applicableType,
        month: item.month || null,
        year: item.year || null,
        examName: item.examName || "",
        customTitle: item.customTitle || "",
        payableAmount: payable,
        discount: Number(item.discount || 0),
        fine: Number(item.fine || 0),
        paidAmount: paid,
        dueAmount: due,
        paymentStatus,
        eligibleForAdmitCard: item.eligibleForAdmitCard !== false,
        remarks: item.remarks || "",
      });
    }

    const savedPaymentItems = await PaymentItem.insertMany(paymentItems, { session });

    // ===============================
    // CREATE LEDGER ENTRIES
    // ===============================

    const createdBy = receivedBy;

    // Credit entry for payment received
    if (paidAmount > 0) {
      await createLedgerEntry({
        student: studentInfo._id,
        studentId: studentInfo.studentId,
        academicSession: academicSession || studentInfo.session,
        payment: paymentHeader._id,
        transactionType: "Payment",
        description: `Payment received - ${receiptNo}`,
        debit: 0,
        credit: paidAmount,
        createdBy,
        remarks: `Payment via ${paymentMethod}. Receipt: ${receiptNo}`,
        session,
      });
    }

    // Charge entries for each fee item
    for (const pi of savedPaymentItems) {
      if (pi.payableAmount > 0) {
        let desc = `${pi.feeName}`;
        if (pi.applicableType === "Month") {
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          desc += ` - ${monthNames[(pi.month || 1) - 1]} ${pi.year || ""}`;
        }
        if (pi.applicableType === "Exam") {
          desc += ` - ${pi.examName || ""}`;
        }

        await createLedgerEntry({
          student: studentInfo._id,
          studentId: studentInfo.studentId,
          academicSession: academicSession || studentInfo.session,
          payment: paymentHeader._id,
          paymentItem: pi._id || null,
          transactionType: "Charge",
          description: `Fee charged: ${desc}`,
          debit: pi.payableAmount,
          credit: 0,
          createdBy,
          remarks: `Receipt: ${receiptNo}`,
          session,
        });
      }
    }

    // Discount entry
    if (totalDiscount > 0) {
      await createLedgerEntry({
        student: studentInfo._id,
        studentId: studentInfo.studentId,
        academicSession: academicSession || studentInfo.session,
        payment: paymentHeader._id,
        transactionType: "Discount",
        description: `Discount applied - ${receiptNo}`,
        debit: 0,
        credit: totalDiscount,
        createdBy,
        remarks: `Discount: ${totalDiscount}`,
        session,
      });
    }

    // Fine entry
    if (totalFine > 0) {
      await createLedgerEntry({
        student: studentInfo._id,
        studentId: studentInfo.studentId,
        academicSession: academicSession || studentInfo.session,
        payment: paymentHeader._id,
        transactionType: "Fine",
        description: `Fine applied - ${receiptNo}`,
        debit: totalFine,
        credit: 0,
        createdBy,
        remarks: `Fine: ${totalFine}`,
        session,
      });
    }

    // ===============================
    // COMMIT
    // ===============================

    await session.commitTransaction();
    session.endSession();

    // Get final balance after all entries
    const finalLedger = await StudentLedger.findOne({ student: studentInfo._id }).sort({ createdAt: -1 });
    const closingBalance = finalLedger ? finalLedger.balance : 0;

    // ===============================
    // RESPONSE
    // ===============================

    return res.status(201).json({
      success: true,
      message: "Payment collected successfully.",
      receiptNo: paymentHeader.receiptNo,
      paymentId: paymentHeader._id,
      totalAmount,
      paidAmount,
      dueAmount,
      totalDiscount: totalDiscount || 0,
      totalFine: totalFine || 0,
      openingBalance,
      closingBalance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// STUDENT PAYMENT HISTORY
// ============================================

const getStudentPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await Payment.find({
      studentId,
      isVoided: false,
    })
      .sort({ receiveDate: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET SINGLE RECEIPT
// ============================================

const getPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId).populate("receivedBy", "name role");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Receipt not found." });
    }

    const items = await PaymentItem.find({ payment: payment._id }).populate("feeCategory", "name category");

    // Get opening balance at time of payment
    const ledgerBefore = await StudentLedger.findOne({
      student: payment.student,
      createdAt: { $lt: payment.createdAt },
    }).sort({ createdAt: -1 });

    const openingBalance = ledgerBefore ? ledgerBefore.balance : 0;

    // Get closing balance
    const ledgerAfter = await StudentLedger.findOne({ student: payment.student }).sort({ createdAt: -1 });
    const closingBalance = ledgerAfter ? ledgerAfter.balance : 0;

    return res.status(200).json({
      success: true,
      payment,
      items,
      openingBalance,
      closingBalance,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// BUILD FEE DETAILS STRING (for history tables)
// ============================================

const buildFeeDetails = (items = []) => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return items
    .map((it) => {
      let label = it.feeName || it.feeCategory?.name || "Fee";
      if (it.applicableType === "Month" && it.month) {
        label += ` (${monthNames[(it.month || 1) - 1]} ${it.year || ""})`;
      } else if (it.applicableType === "Exam" && it.examName) {
        label += ` (${it.examName})`;
      } else if (it.applicableType !== "Month" && it.customTitle) {
        label += ` (${it.customTitle})`;
      }
      return label;
    })
    .join(", ");
};

// ============================================
// GET ALL PAYMENTS (ADMIN) with filters
// ============================================

const getAllPayments = async (req, res) => {
  try {
    const { search, className, paymentMethod, status, page = 1, limit = 50 } = req.query;

    const filter = { isVoided: false };

    if (className) filter.className = className;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.paymentStatus = status;

    if (search) {
      const re = { $regex: String(search).trim(), $options: "i" };
      filter.$or = [
        { studentId: re },
        { studentName: re },
        { receiptNo: re },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .sort({ receiveDate: -1, createdAt: -1 })
      .populate("receivedBy", "name")
      .skip(skip)
      .limit(Number(limit));

    // Attach fee details from payment items
    const ids = payments.map((p) => p._id);
    const items = await PaymentItem.find({ payment: { $in: ids } })
      .populate("feeCategory", "name");

    const itemMap = {};
    items.forEach((it) => {
      const key = it.payment?._id?.toString?.() || it.payment?.toString?.();
      if (!itemMap[key]) itemMap[key] = [];
      itemMap[key].push(it);
    });

    const serialized = payments.map((p) => {
      const po = p.toObject ? p.toObject() : p;
      const feeDetails = buildFeeDetails(itemMap[p._id.toString()] || []);
      return { ...po, feeDetails };
    });

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      payments: serialized,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE PAYMENT (metadata only - not amounts)
// ============================================

const updatePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const {
      paymentMethod,
      senderNumber,
      transactionId,
      bankName,
      bankBranch,
      chequeNo,
      chequeDate,
      referenceNo,
      remarks,
      receivedBy,
      receiveDate,
      paymentStatus,
    } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Receipt not found." });
    }

    if (payment.isVoided) {
      return res.status(400).json({ success: false, message: "Cannot edit a cancelled receipt." });
    }

    const fields = {
      paymentMethod,
      senderNumber,
      transactionId,
      bankName,
      bankBranch,
      chequeNo,
      chequeDate,
      referenceNo,
      remarks,
      paymentStatus,
    };

    Object.keys(fields).forEach((k) => {
      if (fields[k] !== undefined) payment[k] = fields[k];
    });
    if (receivedBy !== undefined) payment.receivedBy = receivedBy;
    if (receiveDate !== undefined) payment.receiveDate = receiveDate;

    await payment.save();

    // Sync the PaymentItem status if only the header was changed globally
    if (paymentStatus && paymentStatus !== "Completed") {
      await PaymentItem.updateMany({ payment: payment._id }, { paymentStatus });
    }

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      payment: await Payment.findById(payment._id).populate("receivedBy", "name"),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CANCEL RECEIPT
// ============================================

const cancelPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Receipt not found." });
    }

    if (payment.isVoided) {
      return res.status(400).json({ success: false, message: "Receipt already cancelled." });
    }

    payment.isVoided = true;
    payment.paymentStatus = "Cancelled";
    payment.voidReason = reason || "";
    await payment.save();

    await PaymentItem.updateMany(
      { payment: payment._id },
      { paymentStatus: "Cancelled" }
    );

    // Create reversal ledger entry
    const reverseEntries = await StudentLedger.find({ payment: payment._id }).sort({ createdAt: -1 });

    for (const entry of reverseEntries) {
      if (entry.transactionType === "Payment" && entry.credit > 0) {
        await createLedgerEntry({
          student: payment.student,
          studentId: payment.studentId,
          academicSession: payment.academicSession,
          payment: payment._id,
          transactionType: "Refund",
          description: `Payment reversed - ${payment.receiptNo}`,
          debit: entry.credit,
          credit: 0,
          createdBy: req.user?._id || null,
          remarks: reason || "Receipt cancelled",
        });
      } else if (entry.transactionType === "Charge" && entry.debit > 0) {
        await createLedgerEntry({
          student: payment.student,
          studentId: payment.studentId,
          academicSession: payment.academicSession,
          payment: payment._id,
          transactionType: "Adjustment",
          description: `Fee reversed - ${payment.receiptNo}`,
          debit: 0,
          credit: entry.debit,
          createdBy: req.user?._id || null,
          remarks: reason || "Receipt cancelled",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Receipt cancelled successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CHECK ADMIT CARD ELIGIBILITY
// Uses the exam defined in Exam Management: the exam name and the required
// admit card fee come from ExamSetting (never hardcoded). A student is
// eligible when the time window is open and the admit-card fee item for that
// exam is paid (0 fee means it is always cleared).
// ============================================

const checkAdmitCardEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        eligible: false,
        message: "Please select an exam from Exam Management.",
      });
    }

    const exam = await ExamSetting.findById(examId).populate("requiredFees.feeCategory", "name");
    if (!exam) {
      return res.status(404).json({
        success: false,
        eligible: false,
        message: "Exam not found.",
      });
    }

    const student = await Student.findOne({ studentId, status: "Active" });
    if (!student) {
      return res.status(404).json({ success: false, eligible: false, message: "Student not found." });
    }

    const fee = Number(exam.admitCardFee || 0);
    const now = new Date();
    const windowOpen =
      (!exam.admitCardStart || now >= new Date(exam.admitCardStart)) &&
      (!exam.admitCardEnd || now <= new Date(exam.admitCardEnd).setHours(23, 59, 59, 999));

    const paidItems = await PaymentItem.find({
      student: student._id,
      paymentStatus: "Paid",
    }).lean();

    const paidAdmitCardItem = fee > 0
      ? paidItems.find(
          (p) =>
            p.applicableType === "Exam" &&
            p.examName === exam.examName &&
            String(p.feeName || "").toLowerCase() === "admit card"
        )
      : null;

    const reasons = [];
    if (!exam.isActive) {
      reasons.push(`"${exam.examName}" is not active.`);
    }
    if (!windowOpen) {
      const from = exam.admitCardStart ? new Date(exam.admitCardStart).toLocaleDateString("en-GB") : "any time";
      const to = exam.admitCardEnd ? new Date(exam.admitCardEnd).toLocaleDateString("en-GB") : "any time";
      reasons.push(`Admit card window ${from} → ${to} is not open yet.`);
    }

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    // The exam's own "Required Fees (for Admit Card)" rows drive eligibility
    // (fee category + applicable type from Exam Management — no hardcodes).
    (exam.requiredFees || []).forEach((r) => {
      const fc = r.feeCategory ? String(r.feeCategory._id || r.feeCategory) : "";
      const label = r.feeCategory?.name || r.customTitle || r.applicableType || "Fee";
      const month = Number(r.month) || 0;
      const year = Number(r.year) || Number(exam.academicSession) || new Date().getFullYear();

      const paid = paidItems.some((p) => {
        if (String(p.feeName || "").toLowerCase() === "admit card") return false;
        const pCat = String(p.feeCategory || "");
        switch (r.applicableType) {
          case "Month":
            return (
              p.applicableType === "Month" &&
              (!fc || pCat === fc) &&
              month > 0 &&
              Number(p.month) === month &&
              Number(p.year) === year
            );
          case "Exam":
            return (
              p.applicableType === "Exam" &&
              p.examName === exam.examName &&
              (!fc || pCat === fc)
            );
          case "Year":
            return (
              p.applicableType === "Year" &&
              Number(p.year) === year &&
              (!fc || pCat === fc)
            );
          case "One Time":
            return p.applicableType === "One Time" && (!fc || pCat === fc);
          case "Custom":
            return p.feeName && p.feeName === r.customTitle;
          default:
            return false;
        }
      });

      if (!paid) {
        if (r.applicableType === "Month" && month > 0) {
          reasons.push(`${label} (${MONTH_NAMES[month - 1]} ${year}) not paid.`);
        } else {
          reasons.push(`${label} (${r.applicableType || "Fee"}) not paid.`);
        }
      }
    });

    if (fee > 0 && !paidAdmitCardItem) {
      reasons.push(`Admit Card fee (BDT ${fee.toLocaleString("en-BD")}) for "${exam.examName}" not paid.`);
    }

    return res.status(200).json({
      success: true,
      eligible: reasons.length === 0,
      reasons,
      fee,
      feePaid: fee > 0 ? Boolean(paidAdmitCardItem) : true,
      windowOpen,
      exam: {
        _id: exam._id,
        examName: exam.examName,
        academicSession: exam.academicSession,
        admitCardFee: fee,
        admitCardStart: exam.admitCardStart,
        admitCardEnd: exam.admitCardEnd,
        isActive: exam.isActive,
      },
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        section: student.section,
        photo: student.photo,
        fatherName: student.fatherName,
        fatherMobile: student.fatherMobile,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// FEE CATEGORY CRUD
// ============================================

const getFeeCategories = async (req, res) => {
  try {
    const categories = await FeeCategory.find().sort({ sortOrder: 1, name: 1 });
    return res.status(200).json(categories);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createFeeCategory = async (req, res) => {
  try {
    const existing = await FeeCategory.findOne({
      $or: [
        { name: { $regex: `^${req.body.name}$`, $options: "i" } },
        { code: req.body.code?.toUpperCase() },
      ],
    });
    if (existing) {
      return res.status(400).json({ message: "Fee category with this name or code already exists" });
    }
    const category = await FeeCategory.create(req.body);
    return res.status(201).json(category);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const updateFeeCategory = async (req, res) => {
  try {
    const category = await FeeCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      return res.status(404).json({ message: "Fee category not found" });
    }
    return res.status(200).json(category);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

const deleteFeeCategory = async (req, res) => {
  try {
    const category = await FeeCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Fee category not found" });
    }

    // Cascade: remove class rates, student overrides and assignments for this fee
    await Promise.all([
      ClassFeeSetting.deleteMany({ feeCategory: category._id }),
      StudentFeeOverride.deleteMany({ feeCategory: category._id }),
      StudentFeeAssignment.deleteMany({ feeCategory: category._id }),
    ]);

    return res.status(200).json({ message: "Fee category deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

// ============================================
// GET STUDENT DUE ITEMS
// Auto-calculates what a student owes based on
// fee settings + existing paid items
// ============================================

const getStudentDueItems = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicSession } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const session = academicSession || student.session || "2026";
    const currentYear = new Date().getFullYear();

    // Derive the session year (e.g., "2025" -> 2025, "2025-2026" -> 2025)
    const sessionYear = parseInt(session) || currentYear;

    // Load all independent data in parallel
    const [
      categories,
      classSettings,
      overrides,
      assignments,
      paidItems,
      discounts,
    ] = await Promise.all([
      FeeCategory.find({ isActive: true }).sort({ sortOrder: 1 }),
      ClassFeeSetting.find({
        $or: [{ className: student.className }, { className: "All Classes" }],
        academicSession: session,
        isActive: true,
      }),
      StudentFeeOverride.find({
        student: student._id,
        academicSession: session,
        isActive: { $ne: false },
      }),
      StudentFeeAssignment.find({
        student: student._id,
        academicSession: session,
        isActive: { $ne: false },
      }),
      PaymentItem.find({
        student: student._id,
        paymentStatus: { $in: ["Paid", "Partial"] },
      }),
      StudentFeeDiscount.find({
        student: student._id,
        academicSession: session,
        discountAmount: { $gt: 0 },
      }),
    ]);

    // Build sets for fully-paid and partial items.
    // Keyed both by feeCategory id AND by fee name so legacy payment
    // items (created before feeCategory existed) still count as paid.
    const monthKey = (cid, m, y) => `${cid}_Month_${m}_${y}`;
    const monthNameKey = (name, m, y) => `N_${String(name).trim().toLowerCase()}_Month_${m}_${y}`;
    const examKey = (cid, exam, y) => `${cid}_Exam_${exam}_${y}`;
    const examNameKey = (name, exam, y) => `N_${String(name).trim().toLowerCase()}_Exam_${exam}_${y}`;
    const otherKey = (cid, type, y) => `${cid}_${type}_${y || ""}`;
    const otherNameKey = (name, type, y) => `N_${String(name).trim().toLowerCase()}_${type}_${y || ""}`;

    // Discounts are keyed by fee instance so they apply only to the matching
    // due fee (monthly, per-exam or one-time/yearly item).
    const discountMap = {};
    discounts.forEach((d) => {
      const dk = `${d.feeCategory ? d.feeCategory.toString() : ""}::${d.applicableType}::${d.month || ""}::${d.year || ""}::${d.examName || ""}`;
      discountMap[dk] = d;
    });

    const applyDiscount = (categoryId, type, m, y, exam, grossDue) => {
      if (grossDue <= 0) return { discount: 0, net: 0, discountId: null, discountReason: "" };
      const d = discountMap[`${categoryId}::${type}::${m || ""}::${y || ""}::${exam || ""}`];
      if (!d) return { discount: 0, net: grossDue, discountId: null, discountReason: "" };
      const discount = Math.min(Number(d.discountAmount || 0), grossDue);
      return { discount, net: Math.max(0, grossDue - discount), discountId: d._id ? d._id.toString() : null, discountReason: d.reason || "" };
    };

    const fullyPaidSet = new Set();
    const fullyPaidByName = new Set();
    const partialMap = {};
    const partialByName = {};

    paidItems.forEach((item) => {
      const type = item.applicableType || "One Time";
      const cid = item.feeCategory ? item.feeCategory.toString() : "";
      const name = item.feeName;
      let key = null;
      let nameKey = null;
      if (type === "Month") {
        key = monthKey(cid, item.month, item.year);
        nameKey = monthNameKey(name, item.month, item.year);
      } else if (type === "Exam") {
        key = examKey(cid, item.examName || "", item.year);
        nameKey = examNameKey(name, item.examName || "", item.year);
      } else {
        key = otherKey(cid, type, item.year);
        nameKey = otherNameKey(name, type, item.year);
      }
      if (item.paymentStatus === "Paid") {
        if (key) fullyPaidSet.add(key);
        if (nameKey) fullyPaidByName.add(nameKey);
      } else if (item.paymentStatus === "Partial" && item.dueAmount > 0) {
        if (key) partialMap[key] = (partialMap[key] || 0) + item.dueAmount;
        if (nameKey) partialByName[nameKey] = (partialByName[nameKey] || 0) + item.dueAmount;
      }
    });

    const overrideMap = {};
    overrides.forEach((o) => { overrideMap[o.feeCategory.toString()] = o; });

    const assignmentMap = {};
    assignments.forEach((a) => { assignmentMap[a.feeCategory.toString()] = a; });

    const classSettingMap = {};
    classSettings.forEach((s) => { classSettingMap[s.feeCategory.toString()] = s; });

    // Get exam names from the ExamName collection
    const examNameDocs =
      await ExamName.find()
        .sort({ order: 1, name: 1 });
    const examNames =
      examNameDocs.map((e) => e.name);

    const dueItems = [];
    const feeLedger = [];

    for (const cat of categories) {
      const catId = cat._id.toString();
      const override = overrideMap[catId];
      const assignment = assignmentMap[catId];
      const classSetting = classSettingMap[catId];

      // Applicability:
      // - Global / Class Wise fees apply automatically once they have an
      //   amount (default amount or per-class setting) — the standard flow.
      // - Specific fees apply only when manually activated for the student
      //   (override or assignment) from Student-wise Fees.
      if (cat.applicableTo === "Specific" && !assignment && !override) continue;

      let effectiveAmount = cat.defaultAmount || 0;
      let frequency = cat.frequency;

      if (override) { effectiveAmount = override.amount; frequency = override.frequency || cat.frequency; }
      else if (assignment && assignment.amount > 0) { effectiveAmount = assignment.amount; frequency = assignment.frequency || cat.frequency; }
      else if (classSetting) { effectiveAmount = classSetting.amount; frequency = classSetting.frequency || cat.frequency; }

      if (effectiveAmount <= 0) continue;

      if (frequency === "Monthly") {
        // Show the full January–December year (advance payment supported)
        const maxMonth = 12;
        const months = [];
        const dueMonths = [];

        for (let m = 1; m <= maxMonth; m++) {
          const isPaid = fullyPaidSet.has(monthKey(catId, m, sessionYear)) || fullyPaidByName.has(monthNameKey(cat.name, m, sessionYear));
          const partial = partialMap[monthKey(catId, m, sessionYear)] ?? partialByName[monthNameKey(cat.name, m, sessionYear)] ?? 0;
          const grossDue = isPaid ? 0 : partial > 0 ? partial : effectiveAmount;
          const { discount, net, discountId, discountReason } = applyDiscount(catId, "Month", m, sessionYear, "", grossDue);
          const paidAmount = isPaid ? effectiveAmount - grossDue : (partial > 0 ? effectiveAmount - partial : 0);
          const waived = !isPaid && net <= 0;

          months.push({
            month: m,
            year: sessionYear,
            status: isPaid ? "Paid" : waived ? "Waived" : partial > 0 ? "Partial" : "Due",
            amount: effectiveAmount,
            paidAmount,
            dueAmount: net,
            discount,
            discountId,
            discountReason,
            waived,
          });

          if (!isPaid && net > 0) {
            dueItems.push({
              feeCategory: catId,
              feeName: cat.name,
              applicableType: "Month",
              month: m,
              year: sessionYear,
              amount: net,
              discount,
              discountId,
              discountReason,
              dueIndex: dueItems.length,
            });
            dueMonths.push(m);
          }
        }

        feeLedger.push({
          feeCategory: catId,
          feeName: cat.name,
          applicableType: "Month",
          frequency: "Monthly",
          amount: effectiveAmount,
          months: months.map((mm) => ({
            ...mm,
            dueIndex: mm.status === "Paid" || mm.waived ? -1 : dueItems.length - dueMonths.length + dueMonths.indexOf(mm.month),
          })),
        });
      } else if (frequency === "Per Exam") {
        const exams = [];
        examNames.forEach((exam) => {
          const fedCatKey = examKey(catId, exam, sessionYear);
          const fNameKey = examNameKey(cat.name, exam, sessionYear);
          const isPaid = fullyPaidSet.has(fedCatKey) || fullyPaidByName.has(fNameKey);
          const partial = partialMap[fedCatKey] ?? partialByName[fNameKey] ?? 0;
          const grossDue = isPaid ? 0 : partial > 0 ? partial : effectiveAmount;
          const { discount, net, discountId, discountReason } = applyDiscount(catId, "Exam", null, sessionYear, exam, grossDue);
          const paidAmount = isPaid ? effectiveAmount - grossDue : (partial > 0 ? effectiveAmount - partial : 0);
          const waived = !isPaid && net <= 0;

          exams.push({
            examName: exam,
            year: sessionYear,
            status: isPaid ? "Paid" : waived ? "Waived" : partial > 0 ? "Partial" : "Due",
            amount: effectiveAmount,
            paidAmount,
            dueAmount: net,
            discount,
            discountId,
            discountReason,
            waived,
            dueIndex: isPaid || waived ? -1 : dueItems.length,
          });
          if (!isPaid && net > 0) {
            dueItems.push({
              feeCategory: catId,
              feeName: `${cat.name} (${exam})`,
              applicableType: "Exam",
              examName: exam,
              year: sessionYear,
              amount: net,
              discount,
              discountId,
              discountReason,
              dueIndex: dueItems.length,
            });
          }
        });
        feeLedger.push({
          feeCategory: catId,
          feeName: cat.name,
          applicableType: "Exam",
          frequency: "Per Exam",
          amount: effectiveAmount,
          exams,
        });
      } else {
        const type = frequency === "Yearly" ? "Year" : (frequency === "One Time" ? "One Time" : "Custom");
        const isPaid = fullyPaidSet.has(otherKey(catId, type, sessionYear)) || fullyPaidByName.has(otherNameKey(cat.name, type, sessionYear));
        const partial = partialMap[otherKey(catId, type, sessionYear)] ?? partialByName[otherNameKey(cat.name, type, sessionYear)] ?? 0;
        const grossDue = isPaid ? 0 : partial > 0 ? partial : effectiveAmount;
        const { discount, net, discountId, discountReason } = applyDiscount(catId, type, null, sessionYear, "", grossDue);
        const paidAmount = isPaid ? effectiveAmount - grossDue : (partial > 0 ? effectiveAmount - partial : 0);
        const status = isPaid ? "Paid" : net <= 0 ? "Waived" : partial > 0 ? "Partial" : "Due";
        const waived = !isPaid && net <= 0;

        if (!isPaid && net > 0) {
          dueItems.push({
            feeCategory: catId,
            feeName: cat.name,
            applicableType: type,
            year: sessionYear,
            amount: net,
            discount,
            discountId,
            discountReason,
            dueIndex: dueItems.length,
          });
        }

        feeLedger.push({
          feeCategory: catId,
          feeName: cat.name,
          applicableType: type,
          frequency,
          amount: effectiveAmount,
          paidAmount,
          period: type === "One Time" ? "One Time" : String(sessionYear),
          year: sessionYear,
          status,
          dueAmount: net,
          discount,
          discountId,
          discountReason,
          waived,
          dueIndex: isPaid || waived ? -1 : dueItems.length - 1,
        });
      }
    }

    // Build fee structure array for display
    const feeStructure = categories.map((cat) => {
      const catId = cat._id.toString();
      const override = overrideMap[catId];
      const assignment = assignmentMap[catId];
      const classSetting = classSettingMap[catId];

      if (cat.applicableTo === "Specific" && !assignment && !override) return null;

      let effectiveAmount = cat.defaultAmount || 0;
      let frequency = cat.frequency;
      let source = "Default";
      if (override) { effectiveAmount = override.amount; frequency = override.frequency || cat.frequency; source = "Override"; }
      else if (assignment && assignment.amount > 0) { effectiveAmount = assignment.amount; frequency = assignment.frequency || cat.frequency; source = "Assignment"; }
      else if (classSetting) { effectiveAmount = classSetting.amount; frequency = classSetting.frequency || cat.frequency; source = "Class Setting"; }
      return { feeCategory: cat, effectiveAmount, frequency, source };
    }).filter(Boolean).filter((f) => f.effectiveAmount > 0);

    return res.status(200).json({ success: true, dueItems, feeStructure, feeLedger });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  collectPayment,
  getStudentPaymentHistory,
  getAllPayments,
  getPaymentReceipt,
  updatePayment,
  cancelPayment,
  checkAdmitCardEligibility,
  getFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  getStudentDueItems,
};
