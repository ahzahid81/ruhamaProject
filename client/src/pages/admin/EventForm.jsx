import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import {
  ImagePlus,
  Images,
  Loader2,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ title: "", description: "" });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [moreFiles, setMoreFiles] = useState([]);
  const [existingThumbnail, setExistingThumbnail] = useState("");
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const thumbInputRef = useRef(null);
  const moreInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/events/${id}`)
      .then((res) => {
        setForm({ title: res.data.title || "", description: res.data.description || "" });
        setExistingThumbnail(res.data.thumbnail || "");
        setExistingPhotos(res.data.morePhotos || []);
      })
      .catch((error) =>
        setToast({ message: error.response?.data?.message || "Failed to load event", type: "error" })
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleThumbnail = (file) => {
    if (!file) return;
    setThumbnailFile(file);
    setExistingThumbnail("");
  };

  const handleMore = (files) => {
    const picked = Array.from(files || []);
    if (picked.length) {
      setMoreFiles((prev) => [...prev, ...picked]);
      setExistingPhotos([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setToast({ message: "Event title is required", type: "error" });
      return;
    }
    if (!isEdit && !thumbnailFile) {
      setToast({ message: "Event thumbnail is required", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("description", form.description.trim());
      if (thumbnailFile) data.append("thumbnail", thumbnailFile);
      moreFiles.forEach((file) => data.append("morePhotos", file));

      if (isEdit) {
        await api.put(`/events/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/events", data, { headers: { "Content-Type": "multipart/form-data" } });
      }

      setToast({ message: isEdit ? "Event updated" : "Event created", type: "success" });
      setTimeout(() => navigate("/admin/events"), 700);
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Failed to save", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/events")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Events
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{isEdit ? "Edit Event" : "New Event"}</h1>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-4">Loading event...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Annual Sports Day 2026"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              placeholder="Share the story of the event..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Thumbnail <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(JPG, PNG, WEBP — max 5 MB)</span>
            </label>
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleThumbnail(e.target.files?.[0])} />
            {existingThumbnail || thumbnailFile ? (
              <div className="relative">
                <img
                  src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : existingThumbnail}
                  alt="Thumbnail preview"
                  className="w-full max-h-64 object-cover rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null);
                    setExistingThumbnail("");
                    if (thumbInputRef.current) thumbInputRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-white shadow-md text-gray-500 hover:text-red-500 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-sm font-medium">Click to choose the thumbnail photo</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              More Photos <span className="text-gray-400 font-normal">(optional — up to 8)</span>
            </label>
            <input
              ref={moreInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleMore(e.target.files)}
            />
            <button
              type="button"
              onClick={() => moreInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition"
            >
              <Images className="w-7 h-7" />
              <span className="text-sm font-medium">Add photos for the event gallery</span>
            </button>
            {(moreFiles.length > 0 || existingPhotos.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                {moreFiles.map((file, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setMoreFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white shadow-md text-gray-500 hover:text-red-500 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {existingPhotos.map((photo) => (
                  <div key={photo} className="relative aspect-square">
                    <img src={photo} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setExistingPhotos((prev) => prev.filter((p) => p !== photo))}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-white shadow-md text-gray-500 hover:text-red-500 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {isEdit ? "Choosing new photos replaces the existing gallery." : "These appear on the event's detail page."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-60 w-full sm:w-auto justify-center"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? "Save Changes" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/events")}
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