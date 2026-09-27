/* eslint-disable no-console */
/**
 * Delete payments from the very first receipt up to a given receipt number.
 *
 * This is NOT the same as purgeAllPayments.js. That one wipes everything, so
 * every balance legitimately lands on 0. This one keeps the receipts *after*
 * the cut-off, which exposes a trap:
 *
 * `StudentLedger.balance` is a running total, not an independent figure —
 * createLedgerEntry() sets balance_n = balance_(n-1) + debit_n - credit_n.
 * Delete the early entries and every surviving entry still carries the old
 * number, so each remaining student's ledger shows an inflated balance that
 * silently disagrees with the sum of its own rows. This script therefore
 * resyncs balances for every student it touched.
 *
 *   node scripts/deletePaymentsUpTo.js                          # usage
 *   node scripts/deletePaymentsUpTo.js --to RUS-2026-000148      # report only
 *   node scripts/deletePaymentsUpTo.js --to RUS-2026-000148 --backup
 *   node scripts/deletePaymentsUpTo.js --to RUS-2026-000148 --apply --backup
 *
 * Flags:
 *   --to <receiptNo>   cut-off receipt. INCLUSIVE by default.
 *   --exclusive        stop just *before* the given receipt instead.
 *   --apply            actually delete. Without it nothing is modified.
 *   --backup           dump the affected documents to scripts/backups/<ts>/.
 *   --no-resync        skip the balance resync. Only safe if you are about to
 *                      delete every payment too. Not recommended.
 *   --force-remote     required for a non-localhost host. Guards against a
 *                      mistyped MONGO_URI silently wiping real receipts.
 *
 * Only payment-linked ledger rows are removed. Standalone charges, opening
 * balances and manual adjustments (rows with `payment: null`) are left alone —
 * they are not receipts, so they are outside "delete the payments".
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const PaymentAllocation = require("../models/PaymentAllocation");
const StudentLedger = require("../models/StudentLedger");

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
};

const TO = argOf("--to");
const EXCLUSIVE = process.argv.includes("--exclusive");
const APPLY = process.argv.includes("--apply");
const BACKUP = process.argv.includes("--backup");
const NO_RESYNC = process.argv.includes("--no-resync");
const FORCE_REMOTE = process.argv.includes("--force-remote");

const usage = () => {
  console.log(`
Delete payments from the first receipt up to a cut-off.

  node scripts/deletePaymentsUpTo.js --to <receiptNo> [options]

  --to <receiptNo>   cut-off receipt, inclusive (e.g. RUS-2026-000148)
  --exclusive        stop just before the cut-off instead
  --apply            actually delete (default is report only)
  --backup           write affected documents to scripts/backups/<timestamp>/
  --no-resync        skip balance resync (not recommended)
  --force-remote     allow a non-localhost database
`);
};

const connect = async () => {
  const uri = process.env.MONGO_URI || "";
  if (!uri) throw new Error("MONGO_URI is not set. Load server/.env first.");
  if (!/retryWrites=/.test(uri)) {
    uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  }

  const host = uri.replace(/^mongodb(\+srv)?:\/\//, "").split("/")[0].split("@").pop();
  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|$)/.test(host);

  if (!isLocal && !FORCE_REMOTE) {
    throw new Error(
      `Refusing to touch a non-local database (host: ${host}).\n` +
        "  Re-run with --force-remote if this really is the database you mean."
    );
  }

  await mongoose.connect(uri);
  return host;
};

/**
 * Receipt numbers look like RUS-2026-000148. Comparing them as plain strings
 * is only safe because the numeric part is zero-padded to a fixed width — so
 * we sort on (prefix, number) explicitly instead of trusting lexicographic
 * order across mixed prefixes and widths.
 */
const parseReceipt = (receiptNo) => {
  const m = /^(.*)-(\d+)$/.exec(String(receiptNo || ""));
  if (!m) return null;
  return { prefix: m[1], num: parseInt(m[2], 10), raw: receiptNo };
};

const compareReceipt = (a, b) => {
  if (a.prefix !== b.prefix) return a.prefix < b.prefix ? -1 : 1;
  return a.num - b.num;
};

const planDeletion = async () => {
  const cut = parseReceipt(TO);
  if (!cut) throw new Error(`Could not parse --to value: ${TO}`);

  const all = await Payment.find({}).select("_id receiptNo student studentId academicSession paidAmount dueAmount advanceReceived isVoided paymentStatus createdAt").lean();
  if (all.length === 0) return { cut, all, doomed: [], kept: [], unparsable: [] };

  const parsed = all.map((p) => ({ doc: p, key: parseReceipt(p.receiptNo) }));
  const unparsable = parsed.filter((p) => !p.key);

  const inRange = parsed.filter((p) => {
    if (!p.key) return false;
    const cmp = compareReceipt(p.key, cut);
    return EXCLUSIVE ? cmp < 0 : cmp <= 0;
  });

  return {
    cut,
    all: all.length,
    unparsable: unparsable.map((p) => p.doc.receiptNo),
    doomed: inRange.map((p) => p.doc).sort((a, b) => compareReceipt(parseReceipt(a.receiptNo), parseReceipt(b.receiptNo))),
    kept: parsed.filter((p) => p.key && compareReceipt(p.key, cut) > 0).length,
  };
};

const writeBackup = async (host, doomedIds, itemIds) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(__dirname, "backups", stamp);
  fs.mkdirSync(dir, { recursive: true });

  const dump = async (name, model, filter) => {
    const docs = await model.find(filter).lean();
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(docs, null, 2), "utf8");
    return docs.length;
  };

  const meta = {
    host,
    database: mongoose.connection.name,
    cutOff: TO,
    exclusive: EXCLUSIVE,
    createdAt: new Date().toISOString(),
  };
  meta.Payment = await dump("Payment", Payment, { _id: { $in: doomedIds } });
  meta.PaymentItem = await dump("PaymentItem", PaymentItem, { payment: { $in: doomedIds } });
  meta.PaymentAllocation = await dump("PaymentAllocation", PaymentAllocation, { paymentItem: { $in: itemIds } });
  meta.StudentLedger = await dump("StudentLedger", StudentLedger, { payment: { $in: doomedIds } });

  fs.writeFileSync(path.join(dir, "_meta.json"), JSON.stringify(meta, null, 2), "utf8");
  return { dir, meta };
};

/**
 * Recompute the running balance for one student over the entries that remain.
 * balance_n = balance_(n-1) + debit_n - credit_n, in createdAt order, starting
 * from 0. Only students with a live entry are touched.
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
  if (bulk.length) await StudentLedger.bulkWrite(bulk, { ordered: false });
  return bulk.length;
};

const main = async () => {
  if (!TO) {
    usage();
    process.exit(1);
  }

  const host = await connect();
  console.log(`Connected to ${host}/${mongoose.connection.name}`);
  console.log(`mode: ${APPLY ? "APPLY (deletes)" : "REPORT ONLY (no writes)"}`);

  const plan = await planDeletion();
  console.log(`\nCut-off: ${TO} (${EXCLUSIVE ? "exclusive — stopping just before it" : "inclusive"})`);

  if (plan.all === 0) {
    console.log("\nNo payments found. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  if (plan.unparsable.length) {
    console.log(`\nWARNING: ${plan.unparsable.length} receipt(s) do not match PREFIX-NUMBER and`);
    console.log(`         will be left alone: ${plan.unparsable.slice(0, 5).join(", ")}`);
  }

  const doomed = plan.doomed;
  const doomedIds = doomed.map((p) => p._id);
  const students = [...new Set(doomed.map((p) => p.student.toString()))];

  const items = await PaymentItem.find({ payment: { $in: doomedIds } }).select("_id payment").lean();
  const itemIds = items.map((i) => i._id);
  const allocations = await PaymentAllocation.countDocuments({ paymentItem: { $in: itemIds } });
  const ledgerRows = await StudentLedger.countDocuments({ payment: { $in: doomedIds } });
  const orphanLedger = await StudentLedger.countDocuments({ payment: null });

  console.log("\nWill be deleted:\n");
  console.log(`  Payment              ${doomed.length}`);
  console.log(`  PaymentItem          ${items.length}`);
  console.log(`  PaymentAllocation    ${allocations}`);
  console.log(`  StudentLedger        ${ledgerRows}  (payment-linked only)`);
  console.log(`  students affected    ${students.length}`);

  const sums = doomed.reduce(
    (acc, p) => ({
      collected: acc.collected + (p.paidAmount || 0),
      outstanding: acc.outstanding + (p.dueAmount || 0),
      advance: acc.advance + (p.advanceReceived || 0),
      voided: acc.voided + (p.isVoided ? 1 : 0),
    }),
    { collected: 0, outstanding: 0, advance: 0, voided: 0 }
  );

  console.log("\nMoney involved:\n");
  console.log(`  total collected      ${sums.collected}`);
  console.log(`  still outstanding    ${sums.outstanding}`);
  console.log(`  advance held         ${sums.advance}`);
  console.log(`  voided receipts      ${sums.voided}`);

  console.log("\nLeft untouched:\n");
  console.log(`  payments after cut   ${plan.kept}`);
  console.log(`  non-payment ledger   ${orphanLedger}  (standalone charges / adjustments)`);

  if (doomed.length === 0) {
    console.log("\nNothing matches. Check the --to value and whether --exclusive is set.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\nRange: ${doomed[0].receiptNo}  ..  ${doomed[doomed.length - 1].receiptNo}`);
  if (plan.kept > 0) {
    console.log(`\n${plan.kept} payment(s) after the cut-off will be KEPT. Their ledger balances`);
    console.log("are running totals, so they must be resynced or they will show wrong dues.");
  }

  if (BACKUP) {
    const { dir, meta } = await writeBackup(host, doomedIds, itemIds);
    console.log(`\nBackup written to ${dir}`);
    console.log(`  ${meta.Payment} payments, ${meta.PaymentItem} items, ${meta.StudentLedger} ledger rows`);
  }

  if (!APPLY) {
    console.log("\nRe-run with --apply to delete.");
    await mongoose.disconnect();
    return;
  }

  console.log("\nDeleting...");
  const rAlloc = await PaymentAllocation.deleteMany({ paymentItem: { $in: itemIds } });
  console.log(`  PaymentAllocation    removed ${rAlloc.deletedCount}`);
  const rLedger = await StudentLedger.deleteMany({ payment: { $in: doomedIds } });
  console.log(`  StudentLedger        removed ${rLedger.deletedCount}`);
  const rItems = await PaymentItem.deleteMany({ payment: { $in: doomedIds } });
  console.log(`  PaymentItem          removed ${rItems.deletedCount}`);
  const rPay = await Payment.deleteMany({ _id: { $in: doomedIds } });
  console.log(`  Payment              removed ${rPay.deletedCount}`);

  if (NO_RESYNC) {
    console.log("\n--no-resync given: surviving balances were NOT recomputed. They are now wrong.");
  } else {
    console.log(`\nResyncing balances for ${students.length} student(s)...`);
    let fixed = 0;
    for (const studentId of students) {
      fixed += await resyncStudent(studentId);
    }
    console.log(`  ${fixed} ledger entr${fixed === 1 ? "y" : "ies"} rebalanced`);
  }

  const remaining = await Payment.countDocuments({});
  console.log(`\nDone. ${remaining} payment(s) remain.`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error.message || error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
