import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";

const emptySubjectRow = { subjectName: "", subjectCode: "", fullMarks: 100, passMarks: 33 };

export default function ExamSubjects() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exam, setExam] = useState(location.state?.exam || null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [subjectClass, setSubjectClass] = useState("");
  const [subjectRows, setSubjectRows] = useState([]);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const sres = await getSettings();
        setSystemSettings(sres.data);
      } catch {
        setSystemSettings({ classes: [], subjects: [] });
      }
      if (!location.state?.exam) {
        try {
          const eres = await api.get("/exams");
          const exams = eres.data.exams || [];
          const found = exams.find((e) => e._id === id);
          if (found) setExam(found);
        } catch {
          // silent
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSubjects = async (className) => {
    try {
      const res = await api.get(`/exams/${id}/subjects?className=${encodeURIComponent(className)}`);
      const existing = res.data.subjects || [];
      if (existing.length > 0) {
        setSubjectRows(
          existing.map((s) => ({
            _id: s._id,
            subjectName: s.subjectName,
            subjectCode: s.subjectCode || "",
            fullMarks: s.fullMarks,
            passMarks: s.passMarks,
          }))
        );
      } else {
        setSubjectRows([{ ...emptySubjectRow }]);
      }
    } catch {
      setSubjectRows([{ ...emptySubjectRow }]);
    }
  };

  const handleClassChange = (className) => {
    setSubjectClass(className);
    if (className) loadSubjects(className);
  };

  const updateSubjectRow = (index, field, value) => {
    const rows = [...subjectRows];
    const updated = { ...rows[index], [field]: value };
    if (field === "subjectName" && value) {
      updated.subjectCode = value.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
    }
    rows[index] = updated;
    setSubjectRows(rows);
  };

  const saveSubjects = async () => {
    const clean = subjectRows
      .map((s) => ({
        subjectName: s.subjectName.trim(),
        subjectCode: s.subjectCode.trim(),
        fullMarks: Number(s.fullMarks) || 100,
        passMarks: s.passMarks === "" ? 33 : Number(s.passMarks) || 33,
      }))
      .filter((s) => s.subjectName);

    if (clean.length === 0) {
      return showToast("Add at least one subject.", "error");
    }

    setSubjectSaving(true);
    try {
      await api.post(`/exams/${id}/subjects/bulk`, {
        className: subjectClass,
        subjects: clean,
      });
      showToast("Subjects saved");
      await loadSubjects(subjectClass);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save subjects", "error");
    } finally {
      setSubjectSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Subjects — {exam?.examName || "Exam"}</h1>
        <p className="text-sm text-gray-500 mt-1">Configure subjects and full marks per class. Subjects are picked from System Settings.</p>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">Class *</label>
            <select value={subjectClass} onChange={(e) => handleClassChange(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition">
              <option value="">Select Class</option>
              {(systemSettings?.classes || []).map((cls) => (
                <option key={cls.name} value={cls.name}>{cls.name}</option>
              ))}
            </select>
          </div>
          {subjectClass && (
            <button type="button" onClick={() => setSubjectRows([...subjectRows, { ...emptySubjectRow }])}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition self-end">
              + Add Subject
            </button>
          )}
        </div>

        {subjectClass && (
          <>
            <p className="text-sm text-gray-500 mb-3">{subjectRows.length} subject{subjectRows.length !== 1 && "s"}</p>
            <div className="space-y-2 mb-4">
              {subjectRows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50/50 rounded-xl p-2 border border-gray-100">
                  <select value={row.subjectName} onChange={(e) => updateSubjectRow(i, "subjectName", e.target.value)}
                    className="col-span-4 border border-gray-200 rounded-lg p-2 text-sm outline-none bg-white">
                    <option value="">Select Subject</option>
                    {(systemSettings?.subjects || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input type="text" value={row.subjectCode} onChange={(e) => updateSubjectRow(i, "subjectCode", e.target.value)}
                    placeholder="Code" className="col-span-2 border border-gray-200 rounded-lg p-2 text-sm outline-none" />
                  <input type="number" value={row.fullMarks} onChange={(e) => updateSubjectRow(i, "fullMarks", e.target.value)}
                    placeholder="Full Marks" className="col-span-2 border border-gray-200 rounded-lg p-2 text-sm outline-none" />
                  <input type="number" value={row.passMarks} onChange={(e) => updateSubjectRow(i, "passMarks", e.target.value)}
                    placeholder="Pass Marks" className="col-span-2 border border-gray-200 rounded-lg p-2 text-sm outline-none" />
                  <button type="button" onClick={() => setSubjectRows(subjectRows.filter((_, ri) => ri !== i))}
                    className="col-span-2 text-xs text-red-600 hover:text-red-800 font-semibold">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={saveSubjects} disabled={subjectSaving}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                {subjectSaving ? "Saving..." : "Save Subjects"}
              </button>
              <button type="button" onClick={() => navigate("/exam/management")}
                className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
            </div>
          </>
        )}

        {!subjectClass && (
          <p className="text-sm text-gray-400 py-4 text-center">Select a class to configure subjects.</p>
        )}
      </div>
    </div>
  );
}