import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { bdYear } from "../../utils/bdTime";

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch((err) => setError(err.response?.data?.message || "Event not found"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Ruhama United School" className="w-9 h-9 object-contain flex-shrink-0" />
            <span className="text-lg font-bold text-gray-900 truncate">Ruhama United School</span>
          </Link>
          <Link
            to="/student-login"
            className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition whitespace-nowrap"
          >
            Student Login
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {loading ? (
          <div className="mt-12 text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-4">Loading event...</p>
          </div>
        ) : error || !event ? (
          <div className="mt-12 text-center">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-lg font-semibold text-gray-700 mt-4">{error || "Event not found"}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-6"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <article className="mt-8">
            {event.thumbnail && (
              <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-lg shadow-gray-200/60">
                <img src={event.thumbnail} alt={event.title} className="w-full h-64 sm:h-96 object-cover" />
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mt-8">{event.title}</h1>

            {event.description ? (
              <p className="text-gray-600 leading-relaxed mt-5 whitespace-pre-line">{event.description}</p>
            ) : (
              <p className="text-gray-400 mt-5">No description added for this event.</p>
            )}

            {event.morePhotos?.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-gray-900">Event Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
                  {event.morePhotos.map((photo, i) => (
                    <div key={photo} className="rounded-2xl overflow-hidden border border-gray-100">
                      <img src={photo} alt={`${event.title} photo ${i + 1}`} loading="lazy" className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                Back to Home
              </Link>
            </div>
          </article>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ruhama United School" className="w-8 h-8 object-contain" />
            <span className="text-sm font-semibold text-white">Ruhama United School</span>
          </div>
          <p className="text-xs">&copy; {bdYear()} Ruhama United School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}