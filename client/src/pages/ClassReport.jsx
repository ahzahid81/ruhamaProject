import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";

import api from "../services/api";
import logo from "../assets/logo.png";

const ClassReport = () => {

    const reportRef = useRef();

    const [className, setClassName] = useState("");

    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [report, setReport] = useState(null);

    const [loading, setLoading] = useState(false);

    // CLASSES
    const classes = [
        "Play Group",
        "Nursery",
        "KG",
        "Class 1",
        "Class 2",
        "Class 3",
    ];

    // GET REPORT
    const getReport = async () => {

        if (!className) {
            return alert("Select class");
        }

        setLoading(true);

        try {

            const res = await api.get(
                `/reports/class-report?className=${className}&date=${date}`
            );

            setReport(res.data);

        } catch (error) {

            alert(
                error.response?.data?.message
            );

        } finally {

            setLoading(false);
        }
    };

    // DOWNLOAD IMAGE
    const downloadImage = async () => {

        try {

            if (!reportRef.current) return;

            const dataUrl =
                await htmlToImage.toPng(
                    reportRef.current,
                    {
                        pixelRatio: 2,
                        cacheBust: true,
                        backgroundColor: "#ffffff",
                    }
                );

            const link =
                document.createElement("a");

            link.download =
                `${report.className}-${report.date}.png`;

            link.href = dataUrl;

            link.click();

        } catch (error) {

            console.log(error);
        }
    };

    // SHARE IMAGE
    const shareImage = async () => {

        try {

            if (!reportRef.current) return;

            const dataUrl =
                await htmlToImage.toPng(
                    reportRef.current,
                    {
                        pixelRatio: 2,
                        cacheBust: true,
                        backgroundColor: "#ffffff",
                    }
                );

            // CONVERT TO FILE
            const response =
                await fetch(dataUrl);

            const blob =
                await response.blob();

            const file =
                new File(
                    [blob],
                    "ruhama-report.png",
                    {
                        type: "image/png",
                    }
                );

            // MOBILE SHARE
            if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                    files: [file],
                })
            ) {

                await navigator.share({

                    files: [file],
                });

            }

            // DESKTOP
            else {

                const newWindow =
                    window.open();

                newWindow.document.write(`
          <html>

            <head>

              <title>
                RUHAMA REPORT
              </title>

              <style>

                body{
                  margin:0;
                  padding:40px;
                  display:flex;
                  justify-content:center;
                  align-items:center;
                  flex-direction:column;
                  background:#eef2ff;
                  font-family:sans-serif;
                }

                img{
                  width:100%;
                  max-width:1080px;
                  border-radius:24px;
                  box-shadow:0 10px 40px rgba(0,0,0,0.12);
                }

                a{
                  margin-top:25px;
                  background:#07153B;
                  color:white;
                  text-decoration:none;
                  padding:16px 28px;
                  border-radius:14px;
                  font-weight:bold;
                  font-size:18px;
                }

              </style>

            </head>

            <body>

              <img src="${dataUrl}" />

              <a
                href="${dataUrl}"
                download="ruhama-report.png"
              >
                Download Image
              </a>

            </body>

          </html>
        `);
            }

        } catch (error) {

            console.log(error);
        }
    };

    return (

        <div className="min-h-screen bg-[#eef2ff] px-3 py-6 md:px-6">

            {/* TOP PANEL */}
            <div className="max-w-6xl mx-auto bg-white rounded-[28px] border border-slate-200 p-5 md:p-8 shadow-sm mb-6">

                {/* HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                    {/* LEFT */}
                    <div>

                        <p className="uppercase tracking-[5px] text-[#1B44D1] text-xs font-bold mb-3">

                            RUHAMA UNITED SCHOOL

                        </p>

                        <h1 className="text-4xl md:text-6xl font-black text-[#07153B] leading-tight">

                            Premium
                            <br />
                            Daily Report

                        </h1>

                        <p className="mt-4 text-slate-500 text-base md:text-lg leading-relaxed">

                            Smart Digital Academic Reporting System

                        </p>

                    </div>

                    {/* RIGHT */}
                    <div className="bg-gradient-to-br from-[#07153B] to-[#12308f] text-white px-7 py-6 rounded-[24px] shadow-md">

                        <h2 className="text-3xl font-black">

                            HD Export

                        </h2>

                        <p className="text-white/70 mt-2">

                            WhatsApp & Facebook Ready

                        </p>

                    </div>

                </div>

                {/* FILTERS */}
                <div className="grid md:grid-cols-3 gap-4 mt-8">

                    {/* CLASS */}
                    <select
                        value={className}
                        onChange={(e) =>
                            setClassName(
                                e.target.value
                            )
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-semibold outline-none"
                    >

                        <option value="">
                            Select Class
                        </option>

                        {classes.map(
                            (
                                item,
                                index
                            ) => (

                                <option
                                    key={index}
                                    value={item}
                                >

                                    {item}

                                </option>

                            )
                        )}

                    </select>

                    {/* DATE */}
                    <input
                        type="date"
                        value={date}
                        onChange={(e) =>
                            setDate(
                                e.target.value
                            )
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-semibold outline-none"
                    />

                    {/* BUTTON */}
                    <button
                        onClick={getReport}
                        disabled={loading}
                        className="bg-[#07153B] hover:bg-[#0B1E4F] transition-all text-white rounded-2xl font-bold"
                    >

                        {
                            loading
                                ? "Loading..."
                                : "Generate Report"
                        }

                    </button>

                </div>

            </div>

            {/* REPORT */}
            {report && (

                <div className="max-w-6xl mx-auto">

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 gap-4 mb-5">

                        {/* DOWNLOAD */}
                        <button
                            onClick={downloadImage}
                            className="bg-[#07153B] hover:bg-[#0B1E4F] transition-all text-white py-4 rounded-2xl font-bold shadow-sm"
                        >

                            Download HD

                        </button>

                        {/* SHARE */}
                        <button
                            onClick={shareImage}
                            className="bg-emerald-600 hover:bg-emerald-700 transition-all text-white py-4 rounded-2xl font-bold shadow-sm"
                        >

                            Share Now

                        </button>

                    </div>

                    {/* EXPORT AREA */}
                    <div className="overflow-x-auto rounded-[30px]">

                        <div
                            ref={reportRef}
                            className="w-[1080px] bg-white rounded-[30px] overflow-hidden border border-slate-200"
                        >

                            {/* HEADER */}
                            <div className="bg-gradient-to-r from-[#07153B] to-[#12308f] px-10 py-10 text-white">

                                <div className="flex items-start justify-between gap-10">

                                    {/* LEFT */}
                                    <div className="flex items-center gap-6">

                                        {/* LOGO */}
                                        <div className="bg-white rounded-[24px] p-4 w-28 h-28 flex items-center justify-center shrink-0">

                                            <img
                                                src={logo}
                                                alt="logo"
                                                className="w-full h-full object-contain"
                                            />

                                        </div>

                                        {/* TITLE */}
                                        <div>

                                            <h1 className="text-6xl font-black leading-tight uppercase">

                                                Ruhama
                                                <br />
                                                United School

                                            </h1>

                                            <p className="mt-4 text-white/70 text-2xl">

                                                Smart Digital Diary &
                                                Academic Reporting System

                                            </p>

                                        </div>

                                    </div>

                                    {/* CLASS */}
                                    <div className="bg-white/10 border border-white/20 rounded-[24px] px-8 py-6 min-w-[240px]">

                                        <p className="text-white/60 text-sm tracking-[5px] uppercase mb-2">

                                            Class

                                        </p>

                                        <h2 className="text-4xl font-black break-words">

                                            {report.className}

                                        </h2>

                                    </div>

                                </div>

                                {/* STATS */}
                                <div className="grid grid-cols-2 gap-5 mt-8">

                                    {/* DATE */}
                                    <div className="bg-white/10 rounded-[24px] p-5">

                                        <p className="text-white/60 text-sm tracking-[4px] uppercase mb-2">

                                            Report Date

                                        </p>

                                        <h2 className="text-3xl font-bold">

                                            {report.date}

                                        </h2>

                                    </div>

                                    {/* SUBJECTS */}
                                    <div className="bg-white/10 rounded-[24px] p-5 text-right">

                                        <p className="text-white/60 text-sm tracking-[4px] uppercase mb-2">

                                            Subjects

                                        </p>

                                        <h2 className="text-3xl font-bold">

                                            {report.entries.length}

                                        </h2>

                                    </div>

                                </div>

                            </div>

                            {/* TABLE */}
                            <div className="p-8">

                                <div className="overflow-hidden rounded-[24px] border border-slate-200">

                                    {/* TABLE HEAD */}
                                    <div className="grid grid-cols-12 bg-[#07153B] text-white font-bold text-lg">

                                        <div className="col-span-1 p-5 border-r border-white/10">

                                            #

                                        </div>

                                        <div className="col-span-2 p-5 border-r border-white/10">

                                            Subject

                                        </div>

                                        <div className="col-span-2 p-5 border-r border-white/10">

                                            Teacher

                                        </div>

                                        <div className="col-span-3 p-5 border-r border-white/10">

                                            Class Work

                                        </div>

                                        <div className="col-span-4 p-5">

                                            Home Work

                                        </div>

                                    </div>

                                    {/* ROWS */}
                                    {report.entries.map(
                                        (
                                            entry,
                                            index
                                        ) => (

                                            <div
                                                key={index}
                                                className={`grid grid-cols-12 border-t border-slate-200
                        ${index % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-slate-50"
                                                    }`}
                                            >

                                                {/* NUMBER */}
                                                <div className="col-span-1 p-5 border-r border-slate-200 font-black text-[#07153B] text-xl">

                                                    {(index + 1)
                                                        .toString()
                                                        .padStart(2, "0")}

                                                </div>

                                                {/* SUBJECT */}
                                                <div className="col-span-2 p-5 border-r border-slate-200">

                                                    <h2 className="text-[#07153B] font-black text-xl leading-8">

                                                        {entry.subject}

                                                    </h2>

                                                </div>

                                                {/* TEACHER */}
                                                <div className="col-span-2 p-5 border-r border-slate-200">

                                                    <p className="text-slate-700 font-semibold leading-7">

                                                        {entry.teacherId?.name}

                                                    </p>

                                                </div>

                                                {/* CLASS WORK */}
                                                <div className="col-span-3 p-5 border-r border-slate-200">

                                                    <p className="text-slate-700 leading-8 whitespace-pre-wrap break-words">

                                                        {entry.classWork}

                                                    </p>

                                                </div>

                                                {/* HOME WORK */}
                                                <div className="col-span-4 p-5">

                                                    <p className="text-slate-700 leading-8 whitespace-pre-wrap break-words">

                                                        {entry.homeWork}

                                                    </p>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                            {/* FOOTER */}
                            <div className="bg-[#f8faff] border-t border-slate-200 px-10 py-8">

                                <div className="flex items-center justify-between">

                                    {/* LEFT */}
                                    <div>

                                        <h2 className="text-4xl font-black text-[#07153B]">

                                            RUHAMA UNITED SCHOOL

                                        </h2>

                                        <p className="text-slate-500 mt-2 text-lg">

                                            Excellence • Discipline • Achievement

                                        </p>

                                    </div>

                                    {/* RIGHT */}
                                    <div className="text-center">

                                        <div className="w-60 border-b-2 border-slate-400 mb-3"></div>

                                        <p className="text-slate-500">

                                            Principal Signature

                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default ClassReport;