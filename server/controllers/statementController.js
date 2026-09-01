const Expense = require("../models/Expense");
const FundTransfer = require("../models/FundTransfer");
const StatementPeriod = require("../models/StatementPeriod");
const Payment = require("../models/Payment");
const Settings = require("../models/Settings");

const ACCOUNTS = ["Cash", "bKash", "Bank"];
const ACCOUNT_KEYS = { Cash: "cash", bKash: "bkash", Bank: "bank" };
const KEY_ACCOUNTS = { cash: "Cash", bkash: "bKash", bank: "Bank" };

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
      openingBalances: { cash: 0, bkash: 0, bank: 0 },
      closingBalances: { cash: 0, bkash: 0, bank: 0 },
      note: "Initial period",
    });
  }
  return period;
}

async function computeAccounts(period) {
  const since = new Date(period.periodStart);

  const [payments, transfers, expenses, settings] = await Promise.all([
    Payment.find({ receiveDate: { $gte: since }, paymentStatus: "Completed", isVoided: { $ne: true } }),
    FundTransfer.find({ date: { $gte: since } }),
    Expense.find({ date: { $gte: since } }),
    Settings.getSettings(),
  ]);

  // Each payment method IS its own income account. A method that equals a fund
  // (Cash / bKash / Bank) credits that fund's balance.
  const byMethod = {};
  const fundIncome = { cash: 0, bkash: 0, bank: 0 };
  const extraMethods = [];
  payments.forEach((p) => {
    const m = (p.paymentMethod || "Cash").trim() || "Cash";
    const amount = Number(p.paidAmount || 0);
    byMethod[m] = Number(byMethod[m] || 0) + amount;
    const k = String(m).toLowerCase().replace(/[\s_-]/g, "");
    if (k === "cash") fundIncome.cash += amount;
    else if (k === "bkash") fundIncome.bkash += amount;
    else if (k === "bank") fundIncome.bank += amount;
    else if (!extraMethods.includes(m)) extraMethods.push(m);
  });

  // Ordered income breakdown: every configured method (even with 0 so new
  // methods added day-by-day appear), then any extra methods found in payments.
  const incomeBreakdown = [];
  ((Array.isArray(settings.paymentMethods) ? settings.paymentMethods : [])).forEach((m) => {
    incomeBreakdown.push({ method: m, amount: Number(byMethod[m] || 0) });
  });
  extraMethods.forEach((m) => {
    incomeBreakdown.push({ method: m, amount: byMethod[m] });
  });

  const byMethodFund = (m) => {
    const k = String(m).toLowerCase().replace(/[\s_-]/g, "");
    if (k === "cash") return fundIncome.cash;
    if (k === "bkash") return fundIncome.bkash;
    if (k === "bank") return fundIncome.bank;
    return 0;
  };
  incomeBreakdown.forEach((row) => {
    row.fundCredit = byMethodFund(row.method);
  });

  const expenseBy = { cash: 0, bkash: 0, bank: 0 };
  expenses.forEach((e) => {
    if (!ACCOUNT_KEYS[e.account]) return;
    expenseBy[ACCOUNT_KEYS[e.account]] += Number(e.amount || 0);
  });

  const transferIn = { cash: 0, bkash: 0, bank: 0 };
  const transferOut = { cash: 0, bkash: 0, bank: 0 };
  const charges = { cash: 0, bkash: 0, bank: 0 };
  transfers.forEach((t) => {
    if (!ACCOUNT_KEYS[t.toAccount] || !ACCOUNT_KEYS[t.fromAccount]) return;
    transferIn[ACCOUNT_KEYS[t.toAccount]] += Number(t.amount || 0);
    transferOut[ACCOUNT_KEYS[t.fromAccount]] += Number(t.amount || 0);
    const chg = Number(t.charge || 0);
    if (chg > 0 && ACCOUNT_KEYS[t.chargeAccount || t.fromAccount]) {
      charges[ACCOUNT_KEYS[t.chargeAccount || t.fromAccount]] += chg;
    }
  });

  const accounts = ACCOUNTS.map((acct) => {
    const k = ACCOUNT_KEYS[acct];
    const opening = Number(period.openingBalances[k] || 0);
    const current =
      opening + fundIncome[k] - expenseBy[k] + transferIn[k] - transferOut[k] - charges[k];
    return {
      key: acct,
      opening,
      income: fundIncome[k],
      expense: expenseBy[k],
      transferIn: transferIn[k],
      transferOut: transferOut[k],
      charges: charges[k],
      current,
    };
  });

  const incomeTotal = incomeBreakdown.reduce((s, r) => s + Number(r.amount || 0), 0);

  return {
    accounts,
    incomeBreakdown,
    totals: {
      opening: accounts.reduce((s, a) => s + a.opening, 0),
      income: accounts.reduce((s, a) => s + a.income, 0),
      incomeAllMethods: incomeTotal,
      expense: accounts.reduce((s, a) => s + a.expense, 0),
      transferIn: accounts.reduce((s, a) => s + a.transferIn, 0),
      transferOut: accounts.reduce((s, a) => s + a.transferOut, 0),
      charges: accounts.reduce((s, a) => s + a.charges, 0),
      inHand: accounts.reduce((s, a) => s + a.current, 0),
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
    incomeBreakdown,
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

    const fundKeyOf = (method) => {
      const k = String(method || "Cash").toLowerCase().replace(/[\s_-]/g, "");
      if (k === "cash") return "cash";
      if (k === "bkash") return "bkash";
      if (k === "bank") return "bank";
      return null;
    };

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
    const [payPre, exPre, trPre] = await Promise.all([
      Payment.find({ receiveDate: { $gte: pStart, $lt: fromDate }, paymentStatus: "Completed", isVoided: { $ne: true } }),
      Expense.find({ date: { $gte: pStart, $lt: fromDate } }),
      FundTransfer.find({ date: { $gte: pStart, $lt: fromDate } }),
    ]);

    const balance = {
      cash: Number(activePeriod.openingBalances?.cash || 0),
      bkash: Number(activePeriod.openingBalances?.bkash || 0),
      bank: Number(activePeriod.openingBalances?.bank || 0),
    };
    payPre.forEach((p) => {
      const k = fundKeyOf(p.paymentMethod);
      if (k) balance[k] += Number(p.paidAmount || 0);
    });
    exPre.forEach((e) => {
      balance[ACCOUNT_KEYS[e.account]] -= Number(e.amount || 0);
    });
    trPre.forEach((t) => {
      const out = ACCOUNT_KEYS[t.fromAccount];
      const inn = ACCOUNT_KEYS[t.toAccount];
      if (!out || !inn) return;
      balance[out] -= Number(t.amount || 0);
      balance[inn] += Number(t.amount || 0);
      const c = Number(t.charge || 0);
      if (c > 0 && ACCOUNT_KEYS[t.chargeAccount || t.fromAccount]) balance[ACCOUNT_KEYS[t.chargeAccount || t.fromAccount]] -= c;
    });

    // Flows inside the requested range.
    const [payRange, exRange, trRange] = await Promise.all([
      Payment.find({ receiveDate: { $gte: fromDate, $lte: toDate }, paymentStatus: "Completed", isVoided: { $ne: true } }).sort({ receiveDate: 1 }),
      Expense.find({ date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1 }),
      FundTransfer.find({ date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1 }),
    ]);

    const rows = [];
    const total = () => balance.cash + balance.bkash + balance.bank;

    ACCOUNTS.forEach((acct) => {
      const k = ACCOUNT_KEYS[acct];
      rows.push({
        date: csvDate(fromDate),
        type: "Opening Balance",
        description: `${acct} opening on ${csvDate(pStart)}`,
        from: acct,
        to: acct,
        amount: balance[k],
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
          const k = fundKeyOf(p.paymentMethod);
          const amt = Number(p.paidAmount || 0);
          if (k) balance[k] += amt;
          rows.push({
            date: csvDate(p.receiveDate),
            type: "Payment",
            description: `${p.studentName || p.studentId}${p.receiptNo ? ` (${p.receiptNo})` : ""} [${p.paymentMethod}]`,
            from: "Student",
            to: k ? KEY_ACCOUNTS[k] : p.paymentMethod || "Cash",
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
          const k = ACCOUNT_KEYS[e.account];
          const amt = Number(e.amount || 0);
          balance[k] -= amt;
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
          const out = ACCOUNT_KEYS[t.fromAccount];
          const inn = ACCOUNT_KEYS[t.toAccount];
          if (!out || !inn) return;
          const amt = Number(t.amount || 0);
          balance[out] -= amt;
          balance[inn] += amt;
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
            const ck = ACCOUNT_KEYS[t.chargeAccount || t.fromAccount];
            balance[ck] -= c;
            rows.push({
              date: csvDate(t.date),
              type: "Transfer Charge",
              description: `${t.chargeAccount || t.fromAccount} charge on transfer`,
              from: t.chargeAccount || t.fromAccount,
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

    rows.push(
      { date: "", type: "CLOSING", description: "Cash balance", from: "", to: "", amount: balance.cash, charge: "", balance: "" },
      { date: "", type: "CLOSING", description: "bKash balance", from: "", to: "", amount: balance.bkash, charge: "", balance: "" },
      { date: "", type: "CLOSING", description: "Bank balance", from: "", to: "", amount: balance.bank, charge: "", balance: "" },
      { date: "", type: "CLOSING", description: "Total in hand", from: "", to: "", amount: total(), charge: "", balance: "" }
    );

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

    if (!ACCOUNTS.includes(account)) {
      return res.status(400).json({ success: false, message: "Please select a valid account." });
    }
    const amt = Number(amount || 0);
    if (!(amt > 0)) {
      return res.status(400).json({ success: false, message: "Expense amount must be greater than 0." });
    }

    const settings = await Settings.getSettings();
    await Expense.create({
      account,
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

    if (!ACCOUNTS.includes(fromAccount) || !ACCOUNTS.includes(toAccount)) {
      return res.status(400).json({ success: false, message: "Please select a valid account." });
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
    const chgAcct = chargeAccount || fromAccount;
    if (!ACCOUNTS.includes(chgAcct)) {
      return res.status(400).json({ success: false, message: "Invalid charge account." });
    }

    const settings = await Settings.getSettings();
    await FundTransfer.create({
      fromAccount,
      toAccount,
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
    const required = ["cash", "bkash", "bank"];
    const values = openingBalances || {};

    for (const key of required) {
      const v = Number(values[key]);
      if (values[key] === undefined || values[key] === null || values[key] === "" || !(v >= 0)) {
        return res.status(400).json({
          success: false,
          message: `Please enter a valid opening balance for ${KEY_ACCOUNTS[key]}.`,
        });
      }
    }

    const currentPeriod = await getCurrentPeriod();
    const { accounts } = await computeAccounts(currentPeriod);

    const closing = {};
    accounts.forEach((a) => { closing[ACCOUNT_KEYS[a.key]] = a.current; });

    const settings = await Settings.getSettings();
    await StatementPeriod.create({
      periodStart: new Date(),
      academicSession: settings.currentSession,
      openingBalances: {
        cash: Number(values.cash),
        bkash: Number(values.bkash),
        bank: Number(values.bank),
      },
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