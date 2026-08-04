import { useState, useEffect } from "react";
import api from "../../services/api";
import Toast from "../../components/Toast";

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

const emptySubjectRow = { subjectName: "", subjectCode: "", fullMarks: 100, passMarks: 33 };

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [systemSettings, setSystemSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState(emptyExamForm);
  const [examEditId, setExamEditId] = useState(null);

  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [subjectClass, setSubjectClass] = useState("");
  const [subjectRows, setSubjectRows] = useState([]);
  const [subjectSaving, setSubjectSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadAll = async () => {
    try {
      const [examRes, catRes, settingsRes] = await Promise.all([
        api.get("/exams"),
        api.get("/payments/fee-categories"),
        api.get("/settings"),
      ]);
      setExams(examRes.data.exams || []);
      setCategories(catRes.data || []);
      setSystemSettings(settingsRes.data);
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

  const openExamModal = (exam = null) => {
    if (exam) {
      setExamForm({
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
      setExamEditId(exam._id);
    } else {
      setExamForm({ ...emptyExamForm, academicSession: systemSettings?.currentSession || "2026" });
      setExamEditId(null);
    }
    setShowExamModal(true);
  };

  const handleExamChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setExamForm({ ...examForm, [e.target.name]: value });
  };

  const updateFeeRow = (index, field, value) => {
    const rows = [...examForm.requiredFees];
    rows[index] = { ...rows[index], [field]: value };
    setExamForm({ ...examForm, requiredFees: rows });
  };

  const submitExam = async (e) => {
    e.preventDefault();
    if (!examForm.examName.trim() || !examForm.examCode.trim()) {
      return showToast("Exam name and code are required.", "error");
    }
    setSaving(true);
    try {
      if (examEditId) {
        await api.put(`/exams/${examEditId}`, examForm);
        showToast("Exam updated");
      } else {
        await api.post("/exams", examForm);
        showToast("Exam created");
      }
      setShowExamModal(false);
      await loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save exam", "error");
    } finally {
      setSaving(false);
    }
  };

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

  const openSubjectsModal = (exam) => {
    setSelectedExam(exam);
    setSubjectClass("");
    setSubjectRows([]);
    setShowSubjectsModal(true);
  };

  const loadSubjects = async (className) => {
    const res = await api.get(`/exams/${selectedExam._id}/subjects?className=${encodeURIComponent(className)}`);
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
      await api.post(`/exams/${selectedExam._id}/subjects/bulk`, {
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
        <button onClick={() => openExamModal()}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm">
          <span>+</span> New Exam
        </button>
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

      {/* Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowExamModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-5">{examEditId ? "Edit Exam" : "New Exam"}</h2>
            <form onSubmit={submitExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Exam Name *</label>
                  <input type="text" name="examName" value={examForm.examName} onChange={handleExamChange} required placeholder="e.g. Half Yearly Examination"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Exam Code *</label>
                  <input type="text" name="examCode" value={examForm.examCode} onChange={handleExamChange} required placeholder="e.g. HY-2026"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Academic Session *</label>
                  <select name="academicSession" value={examForm.academicSession} onChange={handleExamChange} required
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition">
                    {(systemSettings?.academicSessions || ["2025", "2026", "2027"]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Result Publish Date</label>
                  <input type="date" name="resultPublishDate" value={examForm.resultPublishDate} onChange={handleExamChange}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Exam Start Date</label>
                  <input type="date" name="startDate" value={examForm.startDate} onChange={handleExamChange}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Exam End Date</label>
                  <input type="date" name="endDate" value={examForm.endDate} onChange={handleExamChange}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Admit Card From</label>
                  <input type="date" name="admitCardStart" value={examForm.admitCardStart} onChange={handleExamChange}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Admit Card To</label>
                  <input type="date" name="admitCardEnd" value={examForm.admitCardEnd} onChange={handleExamChange}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
                </div>
              </div>

              {/* Required Fees */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Required Fees (for Admit Card)</label>
                  <button type="button" onClick={() => setExamForm({ ...examForm, requiredFees: [...examForm.requiredFees, { ...emptyFeeRow, year: examForm.academicSession }] })}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">
                    + Add Fee
                  </button>
                </div>
                {examForm.requiredFees.length === 0 ? (
                  <p className="text-xs text-gray-400">No required fees added.</p>
                ) : (
                  <div className="space-y-2">
                    {examForm.requiredFees.map((fee, i) => (
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
                        <button type="button" onClick={() => setExamForm({ ...examForm, requiredFees: examForm.requiredFees.filter((_, fi) => fi !== i) })}
                          className="col-span-2 text-xs text-red-600 hover:text-red-800 font-semibold">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Remarks</label>
                <textarea name="remarks" value={examForm.remarks} onChange={handleExamChange} rows="2"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" checked={examForm.isActive} onChange={handleExamChange}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-gray-600">Active</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                  {saving ? "Saving..." : examEditId ? "Update Exam" : "Create Exam"}
                </button>
                <button type="button" onClick={() => setShowExamModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects Modal */}
      {showSubjectsModal && selectedExam && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowSubjectsModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Subjects — {selectedExam.examName}</h2>
            <p className="text-sm text-gray-500 mb-5">Configure subjects and full marks per class. Subjects are picked from System Settings.</p>

            <div className="mb-4">
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
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">{subjectRows.length} subject{subjectRows.length !== 1 && "s"}</p>
                  <button type="button" onClick={() => setSubjectRows([...subjectRows, { ...emptySubjectRow }])}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">
                    + Add Subject
                  </button>
                </div>
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
                <button type="button" onClick={saveSubjects} disabled={subjectSaving}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                  {subjectSaving ? "Saving..." : "Save Subjects"}
                </button>
              </>
            )}
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
                    <button onClick={() => openSubjectsModal(exam)}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition">Subjects</button>
                    <button onClick={() => openExamModal(exam)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition">Edit</button>
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
