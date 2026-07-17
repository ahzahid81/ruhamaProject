import { useEffect, useState } from "react";
import api from "../services/api";
import { UserCheck, BookOpen, Calendar, FileText, Loader2 } from "lucide-react";

const ProxyReport = () => {
  const teacher = JSON.parse(localStorage.getItem("teacher"));
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [classWork, setClassWork] = useState("");
  const [homeWork, setHomeWork] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const res = await api.get("/teachers");
      setTeachers(res.data.filter((t) => t._id !== teacher._id));
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedAssignment) {
      return alert("Select teacher and assignment");
    }
    try {
      setLoading(true);
      await api.post("/reports/create", {
        subject: selectedAssignment.subject,
        className: selectedAssignment.className,
        date,
        classWork,
        homeWork,
        teacherId: selectedTeacher._id,
        takenBy: teacher._id,
      });
      alert("Proxy Report Created Successfully");
      setClassWork("");
      setHomeWork("");
      setSelectedAssignment(null);
    } catch (error) {
      alert(error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Select Teacher */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <UserCheck className="w-4.5 h-4.5 text-indigo-600" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Select Teacher</h2>
        </div>
        <select
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
          onChange={(e) => {
            const found = teachers.find((t) => t._id === e.target.value);
            setSelectedTeacher(found);
            setSelectedAssignment(null);
          }}
        >
          <option value="">Select Teacher</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Assignments */}
      {selectedTeacher && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Select Assignment</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {selectedTeacher.assignments.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedAssignment(item)}
                className={`text-left rounded-xl p-4 border transition-all ${
                  selectedAssignment?.subject === item.subject &&
                  selectedAssignment?.className === item.className
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-gray-900 border-gray-100 hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <h3 className="font-bold text-sm">{item.subject}</h3>
                <p className={`text-xs mt-1 ${selectedAssignment?.subject === item.subject && selectedAssignment?.className === item.className ? "text-indigo-200" : "text-gray-400"}`}>
                  {item.className}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {selectedAssignment && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Report Details</h2>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Class Work</label>
            <textarea
              rows={5}
              placeholder="Write today's class lesson..."
              value={classWork}
              onChange={(e) => setClassWork(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Home Work</label>
            <textarea
              rows={5}
              placeholder="Write homework or practice tasks..."
              value={homeWork}
              onChange={(e) => setHomeWork(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>

          <button
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Proxy Report"
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProxyReport;
