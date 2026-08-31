import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Toast from "../../components/Toast";
import { Plus, Pencil, Trash2, Eye, CalendarDays, Loader2 } from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const loadEvents = () =>
    api
      .get("/events")
      .then((res) => setEvents(res.data))
      .catch((error) =>
        setToast({ message: error.response?.data?.message || "Failed to load events", type: "error" })
      )
      .finally(() => setLoading(false));

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete event "${event.title}"?`)) return;
    try {
      await api.delete(`/events/${event._id}`);
      setToast({ message: "Event deleted", type: "success" });
      loadEvents();
    } catch (error) {
      setToast({ message: error.response?.data?.message || "Delete failed", type: "error" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">Featured on the public website — title, thumbnail and optional photos.</p>
        </div>
        <button
          onClick={() => navigate("/admin/events/new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-4">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <CalendarDays className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-base font-semibold text-gray-700 mt-4">No events yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first event to show it on the landing page.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {event.thumbnail ? (
                  <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <CalendarDays className="w-10 h-10 text-indigo-300" />
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 leading-snug">{event.title}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-1">
                  {event.description || "No description added yet."}
                </p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={`/events/${event._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                  <button
                    onClick={() => navigate(`/admin/events/${event._id}/edit`)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event)}
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