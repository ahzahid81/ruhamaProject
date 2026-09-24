import logo from "../../assets/logo.png";
import signatureController from "../../assets/signature-controller.png";
import signaturePrincipal from "../../assets/signature-principal.png";
import { QRCodeSVG } from "qrcode.react";

const AdmitCardPreview = ({ student, exam, onPrint, bulk = false }) => {
    if (!student || !exam) return null;

    return (
        <div className={bulk ? "admit-card-page" : "mt-8"}>
            {/* ACTION BUTTONS */}
            {!bulk && (
            <div className="no-print print:hidden flex justify-end gap-4 mb-6">
                <button
                    onClick={onPrint}
                    className="bg-indigo-700 hover:bg-indigo-800 transition text-white font-bold px-8 py-3 rounded-2xl shadow-lg"
                >
                    🖨 Print Admit Card
                </button>
            </div>
            )}

            {/* ADMIT CARD — A4 width × half A4 height */}
            <div
                id="admit-card"
                className="bg-white shadow-xl mx-auto overflow-hidden w-[210mm] h-[148.5mm] flex flex-col print:w-[210mm] print:h-[148.5mm] print:shadow-none print:border-none print:overflow-hidden"
            >
                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-5 py-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                            <img src={logo} alt="School Logo" className="w-9 h-9 object-contain" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black uppercase tracking-wide leading-tight">Ruhama United School</h1>
                            <p className="text-[10px] text-yellow-300 font-medium leading-tight">Change Yourself, Decorate The World</p>
                            <p className="text-[9px] text-white/70 leading-tight">An English Version School with Tahfizul Quran</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-yellow-400 text-[#07153B] font-black text-sm px-4 py-1 rounded-md uppercase tracking-widest">
                            Admit Card
                        </div>
                        <p className="text-[9px] text-white/70 mt-1">Session {exam.academicSession}</p>
                    </div>
                </div>

                {/* BODY */}
                <div className="px-5 py-3 relative">
                    {/* Watermark Logo */}
                    <img
                        src={logo}
                        alt=""
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] opacity-[0.04] pointer-events-none select-none"
                    />

                    {/* TOP ROW: Photo + Student Details + QR */}
                    <div className="flex gap-3 items-stretch">
                        {/* PHOTO + ID */}
                        <div className="w-[105px] flex-shrink-0">
                            <div className="border border-slate-200 rounded-lg p-1.5 shadow-sm h-full flex flex-col">
                                {student.photo ? (
                                    <img
                                        src={student.photo}
                                        alt={student.name}
                                        className="w-full aspect-[3/4] object-cover rounded border-2 border-slate-200"
                                    />
                                ) : (
                                    <div className="aspect-[3/4] rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-4xl bg-slate-50">
                                        👤
                                    </div>
                                )}
                                <div className="mt-1.5 bg-[#07153B] text-white rounded py-1 text-center font-bold tracking-wider text-[10px]">
                                    {student.studentId}
                                </div>
                            </div>
                        </div>

                        {/* STUDENT DETAILS */}
                        <div className="flex-1 min-w-0">
                            <div className="border border-slate-200 rounded-lg bg-slate-50 p-3 h-full">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <h2 className="text-xl font-black text-[#07153B] leading-snug break-words">{student.name}</h2>
                                        <p className="mt-0.5 text-[10px] text-slate-500 uppercase tracking-wide">Candidate Details</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold text-[10px] whitespace-nowrap">
                                        ✅ Eligible
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-5 gap-y-2 mt-3">
                                    <InfoItem label="Student ID" value={student.studentId} />
                                    <InfoItem label="Class" value={student.className} />
                                    <InfoItem label="Father's Name" value={student.fatherName} />
                                    <InfoItem label="Guardian Mobile" value={student.fatherMobile} />
                                </div>
                            </div>
                        </div>

                        {/* QR CODE */}
                        <div className="w-[112px] flex-shrink-0 border border-slate-200 rounded-lg p-2 text-center bg-white shadow-sm flex flex-col justify-center">
                            <div className="flex justify-center">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        id: student.studentId,
                                        name: student.name,
                                        class: student.className,
                                        session: exam.academicSession,
                                    })}
                                    size={96}
                                    includeMargin={false}
                                />
                            </div>
                        </div>
                    </div>

                    {/* EXAM DETAILS STRIP */}
                    <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden shadow-sm flex">
                        <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-3 py-2 flex items-center flex-shrink-0">
                            <span className="text-[11px] font-bold whitespace-nowrap">📋 Examination Info</span>
                        </div>
                        <div className="flex-1 grid grid-cols-3 divide-x divide-slate-200 bg-white">
                            <div className="px-3 py-2 min-w-0"><InfoItem label="Examination" value={exam.examName} /></div>
                            <div className="px-3 py-2 min-w-0"><InfoItem label="Academic Session" value={exam.academicSession} /></div>
                            <div className="px-3 py-2 min-w-0"><InfoItem label="Center" value="Ruhama United School" /></div>
                        </div>
                    </div>

                    {/* INSTRUCTIONS + SEAL */}
                    <div className="mt-3 flex gap-4 items-center">
                        {/* Instructions */}
                        <div className="flex-1 min-w-0 border border-slate-200 rounded-lg bg-slate-50 px-3.5 py-2">
                            <h3 className="font-bold text-[11px] text-[#07153B] uppercase tracking-wide mb-1">Instructions</h3>
                            <ol className="list-decimal ml-4 space-y-0.5 text-gray-600 text-[10px] leading-snug">
                                <li>Bring this Admit Card on every exam day.</li>
                                <li>Arrive 15 minutes before the examination starts.</li>
                                <li>Bring pencil &amp; all necessary equipment.</li>
                                <li>Keep this card clean and undamaged.</li>
                            </ol>
                        </div>

                        {/* Official Seal — empty circle, physical seal stamped here */}
                        <div className="w-[100px] h-[100px] flex-shrink-0 rounded-full border-[2px] border-dashed border-slate-400"></div>
                    </div>

                    {/* SIGNATURES */}
                    <div className="mt-3 grid grid-cols-2 gap-16 px-2">
                        <SignatureBlock image={signatureController} title="Exam Controller" />
                        <SignatureBlock image={signaturePrincipal} title="Principal" />
                    </div>
                </div>

                {/* FOOTER — matches header design */}
                <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white px-5 py-2 mt-auto flex justify-between items-center">
                    <p className="text-[10px] flex items-center gap-1.5">
                        <span>📍</span>
                        <span>Ludhi House-101, Road-9, Housing Estate, Amberkhana, Sylhet</span>
                    </p>
                    <p className="text-[10px] flex items-center gap-1.5">
                        <a href="https://ruhamaunitedschool.com" className="text-yellow-300 font-semibold">
                            www.ruhamaunitedschool.com
                        </a>
                    </p>
                </div>
            </div>

            {/* PRINT STYLE (single-card mode only — bulk page provides its own) */}
            {!bulk && (
            <style>
                {`
                @page {
                    size: A4 portrait;
                    margin: 0;
                }

                @media print {
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100%;
                        background: white;
                        overflow: hidden;
                    }

                    /* Hide everything except admit card */
                    body * {
                        visibility: hidden;
                    }

                    #admit-card, #admit-card * {
                        visibility: visible;
                    }

                    #admit-card {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        height: 148.5mm;
                        max-height: 148.5mm;
                        overflow: hidden;
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        margin: 0;
                        padding: 0;
                        background: white;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    /* Lower half of the A4 page stays blank like a receipt */
                    .no-print {
                        display: none !important;
                    }

                    /* Ensure colors print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    .bg-gradient-to-r,
                    .bg-indigo-700,
                    .bg-green-100,
                    .bg-slate-50,
                    .bg-white {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    #admit-card img,
                    #admit-card svg {
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                }
                `}
            </style>
            )}
        </div>
    );
};

// ======================================
// INFO ITEM
// ======================================
const InfoItem = ({ label, value }) => {
    return (
        <div className="min-w-0">
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide leading-none">{label}</p>
            <p className="mt-0.5 text-[12px] font-bold text-[#07153B] leading-snug break-words">{value || "—"}</p>
        </div>
    );
};

// ======================================
// SIGNATURE BLOCK (placeholder image for now — swap file for real signature later)
// ======================================
const SignatureBlock = ({ image, title }) => {
    return (
        <div className="text-center">
            <div className="h-14 flex items-end justify-center">
                <img src={image} alt={title} className="h-12 w-auto object-contain max-w-full" />
            </div>
            <div className="h-1 border-b-2 border-slate-300 mx-2 mt-1" />
            <p className="mt-0.5 text-[10px] font-semibold text-slate-600">{title}</p>
        </div>
    );
};

export default AdmitCardPreview;