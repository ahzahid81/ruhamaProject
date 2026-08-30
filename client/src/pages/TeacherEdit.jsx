import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";

const TeacherEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [teacher, setTeacher] = useState(location.state?.teacher || null);
  const [loading, setLoading] = useState(!location.state?.teacher);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (location.state?.teacher) return;
    api
      .get("/teachers")
      .then((res) => {
        const found = res.data.find((t) => t._id === id);
        setTeacher(found || null);
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, [id, location.state?.teacher]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacher) return;
    setSaving(true);
    try {
      await api.put(`/teachers/${id}`, {
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        assignments: teacher.assignments,
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

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={teacher.name || ""}
              onChange={(e) => setTeacher({ ...teacher, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={teacher.email || ""}
              onChange={(e) => setTeacher({ ...teacher, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Role</label>
            <select
              value={teacher.role || "teacher"}
              onChange={(e) => setTeacher({ ...teacher, role: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
            >
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="account-manager">Account Manager</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
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