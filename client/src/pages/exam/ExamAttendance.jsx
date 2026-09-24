import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../services/api";
import {
  ScanLine,
  QrCode,
  Camera,
  VideoOff,
  CheckCircle2,
  XCircle,
  UserX,
  RefreshCw,
  Clock,
  Trash2,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { bdDateTime } from "../../utils/bdTime";

const STATUS_STYLES = {
  Present: "bg-emerald-100 text-emerald-700",
  Absent: "bg-red-100 text-red-700",
  Late: "bg-amber-100 text-amber-700",
  Leave: "bg-sky-100 text-sky-700",
  "Not Marked": "bg-slate-100 text-slate-500",
};

const STATUS_COLORS = {
  Present: "#10b981",
  Absent: "#ef4444",
  Late: "#f59e0b",
  Leave: "#0ea5e9",
  "Not Marked": "#94a3b8",
};

export default function ExamAttendance() {
  const teacher = JSON.parse(localStorage.getItem("teacher")) || {};
  const isAdmin = teacher.role === "admin";

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, notMarked: 0 });

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [manualId, setManualId] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const scannerRef = useRef(null);
  const busyRef = useRef(false);
  const handleDecodedRef = useRef(null);

  const selectedExam = exams.find((e) => e._id === selectedExamId) || null;
  const exam = selectedExam
    ? {
        examName: selectedExam.examName,
        academicSession: selectedExam.academicSession,
      }
    : null;

  // ---------- exams ----------
  useEffect(() => {
    api
      .get("/exams")
      .then((res) => {
        const list = res.data?.exams || [];
        setExams(list);
        setSelectedExamId(
          (prev) => prev || list.find((e) => e.isActive)?._id || list[0]?._id || ""
        );
      })
      .catch(() => setExams([]));
  }, []);

  // ---------- load roster + records ----------
  const loadAttendance = useCallback(async (examId) => {
    if (!examId) return;
    setRosterLoading(true);
    try {
      const [rosterRes, recordsRes] = await Promise.all([
        api.get(`/exam-attendance/exam/${examId}/roster`),
        api.get(`/exam-attendance/exam/${examId}`),
      ]);
      const rosterData = rosterRes.data?.roster || [];
      const recordList = recordsRes.data?.records || [];
      setRoster(rosterData);
      setRecords(recordList);
      setStats({
        total: rosterData.length,
        present: rosterData.filter((s) => s.status === "Present").length,
        notMarked: rosterData.filter((s) => s.status === "Not Marked").length,
      });
    } catch {
      setRoster([]);
      setRecords([]);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance(selectedExamId);
  }, [selectedExamId, loadAttendance]);

  // ---------- scanner lifecycle ----------
  const stopScanner = useCallback(() => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) scanner.stop();
        scanner.clear();
      } catch {
        // ignore teardown errors
      }
    }
    scannerRef.current = null;
    setScanning(false);
    setDevices([]);
  }, []);

  // Cleanup camera on unmount.
  useEffect(() => () => stopScanner(), [stopScanner]);

  // ---------- scan handling ----------
  const submitScan = useCallback(
    async (qrData, method = "scan") => {
      if (busyRef.current) return;
      busyRef.current = true;
      setProcessing(true);
      setLastResult(null);
      try {
        const res = await api.post("/exam-attendance/scan", {
          examId: selectedExamId,
          qrData,
          method,
        });
        setLastResult(res.data);
        if (res.data?.marked) {
          await loadAttendance(selectedExamId);
        }
      } catch (err) {
        setLastResult({
          success: false,
          marked: false,
          error: err.response?.data?.message || "Scan failed.",
        });
      } finally {
        setProcessing(false);
        setTimeout(() => {
          busyRef.current = false;
        }, 800);
      }
    },
    [selectedExamId, loadAttendance]
  );

  const handleDecoded = useCallback(
    (decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        if (!data.id) throw new Error("no id");
        submitScan(data, "scan");
      } catch {
        setLastResult({
          success: false,
          marked: false,
          error: "Could not read this QR code. Please scan the student's admit card.",
        });
      }
    },
    [submitScan]
  );

  useEffect(() => {
    handleDecodedRef.current = handleDecoded;
  }, [handleDecoded]);

  const startScanner = () => {
    if (!selectedExamId) {
      setToast({ type: "error", text: "Please select an exam first." });
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setCameraError(
        "Camera access requires a secure HTTPS connection. Open this site over https:// (not http:// or an IP address), then try again."
      );
      return;
    }
    setCameraError("");
    setLastResult(null);
    stopScanner();
    setDeviceId(null);
    setScanning(true);

    // Start the camera directly inside the click gesture — mobile/iOS
    // browsers refuse getUserMedia when it is deferred past the tap.
    const scanner = new Html5Qrcode("qr-region");
    scannerRef.current = scanner;
    openCamera(scanner, null);
  };

  const openCamera = async (scanner, deviceIdValue) => {
    const config = { fps: 10, qrbox: { width: 220, height: 220 } };
    const onScan = (text) => handleDecodedRef.current(text);
    try {
      await scanner.start(
        deviceIdValue ? { deviceId: { exact: deviceIdValue } } : { facingMode: "environment" },
        config,
        onScan,
        () => {}
      );
      return;
    } catch {
      try { scanner.clear(); } catch { /* ignore */ }
    }

    // Fallback: enumerate the phone's cameras and try each one.
    let available = [];
    try {
      available = await Html5Qrcode.getCameras();
    } catch {
      // camera enumeration unsupported
    }
    available = (available || []).filter((c) => c && c.id);
    if (available.length) setDevices(available);
    for (const cam of available) {
      try {
        await scanner.start({ deviceId: { exact: cam.id } }, config, onScan, () => {});
        return;
      } catch {
        try { scanner.clear(); } catch { /* ignore */ }
      }
    }

    const secure = typeof window !== "undefined" && window.isSecureContext === true;
    setCameraError(
      secure
        ? "Could not access any camera. Allow camera access in your browser (check the camera icon / permissions in the address bar); if it still fails, choose a camera below or use the manual entry."
        : "Camera access requires a secure HTTPS connection. Open this site over https:// (not http:// or an IP address), then try again."
    );
    setScanning(false);
  };

  // Lets the user pick a different camera if the auto one failed.
  const chooseDevice = (deviceIdValue) => {
    const old = scannerRef.current;
    if (old) {
      try {
        if (old.isScanning) old.stop();
        old.clear();
      } catch {
        // ignore teardown errors
      }
    }
    setDeviceId(deviceIdValue);
    setCameraError("");
    const scanner = new Html5Qrcode("qr-region");
    scannerRef.current = scanner;
    openCamera(scanner, deviceIdValue || null);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const id = manualId.trim();
    if (!id) return;
    if (!selectedExamId) {
      setToast({ type: "error", text: "Please select an exam first." });
      return;
    }
    setManualBusy(true);
    setManualId("");
    await submitScan({ id }, "manual");
    setManualBusy(false);
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  // ---------- admin actions ----------
  const changeStatus = async (studentId, status) => {
    const rec = roster.find((s) => s.studentId === studentId)?.record;
    if (!rec) return;
    try {
      await api.put(`/exam-attendance/${rec._id}`, { status });
      showToast("success", "Status updated.");
      loadAttendance(selectedExamId);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update.");
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this attendance record?")) return;
    try {
      await api.delete(`/exam-attendance/${recordId}`);
      showToast("success", "Record deleted.");
      loadAttendance(selectedExamId);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to delete.");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear ALL exam attendance for this exam?")) return;
    try {
      await api.delete(`/exam-attendance/exam/${selectedExamId}`);
      showToast("success", "All records cleared.");
      loadAttendance(selectedExamId);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to clear.");
    }
  };

  // ---------- derived ----------
  const filteredRoster = useMemo(() => {
    if (!searchQuery) return roster;
    const q = searchQuery.toLowerCase();
    return roster.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.className?.toLowerCase().includes(q)
    );
  }, [roster, searchQuery]);

  return (
    <>
      {/* HERO */}
      <div className="bg-gradient-to-r from-[#07153B] to-[#12308F] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl md:text-4xl font-black">Exam Attendance</h1>
          <p className="mt-2 text-white/80 text-sm">
            Scan students' Admit Card QR codes to mark attendance — eligible students only.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {toast && (
          <div
            className={`px-5 py-3 rounded-2xl text-sm font-semibold border ${
              toast.type === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* TOOLBAR */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <label className="block text-sm font-bold text-slate-600 mb-2">Select Exam</label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="flex-1 min-w-[260px] border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
            >
              {exams.length === 0 && <option value="">No exams found</option>}
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.examName}{ex.examCode ? ` (${ex.examCode})` : ""} — {ex.academicSession}
                </option>
              ))}
            </select>
            {isAdmin && (
              <button
                onClick={handleClearAll}
                disabled={records.length === 0}
                className="px-4 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-40 transition"
              >
                <Trash2 className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Clear All
              </button>
            )}
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <StatCard icon={UserCheck} label="Eligible Students" value={stats.total} color="text-indigo-600 bg-indigo-50" />
            <StatCard icon={CheckCircle2} label="Present" value={stats.present} color="text-emerald-600 bg-emerald-50" />
            <StatCard icon={Clock} label="Not Marked" value={stats.notMarked} color="text-amber-600 bg-amber-50" />
            <StatCard
              icon={ShieldCheck}
              label="Attendance Rate"
              value={stats.total ? `${Math.round((stats.present / stats.total) * 100)}%` : "—"}
              color="text-sky-600 bg-sky-50"
            />
          </div>
        </div>

        {/* SCANNER + LAST RESULT */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* SCANNER */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-indigo-600" /> QR Scanner
              </h2>
              {scanning ? (
                <button
                  onClick={stopScanner}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition"
                >
                  <VideoOff className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Stop Camera
                </button>
              ) : (
                <button
                  onClick={startScanner}
                  disabled={!selectedExamId}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition"
                >
                  <Camera className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Start Camera
                </button>
              )}
            </div>

            {/* Camera region — always mounted so Html5Qrcode can find it */}
            <div
              id="qr-region"
              className={`w-full rounded-2xl overflow-hidden border ${
                scanning
                  ? "h-[320px] border-indigo-200 bg-slate-900"
                  : "h-32 border-slate-200 bg-slate-50"
              }`}
            />

            {!scanning && !cameraError && (
              <div className="mt-3 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl py-6 text-center">
                <QrCode className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  Point the camera at the student's Admit Card QR code.
                </p>
                <p className="text-xs text-slate-400 mt-1">Only eligible students will be marked.</p>
              </div>
            )}

            {devices.length > 0 && scanning && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                  Camera:
                </label>
                <select
                  value={deviceId || ""}
                  onChange={(e) => chooseDevice(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
                >
                  <option value="">Auto (rear)</option>
                  {devices.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Camera ${cam.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {cameraError && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {cameraError}
              </p>
            )}

            {/* Manual fallback */}
            <form onSubmit={handleManualSubmit} className="mt-5 flex gap-2">
              <input
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                disabled={processing || manualBusy}
                placeholder="Or type Student ID manually (e.g. ADM260001)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 transition"
              />
              <button
                type="submit"
                disabled={!manualId.trim() || processing || manualBusy}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 transition"
              >
                {manualBusy ? "..." : "Mark"}
              </button>
            </form>
          </div>

          {/* LAST RESULT */}
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Scan Result</h2>
            {processing ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Verifying eligibility &amp; marking attendance...</p>
              </div>
            ) : lastResult ? (
              <div className="space-y-4">
                <ResultCard result={lastResult} />
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <img
                    src={lastResult.student?.photo || undefined}
                    alt={lastResult.student?.name}
                    className="w-14 h-16 object-cover rounded-xl border-2 border-slate-200 hidden sm:block"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">{lastResult.student?.name || "—"}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {lastResult.student?.className} · {lastResult.student?.studentId}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Father: {lastResult.student?.fatherName || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <ScanLine className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No scan yet. Scan a student's Admit Card to see the result.</p>
              </div>
            )}

            {/* Recent scans */}
            {records.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-600 mb-2">Recently Marked</h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {records.slice(0, 12).map((r) => (
                    <div key={r._id} className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{r.name}</p>
                        <p className="text-xs text-gray-400">
                          {r.studentId} · {bdDateTime(r.scannedAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROSTER */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Eligible Roster</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {exam ? `${exam.examName} — ${exam.academicSession}` : ""} · Only eligible students can be marked
              </p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 w-64"
              />
            </div>
          </div>

          {rosterLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Loading roster...</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="py-16 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">No eligible students found for this exam.</p>
              <p className="text-xs text-slate-400 mt-1">
                Students must clear the exam's required fees before being marked present.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="py-2.5 px-2">#</th>
                    <th className="py-2.5 px-2">Student</th>
                    <th className="py-2.5 px-2">ID</th>
                    <th className="py-2.5 px-2">Class</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2">Marked At</th>
                    {isAdmin && <th className="py-2.5 px-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRoster.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-2 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {s.photo ? (
                              <img src={s.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              s.name?.charAt(0)?.toUpperCase() || "?"
                            )}
                          </div>
                          <span className="font-semibold text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-gray-500">{s.studentId}</td>
                      <td className="py-2.5 px-2 text-gray-500">{s.className}</td>
                      <td className="py-2.5 px-2">
                        {isAdmin && s.status !== "Not Marked" ? (
                          <select
                            value={s.status}
                            onChange={(e) => changeStatus(s.studentId, e.target.value)}
                            className="text-xs font-bold rounded-lg px-2 py-1 outline-none border border-gray-200 cursor-pointer"
                            style={{ color: STATUS_COLORS[s.status] }}
                          >
                            <option>Present</option>
                            <option>Absent</option>
                            <option>Late</option>
                            <option>Leave</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLES[s.status]}`}>
                            {s.status}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-xs text-gray-400">
                        {s.record ? bdDateTime(s.record.scannedAt) : "—"}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-2 text-right">
                          {s.record && (
                            <button
                              onClick={() => handleDelete(s.record._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-[11px] text-slate-400 font-medium mt-1">{label}</p>
    </div>
  </div>
);

const ResultCard = ({ result }) => {
  if (!result) return null;
  if (result.marked) {
    return (
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <CheckCircle2 className="w-9 h-9 text-emerald-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-emerald-700 font-bold">Attendance Marked</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">{result.student?.name}</p>
          <p className="text-xs text-gray-500">
            {result.student?.className} ({result.student?.studentId}) · {bdDateTime(result.record?.scannedAt)}
          </p>
        </div>
      </div>
    );
  }
  if (result.alreadyMarked) {
    return (
      <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-2xl p-4">
        <Clock className="w-9 h-9 text-sky-500 flex-shrink-0" />
        <div>
          <p className="text-sky-700 font-bold">Already Marked</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">{result.student?.name}</p>
          <p className="text-xs text-gray-500">
            Marked {bdDateTime(result.record?.scannedAt)} as {result.record?.status}
          </p>
        </div>
      </div>
    );
  }
  if (result.eligible === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-9 h-9 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-bold">Not Eligible</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{result.student?.name}</p>
            <p className="text-xs text-gray-500">{result.student?.className} · {result.student?.studentId}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-red-600 list-disc ml-5">
          {(result.reasons || []).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (result.error) {
    return (
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <UserX className="w-9 h-9 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-amber-700 font-bold">Scan Failed</p>
          <p className="text-xs text-gray-600 mt-1">{result.error}</p>
        </div>
      </div>
    );
  }
  return null;
};