const mongoose = require("mongoose");

const studentFeeStructureItemSchema =
new mongoose.Schema(
{

    structure:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"StudentFeeStructure",
        required:true,
    },

    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student",
        required:true,
    },

    feeCategory:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"FeeCategory",
        required:true,
    },

    amount:{
        type:Number,
        required:true,
    },

    frequency:{
        type:String,
        enum:[
            "One Time",
            "Monthly",
            "Yearly",
            "Per Exam",
            "Custom",
        ],
        default:"Monthly",
    },

    effectiveFrom:{
        type:Date,
        required:true,
    },

    effectiveTo:{
        type:Date,
        default:null,
    },

    isRequired:{
        type:Boolean,
        default:true,
    },

    isActive:{
        type:Boolean,
        default:true,
    },

    remarks:{
        type:String,
        default:"",
    }

},
{
    timestamps:true,
}
);

module.exports=mongoose.model(
"StudentFeeStructureItem",
studentFeeStructureItemSchema
);