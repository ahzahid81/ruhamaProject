import { useEffect, useState } from "react";
import api from "../services/api";
import { getSettings } from "../services/settingsCache";

const StudentPicker = ({ onSelect, onOpen, selectedId, title = "Select Student", navigateOnClick = true }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [classFilter, setClassFilter] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((r) => setClasses(r.data?.classes || [])).catch(() => {});
    api.get("/students")
      .then((res) => setStudents(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = students.filter((s) => {
    if (classFilter && s.className !== classFilter) return false;
    if (q && !`${s.name} ${s.studentId} ${s.fatherMobile || ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-slate-800 mb-4">{title}</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Student ID, Name, or Father's Mobile..."
          className="flex-1 min-w-[200px] border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border border-gray-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="">All Classes</option>
          {(classes || []).map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="text-xs text-gray-400 mb-2">
        {loading ? "Loading students..." : `${filtered.length} student${filtered.length !== 1 ? "s" : ""}`}
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
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
              <tr
                key={s._id}
                onClick={() => (navigateOnClick ? onOpen?.(s) : onSelect?.(s))}
                className={`cursor-pointer transition ${selectedId === s._id ? "bg-emerald-50" : "hover:bg-gray-50"}`}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    {s.photo ? (
                      <img src={s.photo} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-100" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg">👤</div>
                    )}
                    <div>
                      <p className="font-medium text-slate-700">{s.name}</p>
                      <p className="text-xs font-mono text-gray-400">{s.studentId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-500">
                  {s.className}
                  {s.section ? ` (${s.section})` : ""}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    navigateOnClick
                      ? selectedId === s._id
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-blue-50 text-blue-600"
                      : selectedId === s._id ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {navigateOnClick ? "View" : "Select"} →
                  </span>
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
  );
};

export default StudentPicker;