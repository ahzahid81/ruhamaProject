const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const { sortStudents } = require("../utils/sort");

// ============================================
// MARK ATTENDANCE (Bulk)
// Teacher selects only ABSENT students.
// All others default to PRESENT.
// ============================================

const markAttendance = async (req, res) => {
  try {
    const { className, section, date, absentStudentIds, academicSession, remarks } = req.body;

    if (!className || !date) {
      return res.status(400).json({ success: false, message: "className and date are required." });
    }

    if (!absentStudentIds || !Array.isArray(absentStudentIds)) {
      return res.status(400).json({ success: false, message: "absentStudentIds must be an array." });
    }

    const session = academicSession || "2026";
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const filter = { className, status: { $ne: "Inactive" } };
    if (section) filter.section = section;

    const students = await sortStudents(
      await Student.find(filter).select("_id studentId name").lean()
    );

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: "No students found for this class/section." });
    }

    const absentSet = new Set(absentStudentIds);
    const markedBy = req.user?._id || null;

    const bulkOps = students.map((student) => {
      const isAbsent = absentSet.has(student._id.toString());
      return {
        updateOne: {
          filter: { student: student._id, date: attendanceDate },
          update: {
            $set: {
              student: student._id,
              studentId: student.studentId,
              className,
              section: section || "",
              date: attendanceDate,
              status: isAbsent ? "Absent" : "Present",
              academicSession: session,
              markedBy,
              remarks: isAbsent ? (remarks || "") : "",
            },
          },
          upsert: true,
        },
      };
    });

    await Attendance.bulkWrite(bulkOps);

    const presentCount = students.length - absentStudentIds.length;
    const absentCount = absentStudentIds.length;

    return res.status(200).json({
      success: true,
      message: `Attendance saved. ${presentCount} present, ${absentCount} absent out of ${students.length} students.`,
      total: students.length,
      present: presentCount,
      absent: absentCount,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET ATTENDANCE BY CLASS + DATE
// ============================================

const getAttendanceByClass = async (req, res) => {
  try {
    const { className, section, date } = req.query;

    if (!className || !date) {
      return res.status(400).json({ success: false, message: "className and date are required." });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const filter = { className, date: attendanceDate };
    if (section) filter.section = section;

    const records = await Attendance.find(filter)
      .populate("student", "name studentId photo");

    const students = await sortStudents(
      await Student.find({
        className,
        ...(section ? { section } : {}),
        status: { $ne: "Inactive" },
      }).select("_id studentId name photo").lean()
    );

    const attendanceMap = {};
    records.forEach((r) => {
      attendanceMap[r.student?._id?.toString() || r.studentId] = r.status;
    });

    const result = students.map((s) => ({
      student: s,
      status: attendanceMap[s._id.toString()] || "Not Marked",
    }));

    const presentCount = result.filter((r) => r.status === "Present").length;
    const absentCount = result.filter((r) => r.status === "Absent").length;
    const lateCount = result.filter((r) => r.status === "Late").length;
    const leaveCount = result.filter((r) => r.status === "Leave").length;

    return res.status(200).json({
      success: true,
      date: attendanceDate,
      className,
      section: section || "",
      total: result.length,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      leave: leaveCount,
      students: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET ATTENDANCE BY STUDENT
// ============================================

const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicSession, month, year } = req.query;

    const filter = { student: studentId };
    if (academicSession) filter.academicSession = academicSession;
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === "Present").length;
    const absentDays = records.filter((r) => r.status === "Absent").length;
    const lateDays = records.filter((r) => r.status === "Late").length;
    const leaveDays = records.filter((r) => r.status === "Leave").length;
    const percentage = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      summary: { totalDays, presentDays, absentDays, lateDays, leaveDays, percentage: Number(percentage) },
      records,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET MONTHLY ATTENDANCE REPORT
// ============================================

const getMonthlyReport = async (req, res) => {
  try {
    const { className, section, month, year, academicSession } = req.query;

    if (!className || !month || !year) {
      return res.status(400).json({ success: false, message: "className, month, and year are required." });
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const filter = {
      className,
      date: { $gte: startDate, $lte: endDate },
    };
    if (section) filter.section = section;
    if (academicSession) filter.academicSession = academicSession;

    const records = await Attendance.find(filter);

    const students = await sortStudents(
      await Student.find({
        className,
        ...(section ? { section } : {}),
        status: { $ne: "Inactive" },
      }).select("_id studentId name").lean()
    );

    const statsMap = {};
    students.forEach((s) => {
      statsMap[s._id.toString()] = {
        student: s,
        totalDays: 0,
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        percentage: 0,
      };
    });

    records.forEach((r) => {
      const sid = r.student?.toString();
      if (statsMap[sid]) {
        statsMap[sid].totalDays++;
        if (r.status === "Present") statsMap[sid].present++;
        else if (r.status === "Absent") statsMap[sid].absent++;
        else if (r.status === "Late") statsMap[sid].late++;
        else if (r.status === "Leave") statsMap[sid].leave++;
      }
    });

    Object.values(statsMap).forEach((s) => {
      if (s.totalDays > 0) {
        s.percentage = Number(((s.present + s.late) / s.totalDays * 100).toFixed(1));
      }
    });

    return res.status(200).json({
      success: true,
      className,
      section: section || "",
      month: Number(month),
      year: Number(year),
      totalWorkingDays:
        records.length > 0
          ? new Set(
              records.map((r) => {
                const d = r.date;
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              })
            ).size
          : 0,
      students: Object.values(statsMap),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET ATTENDANCE STATS (for a student across session)
// ============================================

const getAttendanceStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicSession } = req.query;

    const filter = { student: studentId };
    if (academicSession) filter.academicSession = academicSession;

    const records = await Attendance.find(filter).sort({ date: 1 });

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === "Present").length;
    const absentDays = records.filter((r) => r.status === "Absent").length;
    const lateDays = records.filter((r) => r.status === "Late").length;
    const leaveDays = records.filter((r) => r.status === "Leave").length;
    const percentage = totalDays > 0 ? Number(((presentDays + lateDays) / totalDays * 100).toFixed(1)) : 0;

    const monthlyBreakdown = {};
    records.forEach((r) => {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyBreakdown[key]) {
        monthlyBreakdown[key] = { totalDays: 0, present: 0, absent: 0, late: 0, leave: 0 };
      }
      monthlyBreakdown[key].totalDays++;
      if (r.status === "Present") monthlyBreakdown[key].present++;
      else if (r.status === "Absent") monthlyBreakdown[key].absent++;
      else if (r.status === "Late") monthlyBreakdown[key].late++;
      else if (r.status === "Leave") monthlyBreakdown[key].leave++;
    });

    return res.status(200).json({
      success: true,
      summary: { totalDays, presentDays, absentDays, lateDays, leaveDays, percentage },
      monthlyBreakdown,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByClass,
  getAttendanceByStudent,
  getMonthlyReport,
  getAttendanceStats,
};
