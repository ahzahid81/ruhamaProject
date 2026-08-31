import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import {
  Users,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Shield,
  Heart,
  ClipboardList,
  BadgeCheck,
  CalendarCheck,
  Wallet,
  Sprout,
  Star,
} from "lucide-react";

const getVisibleCount = () => {
  if (typeof window === "undefined") return 4;
  const w = window.innerWidth;
  if (w < 640) return 2;
  if (w < 900) return 3;
  if (w < 1280) return 4;
  return 5;
};

export default function LandingPage() {
  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState(null);
  const [events, setEvents] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    api.get("/public/students").then((res) => setStudents(res.data)).catch(() => {});
    api.get("/public/counts").then((res) => setCounts(res.data)).catch(() => {});
    api.get("/events?limit=4").then((res) => setEvents(res.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Ruhama United School" className="w-10 h-10 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">Ruhama United School</h1>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { name: "About", href: "#about" },
              { name: "Students", href: "#students" },
              { name: "Programs", href: "#programs" },
              { name: "Contact", href: "#contact" },
            ].map((l) => (
              <a key={l.name} href={l.href} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                {l.name}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/student-login"
              className="px-3 sm:px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition whitespace-nowrap"
            >
              Student Login
            </Link>
            <Link
              to="/login"
              className="px-4 sm:px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 whitespace-nowrap"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Motto */}
      <section className="pt-24 pb-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
            An English Version School with Tahfizul Quran
          </p>
          <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Change Yourself,<br className="sm:hidden" /> Decorate the World
          </h2>
        </div>
      </section>

      {/* About */}
      <section id="about" className="pt-14 pb-20 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">About Us</h3>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">A Legacy of Academic Excellence</h2>
            <p className="text-gray-600 mt-6 leading-relaxed">
              Ruhama United School blends time-honoured values with modern teaching. Our dedicated faculty and
              well-rounded curriculum help every child discover their strengths — and grow in confidence, character
              and curiosity.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-8">
              {[
                { icon: BookOpen, text: "Modern Curriculum" },
                { icon: Shield, text: "Safe Environment" },
                { icon: Users, text: "Experienced Faculty" },
                { icon: Heart, text: "Holistic Development" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" strokeWidth={1.8} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-12 text-white">
            <p className="text-6xl font-black text-indigo-400 leading-none">&ldquo;</p>
            <p className="text-2xl md:text-3xl font-bold leading-snug mt-2">
              Small classes. Big hearts. Real results.
            </p>
            <p className="text-indigo-200/80 mt-6 text-sm leading-relaxed">
              Today Ruhama United School is home to{" "}
              <span className="font-bold text-white">{counts?.students ?? "—"}</span> young learners, guided by{" "}
              <span className="font-bold text-white">{counts?.teachers ?? "—"}</span> teachers across{" "}
              <span className="font-bold text-white">{counts?.classes ?? "—"}</span> classes — a family that keeps
              growing with every admission season.
            </p>
            <p className="text-indigo-400/70 mt-6 text-sm">&mdash; Ruhama United School</p>
          </div>
        </div>
      </section>

      {/* Students */}
      <section id="students" className="py-20 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Our Students</h3>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">Meet Our Students</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
              The bright faces behind our proudest headline. Every learner invited, every smile remembered.
            </p>
          </div>

          <Gallery students={students} paused={paused} setPaused={setPaused} />

          <div className="text-center mt-10">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              <Users className="w-4 h-4" />
              {showAll ? "Hide Students" : "See All Students"}
            </button>
          </div>

          {showAll && <NamesList students={students} />}
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="py-20 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Programs</h3>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">Academic Programs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Early Childhood", tagline: "Where every day begins with wonder.", desc: "Play Group, Nursery and Kindergarten that make little learners love school.", icon: Sprout, color: "from-pink-500 to-rose-500" },
              { title: "Primary Education", tagline: "Strong roots today. Bright futures tomorrow.", desc: "A complete journey from STD-I to STD-V on a firm academic foundation.", icon: BookOpen, color: "from-indigo-500 to-blue-500" },
              { title: "Hifzul Quran", tagline: "Words memorised. Hearts strengthened for life.", desc: "Dedicated Hifz classes with special coaching for every learner.", icon: Star, color: "from-emerald-500 to-teal-500" },
            ].map(({ title, tagline, desc, icon: Icon, color }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-indigo-600 font-semibold text-sm mt-2">{tagline}</p>
                <p className="text-gray-500 mt-3 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section id="events" className="py-20 px-6 bg-gray-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">What's Happening</h3>
              <h2 className="text-3xl font-bold text-gray-900 mt-3">Events &amp; Activities</h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
                The moments that make our school year memorable — caught on camera, shared with you.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <h3 className="font-bold text-gray-900 leading-snug group-hover:text-indigo-600 transition line-clamp-2">
                      {event.title}
                    </h3>
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
          </div>
        </section>
      )}

      {/* Features */}
      <section id="experience" className="py-20 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">The Ruhama Way</h3>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">School Life, On Paper and On Screen</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
              Attendance, results, fees and homework — all together, all in one place parents can trust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: CalendarCheck, title: "Attendance", tagline: "Every day counts — and every day is recorded.", desc: "Real-time attendance for every student, visible privately to their family." },
              { icon: GraduationCap, title: "Results", tagline: "Fair grades. Honest words.", desc: "Automatic marking from Fair to Outstanding, printed on a card you can be proud of." },
              { icon: Wallet, title: "Fees", tagline: "No surprises at the office.", desc: "Clear fee breakdowns, due reminders and receipts for every payment." },
              { icon: ClipboardList, title: "Homework", tagline: "Homework your family can follow at home.", desc: "Daily tasks shared with parents, so learning continues after the bell rings." },
              { icon: BookOpen, title: "Daily Report", tagline: "Every lesson, captured the same day.", desc: "Class work and homework posted daily by teachers for every class." },
              { icon: BadgeCheck, title: "Admit Card", tagline: "Ready, even on exam morning.", desc: "Fee eligibility checked automatically, so no student is turned away at the gate." },
            ].map(({ icon: Icon, title, tagline, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                <p className="text-indigo-600 font-semibold text-sm mt-2">{tagline}</p>
                <p className="text-gray-500 mt-3 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Contact</h3>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">Get in Touch</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">
              We would love to hear from you — for admission, information, or a visit.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Phone, label: "Phone", value: "+880 1XXXXXXXXX", color: "text-emerald-600 bg-emerald-50" },
              { icon: Mail, label: "Email", value: "info@ruhamaunitedschool.com", color: "text-indigo-600 bg-indigo-50" },
              { icon: MapPin, label: "Address", value: "Ruhama, Sylhet, Bangladesh", color: "text-amber-600 bg-amber-50" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-gray-700 font-medium mt-1">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Ruhama United School" className="w-8 h-8 object-contain" />
            <span className="text-sm font-semibold text-white">Ruhama United School</span>
          </div>
          <div className="flex items-center gap-5 text-xs">
            <a href="#about" className="hover:text-indigo-400 transition">About</a>
            <a href="#students" className="hover:text-indigo-400 transition">Students</a>
            <a href="#programs" className="hover:text-indigo-400 transition">Programs</a>
            <a href="#contact" className="hover:text-indigo-400 transition">Contact</a>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Ruhama United School. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ============ PHOTO GALLERY (sliding carousel) ============

function Gallery({ students, paused, setPaused }) {
  const [visible, setVisible] = useState(getVisibleCount());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onResize = () => setVisible(getVisibleCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const maxIndex = Math.max(0, students.length - visible);
  const effIndex = Math.min(index, maxIndex);

  useEffect(() => {
    if (paused || students.length === 0) return;
    const t = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 3200);
    return () => clearInterval(t);
  }, [paused, maxIndex, students.length]);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-4">Loading student photos...</p>
      </div>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${effIndex * (100 / visible)}%)` }}
        >
          {students.map((s) => (
            <div key={s._id} className="flex-shrink-0 px-3" style={{ width: `${100 / visible}%` }}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                      <span className="text-5xl font-bold text-indigo-400">
                        {s.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 text-center flex-1 flex flex-col justify-center">
                  <p className="font-bold text-gray-900 truncate">{s.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {maxIndex > 0 && (
        <>
          <button
            onClick={() => setIndex((i) => (i <= 0 ? maxIndex : i - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-6 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-indigo-600 hover:text-white transition-all z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIndex((i) => (i >= maxIndex ? 0 : i + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-6 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-indigo-600 hover:text-white transition-all z-10"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}

// ============ ALL STUDENTS (names only) ============

function NamesList({ students }) {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-4">Loading student names...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {students.map((s) => (
        <div key={s._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {s.photo ? (
              <img src={s.photo} alt={s.name} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                <span className="text-4xl font-bold text-indigo-400">{s.name?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
            )}
          </div>
          <p className="px-3 py-2.5 text-sm font-semibold text-gray-800 text-center truncate">{s.name}</p>
        </div>
      ))}
    </div>
  );
}