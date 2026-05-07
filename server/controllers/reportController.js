const Report = require("../models/Report");


// CREATE ENTRY
const createEntry = async (req, res) => {
    try {

        const {
            className,
            date,
            subject,
            teacherId,
            classWork,
            homeWork,
        } = req.body;

        let report = await Report.findOne({
            className,
            date,
        });

        // Create new report
        if (!report) {

            report = await Report.create({
                className,
                date,
                entries: [],
            });
        }

        // Check duplicate subject
        const alreadySubmitted =
            report.entries.find(
                (entry) =>
                    entry.subject === subject
            );

        if (alreadySubmitted) {

            return res.status(400).json({
                message:
                    "This subject already submitted today",
            });
        }

        // Add entry
        report.entries.push({
            subject,
            teacherId,
            classWork,
            homeWork,
        });

        await report.save();

        res.status(201).json({
            message: "Entry Created",
            report,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};


// GET REPORT
const getClassReport = async (
    req,
    res
) => {
    try {

        const {
            className,
            date,
        } = req.query;

        const report =
            await Report.findOne({
                className,
                date,
            }).populate(
                "entries.teacherId",
                "name"
            );

        if (!report) {

            return res.status(404).json({
                message: "Report not found",
            });
        }

        res.status(200).json(report);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

const getAllReports = async (
    req,
    res
) => {
    try {

        const reports =
            await Report.find()
                .populate(
                    "entries.teacherId",
                    "name"
                )
                .sort({
                    createdAt: -1,
                });

        res.status(200).json(reports);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

const Teacher = require("../models/Teacher");

const getPendingSubjects = async (
    req,
    res
) => {
    try {

        const {
            className,
            date,
        } = req.query;

        // Find all assigned subjects
        const teachers =
            await Teacher.find();

        let assignedSubjects = [];

        teachers.forEach((teacher) => {

            teacher.assignments.forEach(
                (assignment) => {

                    if (
                        assignment.className ===
                        className
                    ) {

                        assignedSubjects.push(
                            assignment.subject
                        );
                    }
                }
            );
        });

        // Remove duplicate subjects
        assignedSubjects =
            [...new Set(assignedSubjects)];

        // Find submitted report
        const report =
            await Report.findOne({
                className,
                date,
            });

        let submittedSubjects = [];

        if (report) {

            submittedSubjects =
                report.entries.map(
                    (entry) => entry.subject
                );
        }

        // Find pending
        const pendingSubjects =
            assignedSubjects.filter(
                (subject) =>
                    !submittedSubjects.includes(
                        subject
                    )
            );

        res.status(200).json({
            assignedSubjects,
            submittedSubjects,
            pendingSubjects,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

// DELETE ENTRY
const deleteEntry = async (
    req,
    res
) => {
    try {

        const {
            reportId,
            entryId,
        } = req.params;

        const report =
            await Report.findById(
                reportId
            );

        if (!report) {

            return res.status(404).json({
                message: "Report not found",
            });
        }

        report.entries =
            report.entries.filter(
                (entry) =>
                    entry._id.toString() !==
                    entryId
            );

        await report.save();

        res.status(200).json({
            message: "Entry Deleted",
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};


// UPDATE ENTRY
const updateEntry = async (
    req,
    res
) => {
    try {

        const {
            reportId,
            entryId,
        } = req.params;

        const {
            classWork,
            homeWork,
        } = req.body;

        const report =
            await Report.findById(
                reportId
            );

        if (!report) {

            return res.status(404).json({
                message: "Report not found",
            });
        }

        const entry =
            report.entries.id(entryId);

        if (!entry) {

            return res.status(404).json({
                message: "Entry not found",
            });
        }

        entry.classWork =
            classWork;

        entry.homeWork =
            homeWork;

        await report.save();

        res.status(200).json({
            message: "Entry Updated",
            report,
        });

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    createEntry,
    getClassReport,
    getAllReports,
    getPendingSubjects,
    deleteEntry,
    updateEntry,
};