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

      alert(error.response?.data?.message);

    } finally {

      setLoading(false);
    }
  };

  // DOWNLOAD IMAGE
  const downloadImage = async () => {

    const dataUrl = await htmlToImage.toPng(
      reportRef.current,
      {
        quality: 1,
        pixelRatio: 4,
        backgroundColor: "#ffffff",
      }
    );

    const link = document.createElement("a");

    link.download =
      `${report.className}-${report.date}.png`;

    link.href = dataUrl;

    link.click();
  };

  // SHARE IMAGE
  const shareImage = async () => {

    try {

      const dataUrl = await htmlToImage.toPng(
        reportRef.current,
        {
          quality: 1,
          pixelRatio: 4,
          backgroundColor: "#ffffff",
        }
      );

      const response = await fetch(dataUrl);

      const blob = await response.blob();

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
          title:
            "RUHAMA UNITED SCHOOL",

          text:
            "Daily Academic Report",

          files: [file],
        });

      } else {

        alert(
          "Sharing not supported on this device"
        );
      }

    } catch (error) {

      console.log(error);
    }
  };

  return (

    <div className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8">

      {/* TOP FILTER CARD */}
      <div className="bg-white rounded-[35px] border border-gray-100 shadow-xl p-5 md:p-8 mb-6">

        {/* TOP */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-7">

          {/* LEFT */}
          <div>

            <h1 className="text-4xl md:text-6xl font-black leading-tight text-[#0B1E4F]">

              Premium
              <br />
              Class Report

            </h1>

            <p className="mt-3 text-gray-500 text-base md:text-lg">

              RUHAMA UNITED SCHOOL

            </p>

          </div>

          {/* RIGHT */}
          <div className="bg-gradient-to-r from-[#07153B] to-[#142F7A] text-white px-6 py-5 rounded-[30px] shadow-xl w-fit">

            <h2 className="font-black text-2xl">

              WhatsApp Ready

            </h2>

            <p className="text-white/70 mt-2">

              HD Premium Share Design

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
              setClassName(e.target.value)
            }
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

          {/* DATE */}
          <input
            type="date"
            className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none text-lg font-semibold text-gray-700"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
          />

          {/* BUTTON */}
          <button
            onClick={getReport}
            disabled={loading}
            className="bg-gradient-to-r from-[#07153B] via-[#0B1E4F] to-[#142F7A] hover:scale-[1.02] transition-all duration-300 text-white rounded-2xl text-lg font-black shadow-xl"
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

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-4 mb-6">

            {/* DOWNLOAD */}
            <button
              onClick={downloadImage}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-black text-base md:text-lg shadow-xl hover:scale-[1.02] transition-all"
            >

              Download HD

            </button>

            {/* SHARE */}
            <button
              onClick={shareImage}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-black text-base md:text-lg shadow-xl hover:scale-[1.02] transition-all"
            >

              Share Now

            </button>

          </div>

          {/* REPORT CARD */}
          <div
            ref={reportRef}
            className="w-full max-w-[820px] mx-auto bg-white rounded-[40px] overflow-hidden shadow-2xl"
          >

            {/* HEADER */}
            <div className="bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#142F7A] px-5 py-6 md:px-8 md:py-8 relative overflow-hidden">

              {/* GLOW */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">

                {/* TOP */}
                <div className="flex flex-col items-center text-center">

                  {/* LOGO */}
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-[28px] p-3 shadow-2xl mb-5">

                    <img
                      src={logo}
                      alt=""
                      className="w-full h-full object-contain"
                    />

                  </div>

                  {/* TITLE */}
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight uppercase">

                    Ruhama
                    <br />
                    United School

                  </h1>

                  <p className="text-blue-100 mt-4 text-sm md:text-lg max-w-2xl leading-relaxed">

                    Smart Digital Diary &
                    Academic Reporting System

                  </p>

                </div>

                {/* INFO */}
                <div className="grid grid-cols-2 gap-4 mt-8">

                  {/* CLASS */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 text-center">

                    <p className="text-white/60 uppercase tracking-[3px] text-xs mb-2">

                      CLASS

                    </p>

                    <h2 className="text-white text-2xl md:text-4xl font-black">

                      {report.className}

                    </h2>

                  </div>

                  {/* DATE */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 text-center">

                    <p className="text-white/60 uppercase tracking-[3px] text-xs mb-2">

                      DATE

                    </p>

                    <h2 className="text-white text-lg md:text-3xl font-black">

                      {report.date}

                    </h2>

                  </div>

                </div>

              </div>

            </div>

            {/* BODY */}
            <div className="bg-[#f8fbff] p-4 md:p-6">

              <div className="space-y-4">

                {report.entries.map((entry, index) => (

                  <div
                    key={index}
                    className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden"
                  >

                    {/* SUBJECT TOP */}
                    <div className="bg-gradient-to-r from-[#0B1E4F] to-[#142F7A] px-4 py-4 text-white">

                      <div className="flex items-center justify-between gap-3">

                        {/* LEFT */}
                        <div className="flex items-center gap-3">

                          <div className="w-11 h-11 rounded-[14px] bg-white/10 flex items-center justify-center font-black text-lg">

                            {index + 1}

                          </div>

                          <div>

                            <p className="text-[10px] tracking-[3px] text-white/60 uppercase">

                              Subject

                            </p>

                            <h2 className="text-xl md:text-2xl font-black">

                              {entry.subject}

                            </h2>

                          </div>

                        </div>

                        {/* TEACHER */}
                        <div className="bg-white/10 rounded-[16px] px-3 py-2 text-right">

                          <p className="text-[9px] tracking-[3px] text-white/60 uppercase">

                            Teacher

                          </p>

                          <h3 className="text-sm md:text-base font-bold">

                            {entry.teacherId?.name}

                          </h3>

                        </div>

                      </div>

                    </div>

                    {/* CONTENT */}
                    <div className="p-4">

                      <div className="grid grid-cols-1 gap-3">

                        {/* CLASS WORK */}
                        <div className="bg-blue-50 rounded-[20px] p-4 border border-blue-100">

                          <div className="flex items-start gap-3">

                            {/* ICON */}
                            <div className="w-12 h-12 rounded-[14px] bg-blue-100 flex items-center justify-center text-xl shrink-0">

                              📘

                            </div>

                            {/* TEXT */}
                            <div className="flex-1 min-w-0">

                              <p className="text-[10px] tracking-[3px] text-gray-500 uppercase mb-1">

                                Class Work

                              </p>

                              <h3 className="text-[#0B1E4F] font-black text-lg mb-2">

                                Today's Lesson

                              </h3>

                              <p className="text-gray-700 text-[14px] leading-6 whitespace-pre-wrap font-medium break-words">

                                {entry.classWork}

                              </p>

                            </div>

                          </div>

                        </div>

                        {/* HOME WORK */}
                        <div className="bg-emerald-50 rounded-[20px] p-4 border border-emerald-100">

                          <div className="flex items-start gap-3">

                            {/* ICON */}
                            <div className="w-12 h-12 rounded-[14px] bg-emerald-100 flex items-center justify-center text-xl shrink-0">

                              🏠

                            </div>

                            {/* TEXT */}
                            <div className="flex-1 min-w-0">

                              <p className="text-[10px] tracking-[3px] text-gray-500 uppercase mb-1">

                                Home Work

                              </p>

                              <h3 className="text-emerald-700 font-black text-lg mb-2">

                                Practice Task

                              </h3>

                              <p className="text-gray-700 text-[14px] leading-6 whitespace-pre-wrap font-medium break-words">

                                {entry.homeWork}

                              </p>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

            {/* FOOTER */}
            <div className="bg-white border-t border-gray-100 px-5 py-4 text-center">

              <h3 className="font-black text-2xl md:text-3xl text-[#0B1E4F]">

                RUHAMA UNITED SCHOOL

              </h3>

              <p className="text-gray-500 mt-2 text-sm md:text-lg">

                Excellence • Discipline • Achievement

              </p>

              <div className="w-44 border-b-2 border-gray-300 mx-auto mt-5 mb-2"></div>

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