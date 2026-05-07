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

    const dataUrl =
      await htmlToImage.toPng(
        reportRef.current,
        {
          quality: 1,
          pixelRatio: 6,
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

  // SHARE IMAGE
  const shareImage = async () => {

    try {

      const dataUrl =
        await htmlToImage.toPng(
          reportRef.current,
          {
            quality: 1,
            pixelRatio: 6,
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

    <div className="min-h-screen bg-[#eef3ff] px-3 md:px-6 py-6">

      {/* FILTER CARD */}
      <div className="max-w-6xl mx-auto bg-white rounded-[35px] p-5 md:p-8 shadow-2xl border border-gray-100 mb-6">

        {/* TOP */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-7">

          <div>

            <p className="uppercase tracking-[5px] text-[#1B44D1] text-xs font-bold mb-3">

              RUHAMA UNITED SCHOOL

            </p>

            <h1 className="text-4xl md:text-6xl font-black text-[#07153B] leading-tight">

              Premium
              <br />
              Daily Report

            </h1>

            <p className="mt-4 text-gray-500 text-base md:text-lg">

              HD WhatsApp & Facebook Ready Academic Report

            </p>

          </div>

          {/* BADGE */}
          <div className="bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#1B44D1] text-white rounded-[30px] px-8 py-7 shadow-[0_20px_60px_rgba(11,30,79,0.35)]">

            <h2 className="text-3xl font-black">

              HD PNG

            </h2>

            <p className="text-white/70 mt-2">

              Mobile & Desktop Optimized

            </p>

          </div>

        </div>

        {/* FILTERS */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* CLASS */}
          <select
            className="w-full bg-[#f5f7ff] border border-[#dbe4ff] p-4 rounded-2xl outline-none text-lg font-bold text-[#07153B]"
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
            className="w-full bg-[#f5f7ff] border border-[#dbe4ff] p-4 rounded-2xl outline-none text-lg font-bold text-[#07153B]"
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
            className="bg-gradient-to-r from-[#07153B] via-[#0B1E4F] to-[#1B44D1] text-white rounded-2xl text-lg font-black shadow-xl hover:scale-[1.02] transition-all"
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
          <div className="max-w-[1080px] mx-auto grid grid-cols-2 gap-4 mb-5">

            {/* DOWNLOAD */}
            <button
              onClick={downloadImage}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl text-lg font-black shadow-xl hover:scale-[1.02] transition-all"
            >

              Download HD

            </button>

            {/* SHARE */}
            <button
              onClick={shareImage}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl text-lg font-black shadow-xl hover:scale-[1.02] transition-all"
            >

              Share Now

            </button>

          </div>

          {/* REPORT IMAGE */}
          <div className="overflow-x-auto pb-5">

            <div
              ref={reportRef}
              className="w-[1080px] mx-auto bg-white rounded-[45px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.15)]"
            >

              {/* HEADER */}
              <div className="bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#1B44D1] px-16 py-14 text-white relative overflow-hidden">

                {/* GLOW */}
                <div className="absolute top-[-120px] right-[-100px] w-[350px] h-[350px] bg-white/10 rounded-full blur-3xl"></div>

                <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">

                  {/* TOP */}
                  <div className="flex items-start justify-between gap-8">

                    {/* LEFT */}
                    <div className="flex items-center gap-6">

                      {/* LOGO */}
                      <div className="w-28 h-28 bg-white rounded-[30px] p-3 shadow-2xl shrink-0">

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

                        <p className="text-white/70 text-2xl mt-4">

                          Smart Academic Reporting System

                        </p>

                      </div>

                    </div>

                    {/* CLASS BOX */}
                    <div className="bg-white/10 border border-white/10 backdrop-blur-xl rounded-[30px] px-8 py-6 min-w-[250px] shadow-2xl">

                      <p className="text-white/60 uppercase tracking-[6px] text-sm mb-3 text-center">

                        Class

                      </p>

                      <h2 className="text-5xl font-black text-center break-words">

                        {report.className}

                      </h2>

                    </div>

                  </div>

                  {/* DATE + SUBJECT */}
                  <div className="grid grid-cols-2 gap-6 mt-10">

                    {/* DATE */}
                    <div className="bg-white/10 border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

                      <p className="text-white/60 uppercase tracking-[6px] text-sm mb-3">

                        Report Date

                      </p>

                      <h2 className="text-3xl font-black">

                        {report.date}

                      </h2>

                    </div>

                    {/* SUBJECT */}
                    <div className="bg-white/10 border border-white/10 rounded-[30px] p-6 backdrop-blur-xl text-right">

                      <p className="text-white/60 uppercase tracking-[6px] text-sm mb-3">

                        Subjects

                      </p>

                      <h2 className="text-5xl font-black">

                        {report.entries.length}

                      </h2>

                    </div>

                  </div>

                </div>

              </div>

              {/* TABLE */}
              <div className="p-10 bg-[#f7f9ff]">

                <div className="overflow-hidden rounded-[35px] border border-[#dfe7ff] shadow-lg">

                  <table className="w-full border-collapse">

                    {/* HEAD */}
                    <thead>

                      <tr className="bg-gradient-to-r from-[#07153B] to-[#1B44D1] text-white">

                        <th className="p-6 text-left text-2xl font-black">

                          Subject

                        </th>

                        <th className="p-6 text-left text-2xl font-black">

                          Class Work

                        </th>

                        <th className="p-6 text-left text-2xl font-black">

                          Home Work

                        </th>

                        <th className="p-6 text-left text-2xl font-black">

                          Teacher

                        </th>

                      </tr>

                    </thead>

                    {/* BODY */}
                    <tbody>

                      {report.entries.map(
                        (
                          entry,
                          index
                        ) => (

                          <tr
                            key={index}
                            className={`border-b border-[#e8edff]
                            ${
                              index % 2 === 0
                                ? "bg-white"
                                : "bg-[#f8fbff]"
                            }`}
                          >

                            {/* SUBJECT */}
                            <td className="p-6 align-top">

                              <div className="flex items-center gap-4">

                                <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#07153B] to-[#1B44D1] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-lg">

                                  {index + 1}

                                </div>

                                <div>

                                  <h2 className="text-2xl font-black text-[#07153B]">

                                    {entry.subject}

                                  </h2>

                                </div>

                              </div>

                            </td>

                            {/* CLASS WORK */}
                            <td className="p-6 align-top">

                              <div className="bg-[#f5f8ff] border border-[#dbe6ff] rounded-[25px] p-5 min-h-[150px]">

                                <div className="flex items-center gap-3 mb-4">

                                  <div className="w-12 h-12 rounded-[15px] bg-blue-100 flex items-center justify-center text-2xl">

                                    📘

                                  </div>

                                  <div>

                                    <p className="uppercase tracking-[5px] text-[10px] text-gray-500 mb-1">

                                      Class Work

                                    </p>

                                    <h3 className="text-xl font-black text-[#07153B]">

                                      Today's Lesson

                                    </h3>

                                  </div>

                                </div>

                                <p className="text-gray-700 text-lg leading-8 whitespace-pre-wrap break-words">

                                  {entry.classWork}

                                </p>

                              </div>

                            </td>

                            {/* HOME WORK */}
                            <td className="p-6 align-top">

                              <div className="bg-[#f5fff8] border border-[#d8f5e4] rounded-[25px] p-5 min-h-[150px]">

                                <div className="flex items-center gap-3 mb-4">

                                  <div className="w-12 h-12 rounded-[15px] bg-emerald-100 flex items-center justify-center text-2xl">

                                    🏠

                                  </div>

                                  <div>

                                    <p className="uppercase tracking-[5px] text-[10px] text-gray-500 mb-1">

                                      Home Work

                                    </p>

                                    <h3 className="text-xl font-black text-emerald-700">

                                      Practice Task

                                    </h3>

                                  </div>

                                </div>

                                <p className="text-gray-700 text-lg leading-8 whitespace-pre-wrap break-words">

                                  {entry.homeWork}

                                </p>

                              </div>

                            </td>

                            {/* TEACHER */}
                            <td className="p-6 align-top">

                              <div className="bg-gradient-to-br from-[#07153B] to-[#1B44D1] rounded-[25px] p-5 text-white min-h-[150px] flex flex-col justify-center shadow-lg">

                                <p className="uppercase tracking-[5px] text-[10px] text-white/60 mb-3">

                                  Teacher

                                </p>

                                <h3 className="text-2xl font-black leading-snug break-words">

                                  {
                                    entry.teacherId
                                      ?.name
                                  }

                                </h3>

                              </div>

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* FOOTER */}
              <div className="bg-white px-12 py-10 border-t border-gray-200">

                <div className="flex items-center justify-between">

                  {/* LEFT */}
                  <div>

                    <h2 className="text-4xl font-black text-[#07153B]">

                      RUHAMA UNITED SCHOOL

                    </h2>

                    <p className="text-gray-500 text-lg mt-3">

                      Excellence • Discipline • Achievement

                    </p>

                  </div>

                  {/* RIGHT */}
                  <div className="text-center">

                    <div className="w-64 border-b-2 border-gray-400 mb-3"></div>

                    <p className="text-gray-500 text-lg">

                      Principal Signature

                    </p>

                  </div>

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