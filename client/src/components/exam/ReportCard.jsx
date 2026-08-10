import logo from "../../assets/logo.png";
import { QRCodeSVG } from "qrcode.react";

const GRADING_SYSTEM = [
  { grade: "A+", range: "80-100", point: "5.00" },
  { grade: "A", range: "70-79", point: "4.00" },
  { grade: "A-", range: "60-69", point: "3.50" },
  { grade: "B", range: "50-59", point: "3.00" },
  { grade: "C", range: "40-49", point: "2.00" },
  { grade: "D", range: "33-39", point: "1.00" },
  { grade: "F", range: "0-32", point: "0.00" },
];

const getRemark = (percentage) => {
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

const SignatureCard = ({ title }) => (
  <div className="text-center">
    <div className="h-8 border-b-2 border-dashed border-slate-300 mx-4" />
    <p className="mt-1 text-xl font-semibold text-slate-600">{title}</p>
  </div>
);

const ReportCard = ({ data, id }) => {
  const { exam, student, result } = data;
  const isFail = result.status === "Fail";
  const isAbsent = result.status === "Absent";
  const entries = result.entries || [];
  const isHifz = !!result.isHifz;

  return (
    <div
      id={id}
      className="report-card bg-white shadow-xl mx-auto overflow-hidden w-full max-w-[210mm] flex flex-col print:shadow-none print:border-none"
    >
      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-[#07153B] via-[#12308F] to-[#07153B] text-white px-6 py-4 flex justify-center items-center overflow-hidden">
        <div className="pointer-events-none select-none absolute -top-14 -left-14 w-44 h-44 bg-white/5 rounded-full" />
        <div className="pointer-events-none select-none absolute -bottom-16 -right-14 w-52 h-52 bg-white/5 rounded-full" />
        <div className="pointer-events-none select-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[3px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-yellow-400/40">
            <img src={logo} alt="School Logo" className="w-14 h-14 object-contain" />
          </div>
          <div>
            <h1 className="text-center text-3xl font-black uppercase tracking-wide">Ruhama United School</h1>
            <p className="text-center text-[12px] text-yellow-300 font-semibold tracking-wide">Change Yourself, Decorate The World</p>
            <p className="text-center text-[10px] text-white/70 font-medium">An English Version School with Tahfizul Quran</p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 px-6 py-3 relative flex flex-col min-h-0">
        {/* Watermark Logo */}
        <img
          src={logo}
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] opacity-[0.04] pointer-events-none select-none"
        />

        {/* EXAM BADGE */}
        <div className="relative flex justify-center">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 text-[#07153B] px-7 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-md">
            {exam.examName} — Result Sheet
          </div>
        </div>
        <p className="relative text-center text-[10px] text-slate-500 mt-1 mb-2">
          Academic Session: {exam.academicSession}
        </p>

        {/* PHOTO (LEFT) | INFO (MIDDLE) | GRADING SYSTEM (RIGHT) */}
        <div className="relative flex-shrink-0 grid grid-cols-12 gap-4 items-stretch">
          {/* Photo */}
          <div className="col-span-3 flex flex-col">
            <div className="flex-1 border border-slate-200 rounded-xl p-1.5 bg-white shadow-sm flex flex-col">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="flex-1 w-full min-h-0 object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="flex-1 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-4xl bg-slate-50">
                  👤
                </div>
              )}
            </div>
            {/* <div className="mt-1.5 bg-gradient-to-r from-[#07153B] to-[#12308F] text-white rounded-md py-1 text-center font-bold tracking-widest text-[11px]">
              {student.studentId}
            </div> */}
          </div>

          {/* Info (middle) */}
          <div className="col-span-5 flex flex-col">
            <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] rounded-lg px-4 py-2.5">
              <h2 className="text-lg font-black text-white leading-tight">{student.name}</h2>
              <p className="text-[10px] text-indigo-200 mt-0.5">Student Profile</p>
            </div>

            <div className="mt-2 flex-1 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {[
                { label: "Class", value: student.className },
                { label: "Section", value: student.section },
                { label: "Student ID", value: student.studentId },
                { label: "Session", value: exam.academicSession },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-3 py-1.5 bg-white odd:bg-slate-50/50">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{row.label}</span>
                  <span className="text-xs font-bold text-[#07153B]">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              {isHifz && (
                <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-wider">
                  Hifz Student
                </span>
              )}
              {/* <span className={`px-3 py-1 rounded-full font-black text-[11px] ${isFail ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                {isFail ? "❌ Failed" : "✅ Passed"}
              </span> */}
            </div>
          </div>

          {/* Grading System (right) */}
          <div className="col-span-4 flex flex-col h-full">
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
              <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-2 py-1 text-center">
                <h3 className="text-[10px] font-bold tracking-wide uppercase">Grading System</h3>
              </div>
              <table className="w-full text-[10px]">
                <tbody className="divide-y divide-gray-100">
                  {GRADING_SYSTEM.map((row, i) => (
                    <tr key={row.grade} className={i % 2 ? "bg-slate-50/50" : "bg-white"}>
                      <td className="px-2 py-0.5 text-center font-black text-[#07153B]">{row.grade}</td>
                      <td className="px-2 py-0.5 text-center text-slate-600">{row.range}</td>
                      <td className="px-2 py-0.5 text-center font-semibold text-slate-600">{row.point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MARKS TABLE */}
        <div className="relative mt-2 flex-1 min-h-0 rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="flex-shrink-0 bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-3 py-1.5 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wide">📊 Marks Sheet</h2>
            <span className="text-[10px] text-indigo-200 font-medium">{entries.length} Subjects</span>
          </div>
          <div className="bg-white flex-1 min-h-0 overflow-hidden flex flex-col">
            <table className="w-full text-xs flex-1 flex flex-col">
              <thead className="flex-shrink-0">
                <tr className="bg-slate-100 text-left text-[10px] text-slate-500 uppercase tracking-wider flex">
                  <th className="px-3 py-2 font-bold text-slate-600 flex-[2]">Subject</th>
                  <th className="px-2 py-2 text-center font-bold text-slate-600 flex-1">Full</th>
                  <th className="px-2 py-2 text-center font-bold text-slate-600 flex-1">Obtained</th>
                  <th className="px-2 py-2 text-center font-bold text-slate-600 flex-1">Grade</th>
                  <th className="px-2 py-2 text-center font-bold text-slate-600 flex-1">Point</th>
                  <th className="px-2 py-2 text-center font-bold text-slate-600 flex-1">Result</th>
                </tr>
              </thead>
              <tbody className="flex-1 flex flex-col divide-y divide-gray-100 overflow-hidden">
                {entries.map((e, i) => (
                  <tr key={i} className={`flex flex-1 items-center ${i % 2 ? "bg-slate-50/60" : "bg-white"}`}>
                    <td className="px-3 font-medium text-[#07153B] flex-[2] truncate">{e.subjectName}</td>
                    <td className="px-2 text-center text-slate-500 flex-1">{e.fullMarks}</td>
                    <td className={`px-2 text-center font-semibold flex-1 ${e.status === "Fail" ? "text-red-600" : e.status === "Absent" ? "text-amber-600" : "text-[#07153B]"}`}>
                      {e.status === "Absent" ? "—" : e.obtainedMarks}
                    </td>
                    <td className="px-2 text-center flex-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status === "Fail" ? "bg-red-50 text-red-700" : e.status === "Absent" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {e.grade}
                      </span>
                    </td>
                    <td className="px-2 text-center font-semibold flex-1">{e.status === "Absent" ? "—" : e.gradePoint.toFixed(1)}</td>
                    <td className={`px-2 text-center font-bold flex-1 ${e.status === "Fail" ? "text-red-600" : e.status === "Absent" ? "text-amber-600" : "text-emerald-600"}`}>
                      {e.status === "Absent" ? "Absent" : e.status}
                    </td>
                  </tr>
                ))}
                <tr className="flex flex-shrink-0 bg-gradient-to-r from-[#07153B] to-[#12308F] font-bold text-white items-center">
                  <td className="px-3 py-1.5 flex-[2]">Total</td>
                  <td className="px-2 py-1.5 text-center flex-1">{result.totalFullMarks}</td>
                  <td className="px-2 py-1.5 text-center flex-1">{result.totalObtained}</td>
                  <td className="px-2 py-1.5 text-center flex-1">{result.grade || "—"}</td>
                  <td className="px-2 py-1.5 text-center flex-1">{isAbsent ? "—" : isFail ? "0.00" : result.gpa.toFixed(2)}</td>
                  <td className={`px-2 py-1.5 text-center font-black flex-1 ${isFail ? "text-red-300" : isAbsent ? "text-amber-300" : "text-emerald-300"}`}>{result.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FINAL RESULT SUMMARY */}
        <div className="relative mt-2 flex-shrink-0 grid grid-cols-4 gap-2">
          {[
            { label: "GPA", value: isAbsent ? "—" : isFail ? "0.00" : result.gpa.toFixed(2), color: isFail ? "text-red-600" : isAbsent ? "text-amber-600" : "text-indigo-700" },
            { label: "Grade", value: result.grade || "—", color: isFail ? "text-red-600" : isAbsent ? "text-amber-600" : "text-emerald-600" },
            { label: "Remarks", value: isAbsent ? "Absent" : isFail ? "Fail" : getRemark(result.percentage), color: isAbsent ? "text-amber-600" : "text-indigo-700" },
            { label: "Percentage", value: isAbsent ? "—" : `${result.percentage}%`, color: "text-[#07153B]" },
          ].map((item) => (
            <div key={item.label} className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-lg py-1.5 text-center shadow-sm">
              <p className="text-[9px] text-slate-400 uppercase font-medium tracking-wide">{item.label}</p>
              <p className={`text-base font-black ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* QR + VERIFICATION + SEAL */}
        <div className="relative mt-10 flex-shrink-0 grid grid-cols-3 gap-4 items-center">
          <div className="border rounded-xl p-1.5 text-center bg-slate-50">
            <div className="flex justify-center">
              <QRCodeSVG
                value={JSON.stringify({
                  id: student.studentId,
                  name: student.name,
                  class: student.className,
                  session: exam.academicSession,
                  gpa: isFail || isAbsent ? "0.00" : result.gpa.toFixed(2),
                })}
                size={100}
                includeMargin
              />
            </div>
            <p className="mt-0.5 text-[9px] text-slate-500 font-medium">🔍 Scan for Verification</p>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <p className={`text-4xl font-black ${isFail ? "text-red-500" : isAbsent ? "text-amber-500" : "text-emerald-500"}`}>
              {isFail ? "❌" : isAbsent ? "⛔" : "✅"}
            </p>
            <p className={`text-lg font-black tracking-wide ${isFail ? "text-red-600" : isAbsent ? "text-amber-600" : "text-emerald-600"}`}>
              {isFail ? "FAILED" : isAbsent ? "ABSENT" : "PASSED"}
            </p>
            <p className="text-[10px] text-slate-500">Final Result</p>
          </div>

          <div className="border-2 border-dashed rounded-full w-40 h-40 mx-auto flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-slate-400">Official Seal</p>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="relative mt-20 grid grid-cols-3 gap-6">
          <SignatureCard title="Class Teacher" />
          <SignatureCard title="Guardian" />
          <SignatureCard title="Principal" />
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
