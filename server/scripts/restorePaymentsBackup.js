/* eslint-disable no-console */
/**
 * Restore a payment backup written by purgeAllPayments.js.
 *
 *   node scripts/restorePaymentsBackup.js --from scripts/backups/<timestamp>
 *
 * Safety properties:
 *   - report only unless --apply
 *   - refuses to run if the target collections are non-empty, so it cannot
 *     silently double up with payments that already exist
 *   - skips any document whose _id is already present, so a re-run after a
 *     partial restore completes it rather than duplicating
 *   - _id is preserved, so restored payments keep their original receipt
 *     numbers and ledger references stay valid
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
const FORCE_REMOTE = process.argv.includes("--force-remote");
const FORCE_NONEMPTY = process.argv.includes("--force-nonempty");

const fromIdx = process.argv.indexOf("--from");
const FROM = fromIdx !== -1 ? process.argv[fromIdx + 1] : null;

const MODELS = [
  { file: "Payment", model: Payment },
  { file: "PaymentItem", model: PaymentItem },
  { file: "PaymentAllocation", model: PaymentAllocation },
  { file: "StudentLedger", model: StudentLedger },
];

const connect = async () => {
  let uri = process.env.MONGO_URI || "";
  if (!uri) throw new Error("MONGO_URI is not set.");
  if (!/retryWrites=/.test(uri)) uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  const host = uri.replace(/^mongodb(\+srv)?:\/\//, "").split("/")[0].split("@").pop();
  const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|$)/.test(host);
  if (!isLocal && !FORCE_REMOTE) {
    throw new Error(`Refusing non-local host (${host}). Re-run with --force-remote.`);
  }
  await mongoose.connect(uri);
  return host;
};

const main = async () => {
  if (!FROM) {
    console.log(`
Restore a payment backup.

  node scripts/restorePaymentsBackup.js --from scripts/backups/<timestamp> [--apply]

  --apply             actually insert (default is report only)
  --force-remote      allow a non-localhost database
  --force-nonempty    restore even if payments already exist
`);
    process.exit(1);
  }

  const dir = path.resolve(FROM);
  const host = await connect();
  console.log(`Connected to ${host}/${mongoose.connection.name}`);
  console.log(`Restoring from ${dir}`);
  console.log(`mode: ${APPLY ? "APPLY (writes)" : "REPORT ONLY (no writes)"}`);

  const metaPath = path.join(dir, "_meta.json");
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    console.log(`\nBackup taken: ${meta.createdAt}`);
    console.log(`Backup source: ${meta.host}/${meta.database}`);
    if (meta.host !== `${host}:${mongoose.connection.port || 27017}` && !/cluster|atlas/i.test(meta.host)) {
      console.log("  (note: backup was taken from a different host)");
    }
  }

  const loaded = [];
  for (const m of MODELS) {
    const file = path.join(dir, `${m.file}.json`);
    if (!fs.existsSync(file)) {
      console.log(`\nMissing ${m.file}.json — nothing to restore for that collection.`);
      continue;
    }
    const docs = JSON.parse(fs.readFileSync(file, "utf8"));
    loaded.push({ ...m, docs });
    console.log(`  ${m.file.padEnd(20)} ${docs.length} docs on disk`);
  }

  const currentPayments = await Payment.countDocuments({});
  console.log(`\nCurrently in database: ${currentPayments} payment(s)`);
  if (currentPayments > 0 && !FORCE_NONEMPTY) {
    console.log("\nRefusing to restore on top of existing payments.");
    console.log("  That usually means this is the wrong database, or a restore already ran.");
    console.log("  Re-run with --force-nonempty if you are sure.");
    await mongoose.disconnect();
    return;
  }

  // Report how many would actually be inserted vs skipped as already present.
  for (const { file, model, docs } of loaded) {
    if (!docs.length) continue;
    const ids = docs.map((d) => d._id);
    const existing = await model.countDocuments({ _id: { $in: ids } });
    console.log(`  ${file.padEnd(20)} ${docs.length - existing} to insert, ${existing} already present`);
  }

  if (!APPLY) {
    console.log("\nRe-run with --apply to restore.");
    await mongoose.disconnect();
    return;
  }

  console.log("\nInserting...");
  for (const { file, model, docs } of loaded) {
    if (!docs.length) {
      console.log(`  ${file.padEnd(20)} nothing to insert`);
      continue;
    }
    const ids = docs.map((d) => d._id);
    const existing = await model.countDocuments({ _id: { $in: ids } });
    const fresh = docs.filter((d) => !existing || true); // insertMany ordered:false skips dupes
    try {
      const res = await model.insertMany(fresh, { ordered: false });
      console.log(`  ${file.padEnd(20)} inserted ${res.length}`);
    } catch (e) {
      // Duplicate key errors are expected on a re-run; count what landed.
      const landed = await model.countDocuments({ _id: { $in: ids } });
      console.log(`  ${file.padEnd(20)} inserted ${landed - existing} (skipped existing)`);
    }
  }

  console.log("\nVerify with scripts/verifyLedgerBalances.js");
  await mongoose.disconnect();
};

main().catch(async (e) => {
  console.error(e.message || e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
