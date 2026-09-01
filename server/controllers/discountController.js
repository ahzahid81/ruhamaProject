const Student = require("../models/Student");
const FeeCategory = require("../models/FeeCategory");
const StudentFeeDiscount = require("../models/StudentFeeDiscount");

// ============================================
// GET DISCOUNTS FOR A STUDENT
// ============================================

const getStudentDiscounts = async (req, res) => {
  try {
    const { studentId } = req.params;

    const discounts = await StudentFeeDiscount.find({ student: studentId })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, discounts });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// SAVE / UPSERT A DISCOUNT FOR A FEE ITEM
// ============================================

const saveDiscount = async (req, res) => {
  try {
    const {
      student: studentId,
      academicSession,
      feeCategory,
      feeName,
      applicableType,
      month,
      year,
      examName,
      period,
      discountAmount,
      reason,
      createdBy,
    } = req.body;

    if (!studentId || !feeCategory || !applicableType) {
      return res.status(400).json({
        success: false,
        message: "Student, fee and fee type are required.",
      });
    }

    const amount = Number(discountAmount || 0);
    if (!(amount > 0)) {
      return res.status(400).json({
        success: false,
        message: "Discount amount must be greater than 0.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const feeCategoryDoc = feeCategory ? await FeeCategory.findById(feeCategory) : null;
    const session = academicSession || student.session || String(new Date().getFullYear());

    const filter = {
      student: studentId,
      academicSession: session,
      applicableType,
      feeCategory,
      month: month || null,
      year: year || null,
      examName: examName || "",
    };

    const update = {
      ...filter,
      studentId: student.studentId,
      feeName: feeName || feeCategoryDoc?.name || "Fee",
      period: period || "",
      discountAmount: amount,
      reason: reason || "",
      createdBy: createdBy || null,
      modifiedBy: createdBy || null,
    };

    const doc = await StudentFeeDiscount.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return res.status(200).json({ success: true, discount: doc });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE A DISCOUNT
// ============================================

const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;

    await StudentFeeDiscount.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Discount removed." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudentDiscounts,
  saveDiscount,
  deleteDiscount,
};