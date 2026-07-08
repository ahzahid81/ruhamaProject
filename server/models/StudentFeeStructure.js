const mongoose = require("mongoose");

const studentFeeStructureSchema = new mongoose.Schema(
{
    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student",
        required:true,
    },

    studentId:{
        type:String,
        required:true,
    },

    academicSession:{
        type:String,
        default:"2026",
    },

    remarks:{
        type:String,
        default:"",
    },

    isActive:{
        type:Boolean,
        default:true,
    }

},
{
    timestamps:true,
}
);

module.exports=mongoose.model(
"StudentFeeStructure",
studentFeeStructureSchema
);