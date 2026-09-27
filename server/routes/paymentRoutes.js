const express = require("express");

const router = express.Router();

const {
    protect,
    authorizeRoles,
    protectStaffOrStudent,
} = require("../middlewares/authMiddleware");

const {
    collectPayment,
    getStudentPaymentHistory,
    getAllPayments,
    getPaymentReceipt,
    updatePayment,
    checkAdmitCardEligibility,
    getEligibleStudentsForAdmitCards,
    cancelPayment,
    getFeeCategories,
    createFeeCategory,
    updateFeeCategory,
    deleteFeeCategory,
    getStudentDueItems,
} = require("../controllers/paymentController");

// Any signed-in staff member. Used for the read-only endpoints that teacher
// screens rely on (admit cards, due items, category list).
const staff = [protect];

// Anything that moves money or changes the fee configuration.
const finance = [protect, authorizeRoles("admin", "account-manager")];

// Collect Payment
router.post(
    "/collect",
    protect,
    collectPayment
);

// Student Payment History
router.get(
    "/history/:studentId",
    ...staff,
    getStudentPaymentHistory
);

// All Payments (admin list)
router.get(
    "/",
    ...finance,
    getAllPayments
);

// Update Payment (metadata)
router.put(
    "/:paymentId",
    ...finance,
    updatePayment
);

// Single Receipt
// Reachable from the student portal too, so this accepts a student token and
// the controller restricts a student to their own receipts.
router.get(
    "/receipt/:paymentId",
    protectStaffOrStudent,
    getPaymentReceipt
);

// Student Due Items (auto-calculated)
router.get(
    "/due-items/:studentId",
    ...staff,
    getStudentDueItems
);

// Eligible students for print-all admit cards (MUST be before /admit-card/:studentId)
router.get(
    "/admit-card/print-all",
    ...staff,
    getEligibleStudentsForAdmitCards
);

// Admit Card Eligibility
router.get(
    "/admit-card/:studentId",
    ...staff,
    checkAdmitCardEligibility
);

// Fee Categories
router.get(
    "/fee-categories",
    ...staff,
    getFeeCategories
);

router.post(
    "/fee-categories",
    ...finance,
    createFeeCategory
);

router.put(
    "/fee-categories/:id",
    ...finance,
    updateFeeCategory
);

router.delete(
    "/fee-categories/:id",
    ...finance,
    deleteFeeCategory
);

// Cancel Receipt — destructive and irreversible, so admin only.
router.patch(
    "/cancel/:paymentId",
    protect,
    authorizeRoles("admin"),
    cancelPayment
);

module.exports = router;
