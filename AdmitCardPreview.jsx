import logo from "../../assets/logo.png";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

const AdmitCardPreview = ({ student, exam, onPrint }) => {
    if (!student || !exam) return null;

    return (
        <div className="mt-8">
            {/* ACTION BUTTONS */}
            <div className="no-print print:hidden flex justify-end gap-4 mb-6">
                <button
                    onClick={onPrint}
                    className="bg-indigo-700 hover:bg-indigo-800 transition text-white font-bold px-8 py-3 rounded-2xl shadow-lg"
                >
                    🖨 Print Admit Card
                </button>
            </div>

            {/* ADMIT CARD */}
            <div
                id="admit-card"
                className="bg-white shadow-xl mx-auto overflow-hidden w-[210mm] min-h-[149mm] print:w-[210mm] print:h-[149mm] print:shadow-none print:border-none print:overflow-hidden"
            >
                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-4 py-2 flex justify-center items-center">
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
                <div className="px-4 py-2">
                    <div className="relative">
                        {/* Watermark Logo */}
                        <img
                            src={logo}
                            alt=""
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] opacity-[0.04] pointer-events-none select-none"
                        />

                        {/* STUDENT INFO - GRID */}
                        <div className="grid grid-cols-12 gap-5">
                            {/* LEFT - PHOTO & ID */}
                            <div className="col-span-3">
                                <div className="bg-gradient-to-b from-slate-50 to-white border rounded-2xl p-2 shadow-sm">
                                    {student.photo ? (
                                        <img
                                            src={student.photo}
                                            alt={student.name}
                                            className="w-full h-44 object-cover rounded-xl border-4 border-slate-200"
                                        />
                                    ) : (
                                        <div className="h-44 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-6xl bg-slate-50">
                                            👤
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT - STUDENT DETAILS */}
                            <div className="col-span-6">
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-1 h-full">
                                    <div className="flex justify-between items-start">
                                        <div className=" w-full">
                                            <h2 className="text-3xl text-center justify-center items-center  font-black text-[#07153B]">{student.name}</h2>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <InfoItem label="Student ID" value={student.studentId} />
                                        <InfoItem label="Class" value={student.className} />
                                        <InfoItem label="Father's Name" value={student.fatherName} />
                                        <InfoItem label="Guardian Mobile" value={student.fatherMobile} />
                                    </div>
                                </div>
                            </div>

                            <div
                                className="
    col-span-3
    border
    rounded-2xl
    bg-slate-50
    flex
    items-center
    justify-center
    h-full
    p-1
    "
                            >
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        id: student.studentId,
                                        name: student.name,
                                        class: student.className,
                                        session: exam.academicSession,
                                    })}
                                    size={120}
                                    includeMargin
                                />
                            </div>
                        </div>

                        {/* EXAM DETAILS */}
                        <div className="mt-2 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white px-2.5 py-1">
                                <h2 className="text-lg font-bold">📋 Examination Information</h2>
                            </div>
                            <div className="grid grid-cols-3 text-center gap-4 p-2 bg-white">
                                <InfoItem label="Examination" value={exam.examName} />
                                <InfoItem label="Academic Session" value={exam.academicSession} />
                                <InfoItem label="Examination Center" value="Ruhama United School" />
                            </div>
                        </div>

                        {/* QR + VERIFICATION + SEAL */}
                        <div className=" grid grid-cols-3 gap-6 items-center">
                            {/* QR Code */}
                            {/* <div className="border rounded-2xl p-3 text-center bg-slate-50">
                                <div className="flex justify-center">
                                    <QRCodeSVG
                                        value={JSON.stringify({
                                            id: student.studentId,
                                            name: student.name,
                                            class: student.className,
                                            session: exam.academicSession,
                                        })}
                                        size={120}
                                        includeMargin
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500 font-medium">🔍 Scan for Verification</p>
                            </div> */}

                            {/* Student ID Barcode */}
                            {/* <div className="flex flex-col justify-center items-center">
                                <Barcode
                                    value={student.studentId}
                                    format="CODE128"
                                    width={1.6}
                                    height={55}
                                    displayValue={false}
                                    margin={0}
                                    background="#ffffff"
                                />
                                <h3 className="mt-3 text-xl font-black tracking-[4px] text-[#07153B]">
                                    {student.studentId}
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Student Barcode
                                </p>
                            </div> */}

                            {/* <div className="border-2 border-dashed rounded-full w-36 h-36 mx-auto flex flex-col items-center justify-center text-center">
                                <p className="text-sm font-bold text-slate-400">Official Seal</p>
                            </div> */}
                        </div>

                        {/* INSTRUCTIONS */}
                        <div className="mt-2 bg-slate-50 rounded-2xl p-2 border border-slate-200">
                            <h3 className="font-bold text-base text-[#07153B] mb-1 flex items-center gap-2">
                                <span>📌</span> Instructions
                            </h3>
                            <ol className="list-decimal ml-1 space-y-1 text-gray-700 text-sm">
                                Bring this Admit Card on every exam day. Arrive at least 15 minutes before the examination starts. Bring a pencil and all necessary equipment. Keep this Admit Card clean and undamaged.
                            </ol>
                        </div>
                        <br />
                        <br />

                        {/* SIGNATURE SECTION */}
                        <div className="mt-3 grid grid-cols-2 gap-1">
                            {/* <SignatureCard title="Student Signature" /> */}
                            <SignatureCard title="Exam Controller" />
                            <SignatureCard title="Principal" />
                        </div>
                    </div>
                </div>
            </div>

            PRINT STYLE
        </div>
    );
};

// ======================================
// INFO ITEM
// ======================================
const InfoItem = ({ label, value }) => {
    return (
        <div className="bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
            <p className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-wide">{label}</p>
            <p className="mt-0.5 text-base text-center font-bold text-[#07153B] break-words">{value || "—"}</p>
        </div>
    );
};

// ======================================
// SIGNATURE CARD
// ======================================
const SignatureCard = ({ title }) => {
    return (
        <div className="text-center">
            <div className="h-5 border-b-2 border-dashed border-slate-300 mx-4" />
            <p className="mt-1 text-sm font-semibold text-slate-600">{title}</p>
        </div>
    );
};

export default AdmitCardPreview;