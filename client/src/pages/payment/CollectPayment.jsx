import { useMemo, useState } from "react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

import api from "../../services/api";

import StudentSearch from "../../components/exam/StudentSearch";

const examOptions = [

    "Half Yearly",

    "Year Final",

    "Model Test",

    "Monthly Assessment",

    "Admission Test",

];

const feeOptions = [

    "Monthly Tuition",

    "Exam Fee",

    "Admission Fee",

    "Books",

    "Hostel Fee",

    "Day Care Fee",

    "Quran Fee",

    "Transport Fee",

    "Uniform",

    "Other",

];

const paymentMethods = [

    "Cash",

    "bKash",

    "Bank",

    "Nagad",

    "Rocket",

];

const months = [

    "January",

    "February",

    "March",

    "April",

    "May",

    "June",

    "July",

    "August",

    "September",

    "October",

    "November",

    "December",

];

const CollectPayment = () => {
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get("studentId");
    const [student, setStudent] = useState(null);
    const [receipt, setReceipt] = useState(null);

    const [showReceipt, setShowReceipt] = useState(false);

    const [loading, setLoading] = useState(false);

    const [paymentMethod, setPaymentMethod] =

        useState("Cash");

    const [transactionId, setTransactionId] =

        useState("");

    const [referenceNo, setReferenceNo] =

        useState("");

    const [remarks, setRemarks] =

        useState("");

    const [discount, setDiscount] =

        useState(0);

    const [fine, setFine] =

        useState(0);

    const [fees, setFees] = useState([

        {

            feeName: "Monthly Tuition",

            applicableType: "Month",

            month: 7,

            year: 2026,

            examName: "",

            amount: "",

        },

    ]);

    // ==============================
    // TOTAL
    // ==============================

    const total = useMemo(() => {

        const feeTotal = fees.reduce(

            (sum, item) =>

                sum +

                Number(item.amount || 0),

            0

        );

        return (

            feeTotal +

            Number(fine || 0) -

            Number(discount || 0)

        );

    }, [

        fees,

        fine,

        discount,

    ]);

    // ==============================
    // ADD ROW
    // ==============================

    const addFeeRow = () => {

        setFees([

            ...fees,

            {

                feeName: "Monthly Tuition",

                applicableType: "Month",

                month: 7,

                year: 2026,

                examName: "",

                amount: "",

            },

        ]);

    };

    // ==============================
    // REMOVE ROW
    // ==============================

    const removeRow = (index) => {

        setFees(

            fees.filter(

                (_, i) => i !== index

            )

        );

    };

    // ==============================
    // UPDATE ROW
    // ==============================

    const updateRow = (index, field, value) => {

        const temp = [...fees];

        temp[index][field] = value;

        if (field === "applicableType") {

            if (value === "Month") {

                temp[index].feeName = "Monthly Tuition";

                temp[index].examName = "";

            }

            if (value === "Exam") {

                temp[index].feeName = "Exam Fee";

                temp[index].month = null;

                temp[index].examName = "Half Yearly";

            }

        }

        setFees(temp);

    };

    // ==============================
    // SELECT STUDENT
    // ==============================

    const handleStudentSelect = (

        studentData

    ) => {

        setStudent(studentData);

    };

    useEffect(() => {

        if (!studentId) return;

        const loadStudent = async () => {

            try {

                const res = await api.get(
                    `/students/search?q=${studentId}`
                );

                if (res.data.length > 0) {
                    setStudent(res.data[0]);
                }

            } catch (err) {

                console.log(err);

            }

        };

        loadStudent();

    }, [studentId]);

    // ==============================
    // SUBMIT
    // ==============================

    const submitPayment = async () => {

        if (!student) {

            return alert("Select a student.");

        }

        if (fees.length === 0) {

            return alert("Add at least one fee.");

        }

        try {

            setLoading(true);

            const items = fees.map((fee) => ({

                feeCategory: null,

                feeName: fee.feeName,

                applicableType: fee.applicableType,

                month:

                    fee.applicableType === "Month"

                        ? fee.month

                        : null,

                year: fee.year,

                examName:

                    fee.applicableType === "Exam"

                        ? fee.examName

                        : "",

                payableAmount: Number(fee.amount),

                paidAmount: Number(fee.amount),

                dueAmount: 0,

                discount: 0,

                fine: 0,

            }));

            const payload = {

                student: student._id,

                receivedBy: JSON.parse(

                    localStorage.getItem("teacher")

                )?._id,

                paymentMethod,

                transactionId,

                referenceNo,

                remarks,

                totalDiscount: Number(discount),

                totalFine: Number(fine),

                items,

            };

            const res = await api.post("/payments/collect", payload);

            setReceipt({

                ...res.data,

                student,

            });

            setShowReceipt(true);


            setFees([
                {
                    feeName: "Monthly Tuition",
                    applicableType: "Month",
                    month: 7,
                    year: 2026,
                    examName: "",
                    amount: "",
                },
            ]);

            setDiscount(0);

            setFine(0);

            setTransactionId("");

            setReferenceNo("");

            setRemarks("");

        }

        catch (error) {

            console.log(error);

            alert(

                error.response?.data?.message ||

                "Payment Failed"

            );

        }

        finally {

            setLoading(false);

        }

    };
    const receiptRef = useRef();
    const handlePrintReceipt = useReactToPrint({

        contentRef: receiptRef,

        documentTitle: receipt?.receiptNo || "Receipt",

    });

    return (

        <div className="min-h-screen bg-slate-100">

            {/* HEADER */}

            <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white">

                <div className="max-w-7xl mx-auto px-6 py-10">

                    <h1 className="text-5xl font-black">

                        Collect Payment

                    </h1>

                    <p className="mt-3 text-white/80">

                        Student Fee Collection

                    </p>

                </div>

            </div>

            <div className="max-w-7xl mx-auto p-6">

                {/* STUDENT SEARCH */}

                <StudentSearch

                    onSelect={

                        handleStudentSelect

                    }

                />

                {/* STUDENT CARD */}

                {

                    student && (

                        <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">

                            <div className="flex items-center gap-5">

                                {

                                    student.photo ?

                                        <img

                                            src={

                                                student.photo

                                            }

                                            alt={

                                                student.name

                                            }

                                            className="w-24 h-24 rounded-full object-cover"

                                        />

                                        :

                                        <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-4xl">

                                            👤

                                        </div>

                                }

                                <div>

                                    <h2 className="text-3xl font-bold">

                                        {student.name}

                                    </h2>

                                    <p>

                                        {student.studentId}

                                    </p>

                                    <p>

                                        {student.className}

                                        {" • "}

                                        Roll {student.roll}

                                    </p>

                                </div>

                            </div>

                        </div>

                    )

                }
                {/* ===========================
            FEE COLLECTION
        =========================== */}

                <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">

                    <div className="flex justify-between items-center mb-6">

                        <h2 className="text-2xl font-bold">

                            Fee Collection

                        </h2>

                        <button
                            type="button"
                            onClick={addFeeRow}
                            className="
              bg-emerald-600
              hover:bg-emerald-700
              text-white
              px-5
              py-2
              rounded-xl
              font-semibold
              "
                        >

                            + Add Fee

                        </button>

                    </div>

                    {

                        fees.map((fee, index) => (

                            <div

                                key={index}

                                className="
                border
                rounded-2xl
                p-5
                mb-5
                bg-slate-50
                "

                            >

                                <div className="grid lg:grid-cols-5 gap-4">

                                    {/* Fee Name */}

                                    <div>

                                        <label className="font-semibold">

                                            Fee Name

                                        </label>

                                        <select

                                            className="select select-bordered w-full mt-2"

                                            value={fee.feeName}

                                            onChange={(e) =>

                                                updateRow(

                                                    index,

                                                    "feeName",

                                                    e.target.value

                                                )

                                            }

                                        >

                                            {

                                                feeOptions.map(item => (

                                                    <option

                                                        key={item}

                                                    >

                                                        {item}

                                                    </option>

                                                ))

                                            }

                                        </select>

                                    </div>

                                    {/* Type */}

                                    <div>

                                        <label className="font-semibold">

                                            Type

                                        </label>

                                        <select

                                            className="select select-bordered w-full mt-2"

                                            value={fee.applicableType}

                                            onChange={(e) =>

                                                updateRow(

                                                    index,

                                                    "applicableType",

                                                    e.target.value

                                                )

                                            }

                                        >

                                            <option>

                                                Month

                                            </option>

                                            <option>

                                                Exam

                                            </option>

                                            <option>

                                                One Time

                                            </option>

                                        </select>

                                    </div>

                                    {/* Month */}

                                    {

                                        fee.applicableType === "Month" && (

                                            <div>

                                                <label className="font-semibold">

                                                    Month

                                                </label>

                                                <select

                                                    className="select select-bordered w-full mt-2"

                                                    value={fee.month}

                                                    onChange={(e) =>

                                                        updateRow(

                                                            index,

                                                            "month",

                                                            Number(e.target.value)

                                                        )

                                                    }

                                                >

                                                    {

                                                        months.map(

                                                            (m, i) => (

                                                                <option

                                                                    value={i + 1}

                                                                    key={m}

                                                                >

                                                                    {m}

                                                                </option>

                                                            )

                                                        )

                                                    }

                                                </select>

                                            </div>

                                        )

                                    }

                                    {/* Exam */}

                                    {

                                        fee.applicableType === "Exam" && (

                                            <div>

                                                <label className="font-semibold">

                                                    Exam

                                                </label>

                                                <select
                                                    className="select select-bordered w-full mt-2"
                                                    value={fee.examName}
                                                    onChange={(e) =>
                                                        updateRow(
                                                            index,
                                                            "examName",
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="">
                                                        Select Exam
                                                    </option>

                                                    {

                                                        examOptions.map(exam => (

                                                            <option
                                                                key={exam}
                                                                value={exam}
                                                            >
                                                                {exam}
                                                            </option>

                                                        ))

                                                    }

                                                </select>
                                            </div>

                                        )

                                    }

                                    {/* Amount */}

                                    <div>

                                        <label className="font-semibold">

                                            Amount

                                        </label>

                                        <input

                                            type="number"

                                            className="input input-bordered w-full mt-2"

                                            value={fee.amount}

                                            onChange={(e) =>

                                                updateRow(

                                                    index,

                                                    "amount",

                                                    e.target.value

                                                )

                                            }

                                        />

                                    </div>

                                </div>

                                <div className="mt-5 flex justify-end">

                                    <button

                                        type="button"

                                        onClick={() => removeRow(index)}

                                        className="
                    btn
                    btn-error
                    btn-sm
                    "

                                    >

                                        Remove

                                    </button>

                                </div>

                            </div>

                        ))

                    }

                </div>

                {/* ===========================
            PAYMENT SUMMARY
        =========================== */}

                <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">

                    <h2 className="text-2xl font-bold mb-6">

                        Payment Summary

                    </h2>

                    <div className="grid lg:grid-cols-4 gap-5">

                        <div>

                            <label>

                                Discount

                            </label>

                            <input

                                type="number"

                                className="input input-bordered w-full mt-2"

                                value={discount}

                                onChange={(e) =>

                                    setDiscount(e.target.value)

                                }

                            />

                        </div>

                        <div>

                            <label>

                                Fine

                            </label>

                            <input

                                type="number"

                                className="input input-bordered w-full mt-2"

                                value={fine}

                                onChange={(e) =>

                                    setFine(e.target.value)

                                }

                            />

                        </div>

                        <div>

                            <label>

                                Payment Method

                            </label>

                            <select

                                className="select select-bordered w-full mt-2"

                                value={paymentMethod}

                                onChange={(e) =>

                                    setPaymentMethod(e.target.value)

                                }

                            >

                                {

                                    paymentMethods.map(

                                        method => (

                                            <option

                                                key={method}

                                            >

                                                {method}

                                            </option>

                                        )

                                    )

                                }

                            </select>

                        </div>

                        <div>

                            <label>

                                Total

                            </label>

                            <div className="text-3xl font-black text-emerald-700 mt-3">

                                ৳ {total}

                            </div>

                        </div>

                    </div>

                    {/* ===========================
            TRANSACTION INFORMATION
        =========================== */}

                    <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">

                        <h2 className="text-2xl font-bold mb-6">

                            Transaction Information

                        </h2>

                        <div className="grid lg:grid-cols-3 gap-5">

                            <div>

                                <label className="font-semibold">

                                    Transaction ID

                                </label>

                                <input

                                    type="text"

                                    className="input input-bordered w-full mt-2"

                                    value={transactionId}

                                    onChange={(e) =>

                                        setTransactionId(e.target.value)

                                    }

                                    placeholder="Optional"

                                />

                            </div>

                            <div>

                                <label className="font-semibold">

                                    Reference No

                                </label>

                                <input

                                    type="text"

                                    className="input input-bordered w-full mt-2"

                                    value={referenceNo}

                                    onChange={(e) =>

                                        setReferenceNo(e.target.value)

                                    }

                                    placeholder="Optional"

                                />

                            </div>

                            <div>

                                <label className="font-semibold">

                                    Remarks

                                </label>

                                <input

                                    type="text"

                                    className="input input-bordered w-full mt-2"

                                    value={remarks}

                                    onChange={(e) =>

                                        setRemarks(e.target.value)

                                    }

                                    placeholder="Optional"

                                />

                            </div>

                        </div>

                    </div>




                    {/* ===========================
            SUBMIT
        =========================== */}

                    <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">

                        <div className="flex flex-wrap gap-4 justify-between items-center">

                            <div>

                                <h2 className="text-3xl font-black text-emerald-700">

                                    Total : ৳ {total}

                                </h2>

                            </div>

                            <div className="flex gap-4">

                                <button

                                    type="button"

                                    disabled={loading}

                                    onClick={submitPayment}

                                    className="btn btn-success btn-lg"

                                >

                                    {

                                        loading ?

                                            "Receiving..."

                                            :

                                            "Receive Payment"

                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                </div>


            </div>
            {/* ===============================
    RECEIPT MODAL
================================ */}

            {
                showReceipt &&
                receipt && (

                    <div
                        className="
fixed
inset-0
bg-black/40
flex
items-center
justify-center
z-50
overflow-y-auto
p-6
"
                    >

                        <div
                            className="
bg-white
rounded-3xl
shadow-xl
w-full
max-w-lg
max-h-[90vh]
overflow-y-auto
p-8
"
                        >

                            <h2
                                className="
text-3xl
font-black
text-center
text-emerald-700
"
                            >

                                Payment Successful

                            </h2>

                            <div className="mt-8 space-y-3">

                                <div className="flex justify-between">

                                    <span>

                                        Receipt No

                                    </span>

                                    <b>

                                        {receipt.receiptNo}

                                    </b>

                                </div>

                                <div className="flex justify-between">

                                    <span>

                                        Payment ID

                                    </span>

                                    <b>

                                        {receipt.paymentId}

                                    </b>

                                </div>

                                <div className="flex justify-between">

                                    <span>

                                        Total

                                    </span>

                                    <b>

                                        ৳ {receipt.totalAmount}

                                    </b>

                                </div>

                                <div className="flex justify-between">

                                    <span>

                                        Paid

                                    </span>

                                    <b>

                                        ৳ {receipt.paidAmount}

                                    </b>

                                </div>

                                <div className="flex justify-between">

                                    <span>

                                        Due

                                    </span>

                                    <b>

                                        ৳ {receipt.dueAmount}

                                    </b>

                                </div>

                            </div>
                            <div
                                ref={receiptRef}
                                className="bg-white p-8 rounded-xl"
                            >

                                <h2 className="text-center text-3xl font-black">
                                    RUHAMA UNITED SCHOOL
                                </h2>

                                <p className="text-center">
                                    Money Receipt
                                </p>

                                <hr className="my-4" />

                                <div className="space-y-2">

                                    <div className="flex justify-between">
                                        <span>Receipt</span>
                                        <b>{receipt.receiptNo}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Date</span>
                                        <b>{new Date().toLocaleDateString()}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Student</span>
                                        <b>{receipt.student?.name}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Student ID</span>
                                        <b>{receipt.student?.studentId}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Total</span>
                                        <b>৳ {receipt.totalAmount}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Paid</span>
                                        <b>৳ {receipt.paidAmount}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Due</span>
                                        <b>৳ {receipt.dueAmount}</b>
                                    </div>

                                </div>

                                <div className="mt-10 text-center">
                                    Thank You
                                </div>

                            </div>

                            <br />
                            <br />
                            <br />

                            <div
                                ref={receiptRef}
                                className="bg-white p-8 rounded-xl"
                            >

                                <h2 className="text-center text-3xl font-black">
                                    RUHAMA UNITED SCHOOL
                                </h2>

                                <p className="text-center">
                                    Money Receipt
                                </p>

                                <hr className="my-4" />

                                <div className="space-y-2">

                                    <div className="flex justify-between">
                                        <span>Receipt</span>
                                        <b>{receipt.receiptNo}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Date</span>
                                        <b>{new Date().toLocaleDateString()}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Student</span>
                                        <b>{receipt.student?.name}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Student ID</span>
                                        <b>{receipt.student?.studentId}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Total</span>
                                        <b>৳ {receipt.totalAmount}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Paid</span>
                                        <b>৳ {receipt.paidAmount}</b>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Due</span>
                                        <b>৳ {receipt.dueAmount}</b>
                                    </div>

                                </div>

                                <div className="mt-10 text-center">
                                    Thank You
                                </div>

                            </div>

                            <div className="flex gap-4 mt-8">

                                <button
                                    className="btn btn-success flex-1"
                                    onClick={handlePrintReceipt}
                                >
                                    Print Receipt
                                </button>

                                <button
                                    className="btn btn-outline flex-1"
                                    onClick={() => {
                                        setShowReceipt(false);
                                        setStudent(null);
                                    }}
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </div>

    );

};

export default CollectPayment;