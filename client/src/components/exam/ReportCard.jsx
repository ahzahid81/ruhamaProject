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

const InfoItem = ({ label, value }) => (
  <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
    <p className="text-[12px] font-bold text-[#07153B] truncate">{value || "—"}</p>
  </div>
);

const SignatureCard = ({ title }) => (
  <div className="text-center">
    <div className="h-8 border-b-2 border-dashed border-slate-300 mx-4" />
    <p className="mt-1 text-xs font-semibold text-slate-600">{title}</p>
  </div>
);

const ReportCard = ({ data, id }) => {
  const { exam, student, result } = data;
  const isFail = result.status === "Fail";
  const entries = result.entries || [];
  const isHifz = !!result.isHifz;

  const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-GB") : "—";

  return (
    <div
      id={id}
      className="report-card bg-white shadow-xl mx-auto overflow-hidden w-full max-w-[210mm] print:w-[210mm] print:shadow-none print:border-none"
    >
      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-[#07153B] via-[#12308F] to-[#07153B] text-white px-5 py-3 flex justify-center items-center overflow-hidden">
        <div className="pointer-events-none select-none absolute -top-12 -left-12 w-40 h-40 bg-white/5 rounded-full" />
        <div className="pointer-events-none select-none absolute -bottom-14 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="pointer-events-none select-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-yellow-400/70" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ring-4 ring-yellow-400/40">
            <img src={logo} alt="School Logo" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <h1 className="text-center text-[22px] font-black uppercase tracking-wide">Ruhama United School</h1>
            <p className="text-center text-[11px] text-yellow-300 font-medium">Change Yourself, Decorate The World</p>
            <p className="text-center text-[10px] text-white/70">An English Version School with Tahfizul Quran</p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-5 py-3 relative">
        {/* Watermark Logo */}
        <img
          src={logo}
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] opacity-[0.04] pointer-events-none select-none"
        />

        {/* EXAM BADGE */}
        <div className="relative flex justify-center">
          <div className="bg-gradient-to-r from-yellow-400 to-amber-400 text-[#07153B] px-6 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-md">
            {exam.examName} — Result Sheet
          </div>
        </div>
        <p className="relative text-center text-[10px] text-slate-500 mt-1 mb-2">Academic Session: {exam.academicSession}</p>

        {/* PHOTO + IDENTITY */}
        <div className="relative grid grid-cols-12 gap-4">
          {/* Photo */}
          <div className="col-span-3">
            <div className="bg-gradient-to-b from-slate-50 to-white border-2 border-slate-200 rounded-2xl p-2 shadow-md">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-full aspect-[3/4] object-cover rounded-xl border-4 border-white shadow-inner"
                />
              ) : (
                <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-5xl bg-slate-50">
                  👤
                </div>
              )}
              <div className="mt-2 bg-gradient-to-r from-[#07153B] to-[#12308F] text-white rounded-lg py-1.5 text-center font-bold tracking-widest text-xs shadow">
                {student.studentId}
              </div>
            </div>
          </div>

          {/* Identity details */}
          <div className="col-span-9 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-gradient-to-r from-[#07153B] to-[#12308F] rounded-xl px-4 py-2 shadow-md">
              <div className="text-white">
                <h2 className="text-xl font-black leading-tight">{student.name}</h2>
                <p className="text-[11px] text-indigo-200">
                  Class {student.className} • Section {student.section}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isHifz && (
                  <span className="px-2.5 py-1 rounded-full bg-teal-400 text-teal-950 text-[10px] font-black uppercase tracking-wider">
                    Hifz
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full font-black text-xs ${isFail ? "bg-red-400 text-red-950" : "bg-emerald-400 text-emerald-950"}`}>
                  {isFail ? "❌ Failed" : "✅ Passed"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 flex-1">
              <InfoItem label="Student ID" value={student.studentId} />
              <InfoItem label="Father's Name" value={student.fatherName} />
              <InfoItem label="Mother's Name" value={student.motherName} />
              <InfoItem label="Date of Birth" value={dob} />
              <InfoItem label="Class & Section" value={`${student.className} • ${student.section}`} />
              <InfoItem label="Academic Session" value={exam.academicSession} />
            </div>
          </div>
        </div>

        {/* MARKS TABLE */}
        <div className="relative mt-3 rounded-2xl border border-slate-200 overflow-hidden shadow-md">
          <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-4 py-1.5 flex items-center justify-between">
            <h2 className="text-sm font-bold">📊 Marks Sheet</h2>
            <span className="text-[10px] text-indigo-200 font-medium">{entries.length} Subjects</span>
          </div>
          <div className="bg-white overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="px-3 py-1.5 font-bold text-slate-600">Subject</th>
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600">Full</th>
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600">Obtained</th>
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600">Grade</th>
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600">Point</th>
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e, i) => (
                  <tr key={i} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                    <td className="px-3 py-1 font-medium text-[#07153B]">{e.subjectName}</td>
                    <td className="px-2 py-1 text-center text-slate-500">{e.fullMarks}</td>
                    <td className="px-2 py-1 text-center font-semibold text-[#07153B]">{e.obtainedMarks}</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status === "Fail" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {e.grade}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center font-semibold">{e.gradePoint.toFixed(1)}</td>
                    <td className={`px-2 py-1 text-center font-bold ${e.status === "Fail" ? "text-red-600" : "text-emerald-600"}`}>
                      {e.status}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gradient-to-r from-[#07153B] to-[#12308F] font-bold text-white">
                  <td className="px-3 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-center">{result.totalFullMarks}</td>
                  <td className="px-2 py-1.5 text-center">{result.totalObtained}</td>
                  <td className="px-2 py-1.5 text-center" colSpan="2">{result.percentage}%</td>
                  <td className={`px-2 py-1.5 text-center ${isFail ? "text-red-300" : "text-emerald-300"}`}>{result.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FINAL RESULT SUMMARY */}
        <div className="relative mt-2 grid grid-cols-4 gap-2">
          {[
            { label: "GPA", value: isFail ? "0.00" : result.gpa.toFixed(2), color: isFail ? "text-red-600" : "text-indigo-700" },
            { label: "Grade", value: result.grade || "—", color: isFail ? "text-red-600" : "text-emerald-600" },
            { label: "Division", value: result.division || "—", color: "text-indigo-700" },
            { label: "Percentage", value: `${result.percentage}%`, color: "text-[#07153B]" },
          ].map((item) => (
            <div key={item.label} className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-xl py-1.5 text-center shadow-sm">
              <p className="text-[9px] text-slate-400 uppercase font-medium tracking-wide">{item.label}</p>
              <p className={`text-base font-black ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* GRADING SYSTEM + QR + VERIFICATION + SEAL */}
        <div className="relative mt-3 grid grid-cols-4 gap-3 items-stretch">
          {/* Grading System (compact info) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-2 py-0.5 text-center">
              <h3 className="text-[10px] font-bold tracking-wide uppercase">Grading System</h3>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-200 text-[9.5px]">
              {GRADING_SYSTEM.map((row) => (
                <div key={row.grade} className="bg-white px-1 py-0.5 text-center">
                  <span className="font-black text-[#07153B]">{row.grade}</span>
                  <span className="block text-slate-500">{row.range}</span>
                  <span className="block font-semibold text-slate-600">{row.point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-2 text-center bg-slate-50">
            <div className="flex justify-center">
              <QRCodeSVG
                value={JSON.stringify({
                  id: student.studentId,
                  name: student.name,
                  class: student.className,
                  session: exam.academicSession,
                  gpa: isFail ? "0.00" : result.gpa.toFixed(2),
                })}
                size={80}
                includeMargin
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500 font-medium">🔍 Scan for Verification</p>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <p className={`text-4xl font-black ${isFail ? "text-red-500" : "text-emerald-500"}`}>
              {isFail ? "❌" : "✅"}
            </p>
            <p className={`text-lg font-black tracking-wide ${isFail ? "text-red-600" : "text-emerald-600"}`}>
              {isFail ? "FAILED" : "PASSED"}
            </p>
            <p className="text-[10px] text-slate-500">Final Result</p>
          </div>

          <div className="border-2 border-dashed rounded-full w-28 h-28 mx-auto my-auto flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-400">Official Seal</p>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="relative mt-3 grid grid-cols-3 gap-6">
          <SignatureCard title="Class Teacher" />
          <SignatureCard title="Guardian" />
          <SignatureCard title="Principal" />
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
