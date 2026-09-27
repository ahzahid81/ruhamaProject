const Report = require("../models/Report");


// CREATE ENTRY
const createEntry = async (req, res) => {
    try {

        const {
            className,
            date,
            subject,
            teacherId,
            takenBy,
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
            takenBy,
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
            })
                .populate(
                    "entries.teacherId",
                    "name"
                )
                .populate(
                    "entries.takenBy",
                    "name"
                )
                .lean();

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
                .populate(
                    "entries.takenBy",
                    "name"
                )
                .sort({
                    createdAt: -1,
                })
                .lean();

        res.status(200).json(reports);

    } catch (error) {

        res.status(500).json({
            message: error.message,
        });
    }
};

const Teacher = require("../models/Teacher");

// Collects pending-subject counts for many class/date pairs at once.
// The dashboard used to call /reports/pending once per report, and every one of
// those calls re-read the whole Teacher collection.
const collectAssignedSubjects = (teachers) => {
    const byClass = new Map();
    teachers.forEach((teacher) => {
        if (!teacher.assignments) return;
        teacher.assignments.forEach((assignment) => {
            if (!assignment.className || !assignment.subject) return;
            const bucket = byClass.get(assignment.className) || new Set();
            bucket.add(assignment.subject);
            byClass.set(assignment.className, bucket);
        });
    });
    return byClass;
};

const getPendingSummary = async (req, res) => {
    try {
        let pairs = [];
        if (req.query.pairs) {
            pairs = JSON.parse(req.query.pairs);
        } else if (Array.isArray(req.body?.pairs)) {
            pairs = req.body.pairs;
        }

        const normalized = pairs
            .filter((p) => p && p.className && p.date)
            .map((p) => ({ className: String(p.className), date: String(p.date) }));

        if (!normalized.length) {
            return res.status(200).json({ summary: {} });
        }

        const [teachers, reports] = await Promise.all([
            Teacher.find().lean(),
            Report.find({
                $or: normalized.map((p) => ({ className: p.className, date: p.date })),
            }).lean(),
        ]);

        const assignedByClass = collectAssignedSubjects(teachers);
        const submittedByPair = new Map();
        reports.forEach((report) => {
            const key = `${report.className}|${report.date}`;
            const bucket = submittedByPair.get(key) || new Set();
            (report.entries || []).forEach((entry) => bucket.add(entry.subject));
            submittedByPair.set(key, bucket);
        });

        const summary = {};
        normalized.forEach((pair) => {
            const key = `${pair.className}|${pair.date}`;
            const assigned = assignedByClass.get(pair.className) || new Set();
            const submitted = submittedByPair.get(key) || new Set();
            summary[key] = [...assigned].filter((subject) => !submitted.has(subject));
        });

        return res.status(200).json({ summary });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

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

            if (!teacher.assignments) return;

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
    getPendingSummary,
    deleteEntry,
    updateEntry,
};