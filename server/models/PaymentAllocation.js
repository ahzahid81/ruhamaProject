const mongoose = require("mongoose");

const paymentAllocationSchema = new mongoose.Schema(
{
    paymentItem:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"PaymentItem",
        required:true,
        index:true,
    },

    amount:{
        type:Number,
        required:true,
    },

    paymentMethod:{
        type:String,
        enum:[
            "Cash",
            "bKash",
            "Nagad",
            "Rocket",
            "Bank",
            "Cheque",
            "Card",
            "Online",
            "Advance",
        ],
        required:true,
    },

    senderNumber:{
        type:String,
        default:"",
    },

    transactionId:{
        type:String,
        default:"",
    },

    bankName:{
        type:String,
        default:"",
    },

    referenceNo:{
        type:String,
        default:"",
    },

    receivedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true,
    },

    receivedAt:{
        type:Date,
        default:Date.now,
    },

    remarks:{
        type:String,
        default:"",
    }
},
{
    timestamps:true,
});

module.exports = mongoose.model(
    "PaymentAllocation",
    paymentAllocationSchema
);