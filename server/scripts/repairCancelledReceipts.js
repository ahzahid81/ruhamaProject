/* eslint-disable no-console */
/**
 * Repair receipts that were cancelled while `cancelPayment` was broken.
 *
 * The bug: `cancelPayment` wrote its reversal ledger entries with
 * `createdBy: req.user?._id || null`. That route had no auth middleware, so
 * `req.user` was always undefined and `StudentLedger.createdBy` is required.
 * The first reversal entry therefore failed validation — but only AFTER the
 * payment had already been saved with `isVoided: true`. Result: a voided
 * receipt with no ledger reversal, which the old `isVoided` guard then made
 * impossible to cancel again.
 *
 * This script finds those receipts and writes the missing reversal entries.
 *
 *   node scripts/repairCancelledReceipts.js           # report only (safe)
 *   node scripts/repairCancelledReceipts.js --apply   # write the reversals
 *
 * Flags:
 *   --apply    actually write. Without it nothing is modified.
 *   --resync   after repairing, recompute the running `balance` of every
 *              ledger entry for the affected students in createdAt order.
 *              Needed because a repair shifts balances, and entries written
 *              after the broken cancel kept the old numbers.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const StudentLedger = require("../models/StudentLedger");
const Teacher = require("../models/Teacher");
const { createLedgerEntry } = require("../controllers/studentLedgerController");

const APPLY = process.argv.includes("--apply");
const RESYNC = process.argv.includes("--resync");

const connect = async () => {
  let uri = process.env.MONGO_URI || "";
  if (!uri) {
    throw new Error("MONGO_URI is not set. Load server/.env first.");
  }
  if (!/retryWrites=/.test(uri)) {
    uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  }
  await mongoose.connect(uri);
};

// The descriptions the fixed cancelPayment writes. A receipt that has neither
// of these is one that never got its reversal.
const refundDescription = (receiptNo) => `Payment reversed - ${receiptNo}`;
const feeDescription = (receiptNo) => `Fee reversed - ${receiptNo}`;

const findBrokenReceipts = async () => {
  const voided = await Payment.find({ isVoided: true })
    .select("_id receiptNo student studentId academicSession paidAmount voidReason createdAt")
    .lean();

  const broken = [];
  for (const payment of voided) {
    const entries = await StudentLedger.find({ payment: payment._id })
      .select("transactionType debit credit description")
      .lean();

    const hasRefund = entries.some((e) => e.description === refundDescription(payment.receiptNo));
    const hasFeeReversal = entries.some((e) => e.description === feeDescription(payment.receiptNo));

    const needsRefund = entries.some(
      (e) => e.transactionType === "Payment" && e.credit > 0 && !hasRefund
    );
    const needsFeeReversal = entries.some(
      (e) => e.transactionType === "Charge" && e.debit > 0 && !hasFeeReversal
    );

    if (needsRefund || needsFeeReversal) {
      broken.push({
        payment,
        entries: entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        needsRefund,
        needsFeeReversal,
        partial: hasRefund || hasFeeReversal,
      });
    }
  }
  return broken;
};

const resolveActor = async (payment) => {
  if (payment.receivedBy) return payment.receivedBy;
  const admin = await Teacher.findOne({ role: "admin" }).select("_id").lean();
  return admin?._id || null;
};

const repairOne = async (item) => {
  const { payment, entries } = item;
  const session = await mongoose.startSession();
  try {
    const actor = await resolveActor(payment);
    if (!actor) {
      throw new Error("no teacher available to record the reversal");
    }

    await session.withTransaction(async () => {
      await PaymentItem.updateMany(
        { payment: payment._id },
        { paymentStatus: "Cancelled" },
        { session }
      );

      // Mirror the controller: newest original entry first.
      for (const entry of entries) {
        if (entry.transactionType === "Payment" && entry.credit > 0) {
          await createLedgerEntry({
            student: payment.student,
            studentId: payment.studentId,
            academicSession: payment.academicSession,
            payment: payment._id,
            transactionType: "Refund",
            description: refundDescription(payment.receiptNo),
            debit: entry.credit,
            credit: 0,
            createdBy: actor,
            remarks: payment.voidReason || "Receipt cancelled",
            session,
          });
        } else if (entry.transactionType === "Charge" && entry.debit > 0) {
          await createLedgerEntry({
            student: payment.student,
            studentId: payment.studentId,
            academicSession: payment.academicSession,
            payment: payment._id,
            transactionType: "Adjustment",
            description: feeDescription(payment.receiptNo),
            debit: 0,
            credit: entry.debit,
            createdBy: actor,
            remarks: payment.voidReason || "Receipt cancelled",
            session,
          });
        }
      }
    });

    return true;
  } catch (error) {
    console.error(`  FAILED ${payment.receiptNo}: ${error.message}`);
    return false;
  } finally {
    await session.endSession();
  }
};

/**
 * Recompute the running balance for one student. balance_n = balance_(n-1) +
 * debit_n - credit_n, in createdAt order. Writes only when a value differs.
 */
const resyncStudent = async (studentId) => {
  const entries = await StudentLedger.find({ student: studentId })
    .sort({ createdAt: 1, _id: 1 })
    .select("_id debit credit balance")
    .lean();

  let running = 0;
  const bulk = [];
  for (const entry of entries) {
    const next = running + (entry.debit || 0) - (entry.credit || 0);
    if (next !== entry.balance) {
      bulk.push({ updateOne: { filter: { _id: entry._id }, update: { $set: { balance: next } } } });
    }
    running = next;
  }

  if (bulk.length) {
    await StudentLedger.bulkWrite(bulk, { ordered: false });
  }
  return bulk.length;
};

const main = async () => {
  await connect();
  console.log(`Connected. mode: ${APPLY ? "APPLY (writes)" : "REPORT ONLY (no writes)"}`);

  const broken = await findBrokenReceipts();

  if (broken.length === 0) {
    console.log("No broken receipts found. Nothing to repair.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\n${broken.length} cancelled receipt(s) with a missing ledger reversal:\n`);
  for (const item of broken) {
    const flags = [
      item.needsRefund ? "missing payment refund" : null,
      item.needsFeeReversal ? "missing fee reversal" : null,
    ]
      .filter(Boolean)
      .join(", ");
    console.log(
      `  ${item.payment.receiptNo}  student=${item.payment.studentId}  ` +
        `amount=${item.payment.paidAmount}  voided=${new Date(item.payment.updatedAt || item.payment.createdAt).toISOString().slice(0, 10)}`
    );
    console.log(`    ${flags}${item.partial ? "  (partial — some reversals already exist)" : ""}`);
  }

  if (!APPLY) {
    console.log("\nRe-run with --apply to write the missing reversal entries.");
    await mongoose.disconnect();
    return;
  }

  console.log("\nRepairing...");
  const touchedStudents = new Set();
  let repaired = 0;
  for (const item of broken) {
    const ok = await repairOne(item);
    if (ok) {
      repaired += 1;
      touchedStudents.add(item.payment.student.toString());
      console.log(`  fixed ${item.payment.receiptNo}`);
    }
  }
  console.log(`\nRepaired ${repaired}/${broken.length} receipt(s).`);

  if (RESYNC && touchedStudents.size) {
    console.log(`\nResyncing running balances for ${touchedStudents.size} student(s)...`);
    for (const studentId of touchedStudents) {
      const changed = await resyncStudent(studentId);
      console.log(`  ${studentId}: ${changed} entr${changed === 1 ? "y" : "ies"} rebalanced`);
    }
  } else if (touchedStudents.size) {
    console.log(
      `\nNote: ${touchedStudents.size} student ledger(s) may have stale running balances. ` +
        "Re-run with --resync to recompute them."
    );
  }

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
