/* eslint-disable no-console */
/**
 * Read-only pre-flight inspection. Makes no writes.
 *
 *   MONGO_URI=... node scripts/inspectPayments.js --force-remote
 */

require("dotenv").config();
const mongoose = require("mongoose");

const main = async () => {
  let uri = process.env.MONGO_URI || "";
  if (!/retryWrites=/.test(uri)) uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const P = db.collection("payments");
  const I = db.collection("paymentitems");
  const L = db.collection("studentledgers");
  const A = db.collection("paymentallocations");

  const all = await P.find({}).sort({ receiptNo: 1 }).toArray();
  console.log(`\ntotal payments: ${all.length}`);

  // Prefixes present. Anything other than RUS-2026 would sit outside the range.
  const prefixes = {};
  for (const p of all) {
    const pre = String(p.receiptNo || "").replace(/-\d+$/, "");
    prefixes[pre] = (prefixes[pre] || 0) + 1;
  }
  console.log("receipt prefixes:", JSON.stringify(prefixes));

  // Contiguity: gaps mean a bare --to would silently skip receipts.
  const nums = all
    .map((p) => parseInt(String(p.receiptNo).split("-").pop(), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < nums.length; i++) if (nums[i] !== nums[i - 1] + 1) gaps.push(`${nums[i - 1]}->${nums[i]}`);
  console.log(`receipt range: ${nums[0]}..${nums[nums.length - 1]}  gaps: ${gaps.length ? gaps.join(", ") : "none"}`);
  console.log(`highest receipt: ${all[all.length - 1]?.receiptNo}`);

  // Date span - receipt number is NOT creation order if these disagree.
  const dates = all.map((p) => p.receiveDate || p.createdAt).filter(Boolean).sort((a, b) => a - b);
  console.log(`date span: ${dates[0]?.toISOString?.().slice(0, 10)} .. ${dates[dates.length - 1]?.toISOString?.().slice(0, 10)}`);
  const byNum = all.map((p) => ({ n: parseInt(String(p.receiptNo).split("-").pop(), 10), d: p.receiveDate || p.createdAt }));
  let inversions = 0;
  for (let i = 1; i < byNum.length; i++) if (byNum[i].d < byNum[i - 1].d) inversions++;
  console.log(`receipt-number vs date inversions: ${inversions} ${inversions ? "<-- numbering is NOT chronological" : ""}`);

  // Ledger coverage. Normal flow writes 1 credit per payment + 1 charge per item.
  const items = await I.find({}).toArray();
  const ledgerAll = await L.find({}).toArray();
  const linked = ledgerAll.filter((e) => e.payment);
  console.log(`\nitems: ${items.length}   ledger rows: ${ledgerAll.length}   payment-linked: ${linked.length}`);
  console.log(`expected payment-linked rows if every payment was collected normally: ~${all.length + items.length}`);
  console.log(`  -> shortfall: ${all.length + items.length - linked.length}`);

  const byType = {};
  for (const e of ledgerAll) byType[e.transactionType] = (byType[e.transactionType] || 0) + 1;
  console.log("ledger rows by type:", JSON.stringify(byType));

  // How many payments have ANY ledger row at all?
  const payIds = new Set(linked.map((e) => String(e.payment)));
  const withLedger = all.filter((p) => payIds.has(String(p._id))).length;
  console.log(`payments with >=1 ledger row: ${withLedger}/${all.length}`);
  console.log(`payments with NO ledger row:  ${all.length - withLedger}`);

  // Items whose payment has no matching Payment row = orphans.
  const pids = new Set(all.map((p) => String(p._id)));
  const orphanItems = items.filter((i) => !pids.has(String(i.payment)));
  console.log(`orphan items (payment missing): ${orphanItems.length}`);

  // Money reconciliation between the two records of the same fact.
  const paySum = all.reduce((s, p) => s + (p.paidAmount || 0), 0);
  const creditSum = ledgerAll.filter((e) => e.transactionType === "Payment").reduce((s, e) => s + (e.credit || 0), 0);
  console.log(`\nsum(Payment.paidAmount)      = ${paySum}`);
  console.log(`sum(ledger Payment.credit)   = ${creditSum}`);
  console.log(paySum === creditSum ? "  -> these agree" : "  -> THESE DISAGREE. The ledger does not back up the receipts.");

  const students = await db.collection("students").countDocuments({});
  const affected = new Set(all.map((p) => String(p.student))).size;
  console.log(`\nstudents total: ${students}   affected by this delete: ${affected}`);
  console.log(`allocations: ${await A.countDocuments({})}`);

  await mongoose.disconnect();
};

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
