const mongoose = require("mongoose");

const paymentItemSchema = new mongoose.Schema(
    {
        // ===========================
        // RELATION
        // ===========================

        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            index: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },

        feeCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FeeCategory",
            required: false,
            default: null,
        },

        // ===========================
        // DISPLAY
        // ===========================

        feeName: {
            type: String,
            required: true,
        },

        // ===========================
        // APPLICABLE FOR
        // ===========================

        applicableType: {
            type: String,
            enum: [
                "Month",
                "Exam",
                "Year",
                "One Time",
                "Custom",
            ],
            required: true,
        },

        month: {
            type: Number,
            min: 1,
            max: 12,
            default: null,
        },

        year: {
            type: Number,
            default: null,
        },

        examName: {
            type: String,
            default: "",
        },

        customTitle: {
            type: String,
            default: "",
        },

        // ===========================
        // AMOUNT
        // ===========================

        payableAmount: {
            type: Number,
            required: true,
        },

        discount: {
            type: Number,
            default: 0,
        },

        fine: {
            type: Number,
            default: 0,
        },

        paidAmount: {
            type: Number,
            default: 0,
        },

        dueAmount: {
            type: Number,
            default: 0,
        },

        // ===========================
        // STATUS
        // ===========================

        paymentStatus: {
            type: String,
            enum: [
                "Unpaid",
                "Partial",
                "Paid",
                "Waived",
                "Cancelled",
                "Refunded",
            ],
            default: "Paid",
        },

        // ===========================
        // ADMIT CARD
        // ===========================

        eligibleForAdmitCard: {
            type: Boolean,
            default: true,
        },

        // ===========================
        // REMARKS
        // ===========================

        remarks: {
            type: String,
            default: "",
        }

    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "PaymentItem",
    paymentItemSchema
);