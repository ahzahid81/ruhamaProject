const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const Student = require("../models/Student");
const FeeCategory = require("../models/FeeCategory");
const StudentLedger = require("../models/StudentLedger");

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
          roll: studentInfo.roll,
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

    await PaymentItem.insertMany(paymentItems, { session });

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
      });
    }

    // Charge entries for each fee item
    for (const pi of paymentItems) {
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
// ============================================

const checkAdmitCardEligibility = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month = 6, year = new Date().getFullYear(), examName = "Half Yearly" } = req.query;

    const student = await Student.findOne({ studentId, status: "Active" });

    if (!student) {
      return res.status(404).json({ success: false, eligible: false, message: "Student not found." });
    }

    const tuition = await PaymentItem.findOne({
      student: student._id,
      applicableType: "Month",
      month: Number(month),
      year: Number(year),
      paymentStatus: "Paid",
    }).populate("feeCategory");

    const examFee = await PaymentItem.findOne({
      student: student._id,
      applicableType: "Exam",
      examName,
      paymentStatus: "Paid",
    }).populate("feeCategory");

    const reasons = [];

    if (!tuition) {
      reasons.push(`Month ${month} tuition fee not paid.`);
    }

    if (!examFee) {
      reasons.push(`${examName} exam fee not paid.`);
    }

    return res.status(200).json({
      success: true,
      eligible: reasons.length === 0,
      reasons,
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        section: student.section,
        roll: student.roll,
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

module.exports = {
  collectPayment,
  getStudentPaymentHistory,
  getPaymentReceipt,
  cancelPayment,
  checkAdmitCardEligibility,
};
