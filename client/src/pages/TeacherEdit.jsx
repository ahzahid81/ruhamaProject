import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api";
import { getSettings } from "../services/settingsCache";
import { BookOpen, KeyRound, UserPlus, X } from "lucide-react";
import Toast from "../components/Toast";

const TeacherEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [teacher, setTeacher] = useState(location.state?.teacher || null);
  const [loading, setLoading] = useState(!location.state?.teacher);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Ruhama2026");
  const [role, setRole] = useState("teacher");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);

  const subjects =
    systemSettings?.subjects?.length > 0
      ? systemSettings.subjects
      : ["Arabic", "Math", "English", "Bangla", "BGS", "Science", "MDP", "Islamic Studies"];

  const applyTeacher = (t) => {
    setTeacher(t);
    setName(t.name || "");
    setEmail(t.email || "");
    setPassword(t.plainPassword || "Ruhama2026");
    setRole(t.role || "teacher");
    const subs = [...new Set((t.assignments || []).map((a) => a.subject))];
    const cls = [...new Set((t.assignments || []).map((a) => a.className))];
    setSelectedSubjects(subs);
    setSelectedClasses(cls);
    setAssignments(t.assignments || []);
  };

  useEffect(() => {
    getSettings().then((res) => setSystemSettings(res.data)).catch(() => {
      setSystemSettings({
        classes: [
          { name: "Play Group", code: "P", order: 1 },
          { name: "Nursery", code: "N", order: 2 },
          { name: "KG", code: "K", order: 3 },
          { name: "STD-I", code: "I", order: 4 },
          { name: "STD-II", code: "J", order: 5 },
          { name: "STD-III", code: "L", order: 6 },
          { name: "STD-IV", code: "M", order: 7 },
          { name: "STD-V", code: "V", order: 8 },
        ],
      });
    });
  }, []);

  useEffect(() => {
    if (location.state?.teacher) {
      applyTeacher(location.state.teacher);
      setLoading(false);
      return;
    }
    api
      .get("/teachers/manage")
      .then((res) => {
        const found = res.data.find((t) => t._id === id);
        if (found) applyTeacher(found);
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, [id, location.state?.teacher]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== "account-manager" && assignments.length === 0) {
      return setToast({ message: "Generate assignments first", type: "error" });
    }
    setSaving(true);
    try {
      await api.put(`/teachers/${id}`, {
        name,
        email,
        password,
        role,
        assignments: role === "account-manager" ? [] : assignments,
      });
      setToast({ message: "Teacher Updated", type: "success" });
      setTimeout(() => navigate("/teachers"), 600);
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Update failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-sm text-gray-400">Teacher not found</p>
        <button
          onClick={() => navigate("/teachers")}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
        >
          Back to Teachers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Teacher</h1>
          <p className="mt-1.5 text-indigo-200 text-sm md:text-base">Update teacher profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6">
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
            <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
              <KeyRound className="w-3 h-3" /> Blank keeps the current password
            </p>
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
          <div className="mt-6 space-y-5">
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
                {(systemSettings?.classes || []).map((c, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => toggleClass(c.name)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedClasses.includes(c.name)
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                    }`}
                  >
                    {c.name}
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
          </div>
        )}

        {/* Assignment List */}
        {assignments.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
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

        <div className="flex gap-3 mt-6">
          <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-60">
            <UserPlus className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/teachers")}
            className="px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-all border border-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default TeacherEdit;