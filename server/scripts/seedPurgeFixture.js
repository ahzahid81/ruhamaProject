/* eslint-disable no-console */
/**
 * Throwaway fixture for verifying purgeAllPayments.js. Inserts a couple of
 * payments with items, allocations and ledger entries, then exits. Safe to
 * re-run; it clears its own tagged rows first.
 *
 *   node scripts/seedPurgeFixture.js
 *   node scripts/purgeAllPayments.js --apply --backup
 */

require("dotenv").config();

const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const PaymentAllocation = require("../models/PaymentAllocation");
const StudentLedger = require("../models/StudentLedger");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

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

  await Promise.all([
    Payment.deleteMany({ remarks: "fixture" }),
    StudentLedger.deleteMany({ remarks: "fixture" }),
  ]);

  // StudentLedger.createdBy is required, and PaymentItem/Payment both point at
  // a Student, so the fixture needs both. Reuse existing ones when present,
  // otherwise create throwaway records so this runs on an empty database.
  let teacher = await Teacher.findOne();
  if (!teacher) {
    teacher = await Teacher.create({
      name: "Fixture Admin",
      email: "fixture-admin@test.local",
      password: "not-a-real-password",
      role: "admin",
    });
    console.log("Created throwaway Teacher (no teacher existed).");
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
    console.log("Created throwaway Student (no student existed).");
  }

  const payment = await Payment.create({
    student: student._id,
    studentId: student.studentId,
    studentName: student.name,
    className: student.className,
    receiptNo: "FIXTURE-000001",
    academicSession: "2026",
    totalAmount: 5000,
    paidAmount: 3000,
    dueAmount: 2000,
    advanceReceived: 500,
    paymentMethod: "Cash",
    receivedBy: teacher._id,
    remarks: "fixture",
  });

  const item = await PaymentItem.create({
    payment: payment._id,
    student: student._id,
    feeName: "Tuition Fee",
    applicableType: "Month",
    month: 1,
    year: 2026,
    payableAmount: 5000,
    paidAmount: 3000,
    dueAmount: 2000,
    paymentStatus: "Partial",
  });

  await PaymentAllocation.create({
    paymentItem: item._id,
    amount: 3000,
    paymentMethod: "Cash",
    receivedBy: teacher._id,
  });

  await StudentLedger.create([
    {
      student: student._id,
      studentId: student.studentId,
      academicSession: "2026",
      payment: payment._id,
      paymentItem: item._id,
      transactionType: "Charge",
      description: "Fee charged: Tuition Fee - January 2026",
      debit: 5000,
      credit: 0,
      balance: 5000,
      createdBy: teacher._id,
      remarks: "fixture",
    },
    {
      student: student._id,
      studentId: student.studentId,
      academicSession: "2026",
      payment: payment._id,
      transactionType: "Payment",
      description: "Payment received - FIXTURE-000001",
      debit: 0,
      credit: 3000,
      balance: 2000,
      createdBy: teacher._id,
      remarks: "fixture",
    },
  ]);

  console.log("Seeded 1 payment, 1 item, 1 allocation, 2 ledger entries.");
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
