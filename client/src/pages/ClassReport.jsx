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

      alert(
        error.response?.data?.message
      );

    } finally {

      setLoading(false);
    }
  };

  // DOWNLOAD
  const downloadImage = async () => {

    const dataUrl =
      await htmlToImage.toPng(
        reportRef.current,
        {
          quality: 1,
          pixelRatio: 5,
          backgroundColor: "#ffffff",
        }
      );

    const link =
      document.createElement("a");

    link.download =
      `${report.className}-${report.date}.png`;

    link.href = dataUrl;

    link.click();
  };

  // SHARE
  const shareImage = async () => {

    try {

      const dataUrl =
        await htmlToImage.toPng(
          reportRef.current,
          {
            quality: 1,
            pixelRatio: 5,
            backgroundColor: "#ffffff",
          }
        );

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

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {

        await navigator.share({
          title:
            "RUHAMA UNITED SCHOOL",

          text:
            "Premium Academic Report",

          files: [file],
        });

      } else {

        alert(
          "Sharing not supported"
        );
      }

    } catch (error) {

      console.log(error);
    }
  };

  return (

    <div className="min-h-screen bg-[#eef3ff] px-3 md:px-6 py-6">

      {/* FILTER CARD */}
      <div className="max-w-6xl mx-auto bg-white rounded-[40px] p-5 md:p-8 shadow-2xl border border-white/50 mb-6">

        {/* TOP */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-7">

          <div>

            <p className="uppercase tracking-[6px] text-[#4A67D6] font-bold text-xs mb-3">

              RUHAMA UNITED SCHOOL

            </p>

            <h1 className="text-4xl md:text-6xl font-black leading-tight text-[#07153B]">

              Premium
              <br />
              Daily Report

            </h1>

            <p className="mt-4 text-gray-500 text-base md:text-lg leading-relaxed max-w-xl">

              Elegant WhatsApp-ready academic report
              with ultra premium mobile design.

            </p>

          </div>

          {/* BADGE */}
          <div className="bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#1B44D1] rounded-[35px] px-7 py-6 text-white shadow-[0_20px_60px_rgba(11,30,79,0.35)]">

            <h2 className="text-3xl font-black">

              HD Export

            </h2>

            <p className="text-white/70 mt-2">

              Mobile Optimized Design

            </p>

          </div>

        </div>

        {/* FILTERS */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* CLASS */}
          <select
            className="w-full bg-[#f5f7ff] border border-[#dbe4ff] rounded-2xl p-4 outline-none text-lg font-bold text-[#07153B]"
            value={className}
            onChange={(e) =>
              setClassName(
                e.target.value
              )
            }
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
            className="w-full bg-[#f5f7ff] border border-[#dbe4ff] rounded-2xl p-4 outline-none text-lg font-bold text-[#07153B]"
            value={date}
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
          />

          {/* BUTTON */}
          <button
            onClick={getReport}
            disabled={loading}
            className="bg-gradient-to-r from-[#07153B] via-[#0B1E4F] to-[#1B44D1] text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all duration-300"
          >

            {
              loading
                ? "Generating..."
                : "Generate Report"
            }

          </button>

        </div>

      </div>

      {/* REPORT */}
      {report && (

        <>

          {/* ACTIONS */}
          <div className="max-w-[850px] mx-auto grid grid-cols-2 gap-4 mb-5">

            <button
              onClick={downloadImage}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-black shadow-xl text-base md:text-lg hover:scale-[1.02] transition-all"
            >

              Download HD

            </button>

            <button
              onClick={shareImage}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-black shadow-xl text-base md:text-lg hover:scale-[1.02] transition-all"
            >

              Share Now

            </button>

          </div>

          {/* PREMIUM REPORT CARD */}
          <div
            ref={reportRef}
            className="w-full max-w-[850px] mx-auto rounded-[45px] overflow-hidden bg-white shadow-[0_30px_100px_rgba(0,0,0,0.12)]"
          >

            {/* HEADER */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#1B44D1] px-5 py-7 md:px-8 md:py-10">

              {/* GLOW */}
              <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>

              <div className="absolute bottom-[-100px] left-[-100px] w-72 h-72 rounded-full bg-blue-400/20 blur-3xl"></div>

              <div className="relative z-10">

                {/* TOP */}
                <div className="flex flex-col items-center text-center">

                  {/* LOGO */}
                  <div className="w-24 h-24 bg-white rounded-[30px] p-3 shadow-[0_15px_40px_rgba(0,0,0,0.35)] mb-5">

                    <img
                      src={logo}
                      alt="logo"
                      className="w-full h-full object-contain"
                    />

                  </div>

                  {/* TITLE */}
                  <h1 className="text-white text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight">

                    Ruhama
                    <br />
                    United School

                  </h1>

                  <p className="text-blue-100 text-sm md:text-xl mt-4 leading-relaxed max-w-2xl">

                    Smart Digital Diary &
                    Academic Reporting System

                  </p>

                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">

                  {/* CLASS */}
                  <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-5 text-center shadow-xl">

                    <p className="text-white/60 uppercase tracking-[5px] text-xs mb-2">

                      Class

                    </p>

                    <h2 className="text-white text-3xl font-black">

                      {report.className}

                    </h2>

                  </div>

                  {/* DATE */}
                  <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-5 text-center shadow-xl">

                    <p className="text-white/60 uppercase tracking-[5px] text-xs mb-2">

                      Report Date

                    </p>

                    <h2 className="text-white text-xl md:text-2xl font-black break-words">

                      {report.date}

                    </h2>

                  </div>

                  {/* SUBJECT COUNT */}
                  <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[30px] p-5 text-center shadow-xl">

                    <p className="text-white/60 uppercase tracking-[5px] text-xs mb-2">

                      Subjects

                    </p>

                    <h2 className="text-white text-4xl font-black">

                      {report.entries.length}

                    </h2>

                  </div>

                </div>

              </div>

            </div>

            {/* BODY */}
            <div className="bg-[#f7f9ff] px-4 py-5 md:px-6 md:py-6">

              <div className="space-y-5">

                {report.entries.map(
                  (
                    entry,
                    index
                  ) => (

                    <div
                      key={index}
                      className="bg-white rounded-[35px] overflow-hidden border border-[#edf1ff] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                    >

                      {/* SUBJECT TOP */}
                      <div className="bg-gradient-to-r from-[#0B1E4F] to-[#1B44D1] p-5">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                          {/* LEFT */}
                          <div className="flex items-center gap-4">

                            {/* NUMBER */}
                            <div className="w-14 h-14 rounded-[18px] bg-white/10 flex items-center justify-center text-white text-xl font-black">

                              {index + 1}

                            </div>

                            {/* SUBJECT */}
                            <div>

                              <p className="text-white/60 uppercase tracking-[5px] text-[10px] mb-1">

                                Subject

                              </p>

                              <h2 className="text-white text-2xl md:text-3xl font-black">

                                {entry.subject}

                              </h2>

                            </div>

                          </div>

                          {/* TEACHER */}
                          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[20px] px-5 py-4">

                            <p className="text-white/60 uppercase tracking-[4px] text-[10px] mb-1">

                              Teacher

                            </p>

                            <h3 className="text-white font-bold text-lg">

                              {
                                entry.teacherId
                                  ?.name
                              }

                            </h3>

                          </div>

                        </div>

                      </div>

                      {/* CONTENT */}
                      <div className="p-4 md:p-5">

                        <div className="grid grid-cols-1 gap-4">

                          {/* CLASS WORK */}
                          <div className="bg-gradient-to-br from-[#ffffff] to-[#f5f8ff] border border-[#dbe6ff] rounded-[28px] p-5 shadow-sm">

                            <div className="flex items-start gap-4">

                              {/* ICON */}
                              <div className="w-14 h-14 rounded-[18px] bg-blue-100 flex items-center justify-center text-2xl shrink-0">

                                📘

                              </div>

                              {/* CONTENT */}
                              <div className="flex-1 min-w-0">

                                <p className="text-gray-500 uppercase tracking-[5px] text-[10px] mb-1">

                                  Class Work

                                </p>

                                <h3 className="text-[#07153B] text-2xl font-black mb-3">

                                  Today's Lesson

                                </h3>

                                <p className="text-gray-700 text-[15px] md:text-lg leading-8 whitespace-pre-wrap break-words font-medium">

                                  {entry.classWork}

                                </p>

                              </div>

                            </div>

                          </div>

                          {/* HOME WORK */}
                          <div className="bg-gradient-to-br from-[#ffffff] to-[#f5fff9] border border-[#d9f7e5] rounded-[28px] p-5 shadow-sm">

                            <div className="flex items-start gap-4">

                              {/* ICON */}
                              <div className="w-14 h-14 rounded-[18px] bg-emerald-100 flex items-center justify-center text-2xl shrink-0">

                                🏠

                              </div>

                              {/* CONTENT */}
                              <div className="flex-1 min-w-0">

                                <p className="text-gray-500 uppercase tracking-[5px] text-[10px] mb-1">

                                  Home Work

                                </p>

                                <h3 className="text-emerald-700 text-2xl font-black mb-3">

                                  Practice Task

                                </h3>

                                <p className="text-gray-700 text-[15px] md:text-lg leading-8 whitespace-pre-wrap break-words font-medium">

                                  {entry.homeWork}

                                </p>

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

            {/* FOOTER */}
            <div className="bg-white px-5 py-7 border-t border-gray-100 text-center">

              <h2 className="text-[#07153B] text-3xl md:text-4xl font-black">

                RUHAMA UNITED SCHOOL

              </h2>

              <p className="text-gray-500 mt-3 text-sm md:text-lg">

                Excellence • Discipline • Achievement

              </p>

              <div className="w-52 border-b-2 border-gray-300 mx-auto mt-7 mb-2"></div>

              <p className="text-gray-500 text-sm">

                Principal Signature

              </p>

            </div>

          </div>

        </>

      )}

    </div>
  );
};

export default ClassReport;