import { useEffect, useState } from "react";

import api from "../services/api";

const Admin = () => {

  const [reports, setReports] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [pendingData,
    setPendingData] =
    useState({});


  // GET PENDING SUBJECTS
  const getPending = async (
    className,
    date
  ) => {

    try {

      const res =
        await api.get(
          `/reports/pending?className=${className}&date=${date}`
        );

      setPendingData((prev) => ({
        ...prev,

        [className + date]:
          res.data,
      }));

    } catch (error) {

      console.log(error);
    }
  };


  // DELETE ENTRY
  const deleteEntry = async (
    reportId,
    entryId
  ) => {

    const confirmDelete =
      window.confirm(
        "Delete this entry?"
      );

    if (!confirmDelete) return;

    try {

      await api.delete(
        `/reports/${reportId}/${entryId}`
      );

      alert("Entry Deleted");

      window.location.reload();

    } catch (error) {

      console.log(error);
    }
  };


  // EDIT ENTRY
  const editEntry = async (
    reportId,
    entry
  ) => {

    const classWork =
      prompt(
        "Edit Class Work",
        entry.classWork
      );

    const homeWork =
      prompt(
        "Edit Home Work",
        entry.homeWork
      );

    if (
      !classWork ||
      !homeWork
    ) return;

    try {

      await api.put(
        `/reports/${reportId}/${entry._id}`,
        {
          classWork,
          homeWork,
        }
      );

      alert("Entry Updated");

      window.location.reload();

    } catch (error) {

      console.log(error);
    }
  };


  // LOAD REPORTS
  useEffect(() => {

    const loadData = async () => {

      try {

        const res =
          await api.get(
            "/reports/all"
          );

        setReports(res.data);

        // Load pending
        res.data.forEach((report) => {

          getPending(
            report.className,
            report.date
          );
        });

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);
      }
    };

    loadData();

  }, []);


  // ANALYTICS
  const totalReports =
    reports.length;

  const totalEntries =
    reports.reduce(
      (acc, report) =>
        acc +
        report.entries.length,
      0
    );

  const totalClasses =
    new Set(
      reports.map(
        (report) =>
          report.className
      )
    ).size;

  const totalPending =
    Object.values(
      pendingData
    ).reduce(
      (acc, item) =>
        acc +
        item.pendingSubjects
          .length,
      0
    );

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 text-white p-8 rounded-[35px] shadow-lg mb-6">

        <h1 className="text-4xl md:text-5xl font-bold">

          Admin Dashboard

        </h1>

        <p className="mt-3 text-lg opacity-90">

          School Report Management System

        </p>

      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        {/* Total Reports */}
        <div className="bg-white rounded-[30px] p-6 shadow-sm">

          <p className="text-gray-500 mb-3">

            Total Reports

          </p>

          <h2 className="text-4xl font-bold text-emerald-600">

            {totalReports}

          </h2>

        </div>

        {/* Total Entries */}
        <div className="bg-white rounded-[30px] p-6 shadow-sm">

          <p className="text-gray-500 mb-3">

            Submitted Entries

          </p>

          <h2 className="text-4xl font-bold text-blue-600">

            {totalEntries}

          </h2>

        </div>

        {/* Classes */}
        <div className="bg-white rounded-[30px] p-6 shadow-sm">

          <p className="text-gray-500 mb-3">

            Classes

          </p>

          <h2 className="text-4xl font-bold text-purple-600">

            {totalClasses}

          </h2>

        </div>

        {/* Pending */}
        <div className="bg-white rounded-[30px] p-6 shadow-sm">

          <p className="text-gray-500 mb-3">

            Pending Subjects

          </p>

          <h2 className="text-4xl font-bold text-red-500">

            {totalPending}

          </h2>

        </div>

      </div>

      {/* Loading */}
      {loading && (

        <div className="bg-white p-10 rounded-[30px] text-center text-lg">

          Loading Reports...

        </div>

      )}

      {/* Reports */}
      <div className="space-y-6">

        {reports.map((report) => (

          <div
            key={report._id}
            className="bg-white rounded-[30px] p-6 shadow-sm"
          >

            {/* Top */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

              <div>

                <h2 className="text-2xl md:text-3xl font-bold text-emerald-600">

                  {report.className}

                </h2>

                <p className="text-gray-500 mt-1">

                  {report.date}

                </p>

              </div>

              <div className="bg-emerald-100 text-emerald-700 px-5 py-3 rounded-full font-semibold w-fit">

                {report.entries.length}
                {" "}
                Subjects Submitted

              </div>

            </div>

            {/* Entries */}
            <div className="space-y-5">

              {report.entries.map(
                (entry, index) => (

                  <div
                    key={index}
                    className="border border-gray-100 rounded-[25px] p-5"
                  >

                    {/* Entry Top */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-5">

                      <h3 className="text-2xl font-bold">

                        {entry.subject}

                      </h3>

                      <div className="bg-gray-100 px-4 py-2 rounded-full text-sm font-medium w-fit">

                        {
                          entry.teacherId
                            ?.name
                        }

                      </div>

                    </div>

                    {/* Works */}
                    <div className="grid md:grid-cols-2 gap-4">

                      {/* Class Work */}
                      <div className="bg-gray-50 rounded-[25px] p-5">

                        <p className="text-gray-500 text-sm mb-3">

                          Class Work

                        </p>

                        <p className="font-medium leading-7">

                          {entry.classWork}

                        </p>

                      </div>

                      {/* Home Work */}
                      <div className="bg-gray-50 rounded-[25px] p-5">

                        <p className="text-gray-500 text-sm mb-3">

                          Home Work

                        </p>

                        <p className="font-medium leading-7">

                          {entry.homeWork}

                        </p>

                      </div>

                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-5">

                      <button
                        onClick={() =>
                          editEntry(
                            report._id,
                            entry
                          )
                        }
                        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-2xl"
                      >

                        Edit

                      </button>

                      <button
                        onClick={() =>
                          deleteEntry(
                            report._id,
                            entry._id
                          )
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl"
                      >

                        Delete

                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

            {/* Pending */}
            {
              pendingData[
                report.className +
                report.date
              ] && (

                <div className="mt-6 bg-red-50 border border-red-100 rounded-[25px] p-5">

                  <h3 className="text-red-600 font-bold text-lg mb-4">

                    Pending Subjects

                  </h3>

                  <div className="flex flex-wrap gap-3">

                    {
                      pendingData[
                        report.className +
                        report.date
                      ]
                        ?.pendingSubjects
                        ?.length > 0 ? (

                        pendingData[
                          report.className +
                          report.date
                        ]
                          ?.pendingSubjects
                          ?.map(
                            (
                              subject,
                              index
                            ) => (

                              <div
                                key={index}
                                className="bg-red-500 text-white px-5 py-3 rounded-full font-medium"
                              >

                                {subject}

                              </div>

                            )
                          )

                      ) : (

                        <div className="bg-emerald-500 text-white px-5 py-3 rounded-full font-medium">

                          All Subjects Submitted

                        </div>

                      )
                    }

                  </div>

                </div>

              )
            }

          </div>

        ))}

      </div>

    </div>
  );
};

export default Admin;