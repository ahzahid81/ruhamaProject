const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");

const Student = require("../models/Student");
const Counter = require("../models/Counter");

// ======================================================
// CLASS CODE
// ======================================================

const getClassCode = (className = "") => {
    switch (className.trim()) {
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

// ======================================================
// GENDER CODE
// ======================================================

const getGenderCode = (gender = "") => {
    return gender === "Female" ? "G" : "B";
};

// ======================================================
// EXCEL CLASS MAPPING
// ======================================================

const getClassName = (value = "") => {
    const cls = value.toString().trim();

    switch (cls) {
        case "Play(Boy's)":
        case "Play(Girl's)":
            return "Play Group";

        case "Nursery(Boy's)":
        case "Nursery(Girl's)":
            return "Nursery";

        case "KG(Boy's)":
        case "KG(Girl's)":
            return "KG";

        case "STD-I":
            return "STD-I";

        case "STD-II":
            return "STD-II";

        case "STD-III":
            return "STD-III";

        case "STD-IV":
            return "STD-IV";

        case "STD-V":
            return "STD-V";

        default:
            return cls;
    }
};

// ======================================================
// STUDENT TYPE
// ======================================================

const getStudentType = (value = "") => {
    const type = value.toString().trim().toLowerCase();

    if (type.includes("hostel")) return "Hostel";

    if (type.includes("day")) return "Day Care";

    if (type.includes("hifz")) return "Hifzul Quran";

    return "Regular";
};

// ======================================================
// GENDER
// ======================================================

const getGender = (value = "") => {
    const gender = value.toString().trim().toLowerCase();

    if (
        gender === "male" ||
        gender === "boy" ||
        gender === "boys"
    ) {
        return "Male";
    }

    return "Female";
};

// ======================================================
// BLOOD GROUP
// ======================================================

const getBloodGroup = (value = "") => {
    if (!value) return "";

    const blood = value.toString().trim();

    if (
        blood === "No" ||
        blood === "-" ||
        blood === "N/A"
    ) {
        return "";
    }

    return blood;
};

// ======================================================
// DATE PARSER
// Supports:
// 11/12/2025
// 17-12-2025
// 9-Jun-20
// Excel Serial Number
// ======================================================

const parseExcelDate = (value) => {

    if (!value) return null;

    // Excel Serial Number
    if (typeof value === "number") {

        const utcDays = Math.floor(value - 25569);

        const utcValue =
            utcDays * 86400;

        return new Date(
            utcValue * 1000
        );

    }

    const text =
        value.toString().trim();

    const date =
        new Date(text);

    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
};

// ======================================================
// COUNTER KEY
// Example:
//
// BK-26
// GK-26
// BIII-26
// GIII-26
// ======================================================

const getCounterKey = (
    className,
    gender,
    session
) => {

    const classCode =
        getClassCode(className);

    const genderCode =
        getGenderCode(gender);

    const year =
        session
            ? session.toString().slice(-2)
            : new Date()
                .getFullYear()
                .toString()
                .slice(-2);

    return `${genderCode}${classCode}-${year}`;

};

// ======================================================
// NEXT STUDENT ID
// ======================================================

const generateStudentId = async (
    className,
    gender,
    session
) => {

    const key =
        getCounterKey(
            className,
            gender,
            session
        );

    const counter =
        await Counter.findOneAndUpdate(

            {
                key,
            },

            {
                $inc: {
                    value: 1,
                },
            },

            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }

        );

    const classCode =
        getClassCode(className);

    const genderCode =
        getGenderCode(gender);

    const year =
        session
            ? session.toString().slice(-2)
            : new Date()
                .getFullYear()
                .toString()
                .slice(-2);

    const serial =
        counter.value
            .toString()
            .padStart(4, "0");

    return `R${genderCode}${classCode}${year}${serial}`;

};

// ======================================================
// NEXT ADMISSION NO
// ======================================================

const generateAdmissionNo =
    async (session) => {

        const year =
            session
                ? session.toString().slice(-2)
                : new Date()
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
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                }

            );

        return `ADM${year}${counter.value
            .toString()
            .padStart(4, "0")}`;

    };


// ======================================================
// IMPORT STUDENTS FROM EXCEL
// ======================================================

const importStudents = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Excel file is required.",
            });
        }

        // ==========================
        // READ EXCEL
        // ==========================

        const workbook = XLSX.read(req.file.buffer, {
            type: "buffer",
        });

        const sheet =
            workbook.Sheets[
            workbook.SheetNames[0]
            ];

        const rows =
            XLSX.utils.sheet_to_json(sheet, {
                defval: "",
            });

        if (!rows.length) {

            return res.status(400).json({
                success: false,
                message: "Excel file is empty.",
            });

        }

        let imported = 0;
        let skipped = 0;
        let failed = 0;

        const errors = [];

        // ==========================
        // LOOP
        // ==========================

        for (const [index, row] of rows.entries()) {

            try {

                // --------------------------
                // REQUIRED
                // --------------------------

                const studentId =
                    String(
                        row["ID No"]
                    ).trim();

                const name =
                    String(
                        row["Name"]
                    ).trim();

                const className =
                    getClassName(
                        row["Class"]
                    );

                const fatherName =
                    String(
                        row["Father’s Name"] ||
                        row["Father's Name"]
                    ).trim();

                const fatherMobile =
                    String(
                        row["Mobile No"]
                    ).trim();

                if (
                    !studentId ||
                    !name ||
                    !className
                ) {

                    failed++;

                    errors.push({
                        row: index + 2,
                        reason: "Required data missing",
                    });

                    continue;

                }

                // --------------------------
                // DUPLICATE
                // --------------------------

                const exists =
                    await Student.findOne({
                        studentId,
                    });

                if (exists) {

                    skipped++;

                    continue;

                }

                // --------------------------
                // PASSWORD
                // --------------------------

                const password =
                    fatherMobile || "123456";

                const hashedPassword =
                    await bcrypt.hash(
                        password,
                        10
                    );

                const serial = parseInt(
                    studentId.slice(-4),
                    10
                );

                const year = studentId.substring(
                    studentId.length - 6,
                    studentId.length - 4
                );

                const classCode =
                    getClassCode(className);

                const genderCode =
                    getGenderCode(
                        getGender(row["Gender"])
                    );

                const counterKey =
                    `${genderCode}${classCode}-${year}`;

                await Counter.findOneAndUpdate(
                    {
                        key: counterKey,
                    },
                    {
                        $max: {
                            value: serial,
                        },
                    },
                    {
                        upsert: true,
                        new: true,
                    }
                );


                const admissionNo =
                    await generateAdmissionNo(
                        "2026"
                    );
                // --------------------------
                // CREATE
                // --------------------------

                await Student.create({

                    studentId,

                    password:
                        hashedPassword,

                    admissionNo,

                    name,

                    photo: "",

                    roll: 0,

                    className,

                    section: "A",

                    session: "2026",

                    studentType:
                        getStudentType(
                            row["Student Type"]
                        ),

                    gender:
                        getGender(
                            row["Gender"]
                        ),

                    religion:
                        row["Religion"] || "Islam",

                    bloodGroup:
                        getBloodGroup(
                            row["Blood Group"]
                        ),

                    nationality:
                        "Bangladeshi",

                    dateOfBirth:
                        parseExcelDate(
                            row["DoB"]
                        ),

                    fatherName,

                    fatherMobile,

                    motherName:
                        row["Mother’s Name"] ||
                        row["Mother's Name"] ||
                        "",

                    motherMobile:
                        row["Mothers Mobile No"] ||
                        "",

                    guardianName: "",

                    guardianRelation: "",

                    guardianMobile: "",

                    emergencyContact: "",

                    presentAddress:
                        row["Address"] || "",

                    permanentAddress:
                        row["Address"] || "",

                    admissionDate:
                        parseExcelDate(
                            row["Admission Date"]
                        ),

                    remarks: "",

                    status: "Active",

                });

                imported++;

            } catch (err) {

                failed++;

                errors.push({

                    row: index + 2,

                    reason: err.message,

                });

            }

        }

        // ==========================
        // RESULT
        // ==========================

        return res.status(200).json({

            success: true,

            total: rows.length,

            imported,

            skipped,

            failed,

            errors,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ======================================================
// CREATE STUDENT
// ======================================================

// ======================================================
// CREATE NEW STUDENT ADMISSION
// ======================================================

const createStudent = async (req, res) => {

    try {


        const {

            name,

            roll,

            className,

            section = "A",

            session = "2026",

            studentType = "Regular",


            gender,

            religion = "Islam",

            bloodGroup = "",

            nationality = "Bangladeshi",

            dateOfBirth,


            fatherName,

            fatherMobile,


            motherName = "",

            motherMobile = "",


            guardianName = "",

            guardianRelation = "",

            guardianMobile = "",


            emergencyContact = "",


            presentAddress = "",

            permanentAddress = "",


            admissionDate,


            remarks = "",


            password,


        } = req.body;



        // ==========================
        // REQUIRED VALIDATION
        // ==========================


        if (

            !name ||

            !className ||

            !gender ||

            !fatherName ||

            !fatherMobile

        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Required information missing",

            });

        }



        // ==========================
        // AUTO STUDENT ID
        // ==========================


        const studentId =

            await generateStudentId(

                className,

                gender,

                session

            );




        // ==========================
        // AUTO ADMISSION NO
        // ==========================


        const admissionNo =

            await generateAdmissionNo(

                session

            );




        // ==========================
        // PASSWORD
        // ==========================


        const finalPassword =

            password ||

            fatherMobile;



        const hashedPassword =

            await bcrypt.hash(

                finalPassword,

                10

            );




        // ==========================
        // PHOTO
        // ==========================


        let photo = "";


        if (req.file) {

            photo =
                req.file.path;

        }




        // ==========================
        // CREATE STUDENT
        // ==========================


        const student =

            await Student.create({

                studentId,

                admissionNo,


                password:
                    hashedPassword,


                plainPassword:
                    finalPassword,


                name,


                photo,


                roll:
                    roll || 0,


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


                status: "Active",


            });




        res.status(201).json({

            success: true,

            message:
                "Student admitted successfully",


            student,

        });



    }


    catch (error) {


        res.status(500).json({

            success: false,

            message: error.message,

        });


    }


};
// ======================================================
// GET ALL STUDENTS
// ======================================================

const getStudents = async (req, res) => {

    try {

        const {

            className,

            section,

            status,

            search,

        } = req.query;

        const filter = {};

        if (className)
            filter.className = className;

        if (section)
            filter.section = section;

        if (status)
            filter.status = status;

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
            await Student.find(filter)
                .sort({
                    className: 1,
                    roll: 1,
                    createdAt: 1,
                });

        res.status(200).json(students);

    }

    catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

// ======================================================
// GET SINGLE STUDENT
// ======================================================

const getStudent = async (req, res) => {

    try {

        const student =
            await Student.findById(
                req.params.id
            );

        if (!student) {

            return res.status(404).json({

                success: false,

                message:
                    "Student not found.",

            });

        }

        res.status(200).json(student);

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ======================================================
// UPDATE STUDENT
// ======================================================

// ======================================================
// UPDATE STUDENT WITH PHOTO
// ======================================================

const updateStudent = async (req, res) => {

    try {

        const student =
            await Student.findById(
                req.params.id
            );


        if (!student) {

            return res.status(404).json({

                success: false,

                message: "Student not found",

            });

        }



        const {

            name,

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

            status,


        } = req.body;



        // ==========================
        // PHOTO UPDATE
        // ==========================

        if (req.file) {

            student.photo =
                req.file.path;

        }



        // ==========================
        // BASIC UPDATE
        // ==========================


        student.name =
            name || student.name;


        student.roll =
            roll || student.roll;


        student.className =
            className || student.className;


        student.section =
            section || student.section;


        student.session =
            session || student.session;


        student.studentType =
            studentType || student.studentType;



        student.gender =
            gender || student.gender;


        student.religion =
            religion || student.religion;


        student.bloodGroup =
            bloodGroup || student.bloodGroup;


        student.nationality =
            nationality || student.nationality;


        student.dateOfBirth =
            dateOfBirth || student.dateOfBirth;



        // ==========================
        // PARENTS
        // ==========================


        student.fatherName =
            fatherName || student.fatherName;


        student.fatherMobile =
            fatherMobile || student.fatherMobile;


        student.motherName =
            motherName || student.motherName;


        student.motherMobile =
            motherMobile || student.motherMobile;



        student.guardianName =
            guardianName || student.guardianName;


        student.guardianRelation =
            guardianRelation || student.guardianRelation;


        student.guardianMobile =
            guardianMobile || student.guardianMobile;


        student.emergencyContact =
            emergencyContact || student.emergencyContact;



        // ==========================
        // ADDRESS
        // ==========================


        student.presentAddress =
            presentAddress || student.presentAddress;


        student.permanentAddress =
            permanentAddress || student.permanentAddress;



        student.admissionDate =
            admissionDate || student.admissionDate;



        student.remarks =
            remarks || student.remarks;



        student.status =
            status || student.status;



        await student.save();



        res.status(200).json({

            success: true,

            message:
                "Student updated successfully",

            student,

        });


    }


    catch (error) {


        res.status(500).json({

            success: false,

            message: error.message,

        });


    }


};

// ======================================================
// DELETE STUDENT
// ======================================================

const deleteStudent = async (req, res) => {

    try {

        const student =
            await Student.findById(req.params.id);

        if (!student) {

            return res.status(404).json({

                success: false,

                message: "Student not found.",

            });

        }

        await student.deleteOne();

        res.status(200).json({

            success: true,

            message: "Student deleted successfully.",

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {

    try {

        const student =
            await Student.findById(req.params.id);

        if (!student) {

            return res.status(404).json({

                success: false,

                message: "Student not found.",

            });

        }

        student.password =
            await bcrypt.hash(

                student.fatherMobile,

                10

            );

        await student.save();

        res.status(200).json({

            success: true,

            message:
                "Password reset successfully.",

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

// ======================================================
// GENERATE ROLL NUMBERS
// ======================================================

const generateRollNumbers = async (req, res) => {

    try {

        const {

            className,

            section = "A",

            session = "2026",

        } = req.body;

        const students =
            await Student.find({

                className,

                section,

                session,

                status: "Active",

            }).sort({

                studentId: 1,

            });

        let roll = 1;

        for (const student of students) {

            student.roll = roll++;

            await student.save();

        }

        res.status(200).json({

            success: true,

            message: "Roll numbers generated successfully.",

            total: students.length,

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


// ======================================
// SEARCH STUDENTS
// ======================================

const searchStudents = async (req, res) => {

    try {

        const q = (req.query.q || "").trim();

        if (!q) {

            return res.json([]);

        }

        const students = await Student.find({

            $or: [

                {
                    studentId: {
                        $regex: q,
                        $options: "i",
                    },
                },

                {
                    name: {
                        $regex: q,
                        $options: "i",
                    },
                },

                {
                    fatherMobile: {
                        $regex: q,
                        $options: "i",
                    },
                },

            ],

        })

            .select(
                "studentId name className section roll photo fatherName fatherMobile status"
            )

            .sort({
                className: 1,
                studentId: 1,
                roll: 1,
            })

            .limit(20);

        res.json(students);

    }

    catch (error) {

        console.log(error);

        res.status(500).json({

            message: error.message,

        });

    }

};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    importStudents,

    createStudent,

    getStudents,

    getStudent,

    updateStudent,

    deleteStudent,

    resetPassword,

    generateRollNumbers,

    searchStudents,

};