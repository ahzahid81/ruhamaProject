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
    const dataUrl = await htmlToImage.toPng(reportRef.current, {
      quality: 1,
      pixelRatio: 3,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");

    link.download = `${report.className}-${report.date}.png`;

    link.href = dataUrl;

    link.click();
  };

  // SHARE IMAGE
  const shareImage = async () => {
    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

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
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8">

      {/* TOP CARD */}
      <div className="bg-white rounded-[35px] border border-gray-100 shadow-xl p-5 md:p-8 mb-6">

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

          {/* ACTIONS */}
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

          {/* PREMIUM REPORT */}
          <div
            ref={reportRef}
            className="w-full max-w-[1080px] mx-auto bg-white rounded-[40px] overflow-hidden shadow-2xl"
          >

            {/* HEADER */}
            <div className="bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#142F7A] px-5 py-8 md:px-10 md:py-12 relative overflow-hidden">

              {/* Glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">

                {/* TOP */}
                <div className="flex flex-col items-center text-center">

                  {/* LOGO */}
                  <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-[35px] p-4 shadow-2xl mb-5">

                    <img
                      src={logo}
                      alt=""
                      className="w-full h-full object-contain"
                    />

                  </div>

                  {/* TITLE */}
                  <h1 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tight uppercase">

                    Ruhama
                    <br />
                    United School

                  </h1>

                  <p className="text-blue-100 mt-4 text-sm md:text-xl max-w-2xl leading-relaxed">

                    Smart Digital Daily Academic Reporting System

                  </p>

                </div>

                {/* INFO */}
                <div className="grid grid-cols-2 gap-4 mt-8">

                  {/* CLASS */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[30px] p-5 text-center">

                    <p className="text-white/60 uppercase tracking-[3px] text-xs mb-2">

                      CLASS

                    </p>

                    <h2 className="text-white text-2xl md:text-4xl font-black">

                      {report.className}

                    </h2>

                  </div>

                  {/* DATE */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[30px] p-5 text-center">

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
            <div className="bg-[#f8fbff] p-4 md:p-8 space-y-5">

              {report.entries.map((entry, index) => (

                <div
                  key={index}
                  className="bg-white rounded-[35px] overflow-hidden shadow-lg border border-gray-100"
                >

                  {/* TOP */}
                  <div className="bg-gradient-to-r from-[#0B1E4F] to-[#142F7A] p-5 md:p-7 text-white">

                    <div className="flex flex-col gap-5">

                      {/* SUBJECT */}
                      <div className="flex items-center gap-4">

                        <div className="w-14 h-14 rounded-[20px] bg-white/10 flex items-center justify-center text-2xl font-black">

                          {index + 1}

                        </div>

                        <div>

                          <p className="text-white/60 uppercase tracking-[3px] text-xs mb-1">

                            SUBJECT

                          </p>

                          <h2 className="text-2xl md:text-4xl font-black">

                            {entry.subject}

                          </h2>

                        </div>

                      </div>

                      {/* TEACHER */}
                      <div className="bg-white/10 rounded-[22px] px-5 py-4 w-fit">

                        <p className="text-white/60 uppercase tracking-[3px] text-xs mb-1">

                          TEACHER

                        </p>

                        <h3 className="text-lg md:text-2xl font-bold">

                          {entry.teacherId?.name}

                        </h3>

                      </div>

                    </div>

                  </div>

                  {/* CONTENT */}
                  <div className="p-5 md:p-7 space-y-5">

                    {/* CLASS WORK */}
                    <div className="bg-blue-50 border border-blue-100 rounded-[30px] p-5">

                      <div className="flex items-center gap-3 mb-4">

                        <div className="w-12 h-12 rounded-[18px] bg-blue-100 flex items-center justify-center text-2xl">

                          📘

                        </div>

                        <div>

                          <p className="text-gray-500 uppercase tracking-[3px] text-xs">

                            CLASS WORK

                          </p>

                          <h3 className="text-[#0B1E4F] text-xl md:text-2xl font-black">

                            Today's Lesson

                          </h3>

                        </div>

                      </div>

                      <p className="text-gray-700 text-base md:text-xl leading-8 whitespace-pre-wrap font-medium">

                        {entry.classWork}

                      </p>

                    </div>

                    {/* HOME WORK */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-[30px] p-5">

                      <div className="flex items-center gap-3 mb-4">

                        <div className="w-12 h-12 rounded-[18px] bg-emerald-100 flex items-center justify-center text-2xl">

                          🏠

                        </div>

                        <div>

                          <p className="text-gray-500 uppercase tracking-[3px] text-xs">

                            HOME WORK

                          </p>

                          <h3 className="text-emerald-700 text-xl md:text-2xl font-black">

                            Practice Task

                          </h3>

                        </div>

                      </div>

                      <p className="text-gray-700 text-base md:text-xl leading-8 whitespace-pre-wrap font-medium">

                        {entry.homeWork}

                      </p>

                    </div>

                  </div>

                </div>

              ))}

            </div>

            {/* FOOTER */}
            <div className="bg-white border-t border-gray-100 px-5 py-6 text-center">

              <h3 className="font-black text-2xl md:text-3xl text-[#0B1E4F]">

                RUHAMA UNITED SCHOOL

              </h3>

              <p className="text-gray-500 mt-2 text-sm md:text-lg">

                Excellence • Discipline • Knowledge

              </p>

            </div>

          </div>

        </>

      )}

    </div>
  );
};

export default ClassReport;