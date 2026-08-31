const BD_TIMEZONE = "Asia/Dhaka";

const get = (parts, type) => parts.find((p) => p.type === type)?.value;

function partsOf(date, opts) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BD_TIMEZONE,
    ...opts,
  }).formatToParts(date || new Date());
}

// Current date in Bangladesh as "YYYY-MM-DD" (for date input defaults)
export function bdToday() {
  const p = partsOf(new Date(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${get(p, "year")}-${get(p, "month")}-${get(p, "day")}`;
}

// A Date object holding the Bangladesh wall-clock parts (so getMonth/getFullYear are BD)
export function bdNow() {
  const p = partsOf(new Date(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return new Date(
    Number(get(p, "year")),
    Number(get(p, "month")) - 1,
    Number(get(p, "day")),
    Number(get(p, "hour")),
    Number(get(p, "minute")),
    Number(get(p, "second"))
  );
}

export function bdYear() {
  return bdNow().getFullYear();
}

export function bdMonth() {
  return bdNow().getMonth() + 1;
}

// Format a date as "DD/MM/YYYY" in Bangladesh time
export function bdDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  const p = partsOf(d, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${get(p, "day")}/${get(p, "month")}/${get(p, "year")}`;
}

// Long format: "5 August 2026", or with weekday "Monday, 5 August 2026".
// Pass shortMonth: true for "5 Aug 2026".
export function bdDateLong(value, { weekday = false, shortMonth = false } = {}) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  const p = partsOf(d, {
    weekday: weekday ? "long" : undefined,
    day: "numeric",
    month: shortMonth ? "short" : "long",
    year: "numeric",
  });
  const builder = [];
  if (weekday) builder.push(get(p, "weekday") + ",");
  builder.push(`${get(p, "day")} ${get(p, "month")} ${get(p, "year")}`);
  return builder.join(" ");
}

// Weekday only, e.g. "Saturday"
export function bdWeekday(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BD_TIMEZONE,
    weekday: "long",
  }).format(d);
}

// Date + time in Bangladesh, e.g. "5 Aug 2026, 3:45 PM"
export function bdDateTime(value, { shortMonth = false } = {}) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  const p = partsOf(d, {
    day: "numeric",
    month: shortMonth ? "short" : "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${get(p, "day")} ${get(p, "month")} ${get(p, "year")}, ${get(p, "hour")}:${get(p, "minute")} ${get(p, "dayPeriod") ?? ""}`.trim();
}

// A date value as "YYYY-MM-DD" in Bangladesh time (for <input type="date"> values)
export function bdDateInput(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const p = partsOf(d, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${get(p, "year")}-${get(p, "month")}-${get(p, "day")}`;
}