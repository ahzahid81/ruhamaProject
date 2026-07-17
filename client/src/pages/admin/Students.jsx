import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Eye,
  Edit3,
  Wallet,
  IdCard,
  GraduationCap,
  User,
  Phone,
  Hash,
} from "lucide-react";

const classes = [
  "All Students", "Play Group", "Nursery", "KG",
  "STD-I", "STD-II", "STD-III", "STD-IV", "STD-V",
];

const Students = () => {
  const [students, setStudents] = useState([]);
  const [activeClass, setActiveClass] = useState("All Students");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    const classMatch = activeClass === "All Students" || student.className === activeClass;
    const searchMatch =
      !searchQuery ||
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.fatherName?.toLowerCase().includes(searchQuery.toLowerCase());
    return classMatch && searchMatch;
  });

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this student?");
    if (!confirmDelete) return;
    try {
      await api.delete(`/students/${id}`);
      setStudents(students.filter((student) => student._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Students</h1>
            <p className="mt-1.5 text-indigo-200 text-sm md:text-base">Manage student records</p>
          </div>
          <Link
            to="/student-admission"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 transition-colors text-sm font-semibold shadow-lg flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            New Admission
          </Link>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, or father name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Class Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {classes.map((item) => (
            <button
              key={item}
              onClick={() => setActiveClass(item)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeClass === item
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>
          Showing <strong className="text-gray-900">{filteredStudents.length}</strong> students
        </span>
      </div>

      {/* Student Grid / List */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <div
            key={student._id}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              {student.photo ? (
                <img src={student.photo} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl border border-indigo-100">
                  <User className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{student.name}</h3>
                <p className="text-xs text-gray-400">{student.studentId}</p>
              </div>
              <span
                className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                  student.status === "Active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {student.status}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-gray-300" />
                <span>
                  Class: <strong className="text-gray-700">{student.className}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-gray-300" />
                <span>
                  Roll: <strong className="text-gray-700">{student.roll || "-"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-300" />
                <span>
                  Father: <strong className="text-gray-700">{student.fatherName}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-300" />
                <span>
                  Mobile: <strong className="text-gray-700">{student.fatherMobile}</strong>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-2">
              <Link
                to={`/students/${student._id}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </Link>
              <Link
                to={`/students/edit/${student._id}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </Link>
              <Link
                to={`/collect-payment?studentId=${student.studentId}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-xs font-semibold"
              >
                <Wallet className="w-3.5 h-3.5" />
                Payment
              </Link>
              <Link
                to={`/exam/admit-card?studentId=${student.studentId}`}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-xs font-semibold"
              >
                <IdCard className="w-3.5 h-3.5" />
                Admit
              </Link>
              <button
                onClick={() => handleDelete(student._id)}
                className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Student
              </button>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No students found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
