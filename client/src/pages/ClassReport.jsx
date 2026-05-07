import {
  useRef,
  useState,
} from "react";

import * as htmlToImage from "html-to-image";

import api from "../services/api";

import logo from "../assets/logo.png";

const ClassReport = () => {

  const reportRef = useRef();

  const [className,
    setClassName] =
    useState("");

  const [date,
    setDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [report,
    setReport] =
    useState(null);

  const [loading,
    setLoading] =
    useState(false);


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

      return alert(
        "Select class"
      );
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

    const dataUrl =
      await htmlToImage.toPng(
        reportRef.current,
        {
          quality: 1,
          pixelRatio: 3,
        }
      );

    const link =
      document.createElement("a");

    link.download =
      `${report.className}-${report.date}.png`;

    link.href = dataUrl;

    link.click();
  };


  // SHARE IMAGE
  const shareImage = async () => {

    try {

      const dataUrl =
        await htmlToImage.toPng(
          reportRef.current,
          {
            quality: 1,
            pixelRatio: 3,
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
            "Daily Academic Report",

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
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8">

      {/* FILTER CARD */}
      <div className="bg-white border border-gray-100 rounded-[35px] p-5 md:p-8 shadow-sm mb-5">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">

          <div>

            <h1 className="text-4xl md:text-6xl font-black text-[#0B1E4F] leading-tight tracking-tight">

              Premium
              <br />
              Class Report

            </h1>

            <p className="mt-3 text-gray-500 text-base md:text-lg">

              RUHAMA UNITED SCHOOL

            </p>

          </div>

          <div className="bg-gradient-to-r from-[#0B1E4F] to-[#142f7a] text-white px-5 py-4 rounded-[25px] shadow-lg w-fit">

            <h3 className="font-bold text-lg">

              WhatsApp Ready

            </h3>

            <p className="text-white/70 text-sm mt-1">

              Premium HD Share

            </p>

          </div>

        </div>

        {/* FILTERS */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* CLASS */}
          <select
            className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none text-lg font-semibold text-gray-700"
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
            className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none text-lg font-semibold text-gray-700"
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
            className="bg-gradient-to-r from-[#0B1E4F] to-[#142f7a] hover:scale-[1.02] transition text-white rounded-2xl text-lg font-bold shadow-xl"
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

        <>

          {/* ACTIONS */}
          <div className="grid grid-cols-2 gap-4 mb-5">

            <button
              onClick={downloadImage}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold text-base md:text-lg shadow-xl"
            >

              Download HD

            </button>

            <button
              onClick={shareImage}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-bold text-base md:text-lg shadow-xl"
            >

              Share Now

            </button>

          </div>

          {/* PREMIUM REPORT */}
          <div
            ref={reportRef}
            className="bg-[#f7f9fc] rounded-[45px] overflow-hidden shadow-2xl border border-gray-200"
          >

            {/* HERO */}
            <div className="bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#142f7a] p-6 md:p-12 text-white relative overflow-hidden">

              {/* Glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl"></div>

              <div className="relative z-10">

                {/* Top */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

                  {/* Left */}
                  <div className="flex items-center gap-5">

                    {/* Logo */}
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[35px] shadow-2xl p-3 flex items-center justify-center overflow-hidden">

                      <img
                        src={logo}
                        alt="logo"
                        className="w-full h-full object-contain"
                      />

                    </div>

                    {/* Title */}
                    <div>

                      <h1 className="text-3xl md:text-6xl font-black leading-tight tracking-tight">

                        RUHAMA
                        <br />
                        UNITED SCHOOL

                      </h1>

                      <p className="mt-3 text-white/70 text-base md:text-xl font-medium">

                        Smart Digital Diary & Academic Reporting System

                      </p>

                    </div>

                  </div>

                  {/* Badge */}
                  <div className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-[30px] px-6 py-5 shadow-xl w-fit">

                    <p className="text-white/60 uppercase tracking-[4px] text-xs mb-2 text-center">

                      CLASS

                    </p>

                    <h2 className="text-3xl md:text-4xl font-black text-center">

                      {report.className}

                    </h2>

                  </div>

                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 gap-4 mt-8">

                  {/* DATE */}
                  <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-5">

                    <p className="text-white/60 uppercase tracking-[4px] text-xs mb-2">

                      REPORT DATE

                    </p>

                    <h2 className="text-xl md:text-3xl font-bold">

                      {report.date}

                    </h2>

                  </div>

                  {/* SUBJECT COUNT */}
                  <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] p-5 text-right">

                    <p className="text-white/60 uppercase tracking-[4px] text-xs mb-2">

                      SUBJECTS

                    </p>

                    <h2 className="text-xl md:text-3xl font-bold">

                      {report.entries.length}

                    </h2>

                  </div>

                </div>

              </div>

            </div>

            {/* CONTENT */}
            <div className="p-4 md:p-8 space-y-5">

              {report.entries.map(
                (
                  entry,
                  index
                ) => (

                  <div
                    key={index}
                    className="bg-white rounded-[35px] border border-gray-100 shadow-sm overflow-hidden"
                  >

                    {/* SUBJECT TOP */}
                    <div className="bg-gradient-to-r from-[#0B1E4F] to-[#142f7a] px-5 md:px-7 py-5 text-white">

                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                        {/* Subject */}
                        <div className="flex items-center gap-4">

                          <div className="w-14 h-14 rounded-[20px] bg-white/10 flex items-center justify-center text-2xl font-black">

                            {index + 1}

                          </div>

                          <div>

                            <p className="text-white/60 uppercase tracking-[4px] text-xs mb-1">

                              SUBJECT

                            </p>

                            <h2 className="text-2xl md:text-4xl font-black">

                              {entry.subject}

                            </h2>

                          </div>

                        </div>

                        {/* Teacher */}
                        <div className="bg-white/10 border border-white/10 rounded-[22px] px-5 py-4 w-fit">

                          <p className="text-white/60 uppercase tracking-[4px] text-xs mb-1">

                            TEACHER

                          </p>

                          <h3 className="text-lg md:text-2xl font-bold">

                            {
                              entry.teacherId
                                ?.name
                            }

                          </h3>

                        </div>

                      </div>

                    </div>

                    {/* WORK SECTION */}
                    <div className="grid md:grid-cols-2 gap-5 p-5 md:p-7 bg-[#f8fbff]">

                      {/* CLASS WORK */}
                      <div className="bg-white border border-blue-100 rounded-[30px] p-5 md:p-7 shadow-sm">

                        <div className="flex items-center gap-4 mb-5">

                          <div className="w-14 h-14 rounded-[22px] bg-blue-100 flex items-center justify-center text-3xl">

                            📘

                          </div>

                          <div>

                            <p className="text-gray-500 uppercase tracking-[4px] text-xs mb-1">

                              CLASS WORK

                            </p>

                            <h3 className="text-2xl font-black text-[#0B1E4F]">

                              Today's Lesson

                            </h3>

                          </div>

                        </div>

                        <p className="text-gray-700 leading-9 text-lg md:text-xl font-medium whitespace-pre-wrap">

                          {entry.classWork}

                        </p>

                      </div>

                      {/* HOME WORK */}
                      <div className="bg-white border border-emerald-100 rounded-[30px] p-5 md:p-7 shadow-sm">

                        <div className="flex items-center gap-4 mb-5">

                          <div className="w-14 h-14 rounded-[22px] bg-emerald-100 flex items-center justify-center text-3xl">

                            🏠

                          </div>

                          <div>

                            <p className="text-gray-500 uppercase tracking-[4px] text-xs mb-1">

                              HOME WORK

                            </p>

                            <h3 className="text-2xl font-black text-emerald-700">

                              Practice Task

                            </h3>

                          </div>

                        </div>

                        <p className="text-gray-700 leading-9 text-lg md:text-xl font-medium whitespace-pre-wrap">

                          {entry.homeWork}

                        </p>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

            {/* FOOTER */}
            <div className="bg-white border-t border-gray-100 px-6 py-6">

              <div className="flex flex-col md:flex-row justify-between items-center gap-5">

                {/* Left */}
                <div className="text-center md:text-left">

                  <h3 className="font-black text-2xl text-[#0B1E4F]">

                    RUHAMA UNITED SCHOOL

                  </h3>

                  <p className="text-gray-500 text-sm mt-2">

                    Excellence • Discipline • Achievement

                  </p>

                </div>

                {/* Signature */}
                <div className="text-center">

                  <div className="w-44 border-b-2 border-gray-400 mb-2"></div>

                  <p className="text-gray-500 text-sm font-medium">

                    Principal Signature

                  </p>

                </div>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );
};

export default ClassReport;