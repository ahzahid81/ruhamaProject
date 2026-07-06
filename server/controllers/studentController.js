const Student = require("../models/Student");
const Counter = require("../models/Counter");

const bcrypt = require("bcryptjs");

const getClassCode = (className) => {

    switch (className) {

        case "Play Group":
            return "P";

        case "Nursery":
            return "N";

        case "KG":
            return "K";

        case "STD-I":
            return "I";

        case "STD-II":
            return "II";

        case "STD-III":
            return "III";

        case "STD-IV":
            return "IV";

        case "STD-V":
            return "V";

        default:
            return "";
    }

};

const getGenderCode = (gender) => {

    return gender === "Female"

        ? "G"

        : "B";

};

const generateStudentId = async (
    className,
    gender
) => {

    const year =
        new Date()
            .getFullYear()
            .toString()
            .slice(-2);

    const classCode =
        getClassCode(className);

    const genderCode =
        getGenderCode(gender);

    const counter =
        await Counter.findOneAndUpdate(

            {
                key:
                    `${classCode}-${year}`,
            },

            {
                $inc: {
                    value: 1,
                },
            },

            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }

        );

    const serial =
        counter.value
            .toString()
            .padStart(4, "0");

    return `R${genderCode}${classCode}${year}${serial}`;

};

const generateAdmissionNo =
    async () => {

        const year =
            new Date()
                .getFullYear()
                .toString()
                .slice(-2);

        const counter =
            await Counter.findOneAndUpdate(

                {
                    key:
                        `ADM-${year}`,
                },

                {
                    $inc: {
                        value: 1,
                    },
                },

                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                }

            );

        return `ADM${year}${counter.value
            .toString()
            .padStart(4, "0")}`;

    };

// =======================================
// CREATE STUDENT
// =======================================

const createStudent = async (
    req,
    res
) => {

    try {

        const {

            name,
            photo,
            roll,
            className,
            section,
            session,
            studentType,

            gender,
            religion,
            bloodGroup,
            nationality,
            dateOfBirth,

            fatherName,
            fatherMobile,

            motherName,
            motherMobile,

            guardianName,
            guardianRelation,
            guardianMobile,

            emergencyContact,

            presentAddress,
            permanentAddress,

            admissionDate,

            remarks,

        } = req.body;


        // ===============================
        // REQUIRED VALIDATION
        // ===============================

        if (
            !name ||
            !roll ||
            !className ||
            !gender ||
            !fatherName ||
            !fatherMobile
        ) {

            return res.status(400).json({

                message:
                    "Please fill all required fields.",

            });

        }


        // ===============================
        // DUPLICATE CHECK
        // ===============================

        // ===============================
        // DUPLICATE CHECK
        // ===============================

        // Same Roll in same Class + Section + Session
        const duplicateRoll =
            await Student.findOne({

                className,

                section,

                session,

                roll,

            });

        if (duplicateRoll) {

            return res.status(400).json({

                message:
                    "Roll already exists in this class.",

            });

        }

        // Same Father Mobile + Student Name
        const duplicateStudent =
            await Student.findOne({

                fatherMobile,

                name,

            });

        if (duplicateStudent) {

            return res.status(400).json({

                message:
                    "Student already exists.",

            });

        }

        // =======================================
        // GET ALL STUDENTS
        // =======================================

        const getStudents = async (
            req,
            res
        ) => {

            try {

                const {

                    className,

                    section,

                    status,

                    search,

                } = req.query;

                let filter = {};

                if (className)
                    filter.className =
                        className;

                if (section)
                    filter.section =
                        section;

                if (status)
                    filter.status =
                        status;

                if (search) {

                    filter.$or = [

                        {
                            name: {
                                $regex: search,
                                $options: "i",
                            },
                        },

                        {
                            studentId: {
                                $regex: search,
                                $options: "i",
                            },
                        },

                        {
                            fatherMobile: {
                                $regex: search,
                                $options: "i",
                            },
                        },

                    ];

                }

                const students =
                    await Student.find(
                        filter
                    ).sort({

                        className: 1,

                        roll: 1,

                    });

                res.status(200).json(
                    students
                );

            } catch (error) {

                res.status(500).json({

                    message:
                        error.message,

                });

            }

        };

        // =======================================
        // GET SINGLE STUDENT
        // =======================================

        const getStudent =
            async (
                req,
                res
            ) => {

                try {

                    const student =
                        await Student.findById(

                            req.params.id

                        );

                    if (!student) {

                        return res.status(404).json({

                            message:
                                "Student not found.",

                        });

                    }

                    res.status(200).json(
                        student
                    );

                }

                catch (error) {

                    res.status(500).json({

                        message:
                            error.message,

                    });

                }

            };
        // ===============================
        // GENERATE ADMISSION NO
        // ===============================

        const admissionNo =
            await generateAdmissionNo();


        // ===============================
        // DEFAULT PASSWORD
        // ===============================

        const hashedPassword =
            await bcrypt.hash(

                fatherMobile,

                10

            );


        // ===============================
        // CREATE STUDENT
        // ===============================

        const student =
            await Student.create({

                studentId,

                admissionNo,

                password:
                    hashedPassword,

                name,
                photo,

                roll,
                className,
                section,
                session,
                studentType,

                gender,
                religion,
                bloodGroup,
                nationality,
                dateOfBirth,

                fatherName,
                fatherMobile,

                motherName,
                motherMobile,

                guardianName,
                guardianRelation,
                guardianMobile,

                emergencyContact,

                presentAddress,
                permanentAddress,

                admissionDate,

                remarks,

            });


        return res.status(201).json({

            message:
                "Student Created Successfully",

            student,

        });

    }

    catch (error) {

        return res.status(500).json({

            message:
                error.message,

        });

    }

};