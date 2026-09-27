/* eslint-disable no-console */
/**
 * Fixture for verifying deletePaymentsUpTo.js. Creates N sequential receipts
 * with items, allocations and running-balance ledger rows, so a mid-range
 * delete can be checked for correct resync behaviour.
 *
 *   node scripts/seedRangeFixture.js 12
 *   node scripts/deletePaymentsUpTo.js --to RUS-2026-000005
 *
 * Re-running clears its own tagged rows first.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const PaymentAllocation = require("../models/PaymentAllocation");
const StudentLedger = require("../models/StudentLedger");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

const COUNT = parseInt(process.argv[2], 10) || 10;
const TAG = "rangefixture";

const connect = async () => {
  let uri = process.env.MONGO_URI || "";
  if (!/retryWrites=/.test(uri)) {
    uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  }
  await mongoose.connect(uri);
};

const main = async () => {
  await connect();
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  // Clear previous fixture rows, then any orphaned items/allocations.
  const oldPayments = await Payment.find({ remarks: TAG }).select("_id").lean();
  const oldIds = oldPayments.map((p) => p._id);
  const oldItems = await PaymentItem.find({ payment: { $in: oldIds } }).select("_id").lean();
  await PaymentAllocation.deleteMany({ paymentItem: { $in: oldItems.map((i) => i._id) } });
  await PaymentItem.deleteMany({ payment: { $in: oldIds } });
  await StudentLedger.deleteMany({ remarks: TAG });
  await Payment.deleteMany({ _id: { $in: oldIds } });

  let teacher = await Teacher.findOne();
  if (!teacher) {
    teacher = await Teacher.create({
      name: "Fixture Admin",
      email: "fixture-admin@test.local",
      password: "not-a-real-password",
      role: "admin",
    });
  }

  let student = await Student.findOne();
  if (!student) {
    student = await Student.create({
      studentId: "FIXTURE-001",
      password: "not-a-real-password",
      name: "Fixture Student",
      className: "Class 1",
      section: "A",
      session: "2026",
      gender: "Male",
      fatherName: "Fixture Father",
      fatherMobile: "01700000000",
    });
  }

  // One student, one charge + one payment per receipt, so the running balance
  // climbs predictably and a mid-range cut leaves an obviously wrong total.
  let running = 0;
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  for (let n = 1; n <= COUNT; n++) {
    const receiptNo = `RUS-2026-${String(n).padStart(6, "0")}`;
    const charge = 1000;
    const paid = 800;

    const payment = await Payment.create({
      student: student._id,
      studentId: student.studentId,
      studentName: student.name,
      className: student.className,
      receiptNo,
      academicSession: "2026",
      totalAmount: charge,
      paidAmount: paid,
      dueAmount: charge - paid,
      advanceReceived: 0,
      paymentMethod: "Cash",
      receivedBy: teacher._id,
      remarks: TAG,
    });

    const monthIndex = (n - 1) % 12;
    const item = await PaymentItem.create({
      payment: payment._id,
      student: student._id,
      feeName: "Tuition Fee",
      applicableType: "Month",
      month: monthIndex + 1,
      year: 2026,
      payableAmount: charge,
      paidAmount: paid,
      dueAmount: charge - paid,
      paymentStatus: "Partial",
    });

    await PaymentAllocation.create({
      paymentItem: item._id,
      amount: paid,
      paymentMethod: "Cash",
      receivedBy: teacher._id,
    });

    const afterCharge = running + charge;
    await StudentLedger.create([
      {
        student: student._id,
        studentId: student.studentId,
        academicSession: "2026",
        payment: payment._id,
        paymentItem: item._id,
        transactionType: "Charge",
        description: `Fee charged: Tuition Fee - ${MONTHS[monthIndex]} 2026`,
        debit: charge,
        credit: 0,
        balance: afterCharge,
        createdBy: teacher._id,
        remarks: TAG,
      },
      {
        student: student._id,
        studentId: student.studentId,
        academicSession: "2026",
        payment: payment._id,
        transactionType: "Payment",
        description: `Payment received - ${receiptNo}`,
        debit: 0,
        credit: paid,
        balance: afterCharge - paid,
        createdBy: teacher._id,
        remarks: TAG,
      },
    ]);

    running = afterCharge - paid;
  }

  const last = await StudentLedger.find({ student: student._id }).sort({ createdAt: -1 }).limit(1);
  console.log(`Seeded ${COUNT} receipts (RUS-2026-000001..${String(COUNT).padStart(6, "0")}).`);
  console.log(`Expected final balance: ${running} (each receipt nets +200)`);
  console.log(`Stored final balance:   ${last[0]?.balance}`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
