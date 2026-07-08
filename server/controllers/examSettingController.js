const ExamSetting = require("../models/ExamSetting");

// ==========================================
// CREATE EXAM
// ==========================================

const createExam = async (req, res) => {

    try {

        const exists = await ExamSetting.findOne({

            examCode: req.body.examCode,

        });

        if (exists) {

            return res.status(400).json({

                success: false,

                message: "Exam already exists.",

            });

        }

        const exam = await ExamSetting.create(req.body);

        return res.status(201).json({

            success: true,

            message: "Exam created successfully.",

            exam,

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

// ==========================================
// GET ALL EXAMS
// ==========================================

const getExams = async (req, res) => {

    try {

        const exams = await ExamSetting.find()

            .populate(

                "requiredFees.feeCategory",

                "name category"

            )

            .sort({

                createdAt: -1,

            });

        return res.status(200).json({

            success: true,

            exams,

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

// ==========================================
// GET SINGLE EXAM
// ==========================================

const getExam = async (req, res) => {

    try {

        const exam = await ExamSetting.findById(

            req.params.id

        ).populate(

            "requiredFees.feeCategory",

            "name category"

        );

        if (!exam) {

            return res.status(404).json({

                success: false,

                message: "Exam not found.",

            });

        }

        return res.status(200).json({

            success: true,

            exam,

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

// ==========================================
// UPDATE EXAM
// ==========================================

const updateExam = async (req, res) => {

    try {

        const exam = await ExamSetting.findByIdAndUpdate(

            req.params.id,

            req.body,

            {

                new: true,

                runValidators: true,

            }

        );

        if (!exam) {

            return res.status(404).json({

                success: false,

                message: "Exam not found.",

            });

        }

        return res.status(200).json({

            success: true,

            message: "Exam updated successfully.",

            exam,

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

// ==========================================
// DELETE EXAM
// ==========================================

const deleteExam = async (req, res) => {

    try {

        const exam = await ExamSetting.findByIdAndDelete(

            req.params.id

        );

        if (!exam) {

            return res.status(404).json({

                success: false,

                message: "Exam not found.",

            });

        }

        return res.status(200).json({

            success: true,

            message: "Exam deleted successfully.",

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

    createExam,

    getExams,

    getExam,

    updateExam,

    deleteExam,

};