import { useState } from "react";
import api from "../../services/api";
import useQuery from "../../hooks/useQuery";
import {
  invalidate,
  useFeeCategories,
  useSettings,
  useStudents,
} from "../../services/resources";
import { InlineLoader, PageLoader } from "../../components/Loader";

const fallbackSettings = { classes: [], academicSessions: ["2026"], currentSession: "2026" };

const sortBreakdown = (items) =>
  (items || []).slice().sort((a, b) =>
    (a.feeCategory?.name || "").localeCompare(b.feeCategory?.name || "")
  );

const buildAmounts = (categories, breakdown) => {
  const map = {};
  categories.forEach((c) => { map[c._id] = c.defaultAmount || ""; });
  (breakdown || []).forEach((b) => { map[b.feeCategory._id] = b.effectiveAmount; });
  return map;
};

function StudentWiseFeesView({
  students,
  categories,
  systemSettings,
  session,
  selected,
  breakdown,
  onSelect,
  breakdownLoading,
  onReloadBreakdown,
}) {
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [amounts, setAmounts] = useState(() => buildAmounts(categories, breakdown));

  const [classFilter, setClassFilter] = useState("");
  const [search, setSearch] = useState("");

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refresh = async () => {
    await onReloadBreakdown();
    await invalidate.fees();
  };

  const activateCat = async (cat) => {
    const amount = Number(amounts[cat._id] || 0);
    if (!(amount > 0)) return showToast("Enter an amount greater than 0", "error");
    setSaving(true);
    try {
      await api.post("/fees/student-overrides", {
        student: selected._id,
        academicSession: session,
        feeCategory: cat._id,
        amount,
        frequency: cat.frequency || "Monthly",
      });
      showToast("Override activated for " + selected.name);
      await refresh();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to activate", "error");
    } finally {
      setSaving(false);
    }
  };

  const deactivateOverride = async (b) => {
    if (!b.overrideId) return;
    setSaving(true);
    try {
      await api.put(`/fees/student-overrides/${b.overrideId}`, { isActive: false });
      showToast("Override deactivated");
      await refresh();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to deactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter((s) => {
    if (classFilter && s.className !== classFilter) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${s.name} ${s.studentId}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const isActive = (b) => b.source === "Student Override";

  const activatedCatIds = new Set(breakdown.map((b) => String(b.feeCategory._id)));
  const pendingSpecific = categories.filter(
    (c) => c.applicableTo === "Specific" && c.isActive && !activatedCatIds.has(String(c._id))
  );

  const fmt = (n) => "BDT " + Number(n || 0).toLocaleString("en-BD");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Student-wise Fee Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          View a student's fee amounts. Set a custom amount and click <b>Activate</b> to apply an override.
        </p>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm transition-all ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Student list */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40">
              <option value="">All Classes</option>
              {(systemSettings.classes || []).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input type="text" value={search} placeholder="Search name or ID..."
              className="flex-1 min-w-[180px] border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="text-xs text-gray-400 mb-2">{filtered.length} student{filtered.length !== 1 && "s"}</div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-3 py-2 font-semibold">Student</th>
                  <th className="px-3 py-2 font-semibold">Class</th>
                  <th className="px-3 py-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s._id} className={`hover:bg-gray-50 transition ${selected?._id === s._id ? "bg-emerald-50" : ""}`}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-slate-700">{s.name}</p>
                      <p className="text-xs font-mono text-gray-400">{s.studentId}</p>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">{s.className}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => onSelect(s)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition">
                        {(selected?._id === s._id) ? "Viewing" : "Fees"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center text-gray-400 py-8 text-sm">No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Override panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          {!selected ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-gray-400 text-sm">Select a student to view and override their fee amounts.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="font-bold text-slate-800 text-lg">{selected.name}</h2>
                <p className="text-xs font-mono text-gray-400">{selected.studentId} · {selected.className}</p>
                <p className="text-xs text-gray-400 mt-1">Session: <b>{session}</b></p>
              </div>

              {breakdownLoading ? (
                <InlineLoader label="Loading fee breakdown..." />
              ) : breakdown.length === 0 ? (
                <p className="text-sm text-gray-400">No active fees to manage.</p>
              ) : (
                <div className="space-y-3">
                  {breakdown.map((b) => {
                    const cat = b.feeCategory;
                    const active = isActive(b);
                    return (
                      <div key={cat._id} className="border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-slate-700">{cat.name}</p>
                          {active && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wide">
                              Override Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          Current: <b className="text-slate-600">{fmt(b.effectiveAmount)}</b> · {b.source}
                          {b.frequency ? ` · ${b.frequency}` : ""}
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">৳</span>
                            <input type="number" min="0" value={amounts[cat._id] ?? ""}
                              className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
                              onChange={(e) => setAmounts({ ...amounts, [cat._id]: e.target.value })}
                            />
                          </div>
                          {active ? (
                            <button onClick={() => deactivateOverride(b)} disabled={saving}
                              className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition disabled:opacity-50">
                              Deactivate
                            </button>
                          ) : (
                            <button onClick={() => activateCat(cat)} disabled={saving}
                              className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                              Activate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {pendingSpecific.length > 0 && !breakdownLoading && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Activate a Specific Fee
                  </h3>
                  <div className="space-y-3">
                    {pendingSpecific.map((cat) => (
                      <div key={cat._id} className="border border-dashed border-gray-300 rounded-xl p-3">
                        <p className="text-sm font-semibold text-slate-700 mb-1">{cat.name}</p>
                        <p className="text-xs text-gray-400 mb-2">
                          Not activated for {selected.name} yet. Set the amount, then click Activate. Default amount: {fmt(cat.defaultAmount)}
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">৳</span>
                            <input type="number" min="0" value={amounts[cat._id] ?? ""}
                              className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
                              onChange={(e) => setAmounts({ ...amounts, [cat._id]: e.target.value })}
                            />
                          </div>
                          <button onClick={() => activateCat(cat)} disabled={saving}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                            Activate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentWiseFees() {
  const [selected, setSelected] = useState(null);

  const settingsQuery = useSettings();
  const studentsQuery = useStudents();
  const categoriesQuery = useFeeCategories();

  const session = settingsQuery.data?.currentSession || "";

  const breakdownQuery = useQuery(
    selected && session ? `fees:student-fees:${selected._id}:${session}` : null,
    () =>
      api
        .get(`/fees/student-fees/${selected._id}?academicSession=${session}`)
        .then((res) => res.data?.breakdown || [])
  );

  if (settingsQuery.loading || studentsQuery.loading || categoriesQuery.loading) {
    return <PageLoader />;
  }

  const breakdown = sortBreakdown(breakdownQuery.data);

  return (
    <StudentWiseFeesView
      key={`${selected?._id || "none"}:${session}`}
      students={studentsQuery.data || []}
      categories={categoriesQuery.data || []}
      systemSettings={{ ...fallbackSettings, ...(settingsQuery.data || {}) }}
      session={session}
      selected={selected}
      breakdown={breakdown}
      onSelect={setSelected}
      breakdownLoading={Boolean(selected) && breakdownQuery.loading}
      onReloadBreakdown={breakdownQuery.refetch}
    />
  );
}