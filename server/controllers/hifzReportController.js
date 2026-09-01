const HifzReport = require("../models/HifzReport");
const Student = require("../models/Student");

const normalizeLesson = (obj = {}) => ({
  juz: String(obj.juz || "").trim(),
  page: String(obj.page || "").trim(),
  verse: String(obj.verse || "").trim(),
});

// ============================================
// CREATE / UPDATE (upsert by student + date)
// ============================================
const saveHifzReport = async (req, res) => {
  try {
    const {
      studentId,
      date,
      lesson = {},
      sevenLessons = {},
      memorizationReview = {},
      remarks = "",
    } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({ success: false, message: "studentId and date are required." });
    }

    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const ts = req.user?.name || req.user?.email || "";

    const data = {
      student: student._id,
      studentId: student.studentId,
      studentName: student.name,
      className: student.className,
      section: student.section || "",
      date: reportDate,
      lesson: normalizeLesson(lesson),
      sevenLessons: normalizeLesson(sevenLessons),
      memorizationReview: normalizeLesson(memorizationReview),
      remarks: String(remarks || "").trim(),
    };

    if (req.user?._id) {
      data.teacherId = req.user._id;
      data.teacherName = req.user.name || "";
    } else if (ts) {
      data.teacherName = ts;
    }

    const existing = await HifzReport.findOne({ student: student._id, date: reportDate });

    let result;
    if (existing) {
      result = await HifzReport.findOneAndUpdate({ _id: existing._id }, { $set: data }, { new: true });
    } else {
      result = await HifzReport.create(data);
    }

    return res.status(200).json({
      success: true,
      message: existing ? "Hifz report updated." : "Hifz report saved.",
      report: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET REPORT FOR A STUDENT ON A DATE (prefill)
// ============================================
const getHifzReport = async (req, res) => {
  try {
    const { studentId, date } = req.query;

    if (!studentId || !date) {
      return res.status(400).json({ success: false, message: "studentId and date are required." });
    }

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const report = await HifzReport.findOne({ student: studentId, date: reportDate }).lean();

    return res.status(200).json({ success: true, report: report || null });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET STUDENT HISTORY (all dated entries)
// ============================================
const getHifzStudentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { from, to, limit = 60 } = req.query;

    const filter = { student: studentId };

    if (from || to) {
      filter.date = {};
      if (from) {
        const f = new Date(from);
        f.setHours(0, 0, 0, 0);
        filter.date.$gte = f;
      }
      if (to) {
        const t = new Date(to);
        t.setHours(23, 59, 59, 999);
        filter.date.$lte = t;
      }
    }

    const reports = await HifzReport.find(filter)
      .populate("teacherId", "name")
      .sort({ date: -1 })
      .limit(Number(limit));

    return res.status(200).json({ success: true, reports });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET CLASS + DATE LIST (all students for a sheet)
// ============================================
const getHifzClassList = async (req, res) => {
  try {
    const { className, section, date } = req.query;

    if (!className || !date) {
      return res.status(400).json({ success: false, message: "className and date are required." });
    }

    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);

    const studentFilter = { className, status: { $ne: "Inactive" } };
    if (section) studentFilter.section = section;

    const students = await Student.find(studentFilter).select("_id studentId name photo section").lean();

    const reports = await HifzReport.find({ className, date: reportDate })
      .populate("teacherId", "name")
      .lean();

    const reportMap = {};
    reports.forEach((r) => {
      reportMap[r.student?.toString() || r.studentId] = r;
    });

    const rows = students.map((s) => ({
      student: s,
      report: reportMap[s._id.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      className,
      section: section || "",
      date: reportDate,
      total: rows.length,
      marked: reports.length,
      rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE A REPORT
// ============================================
const deleteHifzReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await HifzReport.findByIdAndDelete(id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Hifz report not found." });
    }

    return res.status(200).json({ success: true, message: "Hifz report deleted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  saveHifzReport,
  getHifzReport,
  getHifzStudentHistory,
  getHifzClassList,
  deleteHifzReport,
};
