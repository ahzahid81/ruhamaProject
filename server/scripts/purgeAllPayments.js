/* eslint-disable no-console */
/**
 * Purge every payment record so collection can start from a clean slate.
 *
 * A "payment" is spread across four collections, not one. Deleting only
 * `Payment` orphans the rest and leaves students looking like they still owe
 * money, because the money-received side of the ledger lives in
 * `StudentLedger`:
 *
 *   Payment            receipt header (receiptNo, paidAmount, receivedBy)
 *   PaymentItem        one row per fee line; drives the "already paid"
 *                      duplicate check and admit-card eligibility
 *   PaymentAllocation  split-payment records hanging off PaymentItem
 *   StudentLedger      charge / payment / discount / fine / refund entries,
 *                      each carrying a running `balance`
 *
 * This deletes all four. Every student balance resets to 0.
 *
 *   node scripts/purgeAllPayments.js                 # report only (safe)
 *   node scripts/purgeAllPayments.js --backup        # report + dump JSON
 *   node scripts/purgeAllPayments.js --apply         # actually delete
 *   node scripts/purgeAllPayments.js --apply --backup
 *
 * Flags:
 *   --apply     actually delete. Without it nothing is modified.
 *   --backup    write the documents to scripts/backups/<timestamp>/ first.
 *   --force-remote  required to run against a non-localhost host. This guard
 *               exists because the production database is MongoDB Atlas and
 *               a mistyped MONGO_URI should not silently wipe real receipts.
 *
 * Note on receipt numbers: generateReceiptNo() derives the next number from
 * the most recent Payment document, so after a purge numbering restarts at
 * RUS-<year>-000001. That is usually what you want after a reset, but it does
 * mean receipt numbers get reused.
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const PaymentAllocation = require("../models/PaymentAllocation");
const StudentLedger = require("../models/StudentLedger");

const APPLY = process.argv.includes("--apply");
const BACKUP = process.argv.includes("--backup");
const FORCE_REMOTE = process.argv.includes("--force-remote");

const TARGETS = [
  { name: "Payment", model: Payment },
  { name: "PaymentItem", model: PaymentItem },
  { name: "PaymentAllocation", model: PaymentAllocation },
  { name: "StudentLedger", model: StudentLedger },
];

const connect = async () => {
  const uri = process.env.MONGO_URI || "";
  if (!uri) {
    throw new Error("MONGO_URI is not set. Load server/.env first.");
  }
  if (!/retryWrites=/.test(uri)) {
    uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  }

  const host = uri.replace(/^mongodb(\+srv)?:\/\//, "").split("/")[0].split("@").pop();
  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|$)/.test(host);

  if (!isLocal && !FORCE_REMOTE) {
    throw new Error(
      `Refusing to touch a non-local database (host: ${host}).\n` +
        "  This script deletes every receipt. If this really is the database\n" +
        "  you mean, re-run with --force-remote."
    );
  }

  await mongoose.connect(uri);
  return host;
};

const writeBackup = async (host) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(__dirname, "backups", stamp);
  fs.mkdirSync(dir, { recursive: true });

  const meta = { host, database: mongoose.connection.name, createdAt: new Date().toISOString() };

  for (const target of TARGETS) {
    const docs = await target.model.find({}).lean();
    const file = path.join(dir, `${target.name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2), "utf8");
    meta[target.name] = docs.length;
  }

  fs.writeFileSync(path.join(dir, "_meta.json"), JSON.stringify(meta, null, 2), "utf8");
  return dir;
};

const summarise = async () => {
  const lines = [];
  for (const target of TARGETS) {
    const count = await target.model.countDocuments({});
    lines.push({ name: target.name, count });
  }
  return lines;
};

const main = async () => {
  const host = await connect();
  console.log(`Connected to ${host}/${mongoose.connection.name}`);
  console.log(`mode: ${APPLY ? "APPLY (deletes)" : "REPORT ONLY (no writes)"}`);

  const counts = await summarise();
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  console.log("\nDocuments that will be deleted:\n");
  for (const { name, count } of counts) {
    console.log(`  ${name.padEnd(20)} ${count}`);
  }
  console.log(`  ${"TOTAL".padEnd(20)} ${total}`);

  // What the user is about to lose, in the units that matter.
  const totals = await Payment.aggregate([
    {
      $group: {
        _id: null,
        receipts: { $sum: 1 },
        collected: { $sum: "$paidAmount" },
        outstanding: { $sum: "$dueAmount" },
        advanceHeld: { $sum: "$advanceReceived" },
      },
    },
  ]);
  const students = await Payment.distinct("student");

  if (totals.length) {
    const t = totals[0];
    console.log("\nMoney involved:\n");
    console.log(`  receipts            ${t.receipts}`);
    console.log(`  students affected   ${students.length}`);
    console.log(`  total collected     ${t.collected}`);
    console.log(`  still outstanding   ${t.outstanding}`);
    console.log(`  advance held        ${t.advanceHeld}`);
  }

  if (total === 0) {
    console.log("\nNothing to delete. Database is already clean.");
    await mongoose.disconnect();
    return;
  }

  if (BACKUP) {
    const dir = await writeBackup(host);
    console.log(`\nBackup written to ${dir}`);
  }

  if (!APPLY) {
    console.log("\nRe-run with --apply to delete. Add --backup first if you want a copy.");
    await mongoose.disconnect();
    return;
  }

  console.log("\nDeleting...");
  for (const target of TARGETS) {
    const res = await target.model.deleteMany({});
    console.log(`  ${target.name.padEnd(20)} removed ${res.deletedCount}`);
  }

  const after = await summarise();
  const remaining = after.reduce((sum, c) => sum + c.count, 0);
  console.log(`\nDone. ${remaining} document(s) left across the four collections.`);
  console.log("Every student ledger balance is now 0. Receipt numbering restarts at 000001.");

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error.message || error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
