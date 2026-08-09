const ExamResult = require("../models/ExamResult");
const ExamSubject = require("../models/ExamSubject");
const ExamSetting = require("../models/ExamSetting");
const Student = require("../models/Student");

const XLSX = require("xlsx");

const { getGrade, getDivision } = require("../utils/grading");

// ==========================================
// HELPER: compute result summary for entries
// ==========================================

const computeResult = (entries) => {
  let totalFullMarks = 0;
  let totalObtained = 0;
  let gradeSum = 0;
  let hasFail = false;

  entries.forEach((e) => {
    totalFullMarks += Number(e.fullMarks) || 0;
    totalObtained += Number(e.obtainedMarks) || 0;
    gradeSum += Number(e.gradePoint) || 0;
    if (e.status === "Fail") hasFail = true;
  });

  const count = entries.length || 1;
  let gpa = Math.round((gradeSum / count) * 100) / 100;
  if (hasFail) gpa = 0;
  const division = getDivision(gpa);

  return {
    totalFullMarks,
    totalObtained,
    percentage: totalFullMarks ? Math.round((totalObtained / totalFullMarks) * 100) / 100 : 0,
    gpa,
    grade: division.grade,
    division: division.division,
    status: hasFail ? "Fail" : "Pass",
  };
};

// ==========================================
// GET STUDENTS FOR MARKS ENTRY
// ==========================================

const getStudentsForMarks = async (req, res) => {
  try {
    const { examId } = req.params;
    const { className } = req.query;

    if (!className) {
      return res.status(400).json({ success: false, message: "className is required." });
    }

    const exam = await ExamSetting.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const subjects = await ExamSubject.find({ exam: examId, className }).sort({ order: 1, subjectName: 1 });

    const students = await Student.find({ className, status: { $ne: "Inactive" } }).sort({ roll: 1 });

    const results = await ExamResult.find({ exam: examId, className });

    const resultMap = {};
    results.forEach((r) => {
      resultMap[r.student.toString()] = r;
    });

    const rows = students.map((s) => {
      const existing = resultMap[s._id.toString()];
      const marks = subjects.map((sub) => {
        const entry = existing?.entries?.find((e) => e.subject && e.subject.toString() === sub._id.toString());
        return {
          subjectId: sub._id,
          subjectName: sub.subjectName,
          fullMarks: sub.fullMarks,
          passMarks: sub.passMarks,
          obtainedMarks: entry ? entry.obtainedMarks : "",
          grade: entry ? entry.grade : "",
          status: entry ? entry.status : "",
        };
      });
      return {
        studentId: s._id,
        studentCode: s.studentId,
        name: s.name,
        roll: s.roll,
        section: s.section,
        photo: s.photo,
        marks,
        saved: !!existing,
        resultId: existing ? existing._id : null,
        isHifz: existing ? !!existing.isHifz : false,
      };
    });

    return res.status(200).json({
      success: true,
      exam: { _id: exam._id, examName: exam.examName, examCode: exam.examCode, academicSession: exam.academicSession },
      className,
      subjects,
      students: rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// SAVE MARKS (bulk upsert per student)
// ==========================================

const saveMarks = async (req, res) => {
  try {
    const { examId } = req.params;
    const { className, students } = req.body;

    const exam = await ExamSetting.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }
    if (!className || !Array.isArray(students)) {
      return res.status(400).json({ success: false, message: "className and students array are required." });
    }

    const subjects = await ExamSubject.find({ exam: examId, className });
    if (subjects.length === 0) {
      return res.status(400).json({ success: false, message: "No subjects defined for this class. Add subjects first." });
    }

    const subjectMap = {};
    subjects.forEach((s) => {
      subjectMap[s._id.toString()] = s;
    });

    let savedCount = 0;

    for (const row of students) {
      if (!row.studentId) continue;

      const student = await Student.findById(row.studentId);
      if (!student) continue;

      const isHifz = !!row.isHifz;
      const entries = [];

      for (const m of row.marks || []) {
        const sub = subjectMap[m.subjectId];
        if (!sub) continue;

        const raw = m.obtainedMarks;
        const isEmpty =
          raw === "" ||
          raw === null ||
          raw === undefined;

        if (isEmpty && isHifz) continue;

        const obtained = isEmpty ? 0 : Math.max(0, Number(raw));
        const capped = Math.min(obtained, sub.fullMarks);
        const grading = getGrade(capped, sub.passMarks, sub.fullMarks);

        entries.push({
          subject: sub._id,
          subjectName: sub.subjectName,
          fullMarks: sub.fullMarks,
          passMarks: sub.passMarks,
          obtainedMarks: capped,
          grade: grading.grade,
          gradePoint: grading.gradePoint,
          status: grading.status,
        });
      }

      if (entries.length === 0) continue;

      const summary = computeResult(entries);

      await ExamResult.findOneAndUpdate(
        { exam: examId, student: student._id },
        {
          $set: {
            className,
            academicSession: exam.academicSession,
            roll: student.roll,
            studentName: student.name,
            studentId: student.studentId,
            entries,
            isHifz,
            ...summary,
            enteredBy: req.user?._id || null,
          },
        },
        { upsert: true, new: true }
      );

      savedCount += 1;
    }

    return res.status(200).json({
      success: true,
      message: `Marks saved for ${savedCount} student(s).`,
      savedCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// EXPORT CLASS RESULTS TO EXCEL (notice board)
// ==========================================

const exportResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const { className } = req.query;

    const exam = await ExamSetting.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const subjects = await ExamSubject.find({ exam: examId, className }).sort({ order: 1, subjectName: 1 });

    const filter = { exam: examId };
    if (className) filter.className = className;

    const results = await ExamResult.find(filter).sort({ totalObtained: -1, gpa: -1 });

    const header = [
      "Position",
      "Student ID",
      "Name",
      "Roll",
      "Section",
      "Hifz",
      ...subjects.map((s) => `${s.subjectName} (${s.fullMarks})`),
      "Total Obtained",
      "Total Full",
      "Percentage",
      "GPA",
      "Grade",
      "Status",
    ];

    const rows = results.map((r, i) => {
      const entryMap = {};
      r.entries.forEach((e) => {
        entryMap[e.subject.toString()] = e;
      });
      const subjectCells = subjects.map((s) => {
        const e = entryMap[s._id.toString()];
        return e ? e.obtainedMarks : "";
      });
      return [
        i + 1,
        r.studentId,
        r.studentName,
        r.roll,
        r.className,
        r.isHifz ? "Yes" : "",
        ...subjectCells,
        r.totalObtained,
        r.totalFullMarks,
        r.percentage ? `${r.percentage}%` : "0%",
        r.gpa.toFixed(2),
        r.grade || "",
        r.status || "",
      ];
    });

    const sheetName = (className || "All").slice(0, 31);

    const title = `${exam.examName} — ${sheetName} Result`;
    const ws = XLSX.utils.aoa_to_sheet([[title], [`Academic Session: ${exam.academicSession} | Total Students: ${results.length}`], [], header, ...rows]);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 12 },
      { wch: 28 },
      { wch: 8 },
      { wch: 12 },
      { wch: 6 },
      ...subjects.map(() => ({ wch: 14 })),
      { wch: 14 },
      { wch: 10 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: header.length - 1 } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    const safeClass = (className || "All").replace(/[^a-zA-Z0-9\-_ ]/g, "");
    const filename = `${exam.examName.replace(/[^a-zA-Z0-9\-_ ]/g, "")}_${safeClass}_Result.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.send(buffer);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET RESULTS (with merit positions)
// ==========================================

const getResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const { className } = req.query;

    const exam = await ExamSetting.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const subjects = await ExamSubject.find({ exam: examId, className }).sort({ order: 1, subjectName: 1 });

    const filter = { exam: examId };
    if (className) filter.className = className;

    let results = await ExamResult.find(filter)
      .populate("student", "photo studentId name roll className section")
      .sort({ totalObtained: -1, gpa: -1 });

    results = results.map((r) => r.toObject());

    let lastRank = 0;
    results.forEach((r, i) => {
      const sameAsPrev =
        i > 0 &&
        r.totalObtained === results[i - 1].totalObtained &&
        r.gpa === results[i - 1].gpa;
      r.position = sameAsPrev ? lastRank : i + 1;
      lastRank = r.position;
      r.totalStudents = results.length;
    });

    return res.status(200).json({
      success: true,
      exam: { _id: exam._id, examName: exam.examName, examCode: exam.examCode, academicSession: exam.academicSession },
      className,
      subjects,
      results,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// GET SINGLE STUDENT RESULT (report card)
// ==========================================

const getResult = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const exam = await ExamSetting.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    let result = await ExamResult.findOne({ exam: examId, student: studentId });

    if (result) {
      result = result.toObject();
    } else {
      result = { entries: [], totalObtained: 0, gpa: 0, status: "Not Submitted" };
    }

    return res.status(200).json({
      success: true,
      exam: { _id: exam._id, examName: exam.examName, examCode: exam.examCode, academicSession: exam.academicSession, resultPublishDate: exam.resultPublishDate },
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        className: student.className,
        section: student.section,
        roll: student.roll,
        photo: student.photo,
        fatherName: student.fatherName,
        motherName: student.motherName,
      },
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PUBLISH / UNPUBLISH RESULTS
// ==========================================

const publishResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const { className, published } = req.body;

    const filter = { exam: examId };
    if (className) filter.className = className;

    const update = { resultPublished: !!published };

    const updated = await ExamResult.updateMany(filter, { $set: update });

    return res.status(200).json({
      success: true,
      message: `Results ${published ? "published" : "unpublished"} for ${updated.modifiedCount} student(s).`,
      modifiedCount: updated.modifiedCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentsForMarks,
  saveMarks,
  getResults,
  getResult,
  publishResults,
  exportResults,
};
