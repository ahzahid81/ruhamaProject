const mongoose = require("mongoose");

const studentRestrictionSchema = new mongoose.Schema(
{
    // ==========================
    // STUDENT
    // ==========================

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

    // ==========================
    // MODULE
    // ==========================

    module:{
        type:String,
        enum:[
            "Admit Card",
            "Result",
            "Certificate",
            "TC",
            "Library",
            "Hostel",
            "Finance",
            "General",
        ],
        required:true,
    },

    // ==========================
    // TYPE
    // ==========================

    restrictionType:{
        type:String,
        enum:[
            "Fee Due",
            "Exam Fee Due",
            "Library Due",
            "Hostel Due",
            "Disciplinary",
            "Document Pending",
            "Manual",
        ],
        required:true,
    },

    title:{
        type:String,
        required:true,
    },

    reason:{
        type:String,
        default:"",
    },

    startDate:{
        type:Date,
        default:Date.now,
    },

    endDate:{
        type:Date,
        default:null,
    },

    isActive:{
        type:Boolean,
        default:true,
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true,
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
    "StudentRestriction",
    studentRestrictionSchema
);