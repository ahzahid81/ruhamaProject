const Settings = require("../models/Settings");

// ======================================================
// CLASS-ORDER AWARE STUDENT SORTING
// Orders students by class order (from Settings + default
// fallback), then boys before girls, then numerically by
// their trailing student id serial.
// ======================================================

const DEFAULT_CLASSES = [
  { name: "Play Group", code: "P", order: 1 },
  { name: "Nursery", code: "N", order: 2 },
  { name: "KG", code: "K", order: 3 },
  { name: "STD-I", code: "I", order: 4 },
  { name: "STD-II", code: "J", order: 5 },
  { name: "STD-III", code: "L", order: 6 },
  { name: "STD-IV", code: "M", order: 7 },
  { name: "STD-V", code: "V", order: 8 },
];

const getClassOrderMap = (classes = []) => {
  const list = classes && classes.length ? classes : DEFAULT_CLASSES;
  const map = {};
  list.forEach((c, i) => { map[c.name] = c.order ?? i + 1; });
  return map;
};

const getNumericId = (studentId = "") => {
  const match = String(studentId).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const getGenderRank = (s = {}) => {
  const g = String(s.gender || "")
    .trim()
    .toLowerCase();
  if (g.startsWith("m") || g.startsWith("b") || g.startsWith("boy")) return 0;
  if (g.startsWith("f") || g.startsWith("g") || g.startsWith("girl")) return 1;
  // fallback: infer from student id code (RB = boy, RG = girl)
  const m = String(s.studentId || "").match(/[A-Za-z]?([BG])[A-Za-z]/);
  if (m) return m[1] === "B" ? 0 : 1;
  return 0;
};

const sortStudentsByClassAndId = (students = []) => {
  return students.sort((a, b) => {
    const orderA = a._classOrder ?? 0;
    const orderB = b._classOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    const rankA = getGenderRank(a);
    const rankB = getGenderRank(b);
    if (rankA !== rankB) return rankA - rankB;
    const idA = getNumericId(a.studentId);
    const idB = getNumericId(b.studentId);
    if (idA !== null && idB !== null) return idA - idB;
    return String(a.studentId || "").localeCompare(String(b.studentId || ""));
  });
};

const attachClassOrder = (students = [], className) => {
  const map = getClassOrderMap(className);
  return students.map((s) => ({ ...s, _classOrder: map[s.className] ?? 999 }));
};

const sortStudents = async (students = []) => {
  let classList = null;
  try {
    const settings = await Settings.getSettings();
    classList = settings?.classes;
  } catch {
    // Never fail a student read because of a settings hiccup;
    // fall back to the default class order.
  }
  const decorated = attachClassOrder(students, classList);
  const sorted = sortStudentsByClassAndId(decorated);
  sorted.forEach((s) => { delete s._classOrder; });
  return sorted;
};

module.exports = {
  DEFAULT_CLASSES,
  getClassOrderMap,
  getNumericId,
  sortStudentsByClassAndId,
  attachClassOrder,
  sortStudents,
};