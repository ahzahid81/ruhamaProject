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

// ============================================
// [STAFF] GET ALL STUDENTS' HIFZ PROGRESS
// Summarizes each student's hifz journey in a class.
// ============================================
const getHifzProgress = async (req, res) => {
  try {
    const { className, section, month, year } = req.query;

    if (!className) {
      return res.status(400).json({ success: false, message: "className is required." });
    }

    const studentFilter = { className, status: { $ne: "Inactive" }, studentType: "Hifzul Quran" };
    if (section) studentFilter.section = section;

    const students = await Student.find(studentFilter)
      .select("_id studentId name photo section studentType")
      .lean();

    const studentIds = students.map((s) => s._id);

    const reportFilter = { student: { $in: studentIds } };

    // Optional month scope for "progress this month"
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      reportFilter.date = { $gte: startDate, $lte: endDate };
    }

    const reports = await HifzReport.find(reportFilter)
      .populate("teacherId", "name")
      .sort({ date: 1 })
      .lean();

    const grouped = {};
    reports.forEach((r) => {
      const sid = r.student?.toString?.() || r.studentId;
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(r);
    });

    const rows = students.map((s) => {
      const list = grouped[s._id.toString()] || [];
      const latest = list[list.length - 1] || null;
      const hasAny = (l) => (l?.juz || l?.page || l?.verse) ? true : false;
      const filled = list.filter(
        (r) => hasAny(r.lesson) || hasAny(r.sevenLessons) || hasAny(r.memorizationReview)
      ).length;

      return {
        student: {
          _id: s._id,
          studentId: s.studentId,
          name: s.name,
          photo: s.photo,
          section: s.section,
          studentType: s.studentType || "Regular",
        },
        markedDays: list.length,
        filledDays: filled,
        latest,
      };
    });

    return res.status(200).json({
      success: true,
      className,
      section: section || "",
      month: month ? Number(month) : null,
      year: year ? Number(year) : null,
      total: rows.length,
      rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// [ADMIN] LIST ALL HIFZ REPORTS (paginated + filters)
// ============================================
const getAllHifzReports = async (req, res) => {
  try {
    const {
      className,
      section,
      studentSearch,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (className) filter.className = className;
    if (section) filter.section = section;

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

    if (studentSearch) {
      const re = { $regex: String(studentSearch).trim(), $options: "i" };
      filter.$or = [{ studentName: re }, { studentId: re }];
    }

    const total = await HifzReport.countDocuments(filter);

    const reports = await HifzReport.find(filter)
      .populate("student", "name photo")
      .populate("teacherId", "name")
      .sort({ date: -1, className: 1, studentName: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      reports,
    });
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
  getHifzProgress,
  getAllHifzReports,
  deleteHifzReport,
};
