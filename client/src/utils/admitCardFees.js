const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const examRequiredRows = (exam, examName) => {
  if (!exam?.requiredFees) return [];
  const rows = [];
  exam.requiredFees.forEach((r) => {
    const base = {
      feeCategory: r.feeCategory?._id || r.feeCategory,
      applicableType: r.applicableType,
      year: r.year || null,
      examName: r.applicableType === "Exam" ? examName : "",
      customTitle: r.customTitle || "",
    };
    // A "Month" fee row covers monthFrom → month (default Jan → exam month).
    if (r.applicableType === "Month") {
      const from = Math.max(1, Number(r.monthFrom) || 1);
      const to = Math.min(12, Number(r.month) || 0);
      if (!to || from > to) return;
      for (let m = from; m <= to; m++) rows.push({ ...base, month: m });
    } else {
      rows.push({ ...base, month: r.month || null });
    }
  });
  return rows;
};

const filterDueItems = (dueItems, requiredRows) => {
  if (requiredRows.length === 0) return [];
  return dueItems.filter((d) => {
    return requiredRows.some((r) => {
      if (r.feeCategory && String(d.feeCategory) !== String(r.feeCategory)) return false;
      if (r.applicableType !== d.applicableType) return false;
      if (r.applicableType === "Month") {
        return Number(d.month) === Number(r.month) && Number(d.year) === Number(r.year);
      }
      if (r.applicableType === "Exam") {
        return d.examName === r.examName;
      }
      return true;
    });
  });
};

// Builds the "Required Fees" display data for an admit card from the
// student's fee ledger (all fee data). Only fees that are selected on the
// exam AND actually apply to this student are included, with contiguous
// monthly selections grouped into month ranges.
const buildAdmitCardFeeData = (exam, feeLedger, dueItems) => {
  const examName = exam?.examName || "";
  const sessionYear = Number(exam?.academicSession) || new Date().getFullYear();
  const requiredRows = examRequiredRows(exam, examName);
  const filteredDueItems = filterDueItems(dueItems, requiredRows);

  const items = [];
  const monthByFc = new Map();

  requiredRows.forEach((r) => {
    const fc = r.feeCategory?._id || r.feeCategory || "";
    const applicableType = r.applicableType || "";
    const label = r.feeCategory?.name || r.customTitle || applicableType || "Fee";
    const year = Number(r.year) || sessionYear;
    const examNameMatch = applicableType === "Exam" ? examName : "";

    const ledger = feeLedger.find(
      (f) => String(f.feeCategory || "") === String(fc) && f.applicableType === applicableType
    );

    // MONTHLY FEES: collect every month covered by the exam requirement, then
    // group the contiguous months into ranges for display.
    if (applicableType === "Month") {
      const from = Math.max(1, Number(r.monthFrom) || 1);
      const to = Math.min(12, Number(r.month) || 0);
      if (!to || from > to) return;
      if (!monthByFc.has(fc)) monthByFc.set(fc, { label, year, months: [], ledger });
      const entry = monthByFc.get(fc);
      entry.months.push({ from, to });
      return;
    }

    const due = filteredDueItems.find((d) =>
      String(d.feeCategory || "") === String(fc) &&
      d.applicableType === applicableType &&
      (applicableType !== "Exam" || d.examName === examNameMatch)
    );

    let amount = 0, paidAmount = 0, dueAmount = 0, discount = 0, status = "Due", waived = false;
    let resolved = false;

    if (applicableType === "Exam" && ledger?.exams) {
      const ee = ledger.exams.find((x) => x.examName === examNameMatch);
      if (ee) {
        amount = Number(ee.amount || 0);
        paidAmount = Number(ee.paidAmount || 0);
        dueAmount = Number(ee.dueAmount || 0);
        discount = Number(ee.discount || 0);
        status = ee.status || (dueAmount > 0 ? "Due" : "Paid");
        waived = Boolean(ee.waived);
        resolved = true;
      }
    } else if (ledger) {
      amount = Number(ledger.amount || 0);
      paidAmount = Number(ledger.paidAmount || 0);
      dueAmount = Number(ledger.dueAmount || 0);
      discount = Number(ledger.discount || 0);
      status = ledger.status || (dueAmount > 0 ? "Due" : "Paid");
      waived = Boolean(ledger.waived);
      resolved = true;
    }

    if (due) {
      amount = Number(due.amount || 0);
      discount = Number(due.discount || 0);
      dueAmount = Math.max(0, amount - discount);
      paidAmount = 0;
      status = "Due";
      resolved = true;
    }

    // Fee doesn't apply to this student (not in the ledger and nothing due) → skip.
    if (!resolved) return;

    items.push({
      id: `${fc}_${applicableType}_${year}_${examName}`,
      label,
      period: applicableType === "Exam"
        ? examNameMatch
        : applicableType === "Year"
          ? String(year)
          : applicableType,
      amount,
      paidAmount,
      dueAmount,
      discount,
      status,
      waived,
    });
  });

  // Resolve monthly requirements grouped into contiguous month ranges.
  monthByFc.forEach((entry, fc) => {
    const monthSet = new Set();
    entry.months.forEach(({ from, to }) => {
      for (let m = from; m <= to; m++) monthSet.add(m);
    });
    const sorted = [...monthSet].sort((a, b) => a - b);

    const runs = [];
    let run = [];
    sorted.forEach((m) => {
      if (run.length === 0 || m === run[run.length - 1] + 1) run.push(m);
      else { runs.push(run); run = [m]; }
    });
    if (run.length) runs.push(run);

    runs.forEach((runArr) => {
      const from = runArr[0];
      const to = runArr[runArr.length - 1];
      const year = entry.year || sessionYear;

      let amount = 0, paidAmount = 0, dueAmount = 0, discount = 0;
      let anyResolved = false;

      if (entry.ledger?.months) {
        for (let m = from; m <= to; m++) {
          const mm = entry.ledger.months.find((x) => Number(x.month) === m && Number(x.year) === year);
          if (!mm) continue;
          anyResolved = true;
          amount += Number(mm.amount || 0);
          paidAmount += Number(mm.paidAmount || 0);
          dueAmount += Number(mm.dueAmount || 0);
          discount += Number(mm.discount || 0);
        }
      }

      if (!anyResolved) {
        const dueMonths = filteredDueItems.filter(
          (d) =>
            String(d.feeCategory || "") === String(fc) &&
            d.applicableType === "Month" &&
            Number(d.year) === year &&
            Number(d.month) >= from &&
            Number(d.month) <= to
        );
        dueMonths.forEach((d) => {
          const net = Math.max(0, Number(d.amount || 0) - Number(d.discount || 0));
          amount += net;
          dueAmount += net;
          discount += Number(d.discount || 0);
        });
        anyResolved = dueMonths.length > 0;
      }

      // Fee doesn't apply to this student → skip.
      if (!anyResolved) return;

      items.push({
        id: `${fc}_Month_${from}-${to}_${year}`,
        label: entry.label,
        period: from === to
          ? `${months[from - 1]} ${year}`
          : `${months[from - 1]} ${year} – ${months[to - 1]} ${year}`,
        amount,
        paidAmount,
        dueAmount,
        discount,
        status: dueAmount <= 0 && paidAmount <= 0 && amount > 0
          ? "Waived"
          : dueAmount > 0 ? (paidAmount > 0 ? "Partial" : "Due") : "Paid",
        waived: dueAmount <= 0 && paidAmount <= 0 && amount > 0,
      });
    });
  });

  return { items, filteredDueItems };
};

export { buildAdmitCardFeeData };