/* eslint-disable no-console */
/**
 * Verifies the delete-all endpoints against a local database.
 *
 *   node scripts/testDeleteAllPayments.js
 *
 * Checks the preview response shape, that a wrong confirm token is rejected,
 * that the cascade removes all four collections, and that non-payment ledger
 * rows survive.
 */

require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Payment = require("../models/Payment");
const PaymentItem = require("../models/PaymentItem");
const PaymentAllocation = require("../models/PaymentAllocation");
const StudentLedger = require("../models/StudentLedger");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

const PORT = process.env.TEST_PORT || 5000;
const BASE = `http://127.0.0.1:${PORT}/api/payments`;

let pass = 0;
let fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${extra}`);
  }
};

const req = (method, path, token, body) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      `${BASE}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });

const seed = async () => {
  await Payment.deleteMany({});
  await PaymentItem.deleteMany({});
  await PaymentAllocation.deleteMany({});
  await StudentLedger.deleteMany({});

  let teacher = await Teacher.findOne();
  if (!teacher) {
    teacher = await Teacher.create({
      name: "Fixture Admin",
      email: "fixture-admin@test.local",
      password: "x",
      role: "admin",
    });
  }
  let student = await Student.findOne();
  if (!student) {
    student = await Student.create({
      studentId: "FIXTURE-001",
      password: "x",
      name: "Fixture Student",
      className: "Class 1",
      session: "2026",
      gender: "Male",
      fatherName: "F",
      fatherMobile: "01700000000",
    });
  }

  // An account-manager is the role that handles money day to day, so it is the
  // one most likely to be wrongly allowed through. The auth checks below
  // depend on a non-admin existing, so create one.
  let nonAdmin = await Teacher.findOne({ role: "account-manager" });
  if (!nonAdmin) {
    nonAdmin = await Teacher.create({
      name: "Fixture Manager",
      email: "fixture-manager@test.local",
      password: "x",
      role: "account-manager",
    });
  }

  for (let n = 1; n <= 3; n++) {
    const p = await Payment.create({
      student: student._id,
      studentId: student.studentId,
      studentName: student.name,
      className: student.className,
      receiptNo: `FIXTURE-${String(n).padStart(6, "0")}`,
      academicSession: "2026",
      totalAmount: 1000,
      paidAmount: 1000,
      dueAmount: 0,
      receivedBy: teacher._id,
    });
    const item = await PaymentItem.create({
      payment: p._id,
      student: student._id,
      feeName: "Tuition",
      applicableType: "One Time",
      payableAmount: 1000,
      paidAmount: 1000,
      dueAmount: 0,
      paymentStatus: "Paid",
    });
    await PaymentAllocation.create({
      paymentItem: item._id,
      amount: 1000,
      paymentMethod: "Cash",
      receivedBy: teacher._id,
    });
    await StudentLedger.create({
      student: student._id,
      studentId: student.studentId,
      academicSession: "2026",
      payment: p._id,
      paymentItem: item._id,
      transactionType: "Payment",
      description: `Payment received - ${p.receiptNo}`,
      debit: 0,
      credit: 1000,
      balance: 1000,
      createdBy: teacher._id,
    });
  }

  // A standalone charge with no payment link. This MUST survive the delete.
  await StudentLedger.create({
    student: student._id,
    studentId: student.studentId,
    academicSession: "2026",
    payment: null,
    transactionType: "Charge",
    description: "Opening admission charge",
    debit: 500,
    credit: 0,
    balance: 500,
    createdBy: teacher._id,
  });
};

const main = async () => {
  let uri = process.env.MONGO_URI || "";
  if (!/retryWrites=/.test(uri)) uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
  await mongoose.connect(uri);
  console.log(`DB: ${mongoose.connection.host}/${mongoose.connection.name}`);

  await seed();
  console.log("seeded 3 payments, 3 items, 3 allocations, 4 ledger rows (1 unlinked)\n");

  const server = require("../server");
  // server.js self-starts on PORT (default 5000) and exports nothing, so just
  // give it a moment to bind rather than calling listen ourselves.
  await new Promise((r) => setTimeout(r, 1200));
  console.log(`test server assumed on :${PORT}\n`);

  const admin = await Teacher.findOne({ role: "admin" });
  const adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const manager = await Teacher.findOne({ role: "account-manager" });
  const managerToken = manager
    ? jwt.sign({ id: manager._id, role: "account-manager" }, process.env.JWT_SECRET, { expiresIn: "1h" })
    : null;

  console.log("--- auth ---");
  check("preview rejects no token", (await req("GET", "/delete-all/preview")).status === 401);
  check("delete rejects no token", (await req("POST", "/delete-all", null, { confirm: "3" })).status === 401);
  if (managerToken) {
    const pv = await req("GET", "/delete-all/preview", managerToken);
    const dl = await req("POST", "/delete-all", managerToken, { confirm: "3" });
    check("preview rejects account-manager (403)", pv.status === 403, `got ${pv.status}`);
    check("delete rejects account-manager (403)", dl.status === 403, `got ${dl.status}`);
  } else {
    console.log("  FAIL  no account-manager available for the non-admin check");
  }

  console.log("\n--- preview ---");
  const prev = await req("GET", "/delete-all/preview", adminToken);
  check("preview 200", prev.status === 200, `got ${prev.status}`);
  check("counts payments=3", prev.body?.counts?.payments === 3, JSON.stringify(prev.body?.counts));
  check("counts items=3", prev.body?.counts?.items === 3);
  check("counts allocations=3", prev.body?.counts?.allocations === 3);
  check("counts ledgerRows=3 (excludes unlinked)", prev.body?.counts?.ledgerRows === 3, JSON.stringify(prev.body?.counts));
  check("counts preservedLedger=1", prev.body?.counts?.preservedLedger === 1);
  check("totals collected=3000", prev.body?.totals?.collected === 3000);
  check("confirm token === '3'", prev.body?.confirm === "3");
  check("preview wrote nothing", (await Payment.countDocuments({})) === 3);

  console.log("\n--- confirm token gate ---");
  const wrong = await req("POST", "/delete-all", adminToken, { confirm: "999" });
  check("wrong token rejected 400", wrong.status === 400, `got ${wrong.status}`);
  check("wrong token deleted nothing", (await Payment.countDocuments({})) === 3);
  const missing = await req("POST", "/delete-all", adminToken, {});
  check("missing token rejected 400", missing.status === 400, `got ${missing.status}`);

  console.log("\n--- execute ---");
  const del = await req("POST", "/delete-all", adminToken, { confirm: prev.body.confirm });
  check("delete 200", del.status === 200, `got ${del.status} ${JSON.stringify(del.body)}`);
  check("payments now 0", (await Payment.countDocuments({})) === 0);
  check("items now 0", (await PaymentItem.countDocuments({})) === 0);
  check("allocations now 0", (await PaymentAllocation.countDocuments({})) === 0);
  check("linked ledger now 0", (await StudentLedger.countDocuments({ payment: { $ne: null } })) === 0);
  check("unlinked ledger PRESERVED", (await StudentLedger.countDocuments({ payment: null })) === 1);
  check("students preserved", (await Student.countDocuments({})) >= 1);

  console.log("\n--- idempotency ---");
  const again = await req("POST", "/delete-all", adminToken, { confirm: "3" });
  check("second delete 400 (nothing to do)", again.status === 400, `got ${again.status}`);

  // cleanup
  await Payment.deleteMany({});
  await PaymentItem.deleteMany({});
  await PaymentAllocation.deleteMany({});
  await StudentLedger.deleteMany({});

  await mongoose.disconnect();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
};

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
