export const getRemark = (percentage, isAbsent = false) => {
  if (isAbsent) return "Absent";
  if (percentage >= 95) return "Outstanding";
  if (percentage >= 90) return "Excellent";
  if (percentage >= 85) return "Very Good";
  if (percentage >= 80) return "Good";
  if (percentage >= 75) return "Above Average";
  if (percentage >= 70) return "Average";
  if (percentage >= 65) return "Satisfactory";
  if (percentage >= 60) return "Fair";
  if (percentage >= 55) return "Below Average";
  if (percentage >= 50) return "Poor";
  if (percentage >= 45) return "Very Poor";
  if (percentage >= 40) return "Weak";
  return "Fail";
};