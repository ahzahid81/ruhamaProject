import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const AdmissionSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const success = location.state || null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Student Admission</h1>
          <p className="mt-1.5 text-indigo-200 text-sm md:text-base">Create new student profile</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Admission Successful</h2>
          <p className="text-sm text-gray-400 mt-1">Student has been registered</p>
        </div>
        {success && (
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Student ID</span>
              <span className="font-semibold text-gray-900">{success.studentId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Admission No</span>
              <span className="font-semibold text-gray-900">{success.admissionNo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Password</span>
              <span className="font-semibold text-gray-900 font-mono">{success.password}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => navigate("/students")}
          className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all"
        >
          Go to Student List
        </button>
      </div>
    </div>
  );
};

export default AdmissionSuccess;