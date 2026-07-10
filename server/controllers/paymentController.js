const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const Student = require("../models/Student");
const FeeCategory = require("../models/FeeCategory");

// ============================================
// GENERATE RECEIPT NUMBER
// Example:
// RUS-2026-000001
// ============================================

const generateReceiptNo = async () => {

    const year = new Date().getFullYear();

    const prefix = `RUS-${year}`;

    const lastPayment = await Payment
        .findOne({
            receiptNo: {
                $regex: `^${prefix}`
            }
        })
        .sort({ createdAt: -1 });

    if (!lastPayment) {
        return `${prefix}-000001`;
    }

    const lastNumber =
        parseInt(
            lastPayment.receiptNo.split("-")[2]
        ) || 0;

    const nextNumber =
        (lastNumber + 1)
            .toString()
            .padStart(6, "0");

    return `${prefix}-${nextNumber}`;

};

// ============================================
// COLLECT PAYMENT
// ============================================

const collectPayment = async (req, res) => {

    const session =
        await mongoose.startSession();

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

            return res.status(400).json({

                success: false,

                message: "Student is required."

            });

        }

        if (!items || !Array.isArray(items) || items.length === 0) {

            await session.abortTransaction();

            session.endSession();

            return res.status(400).json({

                success: false,

                message: "No fee item selected."

            });

        }

        // ===============================
        // LOAD STUDENT
        // ===============================

        const studentInfo =
            await Student.findById(student);

        if (!studentInfo) {

            await session.abortTransaction();

            session.endSession();

            return res.status(404).json({

                success: false,

                message: "Student not found."

            });

        }

        // ===============================
        // RECEIPT
        // ===============================

        const receiptNo =
            await generateReceiptNo();

        let totalAmount = 0;

        let paidAmount = 0;

        let dueAmount = 0;

        // Calculate totals

        items.forEach(item => {

            totalAmount +=
                Number(item.payableAmount || 0);

            paidAmount +=
                Number(item.paidAmount || 0);

            dueAmount +=
                Number(item.dueAmount || 0);

        });

        // ===============================
        // CREATE PAYMENT HEADER
        // ===============================

        const payment =
            await Payment.create([{

                student: studentInfo._id,

                studentId:
                    studentInfo.studentId,

                studentName:
                    studentInfo.name,

                className:
                    studentInfo.className,

                roll:
                    studentInfo.roll,

                receiptNo,

                academicSession:
                    academicSession ||
                    studentInfo.session,

                totalAmount,

                totalDiscount:
                    totalDiscount || 0,

                totalFine:
                    totalFine || 0,

                advanceUsed:
                    advanceUsed || 0,

                advanceReceived:
                    advanceReceived || 0,

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

            }], {

                session

            });

        const paymentHeader =
            payment[0];
        // ===============================
        // SAVE PAYMENT ITEMS
        // ===============================

        const paymentItems = [];

        for (const item of items) {

            // ---------------------------
            // VALIDATE CATEGORY
            // ---------------------------

            // const feeCategory =
            //     await FeeCategory.findById(
            //         item.feeCategory
            //     );

            // if (!feeCategory) {

            //     await session.abortTransaction();

            //     session.endSession();

            //     return res.status(404).json({

            //         success: false,

            //         message: `Fee category not found.`,

            //     });

            // }
            let feeCategory = null;

            if (item.feeCategory) {

                feeCategory = await FeeCategory.findById(item.feeCategory);

            }

            // ---------------------------
            // PAYMENT STATUS
            // ---------------------------

            let paymentStatus = "Paid";

            const payable =
                Number(item.payableAmount || 0);

            const paid =
                Number(item.paidAmount || 0);

            const due =
                Number(item.dueAmount || 0);

            if (paid <= 0) {

                paymentStatus = "Unpaid";

            }

            else if (due > 0) {

                paymentStatus = "Partial";

            }

            // ---------------------------
            // CREATE PAYMENT ITEM
            // ---------------------------

            paymentItems.push({

                payment: paymentHeader._id,

                student: studentInfo._id,

                feeCategory: feeCategory._id,

                feeName: item.feeName,
                
                feeCategory: feeCategory?._id || null,

                applicableType:
                    item.applicableType,

                month:
                    item.month || null,

                year:
                    item.year || null,

                examName:
                    item.examName || "",

                customTitle:
                    item.customTitle || "",

                payableAmount:
                    payable,

                discount:
                    Number(item.discount || 0),

                fine:
                    Number(item.fine || 0),

                paidAmount:
                    paid,

                dueAmount:
                    due,

                paymentStatus,

                eligibleForAdmitCard:
                    item.eligibleForAdmitCard !== false,

                remarks:
                    item.remarks || "",

            });

        }

        // ===============================
        // INSERT ALL ITEMS
        // ===============================

        await PaymentItem.insertMany(

            paymentItems,

            {
                session,
            }

        );

        // ===============================
        // COMMIT
        // ===============================

        await session.commitTransaction();

        session.endSession();

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

        });

    }

    catch (error) {

        await session.abortTransaction();

        session.endSession();

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

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

            .sort({

                receiveDate: -1,

            });

        return res.status(200).json({

            success: true,

            count: payments.length,

            payments,

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ============================================
// GET SINGLE RECEIPT
// ============================================

const getPaymentReceipt = async (req, res) => {

    try {

        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId)

            .populate("receivedBy", "name role");

        if (!payment) {

            return res.status(404).json({

                success: false,

                message: "Receipt not found.",

            });

        }

        const items = await PaymentItem.find({

            payment: payment._id,

        })

            .populate(

                "feeCategory",

                "name category"

            );

        return res.status(200).json({

            success: true,

            payment,

            items,

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

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

            return res.status(404).json({

                success: false,

                message: "Receipt not found.",

            });

        }

        if (payment.isVoided) {

            return res.status(400).json({

                success: false,

                message: "Receipt already cancelled.",

            });

        }

        payment.isVoided = true;

        payment.paymentStatus = "Cancelled";

        payment.voidReason = reason || "";

        await payment.save();

        await PaymentItem.updateMany(

            {

                payment: payment._id,

            },

            {

                paymentStatus: "Cancelled",

            }

        );

        return res.status(200).json({

            success: true,

            message: "Receipt cancelled successfully.",

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ============================================
// CHECK ADMIT CARD ELIGIBILITY
// ============================================

const checkAdmitCardEligibility = async (req, res) => {

    try {

        const { studentId } = req.params;

        const {

            month = 7,

            year = new Date().getFullYear(),

            examName = "Half Yearly",

        } = req.query;

        // ====================================
        // STUDENT
        // ====================================

        const student = await Student.findOne({

            studentId,

            status: "Active",

        });

        if (!student) {

            return res.status(404).json({

                success: false,

                eligible: false,

                message: "Student not found.",

            });

        }

        // ====================================
        // JULY TUITION
        // ====================================

        const tuition = await PaymentItem.findOne({

            student: student._id,

            applicableType: "Month",

            month: Number(month),

            year: Number(year),

            paymentStatus: "Paid",

        }).populate("feeCategory");

        // ====================================
        // EXAM FEE
        // ====================================

        const examFee = await PaymentItem.findOne({

            student: student._id,

            applicableType: "Exam",

            examName,

            paymentStatus: "Paid",

        }).populate("feeCategory");

        // ====================================
        // REASONS
        // ====================================

        const reasons = [];

        if (!tuition) {

            reasons.push(

                `Month ${month} tuition fee not paid.`

            );

        }

        if (!examFee) {

            reasons.push(

                `${examName} exam fee not paid.`

            );

        }

        // ====================================
        // RESPONSE
        // ====================================

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

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

module.exports = {

    collectPayment,

    getStudentPaymentHistory,

    getPaymentReceipt,

    cancelPayment,

    checkAdmitCardEligibility,

};