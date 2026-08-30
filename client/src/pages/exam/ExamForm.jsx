import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";

const emptyExamForm = {
  examName: "",
  examCode: "",
  academicSession: "2026",
  startDate: "",
  endDate: "",
  admitCardStart: "",
  admitCardEnd: "",
  resultPublishDate: "",
  isActive: true,
  remarks: "",
  requiredFees: [],
};

const emptyFeeRow = {
  feeCategory: "",
  applicableType: "Exam",
  month: "",
  year: "",
  customTitle: "",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ExamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editing = Boolean(id);

  const [form, setForm] = useState(emptyExamForm);
  const [categories, setCategories] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const mapExam = (exam) => ({
    examName: exam.examName,
    examCode: exam.examCode,
    academicSession: exam.academicSession || "2026",
    startDate: exam.startDate ? exam.startDate.split("T")[0] : "",
    endDate: exam.endDate ? exam.endDate.split("T")[0] : "",
    admitCardStart: exam.admitCardStart ? exam.admitCardStart.split("T")[0] : "",
    admitCardEnd: exam.admitCardEnd ? exam.admitCardEnd.split("T")[0] : "",
    resultPublishDate: exam.resultPublishDate ? exam.resultPublishDate.split("T")[0] : "",
    isActive: exam.isActive,
    remarks: exam.remarks || "",
    requiredFees: (exam.requiredFees || []).map((f) => ({
      feeCategory: f.feeCategory?._id || f.feeCategory || "",
      applicableType: f.applicableType,
      month: f.month || "",
      year: f.year || "",
      customTitle: f.customTitle || "",
    })),
  });

  useEffect(() => {
    (async () => {
      let currentSession = "2026";
      try {
        const sres = await getSettings();
        setSystemSettings(sres.data);
        currentSession = sres.data.currentSession || "2026";
      } catch {
        setSystemSettings({ academicSessions: ["2025", "2026", "2027"], currentSession: "2026", classes: [] });
      }
      try {
        const cres = await api.get("/payments/fee-categories");
        setCategories(cres.data);
      } catch {
        // silent
      }

      try {
        if (editing) {
          const exam = location.state?.exam;
          if (exam) {
            setForm(mapExam(exam));
          } else {
            const eres = await api.get("/exams");
            const exams = eres.data.exams || [];
            const found = exams.find((e) => e._id === id);
            if (found) setForm(mapExam(found));
          }
        } else {
          setForm({ ...emptyExamForm, academicSession: currentSession });
        }
      } catch {
        // silent
      }
      setLoading(false);
    })();
  }, [id]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const updateFeeRow = (index, field, value) => {
    const rows = [...form.requiredFees];
    rows[index] = { ...rows[index], [field]: value };
    setForm({ ...form, requiredFees: rows });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.examName.trim() || !form.examCode.trim()) {
      return showToast("Exam name and code are required.", "error");
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/exams/${id}`, form);
        showToast("Exam updated");
      } else {
        await api.post("/exams", form);
        showToast("Exam created");
      }
      setTimeout(() => navigate("/exam/management"), 400);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !systemSettings) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const inputClass = "w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{editing ? "Edit Exam" : "New Exam"}</h1>
        <p className="text-sm text-gray-500 mt-1">Configure exam details and required fees</p>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Exam Name *</label>
              <input type="text" name="examName" value={form.examName} onChange={handleChange} required placeholder="e.g. Half Yearly Examination"
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Exam Code *</label>
              <input type="text" name="examCode" value={form.examCode} onChange={handleChange} required placeholder="e.g. HY-2026"
                className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Academic Session *</label>
              <select name="academicSession" value={form.academicSession} onChange={handleChange} required className={inputClass}>
                {(systemSettings.academicSessions || ["2025", "2026", "2027"]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Result Publish Date</label>
              <input type="date" name="resultPublishDate" value={form.resultPublishDate} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Exam Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Exam End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Admit Card From</label>
              <input type="date" name="admitCardStart" value={form.admitCardStart} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Admit Card To</label>
              <input type="date" name="admitCardEnd" value={form.admitCardEnd} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Required Fees */}
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Required Fees (for Admit Card)</label>
              <button type="button" onClick={() => setForm({ ...form, requiredFees: [...form.requiredFees, { ...emptyFeeRow, year: form.academicSession }] })}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">
                + Add Fee
              </button>
            </div>
            {form.requiredFees.length === 0 ? (
              <p className="text-xs text-gray-400">No required fees added.</p>
            ) : (
              <div className="space-y-2">
                {form.requiredFees.map((fee, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white border border-gray-100 rounded-lg p-2">
                    <select value={fee.feeCategory} onChange={(e) => updateFeeRow(i, "feeCategory", e.target.value)}
                      className="col-span-4 border border-gray-200 rounded-lg p-2 text-xs outline-none">
                      <option value="">Select Fee Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    <select value={fee.applicableType} onChange={(e) => updateFeeRow(i, "applicableType", e.target.value)}
                      className="col-span-3 border border-gray-200 rounded-lg p-2 text-xs outline-none">
                      {["Exam", "Month", "Year", "One Time", "Custom"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {fee.applicableType === "Month" ? (
                      <select value={fee.month} onChange={(e) => updateFeeRow(i, "month", e.target.value)}
                        className="col-span-3 border border-gray-200 rounded-lg p-2 text-xs outline-none">
                        <option value="">Month</option>
                        {MONTHS.map((m, mi) => (
                          <option key={m} value={mi + 1}>{m}</option>
                        ))}
                      </select>
                    ) : fee.applicableType === "Custom" ? (
                      <input type="text" value={fee.customTitle} onChange={(e) => updateFeeRow(i, "customTitle", e.target.value)}
                        placeholder="Fee Title" className="col-span-3 border border-gray-200 rounded-lg p-2 text-xs outline-none" />
                    ) : (
                      <input type="number" value={fee.year} onChange={(e) => updateFeeRow(i, "year", e.target.value)}
                        placeholder="Year" className="col-span-3 border border-gray-200 rounded-lg p-2 text-xs outline-none" />
                    )}
                    <button type="button" onClick={() => setForm({ ...form, requiredFees: form.requiredFees.filter((_, fi) => fi !== i) })}
                      className="col-span-2 text-xs text-red-600 hover:text-red-800 font-semibold">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange} rows="2" className={inputClass} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <span className="text-sm text-gray-600">Active</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
              {saving ? "Saving..." : editing ? "Update Exam" : "Create Exam"}
            </button>
            <button type="button" onClick={() => navigate("/exam/management")}
              className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}