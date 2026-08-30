import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadAll = async () => {
    try {
      const examRes = await api.get("/exams");
      setExams(examRes.data.exams || []);
    } catch (error) {
      setToast({ message: error?.response?.data?.message || "Failed to load data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (text, type = "success") => setToast({ text, type });

  const deleteExam = async (id) => {
    try {
      await api.delete(`/exams/${id}`);
      showToast("Exam deleted");
      setDeleteConfirm(null);
      await loadAll();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to delete exam", "error");
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Exam Management</h1>
          <p className="text-sm text-gray-500 mt-1">Configure exams, subjects, and schedules</p>
        </div>
        <Link to="/exam/management/new"
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm">
          <span>+</span> New Exam
        </Link>
      </div>

      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">{deleteConfirm.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={deleteConfirm.action} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Exams List */}
      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-400 text-sm">No exams yet. Click "New Exam" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-slate-800 text-lg">{exam.examName}</h3>
                    <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{exam.examCode}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase ${exam.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                      {exam.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-lg font-medium">Session {exam.academicSession}</span>
                    <span>📅 {fmtDate(exam.startDate)} → {fmtDate(exam.endDate)}</span>
                    {exam.requiredFees?.length > 0 && (
                      <span className="text-amber-600 font-medium">{exam.requiredFees.length} required fee{exam.requiredFees.length !== 1 && "s"}</span>
                    )}
                    {exam.remarks && <span className="text-gray-400">— {exam.remarks}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex gap-1.5">
                    <Link to={`/exam/management/${exam._id}/subjects`} state={{ exam }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition">Subjects</Link>
                    <Link to={`/exam/management/${exam._id}/edit`} state={{ exam }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition">Edit</Link>
                    <button onClick={() => setDeleteConfirm({ message: `Delete "${exam.examName}"? This cannot be undone.`, action: () => deleteExam(exam._id) })}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamManagement;