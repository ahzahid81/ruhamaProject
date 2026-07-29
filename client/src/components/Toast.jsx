import { CheckCircle, XCircle, X } from "lucide-react";
import { useEffect } from "react";

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  return (
    <div className="fixed top-6 right-6 z-[100] animate-slide-down">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border ${
          isSuccess
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        )}
        <p className="text-sm font-semibold">{message}</p>
        <button onClick={onClose} className="ml-2 p-0.5 rounded hover:bg-black/5 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
