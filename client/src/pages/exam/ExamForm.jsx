import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";

const emptyExamForm = {
  examName: "",
  examCode: "",
  academicSession: "2026",
  attendanceDays: 1,
  isActive: true,
  remarks: "",
  requiredFees: [],
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const slugCode = (name) => (name || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) || "EXAM";

const rowKey = (r) => {
  if (r.applicableType === "Month") return `${r.feeCategory}_Month_${r.month}`;
  return `${r.feeCategory}_${r.applicableType}`;
};

const flattenRequired = (list) => {
  const out = [];
  (list || []).forEach((r) => {
    const fc = r.feeCategory?._id || r.feeCategory || "";
    if (r.applicableType === "Month") {
      const from = Math.max(1, Number(r.monthFrom) || 1);
      const to = Math.min(12, Number(r.month) || 0);
      if (!to || from > to) return;
      for (let m = from; m <= to; m++) {
        out.push({ feeCategory: fc, applicableType: "Month", month: m, monthFrom: m, year: r.year || "", customTitle: "" });
      }
    } else {
      out.push({
        feeCategory: fc,
        applicableType: r.applicableType,
        month: r.month || null,
        monthFrom: r.monthFrom || null,
        year: r.year || "",
        customTitle: r.customTitle || "",
      });
    }
  });
  return out;
};

const fmt = (n) => "BDT " + (Number(n) || 0).toLocaleString("en-BD");

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
    examCode: exam.examCode || slugCode(exam.examName),
    academicSession: exam.academicSession || "2026",
    attendanceDays: exam.attendanceDays || 1,
    isActive: exam.isActive,
    remarks: exam.remarks || "",
    requiredFees: flattenRequired(exam.requiredFees || []),
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
    const name = e.target.name;
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (name === "examName" && !editing) {
      setForm({ ...form, examName: value, examCode: slugCode(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const sessionYear = Number(form.academicSession) || new Date().getFullYear();

  const feeRows = useMemo(() => {
    const rows = [];
    (categories || [])
      .filter((c) => c.isActive !== false)
      .forEach((cat) => {
        const catId = String(cat._id);
        const base = { feeCategory: catId, feeName: cat.name, frequency: cat.frequency, defaultAmount: Number(cat.defaultAmount || 0) };
        if (cat.frequency === "Monthly") {
          for (let m = 1; m <= 12; m++) {
            rows.push({
              ...base,
              applicableType: "Month",
              month: m,
              year: sessionYear,
              period: `${MONTHS[m - 1]} ${sessionYear}`,
              key: rowKey({ feeCategory: catId, applicableType: "Month", month: m }),
            });
          }
        } else if (cat.frequency === "Per Exam") {
          rows.push({
            ...base, applicableType: "Exam", month: null, year: sessionYear, customTitle: "", period: "Exam",
            key: rowKey({ feeCategory: catId, applicableType: "Exam" }),
          });
        } else if (cat.frequency === "Yearly") {
          rows.push({
            ...base, applicableType: "Year", month: null, year: sessionYear, customTitle: "", period: String(sessionYear),
            key: rowKey({ feeCategory: catId, applicableType: "Year" }),
          });
        } else if (cat.frequency === "One Time") {
          rows.push({
            ...base, applicableType: "One Time", month: null, year: sessionYear, customTitle: "", period: "One Time",
            key: rowKey({ feeCategory: catId, applicableType: "One Time" }),
          });
        } else {
          rows.push({
            ...base, applicableType: "Custom", month: null, year: sessionYear, customTitle: cat.name, period: "Custom",
            key: rowKey({ feeCategory: catId, applicableType: "Custom" }),
          });
        }
      });
    return rows;
  }, [categories, sessionYear]);

  const selectedKeys = useMemo(() => new Set((form.requiredFees || []).map(rowKey)), [form.requiredFees]);
  const allSelected = feeRows.length > 0 && (form.requiredFees || []).length === feeRows.length;

  const entryFromRow = (row) => ({
    feeCategory: row.feeCategory,
    applicableType: row.applicableType,
    month: row.applicableType === "Month" ? row.month : null,
    monthFrom: row.applicableType === "Month" ? row.month : null,
    year: row.year || form.academicSession,
    customTitle: row.customTitle || "",
  });

  const toggleFee = (row) => {
    const key = rowKey(row);
    const exists = selectedKeys.has(key);
    const requiredFees = exists
      ? (form.requiredFees || []).filter((r) => rowKey(r) !== key)
      : [...(form.requiredFees || []), entryFromRow(row)];
    setForm({ ...form, requiredFees });
  };

  const toggleAll = () => {
    if (allSelected) {
      setForm({ ...form, requiredFees: [] });
    } else {
      setForm({ ...form, requiredFees: feeRows.map(entryFromRow) });
    }
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
              {!editing && form.examCode && (
                <p className="text-[11px] text-emerald-600 mt-1">Exam code will be <span className="font-semibold">{form.examCode}</span></p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Academic Session *</label>
              <select name="academicSession" value={form.academicSession} onChange={handleChange} required className={inputClass}>
                {(systemSettings.academicSessions || ["2025", "2026", "2027"]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Attendance Days</label>
            <input type="number" name="attendanceDays" value={form.attendanceDays}
              onChange={handleChange} min="1" max="30"
              className={inputClass} />
            <p className="text-[11px] text-gray-400 mt-1">
              Over how many days this exam's attendance is taken (scan once per student per day).
            </p>
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

      {/* Required Fees */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-200 pt-5 max-w-4xl">
        <div className="px-6 pb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Required Fees (for Admit Card)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tick the fees students must clear before taking this exam — {" "}
              <span className="font-semibold text-emerald-600">{selectedKeys.size} selected</span>
              {sessionYear && <span> · Academic session {sessionYear}</span>}
            </p>
          </div>
        </div>
        {feeRows.length === 0 ? (
          <div className="px-6 pb-8">
            <p className="text-sm text-gray-400">No fee categories found. Add fee categories in Collect Payment setup first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-slate-500 border-y border-gray-100">
                  <th className="px-6 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Fee</th>
                  <th className="px-3 py-3 text-left font-semibold">Period</th>
                  <th className="px-6 py-3 text-right font-semibold">Default Amount</th>
                </tr>
              </thead>
              <tbody>
                {feeRows.map((row) => {
                  const on = selectedKeys.has(row.key);
                  return (
                    <tr key={row.key} onClick={() => toggleFee(row)}
                      className={`cursor-pointer border-b border-gray-50 transition ${on ? "bg-emerald-50/60" : "hover:bg-slate-50/60"}`}>
                      <td className="px-6 py-2">
                        <input type="checkbox" checked={on} readOnly
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-700">{row.feeName}</p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">{row.frequency}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.period}</td>
                      <td className="px-6 py-2 text-right text-slate-600">{row.defaultAmount > 0 ? fmt(row.defaultAmount) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}