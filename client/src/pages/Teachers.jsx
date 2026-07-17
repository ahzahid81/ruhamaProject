import { useEffect, useState } from "react";
import api from "../services/api";
import {
  UserPlus,
  Trash2,
  Edit3,
  Mail,
  Shield,
  BookOpen,
  Users,
  X,
  Loader2,
} from "lucide-react";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const subjects = [
    "Arabic", "Math", "English", "Bangla", "BGS", "Science", "MDP", "Islamic Studies",
  ];

  const classes = [
    "Play Group", "Nursery", "KG", "STD-I", "STD-II", "STD-III", "STD-IV", "STD-V",
  ];

  const getTeachers = async () => {
    try {
      const res = await api.get("/teachers");
      setTeachers(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getTeachers();
  }, []);

  const toggleSubject = (subject) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((item) => item !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const toggleClass = (className) => {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((item) => item !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  };

  const generateAssignments = () => {
    let generated = [];
    selectedSubjects.forEach((subject) => {
      selectedClasses.forEach((className) => {
        generated.push({ subject, className });
      });
    });
    const unique = generated.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.subject === item.subject && t.className === item.className)
    );
    setAssignments(unique);
  };

  const removeAssignment = (index) => {
    const updated = assignments.filter((_, i) => i !== index);
    setAssignments(updated);
  };

  const createTeacher = async (e) => {
    e.preventDefault();
    if (role !== "account-manager" && assignments.length === 0) {
      return alert("Generate assignments first");
    }
    try {
      await api.post("/teachers/create", {
        name,
        email,
        password,
        role,
        assignments: role === "account-manager" ? [] : assignments,
      });
      alert("Teacher Created");
      setName("");
      setEmail("");
      setPassword("");
      setRole("teacher");
      setSelectedSubjects([]);
      setSelectedClasses([]);
      setAssignments([]);
      getTeachers();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  const editTeacher = async (teacher) => {
    const name = prompt("Edit Name", teacher.name);
    const email = prompt("Edit Email", teacher.email);
    const role = prompt("Edit Role (admin/teacher)", teacher.role);
    if (!name || !email || !role) return;
    try {
      await api.put(`/teachers/${teacher._id}`, {
        name,
        email,
        role,
        assignments: teacher.assignments,
      });
      alert("Teacher Updated");
      getTeachers();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteTeacher = async (id) => {
    const confirmDelete = window.confirm("Delete Teacher?");
    if (!confirmDelete) return;
    try {
      await api.delete(`/teachers/${id}`);
      alert("Teacher Deleted");
      getTeachers();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Teacher Management</h1>
          <p className="mt-1.5 text-indigo-200 text-sm md:text-base">
            Smart Multi Assignment System
          </p>
        </div>
      </div>

      {/* Create Teacher Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Create Teacher</h2>
        </div>

        <form onSubmit={createTeacher} className="space-y-5">
          {/* Basic Info */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Name
              </label>
              <input
                type="text"
                placeholder="Teacher Name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="teacher@school.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                Role
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="account-manager">Account Manager</option>
              </select>
            </div>
          </div>

          {/* Subjects & Classes */}
          {role !== "account-manager" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                  Subjects
                </label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => toggleSubject(subject)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        selectedSubjects.includes(subject)
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                  Classes
                </label>
                <div className="flex flex-wrap gap-2">
                  {classes.map((className, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => toggleClass(className)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        selectedClasses.includes(className)
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                      }`}
                    >
                      {className}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={generateAssignments}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-all shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                Generate Assignments
              </button>
            </>
          )}

          {/* Assignment List */}
          {assignments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignments.map((item, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium"
                >
                  <span>
                    {item.subject} - {item.className}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAssignment(index)}
                    className="text-indigo-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm">
            <UserPlus className="w-4 h-4" />
            Create Teacher
          </button>
        </form>
      </div>

      {/* Teachers List */}
      {teachers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No teachers found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <div key={teacher._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-lg font-bold text-indigo-600 border border-indigo-100">
                    {teacher.name?.charAt(0)?.toUpperCase() || "T"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs text-gray-400">{teacher.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold ${
                      teacher.role === "admin"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    {teacher.role}
                  </span>
                  <button
                    onClick={() => editTeacher(teacher)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTeacher(teacher._id)}
                    className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {teacher.assignments?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                  {teacher.assignments.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium"
                    >
                      {item.subject} - {item.className}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teachers;
