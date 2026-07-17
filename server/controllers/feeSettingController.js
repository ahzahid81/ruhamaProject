const ClassFeeSetting = require("../models/ClassFeeSetting");
const StudentFeeOverride = require("../models/StudentFeeOverride");
const FeeCategory = require("../models/FeeCategory");
const Student = require("../models/Student");

// ============================================
// CLASS FEE SETTINGS - CRUD
// ============================================

const getClassFeeSettings = async (req, res) => {
  try {
    const { className, academicSession, isActive } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (academicSession) filter.academicSession = academicSession;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const settings = await ClassFeeSetting.find(filter)
      .populate("feeCategory", "name code category")
      .populate("createdBy", "name")
      .sort({ className: 1, feeCategory: 1 });

    return res.status(200).json({ success: true, count: settings.length, settings });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getClassFeeSetting = async (req, res) => {
  try {
    const setting = await ClassFeeSetting.findById(req.params.id)
      .populate("feeCategory", "name code category")
      .populate("createdBy", "name");
    if (!setting) {
      return res.status(404).json({ success: false, message: "Fee setting not found." });
    }
    return res.status(200).json({ success: true, setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createClassFeeSetting = async (req, res) => {
  try {
    const { className, academicSession, feeCategory, amount, frequency, dueDay, effectiveFrom, effectiveTo, remarks } = req.body;

    if (!className || !feeCategory || amount === undefined) {
      return res.status(400).json({ success: false, message: "className, feeCategory, and amount are required." });
    }

    const cat = await FeeCategory.findById(feeCategory);
    if (!cat) {
      return res.status(404).json({ success: false, message: "Fee category not found." });
    }

    const existing = await ClassFeeSetting.findOne({
      className,
      academicSession: academicSession || "2026",
      feeCategory,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Fee setting already exists for ${className} - ${cat.name}. Use update instead.`,
      });
    }

    const setting = await ClassFeeSetting.create({
      className,
      academicSession: academicSession || "2026",
      feeCategory,
      amount,
      frequency: frequency || cat.frequency,
      dueDay: dueDay || 10,
      effectiveFrom: effectiveFrom || Date.now(),
      effectiveTo: effectiveTo || null,
      createdBy: req.user?._id || null,
      remarks: remarks || "",
    });

    return res.status(201).json({ success: true, message: "Fee setting created.", setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateClassFeeSetting = async (req, res) => {
  try {
    const { amount, frequency, dueDay, isActive, effectiveFrom, effectiveTo, remarks } = req.body;

    const setting = await ClassFeeSetting.findById(req.params.id);
    if (!setting) {
      return res.status(404).json({ success: false, message: "Fee setting not found." });
    }

    if (amount !== undefined) setting.amount = amount;
    if (frequency !== undefined) setting.frequency = frequency;
    if (dueDay !== undefined) setting.dueDay = dueDay;
    if (isActive !== undefined) setting.isActive = isActive;
    if (effectiveFrom !== undefined) setting.effectiveFrom = effectiveFrom;
    if (effectiveTo !== undefined) setting.effectiveTo = effectiveTo;
    if (remarks !== undefined) setting.remarks = remarks;

    await setting.save();

    return res.status(200).json({ success: true, message: "Fee setting updated.", setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteClassFeeSetting = async (req, res) => {
  try {
    const setting = await ClassFeeSetting.findByIdAndDelete(req.params.id);
    if (!setting) {
      return res.status(404).json({ success: false, message: "Fee setting not found." });
    }
    return res.status(200).json({ success: true, message: "Fee setting deleted." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// STUDENT FEE BREAKDOWN
// Priority: StudentOverride > ClassFeeSetting > FeeCategory.defaultAmount
// ============================================

const getStudentFeeBreakdown = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicSession } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const session = academicSession || student.session || "2026";

    // Get all active fee categories
    const categories = await FeeCategory.find({ isActive: true }).sort({ sortOrder: 1 });

    // Get class fee settings for this student's class
    const classSettings = await ClassFeeSetting.find({
      className: student.className,
      academicSession: session,
      isActive: true,
    });

    // Get student-specific overrides
    const overrides = await StudentFeeOverride.find({
      student: student._id,
      academicSession: session,
      isActive: true,
    });

    const overrideMap = {};
    overrides.forEach((o) => {
      overrideMap[o.feeCategory.toString()] = o;
    });

    const classSettingMap = {};
    classSettings.forEach((s) => {
      classSettingMap[s.feeCategory.toString()] = s;
    });

    const breakdown = categories.map((cat) => {
      const catId = cat._id.toString();
      const override = overrideMap[catId];
      const classSetting = classSettingMap[catId];

      let effectiveAmount = cat.defaultAmount || 0;
      let source = "System Default";
      let frequency = cat.frequency;
      let overrideId = null;

      if (override) {
        effectiveAmount = override.amount;
        frequency = override.frequency || cat.frequency;
        source = "Student Override";
        overrideId = override._id;
      } else if (classSetting) {
        effectiveAmount = classSetting.amount;
        frequency = classSetting.frequency || cat.frequency;
        source = "Class Fee Setting";
      }

      return {
        feeCategory: cat,
        effectiveAmount,
        frequency,
        source,
        classSettingId: classSetting?._id || null,
        overrideId,
      };
    });

    return res.status(200).json({
      success: true,
      student: { _id: student._id, name: student.name, className: student.className, studentId: student.studentId },
      academicSession: session,
      breakdown,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// STUDENT FEE OVERRIDE - CRUD
// ============================================

const getStudentOverrides = async (req, res) => {
  try {
    const { studentId, academicSession } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    if (academicSession) filter.academicSession = academicSession;

    const overrides = await StudentFeeOverride.find(filter)
      .populate("feeCategory", "name code category")
      .populate("createdBy", "name")
      .populate("modifiedBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: overrides.length, overrides });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createStudentFeeOverride = async (req, res) => {
  try {
    const { student: studentId, academicSession, feeCategory, amount, frequency, reason } = req.body;

    if (!studentId || !feeCategory || amount === undefined) {
      return res.status(400).json({ success: false, message: "student, feeCategory, and amount are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const existing = await StudentFeeOverride.findOne({
      student: studentId,
      academicSession: academicSession || student.session || "2026",
      feeCategory,
    });

    if (existing) {
      existing.amount = amount;
      existing.frequency = frequency || existing.frequency;
      existing.reason = reason || existing.reason;
      existing.modifiedBy = req.user?._id || null;
      await existing.save();
      return res.status(200).json({ success: true, message: "Fee override updated.", override: existing });
    }

    const override = await StudentFeeOverride.create({
      student: studentId,
      studentId: student.studentId,
      academicSession: academicSession || student.session || "2026",
      feeCategory,
      amount,
      frequency: frequency || "Monthly",
      reason: reason || "",
      createdBy: req.user?._id || null,
      modifiedBy: req.user?._id || null,
    });

    return res.status(201).json({ success: true, message: "Fee override created.", override });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteStudentFeeOverride = async (req, res) => {
  try {
    const override = await StudentFeeOverride.findByIdAndDelete(req.params.id);
    if (!override) {
      return res.status(404).json({ success: false, message: "Override not found." });
    }
    return res.status(200).json({ success: true, message: "Fee override removed." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClassFeeSettings,
  getClassFeeSetting,
  createClassFeeSetting,
  updateClassFeeSetting,
  deleteClassFeeSetting,
  getStudentFeeBreakdown,
  getStudentOverrides,
  createStudentFeeOverride,
  deleteStudentFeeOverride,
};
