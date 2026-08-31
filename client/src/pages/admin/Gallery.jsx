import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { Plus, Pencil, Trash2, Images, Loader2 } from "lucide-react";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const loadPhotos = () =>
    api
      .get("/gallery")
      .then((res) => setPhotos(res.data))
      .catch((error) =>
        setToast({ message: error.response?.data?.message || "Failed to load photos", type: "error" })
      )
      .finally(() => setLoading(false));

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleDelete = (photo) => {
    if (!window.confirm(photo.altText ? `Delete "${photo.altText}"?` : "Delete this photo?")) return;
    api
      .delete(`/gallery/${photo._id}`)
      .then(() => {
        setToast({ message: "Photo deleted", type: "success" });
        loadPhotos();
      })
      .catch((error) =>
        setToast({ message: error.response?.data?.message || "Delete failed", type: "error" })
      );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">Photos shown on the public website sliding gallery.</p>
        </div>
        <button
          onClick={() => navigate("/admin/gallery/new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> Add Photo
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-4">Loading gallery...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Images className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-base font-semibold text-gray-700 mt-4">No photos yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first photo to show it on the landing page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div key={photo._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <div className="aspect-square bg-gray-100 overflow-hidden">
                <img src={photo.photo} alt={photo.altText || "Gallery photo"} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm font-medium text-gray-700 line-clamp-1 flex-1">
                  {photo.altText || <span className="text-gray-400">No description</span>}
                </p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/admin/gallery/${photo._id}/edit`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(photo)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}