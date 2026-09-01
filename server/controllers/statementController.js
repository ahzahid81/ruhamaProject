const Expense = require("../models/Expense");
const FundTransfer = require("../models/FundTransfer");
const StatementPeriod = require("../models/StatementPeriod");
const Payment = require("../models/Payment");
const Settings = require("../models/Settings");

// The statement runs entirely on the payment methods defined in System
// Settings. There is NO hardcoded account list — income, expenses, fund
// transfers, opening/closing balances all use the declared payment methods.

const csvDate = (d) => new Date(d).toISOString().slice(0, 10);

// Normalize a transaction date. A bare date sent by the client ("2026-09-01"
// or "2026-09-01T00:00:00.000Z") has no meaningful time-of-day. If its calendar
// date is today, store the real current time so a same-day entry recorded after
// an audit reset (whose period started later today) is NOT wrongly excluded.
function parseTxDate(input) {
  const now = new Date();
  if (!input) return now;
  const d = new Date(input);
  if (isNaN(d.getTime())) return now;
  const s = String(input);
  const isDateOnly =
    /^\d{4}-\d{2}-\d{2}$/.test(s) || /T00:00:00(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/.test(s);
  if (
    isDateOnly &&
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) {
    return now;
  }
  return d;
}

// Ordered account list: every configured payment method first, then any other
// account names found on actual records (so nothing is silently dropped).
function resolveAccounts(settings, payments, expenses, transfers) {
  const seen = [];
  const add = (m) => {
    const name = String(m || "").trim();
    if (name && !seen.includes(name)) seen.push(name);
  };
  (Array.isArray(settings.paymentMethods) ? settings.paymentMethods : []).forEach(add);
  (payments || []).forEach((r) => add(r.paymentMethod || "Cash"));
  (expenses || []).forEach((r) => add(r.account));
  (transfers || []).forEach((r) => {
    add(r.fromAccount);
    add(r.toAccount);
    if (Number(r.charge || 0) > 0) add(r.chargeAccount || r.fromAccount);
  });
  if (!seen.length) seen.push("Cash");
  return seen;
}

// ============================================
// PERIOD HELPERS
// ============================================

async function getCurrentPeriod() {
  let period = await StatementPeriod.findOne().sort({ periodStart: -1 });
  if (!period) {
    const settings = await Settings.getSettings();
    period = await StatementPeriod.create({
      periodStart: new Date(0),
      academicSession: settings.currentSession,
      openingBalances: {},
      closingBalances: {},
      note: "Initial period",
    });
  }
  return period;
}

async function computeAccounts(period) {
  const since = new Date(period.periodStart);
  const n = (v) => Number(v || 0);

  const [payments, transfers, expenses, settings] = await Promise.all([
    Payment.find({ receiveDate: { $gte: since }, paymentStatus: "Completed", isVoided: { $ne: true } }),
    FundTransfer.find({ date: { $gte: since } }),
    Expense.find({ date: { $gte: since } }),
    Settings.getSettings(),
  ]);

  const accNames = resolveAccounts(settings, payments, expenses, transfers);
  const income = {};
  const expenseBy = {};
  const transferIn = {};
  const transferOut = {};
  const charges = {};
  accNames.forEach((acc) => {
    income[acc] = 0;
    expenseBy[acc] = 0;
    transferIn[acc] = 0;
    transferOut[acc] = 0;
    charges[acc] = 0;
  });

  payments.forEach((p) => {
    income[String(p.paymentMethod || "Cash").trim()] += n(p.paidAmount);
  });
  expenses.forEach((e) => {
    if (accNames.includes(e.account)) expenseBy[e.account] += n(e.amount);
  });
  transfers.forEach((t) => {
    if (accNames.includes(t.fromAccount)) transferOut[t.fromAccount] += n(t.amount);
    if (accNames.includes(t.toAccount)) transferIn[t.toAccount] += n(t.amount);
    const c = n(t.charge);
    if (c > 0) charges[t.chargeAccount || t.fromAccount] += c;
  });

  const accounts = accNames.map((acc) => {
    const opening = n(period.openingBalances?.[acc]);
    const current =
      opening + income[acc] - expenseBy[acc] + transferIn[acc] - transferOut[acc] - charges[acc];
    return {
      key: acc,
      opening,
      income: income[acc],
      expense: expenseBy[acc],
      transferIn: transferIn[acc],
      transferOut: transferOut[acc],
      charges: charges[acc],
      current,
    };
  });

  const sum = (pick) => accounts.reduce((s, a) => s + a[pick], 0);

  return {
    accounts,
    totals: {
      opening: sum("opening"),
      income: sum("income"),
      expense: sum("expense"),
      transferIn: sum("transferIn"),
      transferOut: sum("transferOut"),
      charges: sum("charges"),
      inHand: sum("current"),
    },
  };
}

// Full statement payload returned by GET and every mutation, so the
// client always renders freshly recalculated numbers.
async function buildPayload(period) {
  const { accounts, totals } = await computeAccounts(period);
  const [recentExpenses, recentTransfers, recentPayments, history, settings] = await Promise.all([
    Expense.find().sort({ date: -1, createdAt: -1 }).limit(50),
    FundTransfer.find().sort({ date: -1, createdAt: -1 }).limit(50),
    Payment.find({ isVoided: { $ne: true } })
      .sort({ receiveDate: -1, createdAt: -1 })
      .limit(50)
      .select("studentId studentName receiptNo paymentMethod paidAmount receiveDate"),
    StatementPeriod.find().sort({ periodStart: -1 }).limit(20),
    Settings.getSettings(),
  ]);

  return {
    period: {
      _id: period._id,
      periodStart: period.periodStart,
      academicSession: period.academicSession || settings.currentSession,
      openingBalances: period.openingBalances,
      note: period.note,
    },
    accounts,
    totals,
    paymentMethods: settings.paymentMethods,
    recentExpenses,
    recentTransfers,
    recentPayments,
    history: history.map((h) => ({
      _id: h._id,
      periodStart: h.periodStart,
      academicSession: h.academicSession,
      openingBalances: h.openingBalances,
      closingBalances: h.closingBalances,
      note: h.note,
      createdAt: h.createdAt,
    })),
  };
}

// ============================================
// GET FULL STATEMENT
// ============================================

const getStatement = async (req, res) => {
  try {
    const period = await getCurrentPeriod();
    return res.json({ success: true, ...(await buildPayload(period)) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DATE-WISE CSV EXPORT
// ============================================

const exportStatement = async (req, res) => {
  try {
    const currentPeriod = await getCurrentPeriod();
    const now = new Date();

    const fromRaw = req.query.from ? new Date(req.query.from) : null;
    const toRaw = req.query.to ? new Date(req.query.to) : now;

    // The audit period that was active on the requested "from" date.
    const activePeriod = fromRaw
      ? (await StatementPeriod.findOne({ periodStart: { $lte: fromRaw } }).sort({ periodStart: -1 })) || currentPeriod
      : currentPeriod;
    const pStart = new Date(activePeriod.periodStart);
    const fromDate = fromRaw && fromRaw > pStart ? fromRaw : pStart;
    const toDate = toRaw < fromDate ? fromDate : toRaw;

    // Flows before the range (basis for the opening balance).
    const [payPre, exPre, trPre, settings] = await Promise.all([
      Payment.find({ receiveDate: { $gte: pStart, $lt: fromDate }, paymentStatus: "Completed", isVoided: { $ne: true } }),
      Expense.find({ date: { $gte: pStart, $lt: fromDate } }),
      FundTransfer.find({ date: { $gte: pStart, $lt: fromDate } }),
      Settings.getSettings(),
    ]);

    const accNames = resolveAccounts(settings, payPre, exPre, trPre);
    const balance = {};
    accNames.forEach((a) => {
      balance[a] = Number(activePeriod.openingBalances?.[a] || 0);
    });

    payPre.forEach((p) => {
      const m = String(p.paymentMethod || "Cash").trim();
      balance[m] = (balance[m] || 0) + Number(p.paidAmount || 0);
    });
    exPre.forEach((e) => {
      balance[e.account] = (balance[e.account] || 0) - Number(e.amount || 0);
    });
    trPre.forEach((t) => {
      balance[t.fromAccount] = (balance[t.fromAccount] || 0) - Number(t.amount || 0);
      balance[t.toAccount] = (balance[t.toAccount] || 0) + Number(t.amount || 0);
      const c = Number(t.charge || 0);
      if (c > 0) balance[t.chargeAccount || t.fromAccount] = (balance[t.chargeAccount || t.fromAccount] || 0) - c;
    });

    // Flows inside the requested range.
    const [payRange, exRange, trRange] = await Promise.all([
      Payment.find({ receiveDate: { $gte: fromDate, $lte: toDate }, paymentStatus: "Completed", isVoided: { $ne: true } }).sort({ receiveDate: 1 }),
      Expense.find({ date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1 }),
      FundTransfer.find({ date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1 }),
    ]);

    const rows = [];
    const total = () => Object.values(balance).reduce((s, v) => s + Number(v || 0), 0);

    accNames.forEach((a) => {
      rows.push({
        date: csvDate(fromDate),
        type: "Opening Balance",
        description: `${a} opening on ${csvDate(pStart)}`,
        from: a,
        to: a,
        amount: Number(balance[a] || 0),
        charge: "",
        balance: total(),
      });
    });

    const events = [];
    payRange.forEach((p) => {
      events.push({
        ts: p.receiveDate,
        sort: 0,
        make: () => {
          const m = String(p.paymentMethod || "Cash").trim();
          const amt = Number(p.paidAmount || 0);
          balance[m] = (balance[m] || 0) + amt;
          rows.push({
            date: csvDate(p.receiveDate),
            type: "Payment",
            description: `${p.studentName || p.studentId}${p.receiptNo ? ` (${p.receiptNo})` : ""} [${m}]`,
            from: "Student",
            to: m,
            amount: amt,
            charge: "",
            balance: total(),
          });
        },
      });
    });
    exRange.forEach((e) => {
      events.push({
        ts: e.date,
        sort: 1,
        make: () => {
          const amt = Number(e.amount || 0);
          balance[e.account] = (balance[e.account] || 0) - amt;
          rows.push({
            date: csvDate(e.date),
            type: "Expense",
            description: `${e.category}${e.description ? ` - ${e.description}` : ""}`,
            from: e.account,
            to: "Expense",
            amount: -amt,
            charge: "",
            balance: total(),
          });
        },
      });
    });
    trRange.forEach((t) => {
      events.push({
        ts: t.date,
        sort: 2,
        make: () => {
          const amt = Number(t.amount || 0);
          balance[t.fromAccount] = (balance[t.fromAccount] || 0) - amt;
          balance[t.toAccount] = (balance[t.toAccount] || 0) + amt;
          rows.push({
            date: csvDate(t.date),
            type: "Fund Transfer",
            description: t.note || "Fund transfer",
            from: t.fromAccount,
            to: t.toAccount,
            amount: "",
            charge: Number(t.charge || 0),
            balance: total(),
          });
          const c = Number(t.charge || 0);
          if (c > 0) {
            const ck = t.chargeAccount || t.fromAccount;
            balance[ck] = (balance[ck] || 0) - c;
            rows.push({
              date: csvDate(t.date),
              type: "Transfer Charge",
              description: `${ck} charge on transfer`,
              from: ck,
              to: "Charge",
              amount: -c,
              charge: "",
              balance: total(),
            });
          }
        },
      });
    });

    events.sort((a, b) => new Date(a.ts) - new Date(b.ts) || a.sort - b.sort);
    events.forEach((ev) => ev.make());

    accNames.forEach((a) => {
      rows.push({ date: "", type: "CLOSING", description: `${a} balance`, from: "", to: "", amount: Number(balance[a] || 0), charge: "", balance: "" });
    });
    rows.push({ date: "", type: "CLOSING", description: "Total in hand", from: "", to: "", amount: total(), charge: "", balance: "" });

    const safe = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Date", "Type", "Description", "From", "To", "Amount", "Charge", "Balance"];
    const lines = [header.join(",")].concat(
      rows.map((r) =>
        [safe(r.date), safe(r.type), safe(r.description), safe(r.from), safe(r.to), safe(r.amount), safe(r.charge), safe(r.balance)].join(",")
      )
    );
    const csv = "\uFEFF" + lines.join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=statement-${csvDate(fromDate)}-${csvDate(toDate)}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// EXPENSES
// ============================================

const addExpense = async (req, res) => {
  try {
    const { account, category, description, amount, date } = req.body;

    if (!String(account || "").trim()) {
      return res.status(400).json({ success: false, message: "Please select an account." });
    }
    const amt = Number(amount || 0);
    if (!(amt > 0)) {
      return res.status(400).json({ success: false, message: "Expense amount must be greater than 0." });
    }

    const settings = await Settings.getSettings();
    await Expense.create({
      account: String(account).trim(),
      category: String(category || "").trim(),
      description: String(description || "").trim(),
      amount: amt,
      date: parseTxDate(date),
      academicSession: settings.currentSession,
      createdBy: req.user?._id || null,
    });

    const payload = await buildPayload(await getCurrentPeriod());
    return res.status(201).json({ success: true, message: "Expense recorded.", ...payload });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    const payload = await buildPayload(await getCurrentPeriod());
    return res.json({ success: true, message: "Expense deleted.", ...payload });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// FUND TRANSFERS
// ============================================

const addFundTransfer = async (req, res) => {
  try {
    const { fromAccount, toAccount, amount, charge, chargeAccount, note, date } = req.body;

    if (!String(fromAccount || "").trim() || !String(toAccount || "").trim()) {
      return res.status(400).json({ success: false, message: "Please select source and destination accounts." });
    }
    if (fromAccount === toAccount) {
      return res.status(400).json({ success: false, message: "Source and destination accounts must be different." });
    }
    const amt = Number(amount || 0);
    if (!(amt > 0)) {
      return res.status(400).json({ success: false, message: "Transfer amount must be greater than 0." });
    }
    const chg = Number(charge || 0);
    if (chg < 0) {
      return res.status(400).json({ success: false, message: "Charge cannot be negative." });
    }
    const chgAcct = String(chargeAccount || fromAccount).trim() || fromAccount;

    const settings = await Settings.getSettings();
    await FundTransfer.create({
      fromAccount: String(fromAccount).trim(),
      toAccount: String(toAccount).trim(),
      amount: amt,
      charge: chg,
      chargeAccount: chgAcct,
      note: String(note || "").trim(),
      date: parseTxDate(date),
      academicSession: settings.currentSession,
      createdBy: req.user?._id || null,
    });

    const payload = await buildPayload(await getCurrentPeriod());
    return res.status(201).json({ success: true, message: "Fund moved.", ...payload });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFundTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    await FundTransfer.findByIdAndDelete(id);
    const payload = await buildPayload(await getCurrentPeriod());
    return res.json({ success: true, message: "Transfer deleted.", ...payload });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// RESET / CLOSE AUDIT
// ============================================

const resetAccount = async (req, res) => {
  try {
    const { openingBalances, note } = req.body;
    const values = openingBalances || {};
    const settings = await Settings.getSettings();

    const currentPeriod = await getCurrentPeriod();
    const { accounts } = await computeAccounts(currentPeriod);

    // Opening balance is required for every configured payment method.
    const accNames = accounts.map((a) => a.key);
    if (!accNames.length) accNames.push("Cash");

    for (const name of accNames) {
      const v = values[name];
      if (v === undefined || v === null || v === "" || !(Number(v) >= 0)) {
        return res.status(400).json({
          success: false,
          message: `Please enter a valid opening balance for ${name}.`,
        });
      }
    }

    const closing = {};
    accounts.forEach((a) => { closing[a.key] = a.current; });

    await StatementPeriod.create({
      periodStart: new Date(),
      academicSession: settings.currentSession,
      openingBalances: Object.fromEntries(accNames.map((name) => [name, Number(values[name])])),
      closingBalances: closing,
      note: String(note || "").trim(),
      resetBy: req.user?._id || null,
    });

    const payload = await buildPayload(await getCurrentPeriod());
    return res.status(201).json({
      success: true,
      message: "Audit closed and account reset. Counting restarted.",
      closedBalances: closing,
      ...payload,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStatement,
  exportStatement,
  addExpense,
  deleteExpense,
  addFundTransfer,
  deleteFundTransfer,
  resetAccount,
};