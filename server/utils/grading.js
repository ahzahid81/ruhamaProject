const GRADE_TABLE = [
  { min: 80, grade: "A+", gradePoint: 5.0 },
  { min: 70, grade: "A", gradePoint: 4.0 },
  { min: 60, grade: "A-", gradePoint: 3.5 },
  { min: 50, grade: "B", gradePoint: 3.0 },
  { min: 40, grade: "C", gradePoint: 2.0 },
  { min: 33, grade: "D", gradePoint: 1.0 },
  { min: 0, grade: "F", gradePoint: 0.0 },
];

const DIVISION_TABLE = [
  { min: 5.0, division: "Outstanding", grade: "A+" },
  { min: 4.0, division: "Excellent", grade: "A" },
  { min: 3.5, division: "Very Good", grade: "A-" },
  { min: 3.0, division: "Good", grade: "B" },
  { min: 2.0, division: "Average", grade: "C" },
  { min: 1.0, division: "Pass", grade: "D" },
  { min: 0.0, division: "Fail", grade: "F" },
];

const getGrade = (obtained, passMarks = 33, fullMarks = 100) => {
  const normalized = Math.max(0, Number(obtained) || 0);
  const rule = GRADE_TABLE.find((g) => normalized >= g.min);
  const point = rule ? rule.gradePoint : 0;

  if (rule && rule.grade === "F") {
    return { grade: "F", gradePoint: 0, status: "Fail" };
  }

  if (passMarks && normalized < passMarks) {
    return { grade: "F", gradePoint: 0, status: "Fail" };
  }

  return {
    grade: rule ? rule.grade : "F",
    gradePoint: point,
    status: "Pass",
  };
};

const getDivision = (gpa) => {
  const rule = DIVISION_TABLE.find((d) => gpa >= d.min);
  return rule || DIVISION_TABLE[DIVISION_TABLE.length - 1];
};

module.exports = {
  getGrade,
  getDivision,
  GRADE_TABLE,
  DIVISION_TABLE,
};
