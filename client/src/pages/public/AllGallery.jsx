import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import { ArrowLeft, ChevronLeft, ChevronRight, Images, Loader2, X } from "lucide-react";

export default function AllGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api
      .get("/gallery")
      .then((res) => setPhotos(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") return setActive(null);
      if (e.key === "ArrowRight") return setActive((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") return setActive((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, photos.length]);

  const photo = active !== null ? photos[active] : null;

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
          <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Moments in Time</h3>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3">School Gallery</h1>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
            Every smile, celebration and proud moment — captured for the Ruhama family.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-4">Loading gallery...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <Images className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-base font-semibold text-gray-700 mt-4">No photos yet</p>
            <p className="text-sm text-gray-400 mt-1">The gallery is being filled — check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p, i) => (
              <button
                key={p._id}
                onClick={() => setActive(i)}
                className="group relative aspect-square rounded-2xl overflow-hidden border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <img
                  src={p.photo}
                  alt={p.altText || "Gallery photo"}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </button>
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

      {photo && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <button
            onClick={() => setActive(null)}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActive((active - 1 + photos.length) % photos.length); }}
            className="absolute left-3 sm:left-6 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <figure className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={photo.photo}
              alt={photo.altText || "Gallery photo"}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {photo.altText && (
              <figcaption className="text-center text-white/80 text-sm mt-4">{photo.altText}</figcaption>
            )}
          </figure>
          <button
            onClick={(e) => { e.stopPropagation(); setActive((active + 1) % photos.length); }}
            className="absolute right-3 sm:right-6 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}