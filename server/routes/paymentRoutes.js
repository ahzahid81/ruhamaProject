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
    previewDeleteAllPayments,
    deleteAllPayments,
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

// Delete ALL payments — destroys every receipt in the system. Admin only, and
// deliberately not part of the `finance` group: an account-manager handles
// day-to-day money, this is a total reset.
//
// Split preview/execute so the UI can show real counts before committing, and
// so the delete cannot be triggered blind. `deleteAllPayments` additionally
// requires the `confirm` token from the preview.
router.get(
    "/delete-all/preview",
    protect,
    authorizeRoles("admin"),
    previewDeleteAllPayments
);

router.post(
    "/delete-all",
    protect,
    authorizeRoles("admin"),
    deleteAllPayments
);

module.exports = router;
