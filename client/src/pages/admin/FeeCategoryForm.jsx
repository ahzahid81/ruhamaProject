import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../../services/api";
import { getSettings } from "../../services/settingsCache";

const toCode = (name) =>
  name.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

const fallbackSettings = {
  classes: [],
  academicSessions: ["2026"],
  currentSession: "2026",
};

const TYPES = ["Monthly", "One Time"];
const APPLIES_TO = ["Global", "Class Wise", "Specific"];

export default function FeeCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editing = Boolean(id);

  const [systemSettings, setSystemSettings] = useState(fallbackSettings);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [type, setType] = useState("Monthly");
  const [applicableTo, setApplicableTo] = useState("Global");
  const [session, setSession] = useState("");
  const [globalAmount, setGlobalAmount] = useState("");
  const [classAmounts, setClassAmounts] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const classes = systemSettings.classes || [];

  useEffect(() => {
    (async () => {
      try {
        const sres = await getSettings();
        const data = sres.data || {};
        setSystemSettings({ ...fallbackSettings, ...data });
        setSession(data.currentSession || fallbackSettings.currentSession || "");
      } catch {
        setSession(fallbackSettings.currentSession || "");
      }

      try {
        const res = await api.get("/payments/fee-categories");
        setCategories(res.data);
      } catch {
        // silent
      }

      try {
        const res = await api.get("/students");
        setStudents(res.data || []);
      } catch {
        // silent
      }

      if (!editing) return;

      const cat = location.state?.category || categories.find((c) => c._id === id);
      if (!cat) return;

      setForm({ name: cat.name, code: cat.code, description: cat.description || "" });
      setType(cat.frequency === "One Time" ? "One Time" : "Monthly");
      setGlobalAmount(cat.defaultAmount || "");
      setApplicableTo(cat.applicableTo || (cat.defaultAmount > 0 ? "Global" : "Class Wise"));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, categories.length]);

  useEffect(() => {
    if (!editing) return;
    const cat = location.state?.category || categories.find((c) => c._id === id);
    if (!cat) return;

    if (cat.applicableTo === "Class Wise") {
      api.get(`/fees/settings?feeCategory=${cat._id}`)
        .then((r) => {
          const rates = r.data.settings || r.data || [];
          const map = {};
          rates.forEach((rate) => { map[rate.className] = rate.amount; });
          setClassAmounts(map);
        })
        .catch(() => {});
    }

    if (cat.applicableTo === "Specific") {
      api.get(`/fees/student-overrides?feeCategory=${cat._id}`)
        .then((r) => {
          const ovr = r.data.overrides || [];
          setSelectedStudents(ovr.map((o) => ({
            _id: o.student,
            studentId: o.studentId,
            name: o.studentId,
            amount: o.amount,
          })));
          setStudents((prev) => {
            const existingIds = new Set(prev.map((s) => s._id));
            ovr.forEach((o) => {
              if (!existingIds.has(String(o.student))) {
                prev.push({ _id: o.student, studentId: o.studentId, name: o.studentId });
                existingIds.add(String(o.student));
              }
            });
            return [...prev];
          });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, categories.length]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addStudent = (s) => {
    if (selectedStudents.some((x) => String(x._id) === String(s._id))) {
      showToast("Student already added", "error");
      return;
    }
    setSelectedStudents((prev) => [...prev, { _id: s._id, studentId: s.studentId, name: s.name, amount: "" }]);
    setSearch("");
  };

  const removeStudent = (sid) => setSelectedStudents((prev) => prev.filter((s) => String(s._id) !== String(sid)));
  const setStudentAmount = (sid, value) =>
    setSelectedStudents((prev) => prev.map((s) => (String(s._id) === String(sid) ? { ...s, amount: value } : s)));

  const matches = students
    .filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return false;
      return `${s.name} ${s.studentId}`.toLowerCase().includes(q);
    })
    .slice(0, 8);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("Fee name is required", "error");
    if (applicableTo === "Global" && !(Number(globalAmount) > 0)) return showToast("Enter the fee amount", "error");
    setSaving(true);

    const payload = {
      ...form,
      code: form.code || toCode(form.name),
      frequency: type,
      applicableTo,
      defaultAmount: applicableTo === "Global" ? Number(globalAmount) || 0 : 0,
      sortOrder: form.sortOrder || categories.length + 1,
      isActive: true,
    };

    try {
      let catId = id;
      if (editing) {
        const res = await api.put(`/payments/fee-categories/${id}`, payload);
        catId = res.data?._id || id;
      } else {
        const res = await api.post("/payments/fee-categories", payload);
        catId = res.data._id;
      }

      if (applicableTo === "Class Wise") {
        const rres = await api.get(`/fees/settings?feeCategory=${catId}`);
        const existing = rres.data.settings || rres.data || [];
        for (const cls of classes) {
          const amount = Number(classAmounts[cls.name] || 0);
          const rate = existing.find((r) => r.className === cls.name);
          if (amount > 0) {
            const body = { amount, frequency: type };
            if (rate) {
              await api.put(`/fees/settings/${rate._id}`, body);
            } else {
              await api.post("/fees/settings", {
                className: cls.name,
                academicSession: session,
                feeCategory: catId,
                amount,
                frequency: type,
              });
            }
          } else if (rate) {
            await api.delete(`/fees/settings/${rate._id}`);
          }
        }
      }

      if (applicableTo === "Specific") {
        const ores = await api.get(`/fees/student-overrides?feeCategory=${catId}`);
        const existing = ores.data.overrides || [];
        for (const st of selectedStudents) {
          const amount = Number(st.amount || 0);
          if (amount > 0) {
            await api.post("/fees/student-overrides", {
              student: st._id,
              academicSession: session,
              feeCategory: catId,
              amount,
              frequency: type,
            });
          } else {
            const ovr = existing.find((o) => String(o.student) === String(st._id));
            if (ovr) await api.delete(`/fees/student-overrides/${ovr._id}`);
          }
        }
      }

      showToast(editing ? "Fee updated" : "Fee created");
      setTimeout(() => navigate("/fees/settings"), 500);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">{editing ? "Edit Fee" : "New Fee"}</h1>
        <p className="text-sm text-gray-500 mt-1">Define the fee once — choose how it applies to students.</p>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Fee Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Fee Name *</label>
              <input type="text" name="name" value={form.name} required
                placeholder="e.g. Tuition Fee"
                className={inputCls}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name, code: editing ? form.code : toCode(name) });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Code</label>
              <input type="text" value={form.code} readOnly
                className={inputCls + " bg-gray-50 text-gray-500 font-mono"}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <input type="text" value={form.description} placeholder="Optional"
              className={inputCls}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Fee Type</h2>
          <div className="flex flex-wrap gap-3">
            {TYPES.map((t) => (
              <label key={t} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition text-sm font-semibold ${
                type === t ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
                <input type="radio" className="accent-emerald-600" checked={type === t} onChange={() => setType(t)} />
                {t}
              </label>
            ))}
          </div>
          {type === "One Time" && (
            <p className="text-xs text-gray-400">Charged once per student (e.g. admission, books, uniform).</p>
          )}
          {type === "Monthly" && (
            <p className="text-xs text-gray-400">Charged monthly, every month of the session.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 max-w-2xl">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Applies To</h2>
          <div className="flex flex-wrap gap-3">
            {APPLIES_TO.map((a) => (
              <label key={a} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition text-sm font-semibold ${
                applicableTo === a ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}>
                <input type="radio" className="accent-emerald-600" checked={applicableTo === a} onChange={() => setApplicableTo(a)} />
                {a}
              </label>
            ))}
          </div>

          {applicableTo === "Global" && (
            <div className="pt-2 max-w-xs">
              <label className="block text-sm font-medium text-gray-600 mb-1">Default Amount (all students) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">৳</span>
                <input type="number" min="0" value={globalAmount} placeholder="0"
                  className={inputCls + " pl-8"}
                  onChange={(e) => setGlobalAmount(e.target.value)}
                />
              </div>
            </div>
          )}

          {applicableTo === "Class Wise" && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Session</label>
              <select value={session} className={inputCls + " max-w-xs"}
                onChange={(e) => setSession(e.target.value)}>
                {(systemSettings.academicSessions || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {classes.length === 0 ? (
                <p className="text-xs text-amber-600 mt-2">No classes configured yet. Add classes in System Settings, then set amounts here.</p>
              ) : (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classes.map((cls) => (
                    <div key={cls.name} className="border border-gray-200 rounded-xl p-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{cls.name}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">৳</span>
                        <input type="number" min="0" value={classAmounts[cls.name] ?? ""} placeholder="0"
                          className={inputCls + " pl-8 py-2"}
                          onChange={(e) => setClassAmounts({ ...classAmounts, [cls.name]: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">Leave a class amount empty (or 0) to skip that class.</p>
            </div>
          )}

          {applicableTo === "Specific" && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">Session</label>
              <select value={session} className={inputCls + " max-w-xs"}
                onChange={(e) => setSession(e.target.value)}>
                {(systemSettings.academicSessions || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <label className="block text-sm font-medium text-gray-600 mb-1 mt-3">Add Students</label>
              <input type="text" value={search} placeholder="Search by student name or ID..."
                className={inputCls + " max-w-md"}
                onChange={(e) => setSearch(e.target.value)}
              />
              {matches.length > 0 && (
                <div className="mt-1 max-w-md bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {matches.map((s) => (
                    <button type="button" key={s._id} onClick={() => addStudent(s)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-700">{s.name}</span>
                      <span className="text-xs font-mono text-gray-400">{s.studentId}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedStudents.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedStudents.map((st) => (
                    <div key={st._id} className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600 truncate">{st.name || st.studentId}</span>
                        <button type="button" onClick={() => removeStudent(st._id)} className="text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">৳</span>
                        <input type="number" min="0" value={st.amount ?? ""} placeholder="Amount"
                          className={inputCls + " pl-8 py-2"}
                          onChange={(e) => setStudentAmount(st._id, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-2">Search and pick students to set a custom amount for each. This activates the override in one step.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : editing ? "Save Fee" : "Create Fee"}
          </button>
          <button type="button" onClick={() => navigate("/fees/settings")}
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}