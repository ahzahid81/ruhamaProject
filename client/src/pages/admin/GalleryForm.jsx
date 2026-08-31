import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { ArrowLeft, ImagePlus, Loader2, Save, X } from "lucide-react";

export default function GalleryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [photoFile, setPhotoFile] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState("");
  const [altText, setAltText] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/gallery/${id}`)
      .then((res) => {
        setExistingPhoto(res.data.photo || "");
        setAltText(res.data.altText || "");
      })
      .catch((error) =>
        setToast({ message: error.response?.data?.message || "Failed to load photo", type: "error" })
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !photoFile) {
      setToast({ message: "Photo is required", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("altText", altText.trim());
      if (photoFile) data.append("photo", photoFile);

      if (isEdit) {
        await api.put(`/gallery/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/gallery", data, { headers: { "Content-Type": "multipart/form-data" } });
      }

      setToast({ message: isEdit ? "Photo updated" : "Photo added", type: "success" });
      setTimeout(() => navigate("/admin/gallery"), 700);
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Failed to save", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const preview = photoFile ? URL.createObjectURL(photoFile) : existingPhoto;

  return (
    <div className="max-w-2xl mx-auto">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/gallery")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Gallery
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{isEdit ? "Edit Photo" : "New Photo"}</h1>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-4">Loading photo...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Photo <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(JPG, PNG, WEBP — max 5 MB)</span>
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full max-h-80 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setExistingPhoto("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white shadow-md text-gray-500 hover:text-red-500 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm font-medium">Click to choose a photo</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Alt Text <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g. Students at the Annual Sports Day"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1.5">Used for accessibility and on the gallery page — not shown on the landing slider.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-60 w-full sm:w-auto justify-center"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? "Save Changes" : "Add Photo"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/gallery")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition w-full sm:w-auto justify-center"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}