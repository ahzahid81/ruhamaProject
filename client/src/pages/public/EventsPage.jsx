import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import { ArrowLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/events")
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
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

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 flex-1">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center my-10">
          <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">What's Happening</h3>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3">All Events</h1>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
            Every celebration, competition and milestone — all in one place.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-4">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <CalendarDays className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-base font-semibold text-gray-700 mt-4">No events yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon — new events are on the way.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event._id}
                to={`/events/${event._id}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {event.thumbnail ? (
                    <img
                      src={event.thumbnail}
                      alt={event.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                      <span className="text-5xl font-bold text-indigo-300">{event.title?.charAt(0)?.toUpperCase() || "?"}</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h2 className="font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition line-clamp-2">
                    {event.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
                    {event.description || "Click to read more about this event."}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 mt-1">
                    See More
                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ruhama United School" className="w-8 h-8 object-contain" />
            <span className="text-sm font-semibold text-white">Ruhama United School</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Ruhama United School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}