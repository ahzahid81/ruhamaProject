import logo from "../../assets/logo.png";
import { QRCodeSVG } from "qrcode.react";

const InfoItem = ({ label, value }) => (
  <div className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="mt-0.5 text-base font-bold text-[#07153B] break-words">{value || "—"}</p>
  </div>
);

const SummaryCard = ({ label, value, color }) => (
  <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-2xl p-3 text-center shadow-sm">
    <p className="text-[10px] text-slate-400 uppercase font-medium tracking-wide">{label}</p>
    <p className={`mt-1 text-2xl font-black ${color}`}>{value || "—"}</p>
  </div>
);

const SignatureCard = ({ title }) => (
  <div className="text-center">
    <div className="h-10 border-b-2 border-dashed border-slate-300 mx-4" />
    <p className="mt-1.5 text-sm font-semibold text-slate-600">{title}</p>
  </div>
);

const ReportCard = ({ data, id }) => {
  const { exam, student, result } = data;
  const isFail = result.status === "Fail";
  const entries = result.entries || [];
  const isHifz = !!result.isHifz;

  return (
    <div
      id={id}
      className="report-card bg-white shadow-xl mx-auto overflow-hidden w-full max-w-[210mm] print:w-[210mm] print:shadow-none print:border-none"
    >
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-6 py-4 flex justify-center items-center">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
            <img src={logo} alt="School Logo" className="w-14 h-14 object-contain" />
          </div>
          <div>
            <h1 className="text-center text-2xl font-black uppercase tracking-wide">Ruhama United School</h1>
            <p className="text-center text-sm text-yellow-300 font-medium">Change Yourself, Decorate The World</p>
            <p className="text-center text-xs text-white/70">An English Version School with Tahfizul Quran</p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-6 py-4 relative">
        {/* Watermark Logo */}
        <img
          src={logo}
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] opacity-[0.04] pointer-events-none select-none"
        />

        {/* EXAM BADGE */}
        <div className="relative flex justify-center">
          <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wide shadow-md">
            {exam.examName} — Result Sheet
          </div>
        </div>
        <p className="relative text-center text-xs text-slate-500 mt-1.5 mb-4">Academic Session: {exam.academicSession}</p>

        {/* STUDENT INFO */}
        <div className="relative grid grid-cols-12 gap-5">
          <div className="col-span-3">
            <div className="bg-gradient-to-b from-slate-50 to-white border rounded-2xl p-4 shadow-sm">
              {student.photo ? (
                <img
                  src={student.photo}
                  alt={student.name}
                  className="w-full aspect-[3/4] object-cover rounded-xl border-4 border-slate-200"
                />
              ) : (
                <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-6xl bg-slate-50">
                  👤
                </div>
              )}
              <div className="mt-3 bg-indigo-700 text-white rounded-lg py-2 text-center font-bold tracking-wider text-sm">
                {student.studentId}
              </div>
            </div>
          </div>

          <div className="col-span-9">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 h-full">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-[#07153B]">{student.name}</h2>
                  <p className="text-sm text-slate-500">Student Profile</p>
                  {isHifz && (
                    <p className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-black uppercase tracking-wider">
                      Hifz Student
                    </p>
                  )}
                </div>
                <div className={`px-4 py-1.5 rounded-full font-bold text-sm ${isFail ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {isFail ? "❌ Failed" : "✅ Passed"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-5">
                <InfoItem label="Student ID" value={student.studentId} />
                <InfoItem label="Class" value={`${student.className} • Section ${student.section}`} />
                <InfoItem label="GPA" value={isFail ? "0.00" : result.gpa.toFixed(2)} />
              </div>
            </div>
          </div>
        </div>

        {/* MARKS TABLE */}
        <div className="relative mt-4 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-5 py-2.5">
            <h2 className="text-lg font-bold">📊 Marks Sheet</h2>
          </div>
          <div className="bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5 font-bold text-slate-600">Subject</th>
                  <th className="px-3 py-2.5 text-center font-bold text-slate-600">Full</th>
                  <th className="px-3 py-2.5 text-center font-bold text-slate-600">Obtained</th>
                  <th className="px-3 py-2.5 text-center font-bold text-slate-600">Grade</th>
                  <th className="px-3 py-2.5 text-center font-bold text-slate-600">Point</th>
                  <th className="px-3 py-2.5 text-center font-bold text-slate-600">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-[#07153B]">{e.subjectName}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">{e.fullMarks}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-[#07153B]">{e.obtainedMarks}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${e.status === "Fail" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {e.grade}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold">{e.gradePoint.toFixed(1)}</td>
                    <td className={`px-3 py-2.5 text-center font-bold ${e.status === "Fail" ? "text-red-600" : "text-emerald-600"}`}>
                      {e.status}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-[#07153B]">Total</td>
                  <td className="px-3 py-3 text-center text-slate-500">{result.totalFullMarks}</td>
                  <td className="px-3 py-3 text-center text-[#07153B]">{result.totalObtained}</td>
                  <td className="px-3 py-3 text-center text-[#07153B]" colSpan="2">{result.percentage}%</td>
                  <td className={`px-3 py-3 text-center ${isFail ? "text-red-600" : "text-emerald-600"}`}>{result.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="relative mt-4 grid grid-cols-4 gap-4">
          <SummaryCard label="GPA" value={isFail ? "0.00" : result.gpa.toFixed(2)} color={isFail ? "text-red-600" : "text-indigo-700"} />
          <SummaryCard label="Grade" value={result.grade || "—"} color={isFail ? "text-red-600" : "text-emerald-600"} />
          <SummaryCard label="Division" value={result.division || "—"} color="text-indigo-700" />
          <SummaryCard label="Percentage" value={`${result.percentage}%`} color="text-[#07153B]" />
        </div>

        {/* QR + VERIFICATION */}
        <div className="relative mt-4 grid grid-cols-3 gap-6 items-center">
          <div className="border rounded-2xl p-3 text-center bg-slate-50">
            <div className="flex justify-center">
              <QRCodeSVG
                value={JSON.stringify({
                  id: student.studentId,
                  name: student.name,
                  class: student.className,
                  session: exam.academicSession,
                  gpa: isFail ? "0.00" : result.gpa.toFixed(2),
                })}
                size={110}
                includeMargin
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">🔍 Scan for Verification</p>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <p className={`text-6xl font-black ${isFail ? "text-red-500" : "text-emerald-500"}`}>
              {isFail ? "❌" : "✅"}
            </p>
            <p className={`mt-2 text-2xl font-black tracking-wide ${isFail ? "text-red-600" : "text-emerald-600"}`}>
              {isFail ? "FAILED" : "PASSED"}
            </p>
            <p className="mt-1 text-xs text-slate-500">Final Result</p>
          </div>

          <div className="border-2 border-dashed rounded-full w-36 h-36 mx-auto flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-slate-400">Official Seal</p>
          </div>
        </div>

        {/* SIGNATURES */}
        <div className="relative mt-6 grid grid-cols-3 gap-8">
          <SignatureCard title="Class Teacher" />
          <SignatureCard title="Guardian" />
          <SignatureCard title="Principal" />
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
