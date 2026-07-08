const express = require("express");

const router = express.Router();

// const {

//     protect,

//     authorizeRoles,

// } = require("../middleware/authMiddleware");

const {
    collectPayment,
    getStudentPaymentHistory,
    getPaymentReceipt,
    checkAdmitCardEligibility,
    cancelPayment,
} = require("../controllers/paymentController");

// Collect Payment

router.post(

    "/collect",

    // protect,

    // authorizeRoles(

    //     "admin",

    //     "account-manager"

    // ),

    collectPayment

);

// Student Payment History
router.get(

    "/history/:studentId",

    // protect,

    // authorizeRoles(

    //     "admin",

    //     "account-manager"

    // ),

    getStudentPaymentHistory

);

// Single Receipt
router.get(

    "/receipt/:paymentId",

    // protect,

    // authorizeRoles(

    //     "admin",

    //     "account-manager"

    // ),

    getPaymentReceipt

);
// Admit Card Eligibility
router.get(

    "/admit-card/:studentId",

    // protect,

    // authorizeRoles(

    //     "admin",

    //     "account-manager",

    //     "teacher"

    // ),

    checkAdmitCardEligibility

);

// Cancel Receipt
router.patch(

    "/cancel/:paymentId",

    // protect,

    // authorizeRoles(

    //     "admin"

    // ),

    cancelPayment

);

module.exports = router;