const Dashboard = () => {

  const teacher = JSON.parse(
    localStorage.getItem("teacher")
  );

  return (
    <div>

      {/* Top Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">

        <h1 className="text-3xl font-bold text-emerald-600">
          Welcome,
          {" "}
          {teacher?.name}
        </h1>

        <p className="text-gray-500 mt-2">
          Daily Class Report System
          <br />
            file: Zahid_MunazzirBhai_Ruhama
        </p>

      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-5 mb-6">

        <div className="bg-white p-6 rounded-2xl shadow-sm">

          <h2 className="text-gray-500">
            Assigned Classes
          </h2>

          <p className="text-4xl font-bold mt-3 text-emerald-600">

            {
              new Set(
                teacher?.assignments?.map(
                  (a) => a.className
                )
              ).size
            }

          </p>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">

          <h2 className="text-gray-500">
            Subjects
          </h2>

          <p className="text-4xl font-bold mt-3 text-blue-600">

            {
              new Set(
                teacher?.assignments?.map(
                  (a) => a.subject
                )
              ).size
            }

          </p>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm">

          <h2 className="text-gray-500">
            Today's Entries
          </h2>

          <p className="text-4xl font-bold mt-3 text-purple-600">
            0
          </p>

        </div>

      </div>

      {/* Assignments */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">

        <div className="flex justify-between items-center mb-5">

          <h2 className="text-2xl font-bold">
            My Assignments
          </h2>

          <a
            href="/create-report"
            className="bg-emerald-600 text-white px-5 py-3 rounded-xl"
          >
            Create Entry
          </a>

        </div>

        <div className="space-y-4">

          {teacher?.assignments?.map(
            (item, index) => (

              <div
                key={index}
                className="border rounded-2xl p-4 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-bold text-lg">
                    {item.subject}
                  </h3>

                  <p className="text-gray-500">
                    {item.className}
                  </p>

                </div>

                <button className="bg-gray-100 px-4 py-2 rounded-xl">
                  Pending
                </button>

              </div>

            )
          )}

        </div>

      </div>

    </div>
  );
};

export default Dashboard;