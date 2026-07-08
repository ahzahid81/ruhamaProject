const mongoose = require("mongoose");

const studentLedgerSchema = new mongoose.Schema(
{
    // ===========================
    // STUDENT
    // ===========================

    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student",
        required:true,
        index:true,
    },

    studentId:{
        type:String,
        required:true,
        index:true,
    },

    academicSession:{
        type:String,
        required:true,
    },

    // ===========================
    // REFERENCE
    // ===========================

    payment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Payment",
        default:null,
    },

    paymentItem:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"PaymentItem",
        default:null,
    },

    // ===========================
    // TRANSACTION TYPE
    // ===========================

    transactionType:{
        type:String,
        enum:[
            "Charge",
            "Payment",
            "Advance",
            "Advance Used",
            "Discount",
            "Fine",
            "Waiver",
            "Refund",
            "Adjustment",
        ],
        required:true,
    },

    // ===========================
    // DESCRIPTION
    // ===========================

    description:{
        type:String,
        required:true,
    },

    // ===========================
    // AMOUNT
    // ===========================

    debit:{
        type:Number,
        default:0,
    },

    credit:{
        type:Number,
        default:0,
    },

    balance:{
        type:Number,
        default:0,
    },

    // ===========================
    // DATE
    // ===========================

    transactionDate:{
        type:Date,
        default:Date.now,
    },

    // ===========================
    // USER
    // ===========================

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true,
    },

    remarks:{
        type:String,
        default:"",
    },

},
{
    timestamps:true,
}
);

module.exports = mongoose.model(
    "StudentLedger",
    studentLedgerSchema
);