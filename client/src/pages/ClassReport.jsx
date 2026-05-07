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
      alert(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  // DOWNLOAD
  const downloadImage = async () => {
    try {
      if (!reportRef.current) return;

      const blob = await htmlToImage.toBlob(
        reportRef.current,
        {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#ffffff",
        }
      );

      if (!blob) return;

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.download = `${report.className}-${report.date}.png`;

      link.href = url;

      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
    }
  };

  // SHARE
  const shareImage = async () => {
    try {
      if (!reportRef.current) return;

      const blob = await htmlToImage.toBlob(
        reportRef.current,
        {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#ffffff",
        }
      );

      if (!blob) return;

      const file = new File(
        [blob],
        "ruhama-report.png",
        {
          type: "image/png",
        }
      );

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          title: "RUHAMA UNITED SCHOOL",
          text: "Daily Academic Report",
          files: [file],
        });
      } else {
        alert("Sharing not supported");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2ff] px-3 py-6 md:px-6">

      {/* TOP PANEL */}
      <div className="max-w-6xl mx-auto bg-white rounded-[28px] border border-slate-200 p-5 md:p-8 shadow-sm mb-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <h1 className="text-3xl md:text-5xl font-black text-[#07153B] leading-tight">

              Premium
              <br />
              Class Report

            </h1>

            <p className="mt-2 text-slate-500 text-sm md:text-base">

              RUHAMA UNITED SCHOOL

            </p>

          </div>

          <div className="bg-[#07153B] text-white px-5 py-4 rounded-2xl">

            <h3 className="font-bold text-lg">
              WhatsApp Ready
            </h3>

            <p className="text-white/70 text-sm mt-1">
              Fast HD Export
            </p>

          </div>

        </div>

        {/* FILTER */}
        <div className="grid md:grid-cols-3 gap-4 mt-7">

          <select
            value={className}
            onChange={(e) =>
              setClassName(e.target.value)
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-semibold outline-none"
          >

            <option value="">
              Select Class
            </option>

            {classes.map((item, index) => (
              <option
                key={index}
                value={item}
              >
                {item}
              </option>
            ))}

          </select>

          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-semibold outline-none"
          />

          <button
            onClick={getReport}
            disabled={loading}
            className="bg-[#07153B] hover:bg-[#0B1E4F] transition text-white rounded-2xl font-bold"
          >

            {loading
              ? "Loading..."
              : "Generate Report"}

          </button>

        </div>

      </div>

      {/* REPORT */}
      {report && (
        <div className="max-w-6xl mx-auto">

          {/* ACTIONS */}
          <div className="grid grid-cols-2 gap-4 mb-5">

            <button
              onClick={downloadImage}
              className="bg-[#0B1E4F] text-white py-4 rounded-2xl font-bold shadow-sm"
            >

              Download HD

            </button>

            <button
              onClick={shareImage}
              className="bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-sm"
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

                    <div className="bg-white rounded-[24px] p-4 w-28 h-28 flex items-center justify-center">

                      <img
                        src={logo}
                        alt="logo"
                        className="w-full h-full object-contain"
                      />

                    </div>

                    <div>

                      <h1 className="text-6xl font-black leading-tight">

                        RUHAMA
                        <br />
                        UNITED SCHOOL

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

                    <h2 className="text-4xl font-black">

                      {report.className}

                    </h2>

                  </div>

                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 gap-5 mt-8">

                  <div className="bg-white/10 rounded-[24px] p-5">

                    <p className="text-white/60 text-sm tracking-[4px] uppercase mb-2">

                      Report Date

                    </p>

                    <h2 className="text-3xl font-bold">

                      {report.date}

                    </h2>

                  </div>

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

                  {/* TABLE HEADER */}
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
                      Today's Lesson
                    </div>

                    <div className="col-span-4 p-5">
                      Practice Task
                    </div>

                  </div>

                  {/* ROWS */}
                  {report.entries.map(
                    (entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 border-t border-slate-200 text-slate-700"
                      >

                        <div className="col-span-1 p-5 font-black text-[#07153B] text-xl border-r border-slate-200">

                          {(index + 1)
                            .toString()
                            .padStart(2, "0")}

                        </div>

                        <div className="col-span-2 p-5 font-bold text-[#07153B] text-xl border-r border-slate-200">

                          {entry.subject}

                        </div>

                        <div className="col-span-2 p-5 font-semibold border-r border-slate-200 leading-7">

                          {entry.teacherId?.name}

                        </div>

                        <div className="col-span-3 p-5 border-r border-slate-200 leading-8 whitespace-pre-wrap">

                          {entry.classWork}

                        </div>

                        <div className="col-span-4 p-5 leading-8 whitespace-pre-wrap">

                          {entry.homeWork}

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* FOOTER */}
              <div className="bg-[#f8faff] border-t border-slate-200 px-10 py-8">

                <div className="flex justify-between items-center">

                  <div>

                    <h2 className="text-4xl font-black text-[#07153B]">

                      RUHAMA UNITED SCHOOL

                    </h2>

                    <p className="text-slate-500 mt-2 text-lg">

                      Excellence • Discipline • Achievement

                    </p>

                  </div>

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