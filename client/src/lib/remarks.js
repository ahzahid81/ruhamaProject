export const getRemark = (percentage, isAbsent = false) => {
  if (isAbsent) return "Absent";
  if (percentage >= 95) return "Outstanding";
  if (percentage >= 90) return "Excellent";
  if (percentage >= 85) return "Brilliant";
  if (percentage >= 80) return "Superb";
  if (percentage >= 75) return "Very Good";
  if (percentage >= 70) return "Good";
  if (percentage >= 65) return "Above Average"; 
  if (percentage >= 60) return "Satisfactory";
  if (percentage >= 55) return "Fair";
  if (percentage >= 50) return "Below Average";
  if (percentage >= 45) return "Needs More Focus";
  if (percentage >= 40) return "Needs More Hard Work";
  return "Fail";
};