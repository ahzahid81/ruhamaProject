import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";

const AdminEntryEdit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const reportId = searchParams.get("reportId");
  const entryId = searchParams.get("entryId");

  const [entry, setEntry] = useState(location.state?.entry || null);
  const [classWork, setClassWork] = useState(location.state?.entry?.classWork || "");
  const [homeWork, setHomeWork] = useState(location.state?.entry?.homeWork || "");
  const [loading, setLoading] = useState(!location.state?.entry);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (location.state?.entry || !reportId || !entryId) return;
    api
      .get("/reports/all")
      .then((res) => {
        const report = res.data.find((r) => r._id === reportId);
        const found = report?.entries?.find((en) => en._id === entryId);
        if (found) {
          setEntry(found);
          setClassWork(found.classWork);
          setHomeWork(found.homeWork);
        }
      })
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  }, [reportId, entryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/reports/${reportId}/${entryId}`, { classWork, homeWork });
      setToast({ message: "Entry Updated", type: "success" });
      setTimeout(() => navigate("/admin"), 600);
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Update failed", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading && reportId && entryId) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-12 flex items-center justify-center gap-3 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading Entry...</span>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-sm text-gray-400">Entry not found</p>
        <button
          onClick={() => navigate("/admin")}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
        >
          Back to Admin
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Entry</h1>
          <p className="mt-1.5 text-indigo-200 text-sm md:text-base">
            {entry.subject}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Class Work</label>
            <textarea
              rows={4}
              value={classWork || ""}
              onChange={(e) => setClassWork(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Home Work</label>
            <textarea
              rows={4}
              value={homeWork || ""}
              onChange={(e) => setHomeWork(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate("/admin")} className="px-6 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-semibold transition-all border border-gray-100">
            Cancel
          </button>
        </div>
      </form>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminEntryEdit;