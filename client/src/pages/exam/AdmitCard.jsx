import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";

import StudentSearch from "../../components/exam/StudentSearch";
import EligibilityCard from "../../components/exam/EligibilityCard";
import AdmitCardPreview from "../../components/exam/AdmitCardPreview";

const AdmitCard = () => {
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get("studentId");
    const [student, setStudent] = useState(null);
    const [eligibility, setEligibility] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const printTimeoutRef = useRef(null);

    const exam = {
        examName: "Half Yearly Examination",
        academicSession: "2026",
    };


    // ==========================
    // LOAD ELIGIBILITY
    // ==========================
    const loadEligibility = async (selectedStudent) => {
        try {
            setLoading(true);
            setStudent(selectedStudent);
            const res = await api.get(
                `/payments/admit-card/${selectedStudent.studentId}`
            );
            setEligibility({
                reasons: [],
                ...res.data,
            });
        }
        catch (error) {
            console.log(error);
            alert(
                error.response?.data?.message ||
                "Failed to check eligibility."
            );
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        if (!studentId) return;

        const loadStudent = async () => {

            try {

                const res = await api.get(
                    `/students/search?q=${studentId}`
                );

                if (res.data.length > 0) {

                    loadEligibility(res.data[0]);

                }

            } catch (err) {

                console.log(err);

            }

        };

        loadStudent();

    }, [studentId]);

    // ==========================
    // PRINT - FIXED VERSION
    // ==========================
    const handlePrint = () => {

        setIsPrinting(true);

        requestAnimationFrame(() => {

            setTimeout(() => {

                window.print();

            }, 500);

        });

    };
    useEffect(() => {

        const afterPrint = () => {

            setIsPrinting(false);

        };

        window.addEventListener("afterprint", afterPrint);

        return () => {

            window.removeEventListener(
                "afterprint",
                afterPrint
            );

        };

    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (printTimeoutRef.current) {
                clearTimeout(printTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div className="min-h-screen bg-slate-100">
                {/* HEADER */}
                <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white">
                    <div className="max-w-7xl mx-auto px-6 py-10">
                        <h1 className="text-5xl font-black">
                            Admit Card
                        </h1>
                        <p className="mt-3 text-white/80 text-lg">
                            Generate Student Admit Card
                        </p>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <StudentSearch
                        onSelect={(student) => {
                            setStudent(student);
                            loadEligibility(student);
                        }}
                    />
                    {/* ELIGIBILITY */}
                    <div className="mt-8">
                        <EligibilityCard
                            eligibility={eligibility}
                            loading={loading}
                            onGenerate={() => {
                                setTimeout(() => {
                                    document
                                        .getElementById("admit-preview")
                                        ?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "start",
                                        });
                                }, 100);
                            }}
                        />
                    </div>

                    {/* ADMIT CARD PREVIEW */}
                    {
                        eligibility &&
                        eligibility.eligible &&
                        student && (
                            <div
                                id="admit-preview"
                                className="mt-10"
                            >
                                <AdmitCardPreview
                                    student={student}
                                    exam={exam}
                                    onPrint={handlePrint}
                                    isPrinting={isPrinting}
                                />
                            </div>
                        )
                    }

                    {/* NOT ELIGIBLE MESSAGE */}
                    {
                        eligibility &&
                        !eligibility.eligible && (
                            <div
                                className="
                            mt-8
                            bg-red-50
                            border
                            border-red-200
                            rounded-3xl
                            p-8
                            "
                            >
                                <h2
                                    className="
                                text-2xl
                                font-bold
                                text-red-700
                                "
                                >
                                    Admit Card Cannot Be Generated
                                </h2>
                                <p
                                    className="
                                mt-3
                                text-red-600
                                "
                                >
                                    Please clear the following issues
                                    before generating the Admit Card.
                                </p>
                                <ul
                                    className="
                                mt-6
                                space-y-3
                                "
                                >
                                    {
                                        (eligibility.reasons || []).map(
                                            (reason, index) => (
                                                <li
                                                    key={index}
                                                    className="
                                                flex
                                                items-center
                                                gap-3
                                                text-red-700
                                                font-medium
                                                "
                                                >
                                                    ❌ {reason}
                                                </li>
                                            )
                                        )
                                    }
                                </ul>
                            </div>
                        )
                    }
                </div>
            </div>

            {/* PRINT STYLE - FIXED */}
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
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        height: 297mm;
                        overflow: hidden;
                        page-break-after: avoid;
                        page-break-inside: avoid;
                        margin: 0;
                        padding: 0;
                        background: white;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    /* Force single page */
                    #admit-card .print\\:h-\\[297mm\\] {
                        height: 297mm !important;
                        max-height: 297mm !important;
                        min-height: 297mm !important;
                    }

                    /* Prevent page breaks inside */
                    #admit-card > * {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    /* Hide print button and other UI elements */
                    .no-print {
                        display: none !important;
                    }

                    /* Ensure colors print correctly */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* Ensure backgrounds print */
                    .bg-gradient-to-r,
                    .bg-indigo-700,
                    .bg-green-100,
                    .bg-slate-50,
                    .bg-white {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }

                    /* Fix for Chrome print scaling */
                    #admit-card .text-4xl {
                        font-size: 2.25rem !important;
                    }

                    #admit-card .text-3xl {
                        font-size: 1.875rem !important;
                    }

                    #admit-card .text-2xl {
                        font-size: 1.5rem !important;
                    }

                    #admit-card .text-xl {
                        font-size: 1.25rem !important;
                    }

                    #admit-card .text-lg {
                        font-size: 1.125rem !important;
                    }

                    /* Ensure grid works in print */
                    #admit-card .grid {
                        display: grid !important;
                    }

                    #admit-card .grid-cols-12 {
                        grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
                    }

                    #admit-card .grid-cols-3 {
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                    }

                    #admit-card .grid-cols-2 {
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    }

                    #admit-card .col-span-3 {
                        grid-column: span 3 / span 3 !important;
                    }

                    #admit-card .col-span-9 {
                        grid-column: span 9 / span 9 !important;
                    }

                    /* Ensure images print */
                    #admit-card img {
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }

                    /* Ensure QR code prints */
                    #admit-card svg {
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }

                    /* Barcode fix */
                    #admit-card .react-barcode {
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                }
                `}
            </style>
        </>
    );
};

export default AdmitCard;