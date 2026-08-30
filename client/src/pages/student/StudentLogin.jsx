import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import { Hash, Lock, LogIn, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";

export default function StudentLogin() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/student-login", { studentId, password });
      localStorage.setItem("studentToken", res.data.token);
      localStorage.setItem("student", JSON.stringify(res.data.student));
      window.location.href = "/student-portal";
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link to="/" className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <img src={logo} alt="Ruhama" className="w-20 h-20 object-contain mx-auto mb-5" />
            <h1 className="text-3xl font-bold text-white tracking-tight">Student Portal</h1>
            <p className="text-emerald-200/70 mt-2 text-sm">Sign in with your Student ID</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-emerald-200/80 mb-1.5 uppercase tracking-wider">
                Student ID
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                <input
                  type="text"
                  placeholder="e.g. RB260001"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-emerald-300/30 rounded-xl text-sm outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all"
                  value={studentId}
                  onChange={(e) => { setStudentId(e.target.value); setError(""); }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-200/80 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-300/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 text-white placeholder:text-emerald-300/30 rounded-xl text-sm outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/10 transition-all"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300/50 hover:text-emerald-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-all shadow-xl shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-emerald-200/40 text-xs">
              &copy; {new Date().getFullYear()} Ruhama United School
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
