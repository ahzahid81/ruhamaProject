/* eslint-disable no-console */
/**
 * Independent check that StudentLedger.balance equals the running sum of the
 * entries that actually remain, after a range delete.
 *
 *   node scripts/verifyLedgerBalances.js
 *
 * Compares two orderings, because ties on createdAt make the order ambiguous:
 *   - {createdAt, _id}  the ordering the resync writes with
 *   - {createdAt}       natural order, to surface tie-order sensitivity
 */

require("dotenv").config();
const mongoose = require("mongoose");

const check = async (label, sort) => {
  const docs = await mongoose.connection.db
    .collection("studentledgers")
    .find({})
    .sort(sort)
    .toArray();

  let running = 0;
  const bad = [];
  for (const d of docs) {
    running += (d.debit || 0) - (d.credit || 0);
    if (d.balance !== running) {
      bad.push({ description: d.description, stored: d.balance, expected: running });
    }
  }

  console.log(`\n[${label}]  entries=${docs.length}  mismatches=${bad.length}  final=${running}`);
  for (const b of bad.slice(0, 6)) {
    console.log(`   ${b.description}  stored=${b.stored} expected=${b.expected}`);
  }
  return { total: docs.length, bad: bad.length, final: running };
};

const main = async () => {
  let uri = process.env.MONGO_URI || "";
  if (!/retryWrites=/.test(uri)) {
    uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  }
  await mongoose.connect(uri);
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const a = await check("createdAt,_id (resync order)", { createdAt: 1, _id: 1 });
  const b = await check("createdAt only (natural)", { createdAt: 1 });

  const ties = await mongoose.connection.db
    .collection("studentledgers")
    .aggregate([{ $group: { _id: "$createdAt", n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }])
    .toArray();
  console.log(`\ntimestamps shared by more than one entry: ${ties.length}`);
  for (const t of ties.slice(0, 5)) console.log(`   ${t._id} x${t.n}`);

  // The ledger charges the full payable and credits what was actually paid, so
  // the expected net is sum(payable) - sum(paid). Using paid - due here would
  // be wrong: due is only the unpaid slice of payable, not the charge itself.
  const items = await mongoose.connection.db.collection("paymentitems").find({}).toArray();
  const net = items.reduce((s, i) => s + (i.payableAmount || 0) - (i.paidAmount || 0), 0);
  const payments = await mongoose.connection.db.collection("payments").find({}).toArray();
  console.log(`\nremaining payments: ${payments.length}, items: ${items.length}`);
  console.log(`sum of (payable - paid) across items: ${net}  (should equal final balance ${a.final})`);
  console.log(net === a.final ? "OK: ledger ties out to the receipts." : "WARNING: ledger does not tie out.");

  await mongoose.disconnect();
};

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
