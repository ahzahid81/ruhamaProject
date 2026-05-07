import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const CreateReport = () => {

  const teacher =
    JSON.parse(
      localStorage.getItem(
        "teacher"
      )
    );

  const [assignments,
    setAssignments] =
    useState([]);

  const [selectedAssignment,
    setSelectedAssignment] =
    useState(null);

  const [classWork,
    setClassWork] =
    useState("");

  const [homeWork,
    setHomeWork] =
    useState("");

  const [date,
    setDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [loading,
    setLoading] =
    useState(false);


  // LOAD ASSIGNMENTS
  useEffect(() => {

    if (
      teacher?.assignments
    ) {

      setAssignments(
        teacher.assignments
      );
    }

  }, []);


  // CREATE REPORT
  const handleSubmit =
    async (e) => {

      e.preventDefault();

      if (
        !selectedAssignment
      ) {

        return alert(
          "Select Subject & Class"
        );
      }

      setLoading(true);

      try {

        await api.post(
          "/reports/create",
          {
            subject:
              selectedAssignment.subject,

            className:
              selectedAssignment.className,

            classWork,

            homeWork,

            date,

            teacherId:
              teacher._id,
          }
        );

        alert(
          "Report Created Successfully"
        );

        setClassWork("");
        setHomeWork("");

      } catch (error) {

        alert(
          error.response?.data
            ?.message
        );

      } finally {

        setLoading(false);
      }
    };

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-8">

      {/* HERO */}
      <div className="bg-gradient-to-br from-[#07153B] via-[#0B1E4F] to-[#142f7a] rounded-[40px] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden mb-6">

        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

        <div className="absolute bottom-0 left-0 w-52 h-52 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight">

                Create
                <br />
                Daily Report

              </h1>

              <p className="mt-4 text-white/70 text-base md:text-xl max-w-xl">

                Smart premium academic reporting system for RUHAMA UNITED SCHOOL

              </p>

            </div>

            {/* Teacher */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[30px] p-5 min-w-[280px]">

              <p className="text-white/60 uppercase tracking-[4px] text-xs mb-2">

                Teacher

              </p>

              <h2 className="text-2xl font-black">

                {teacher?.name}

              </h2>

              <p className="text-white/70 mt-2">

                {teacher?.email}

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ASSIGNMENTS */}
      <div className="mb-6">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-2xl md:text-4xl font-black text-[#0B1E4F]">

            Select Subject

          </h2>

          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-bold text-sm">

            {assignments.length}
            {" "}
            Assignments

          </div>

        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          {assignments.map(
            (
              item,
              index
            ) => (

              <button
                key={index}
                type="button"
                onClick={() =>
                  setSelectedAssignment(
                    item
                  )
                }
                className={`text-left rounded-[30px] p-5 border transition-all duration-300 shadow-sm
                    
                    ${
                      selectedAssignment
                        ?.subject ===
                        item.subject &&
                      selectedAssignment
                        ?.className ===
                        item.className

                        ? "bg-gradient-to-br from-[#07153B] to-[#142f7a] text-white scale-[1.02] border-transparent shadow-2xl"

                        : "bg-white hover:shadow-xl border-gray-100"
                    }`}
              >

                <div className="flex justify-between items-start">

                  <div>

                    <p
                      className={`uppercase tracking-[4px] text-xs mb-2
                        
                        ${
                          selectedAssignment
                            ?.subject ===
                            item.subject &&
                          selectedAssignment
                            ?.className ===
                            item.className

                            ? "text-white/60"

                            : "text-gray-400"
                        }`}
                    >

                      Subject

                    </p>

                    <h2 className="text-3xl font-black">

                      {item.subject}

                    </h2>

                  </div>

                  <div
                    className={`w-14 h-14 rounded-[20px] flex items-center justify-center text-2xl
                      
                      ${
                        selectedAssignment
                          ?.subject ===
                          item.subject &&
                        selectedAssignment
                          ?.className ===
                          item.className

                          ? "bg-white/10"

                          : "bg-blue-100"
                      }`}
                  >

                    📘

                  </div>

                </div>

                <div className="mt-6">

                  <p
                    className={`uppercase tracking-[4px] text-xs mb-2
                      
                      ${
                        selectedAssignment
                          ?.subject ===
                          item.subject &&
                        selectedAssignment
                          ?.className ===
                          item.className

                          ? "text-white/60"

                          : "text-gray-400"
                      }`}
                  >

                    Class

                  </p>

                  <h3 className="text-xl font-bold">

                    {item.className}

                  </h3>

                </div>

              </button>

            )
          )}

        </div>

      </div>

      {/* FORM */}
      {selectedAssignment && (

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden"
        >

          {/* TOP */}
          <div className="bg-gradient-to-r from-[#0B1E4F] to-[#142f7a] p-6 md:p-8 text-white">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <p className="uppercase tracking-[4px] text-xs text-white/60 mb-2">

                  Creating Report For

                </p>

                <h1 className="text-3xl md:text-5xl font-black">

                  {
                    selectedAssignment.subject
                  }

                </h1>

                <p className="mt-3 text-white/70 text-lg">

                  {
                    selectedAssignment.className
                  }

                </p>

              </div>

              {/* Date */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[25px] p-5 min-w-[220px]">

                <p className="uppercase tracking-[4px] text-xs text-white/60 mb-2">

                  Date

                </p>

                <input
                  type="date"
                  className="bg-transparent outline-none text-xl font-bold w-full"
                  value={date}
                  onChange={(e) =>
                    setDate(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>

          </div>

          {/* BODY */}
          <div className="p-5 md:p-8 space-y-6 bg-[#f8fbff]">

            {/* CLASS WORK */}
            <div className="bg-white rounded-[35px] border border-blue-100 p-5 md:p-7 shadow-sm">

              <div className="flex items-center gap-4 mb-5">

                <div className="w-16 h-16 rounded-[24px] bg-blue-100 flex items-center justify-center text-3xl">

                  📘

                </div>

                <div>

                  <p className="uppercase tracking-[4px] text-xs text-gray-400 mb-2">

                    Class Work

                  </p>

                  <h2 className="text-3xl font-black text-[#0B1E4F]">

                    Today's Lesson

                  </h2>

                </div>

              </div>

              <textarea
                rows={7}
                placeholder="Write today's class lesson..."
                className="w-full bg-[#f8fbff] border border-gray-200 rounded-[28px] p-5 outline-none resize-none text-lg leading-9 font-medium"
                value={classWork}
                onChange={(e) =>
                  setClassWork(
                    e.target.value
                  )
                }
              />

            </div>

            {/* HOME WORK */}
            <div className="bg-white rounded-[35px] border border-emerald-100 p-5 md:p-7 shadow-sm">

              <div className="flex items-center gap-4 mb-5">

                <div className="w-16 h-16 rounded-[24px] bg-emerald-100 flex items-center justify-center text-3xl">

                  🏠

                </div>

                <div>

                  <p className="uppercase tracking-[4px] text-xs text-gray-400 mb-2">

                    Home Work

                  </p>

                  <h2 className="text-3xl font-black text-emerald-700">

                    Practice Task

                  </h2>

                </div>

              </div>

              <textarea
                rows={7}
                placeholder="Write homework or practice tasks..."
                className="w-full bg-[#f8fbff] border border-gray-200 rounded-[28px] p-5 outline-none resize-none text-lg leading-9 font-medium"
                value={homeWork}
                onChange={(e) =>
                  setHomeWork(
                    e.target.value
                  )
                }
              />

            </div>

            {/* SUBMIT */}
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#07153B] via-[#0B1E4F] to-[#142f7a] hover:scale-[1.01] transition-all duration-300 text-white py-5 rounded-[30px] font-black text-xl shadow-2xl"
            >

              {
                loading
                  ? "Creating Report..."
                  : "Create Premium Report"
              }

            </button>

          </div>

        </form>

      )}

    </div>
  );
};

export default CreateReport;