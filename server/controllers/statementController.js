const Expense = require("../models/Expense");
const FundTransfer = require("../models/FundTransfer");
const StatementPeriod = require("../models/StatementPeriod");
const Payment = require("../models/Payment");
const Settings = require("../models/Settings");

const ACCOUNTS = ["Cash", "bKash", "Bank"];
const ACCOUNT_KEYS = { Cash: "cash", bKash: "bkash", Bank: "bank" };
const KEY_ACCOUNTS = { cash: "Cash", bkash: "bKash", bank: "Bank" };

// Map a payment method to one of the three tracked fund accounts.
// Cash -> Cash, Bank/Cheque -> Bank, everything else (bKash, Nagad,
// Rocket, Card, Online, Other) -> mobile/online money held in bKash.
const methodToAccountKey = (method) => {
  const m = String(method || "").toLowerCase().replace(/[\s_-]/g, "");
  if (m === "cash") return "cash";
  if (m === "bank" || m === "cheque") return "bank";
  return "bkash";
};

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

  const [payments, transfers, expenses] = await Promise.all([
    Payment.find({ receiveDate: { $gte: since }, paymentStatus: "Completed", isVoided: { $ne: true } }),
    FundTransfer.find({ date: { $gte: since } }),
    Expense.find({ date: { $gte: since } }),
  ]);

  const income = { cash: 0, bkash: 0, bank: 0 };
  payments.forEach((p) => {
    income[methodToAccountKey(p.paymentMethod)] += Number(p.paidAmount || 0);
  });

  const expenseBy = { cash: 0, bkash: 0, bank: 0 };
  expenses.forEach((e) => {
    expenseBy[ACCOUNT_KEYS[e.account]] += Number(e.amount || 0);
  });

  const transferIn = { cash: 0, bkash: 0, bank: 0 };
  const transferOut = { cash: 0, bkash: 0, bank: 0 };
  const charges = { cash: 0, bkash: 0, bank: 0 };
  transfers.forEach((t) => {
    transferIn[ACCOUNT_KEYS[t.toAccount]] += Number(t.amount || 0);
    transferOut[ACCOUNT_KEYS[t.fromAccount]] += Number(t.amount || 0);
    const chg = Number(t.charge || 0);
    if (chg > 0) {
      charges[ACCOUNT_KEYS[t.chargeAccount || t.fromAccount]] += chg;
    }
  });

  const accounts = ACCOUNTS.map((acct) => {
    const k = ACCOUNT_KEYS[acct];
    const opening = Number(period.openingBalances[k] || 0);
    const current =
      opening + income[k] - expenseBy[k] + transferIn[k] - transferOut[k] - charges[k];
    return {
      key: acct,
      opening,
      income: income[k],
      expense: expenseBy[k],
      transferIn: transferIn[k],
      transferOut: transferOut[k],
      charges: charges[k],
      current,
    };
  });

  return {
    accounts,
    totals: {
      opening: accounts.reduce((s, a) => s + a.opening, 0),
      income: accounts.reduce((s, a) => s + a.income, 0),
      expense: accounts.reduce((s, a) => s + a.expense, 0),
      transferIn: accounts.reduce((s, a) => s + a.transferIn, 0),
      transferOut: accounts.reduce((s, a) => s + a.transferOut, 0),
      charges: accounts.reduce((s, a) => s + a.charges, 0),
      inHand: accounts.reduce((s, a) => s + a.current, 0),
    },
  };
}

// ============================================
// GET FULL STATEMENT
// ============================================

const getStatement = async (req, res) => {
  try {
    const period = await getCurrentPeriod();
    const { accounts, totals } = await computeAccounts(period);

    const [recentExpenses, recentTransfers, history, settings] = await Promise.all([
      Expense.find().sort({ date: -1, createdAt: -1 }).limit(50),
      FundTransfer.find().sort({ date: -1, createdAt: -1 }).limit(50),
      StatementPeriod.find().sort({ periodStart: -1 }).limit(20),
      Settings.getSettings(),
    ]);

    return res.json({
      success: true,
      period: {
        _id: period._id,
        periodStart: period.periodStart,
        academicSession: period.academicSession || settings.currentSession,
        openingBalances: period.openingBalances,
        note: period.note,
      },
      accounts,
      totals,
      recentExpenses,
      recentTransfers,
      history: history.map((h, i) => ({
        _id: h._id,
        periodStart: h.periodStart,
        academicSession: h.academicSession,
        openingBalances: h.openingBalances,
        closingBalances: h.closingBalances,
        note: h.note,
        createdAt: h.createdAt,
      })),
    });
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
    const expense = await Expense.create({
      account,
      category: String(category || "").trim(),
      description: String(description || "").trim(),
      amount: amt,
      date: date ? new Date(date) : new Date(),
      academicSession: settings.currentSession,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({ success: true, expense });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    return res.json({ success: true, message: "Expense deleted." });
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
    const transfer = await FundTransfer.create({
      fromAccount,
      toAccount,
      amount: amt,
      charge: chg,
      chargeAccount: chgAcct,
      note: String(note || "").trim(),
      date: date ? new Date(date) : new Date(),
      academicSession: settings.currentSession,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({ success: true, transfer });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFundTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    await FundTransfer.findByIdAndDelete(id);
    return res.json({ success: true, message: "Transfer deleted." });
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
    const newPeriod = await StatementPeriod.create({
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

    return res.status(201).json({
      success: true,
      message: "Audit closed and account reset. Counting restarted.",
      period: newPeriod,
      closedBalances: closing,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStatement,
  addExpense,
  deleteExpense,
  addFundTransfer,
  deleteFundTransfer,
  resetAccount,
};