import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

const StudentSearch = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setStudents([]);
      return;
    }

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      searchStudents();
    }, 300);

    return () => clearTimeout(debounceRef.current);

    // eslint-disable-next-line
  }, [query]);

  const searchStudents = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `/students/search?q=${encodeURIComponent(query)}`
      );

      setStudents(res.data);
      setShowResult(true);
    } catch (error) {
      console.log(error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">

      {/* Search Box */}

      <div className="bg-white rounded-3xl shadow-lg p-6">

        <h2 className="text-2xl font-bold text-slate-800 mb-5">
          Search Student
        </h2>

        <input
          type="text"
          placeholder="Student ID / Name / Father's Mobile"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="
          w-full
          border
          rounded-2xl
          p-4
          text-lg
          outline-none
          focus:ring-2
          focus:ring-emerald-500
          "
        />

      </div>

      {/* Loading */}

      {loading && (
        <div className="bg-white shadow rounded-2xl p-6 mt-3">
          Searching...
        </div>
      )}

      {/* Result */}

      {showResult && !loading && (
        <div
          className="
          bg-white
          shadow-xl
          rounded-2xl
          mt-3
          overflow-hidden
          "
        >
          {students.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No Student Found
            </div>
          )}

          {students.map((student) => (
            <button
              key={student._id}
              type="button"
              onClick={() => {
                console.log(student);
                onSelect(student);
                setShowResult(false);
                setQuery(student.studentId);
              }}
              className="
              w-full
              text-left
              hover:bg-emerald-50
              transition
              border-b
              last:border-none
              "
            >
              <div className="flex items-center gap-4 p-4">

                {student.photo ? (
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="
                    w-16
                    h-16
                    rounded-full
                    object-cover
                    "
                  />
                ) : (
                  <div
                    className="
                    w-16
                    h-16
                    rounded-full
                    bg-gray-200
                    flex
                    items-center
                    justify-center
                    text-2xl
                    "
                  >
                    👤
                  </div>
                )}

                <div className="flex-1">

                  <h3 className="font-bold text-lg">
                    {student.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {student.studentId}
                  </p>

                  <p className="text-sm text-gray-500">
                    {student.className} •
                    {" "}
                    {student.section}
                    {" "}
                    • Roll
                    {" "}
                    {student.roll}
                  </p>

                  <p className="text-sm text-gray-500">
                    {student.fatherMobile}
                  </p>

                </div>

                <div>

                  <span
                    className={`
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-bold
                    ${
                      student.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                    `}
                  >
                    {student.status}
                  </span>

                </div>

              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSearch;