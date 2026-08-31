import { useEffect, useMemo, useState } from "react";
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
  Image as ImageIcon,
  Users2,
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
  const [view, setView] = useState("gallery");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    api.get("/public/students").then((res) => setStudents(res.data)).catch(() => {});
    api.get("/public/counts").then((res) => setCounts(res.data)).catch(() => {});
  }, []);

  const stats = useMemo(
    () => [
      { icon: Users, label: "Students", value: counts?.students ?? "—" },
      { icon: GraduationCap, label: "Teachers", value: counts?.teachers ?? "—" },
      { icon: BookOpen, label: "Classes", value: counts?.classes ?? "—" },
      { icon: Users2, label: "Sections", value: counts?.sections ?? "—" },
    ],
    [counts]
  );

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

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold tracking-wide">
              <Shield className="w-4 h-4" /> Admissions Open 2026
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mt-5">
              Nurturing Minds,<br />Building Futures
            </h2>
            <p className="text-indigo-200/70 mt-6 text-lg leading-relaxed">
              Ruhama United School is committed to providing quality education that empowers students to become confident, creative, and responsible global citizens.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="#students"
                className="px-8 py-3.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition shadow-xl"
              >
                Our Students
              </a>
              <Link
                to="/student-login"
                className="px-8 py-3.5 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-bold hover:bg-white/20 transition"
              >
                Student Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stats */}
      <section className="py-12 px-6 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <Icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">About Us</h3>
            <h2 className="text-3xl font-bold text-gray-900 mt-3">A Legacy of Academic Excellence</h2>
            <p className="text-gray-600 mt-6 leading-relaxed">
              Ruhama United School has been at the forefront of quality education, combining traditional values with modern teaching methodologies. Our dedicated faculty and comprehensive curriculum ensure every student reaches their full potential.
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
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-12 flex items-center justify-center">
            <div className="text-center">
              <img src={logo} alt="Ruhama United School" className="w-24 h-24 object-contain mx-auto" />
              <p className="text-2xl font-bold text-indigo-800 mt-6">Ruhama United School</p>
              <p className="text-indigo-600/60 mt-2">Excellence in Education</p>
              <p className="text-4xl font-black text-indigo-700 mt-6">{counts?.students ?? "—"}</p>
              <p className="text-sm font-semibold text-indigo-500 mt-1">Students and counting</p>
            </div>
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
              A look at the bright faces who make Ruhama United School what it is today.
            </p>
            <div className="inline-flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-200 mt-6">
              <button
                onClick={() => setView("gallery")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === "gallery" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Photo Gallery
              </button>
              <button
                onClick={() => setView("names")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === "names" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4" /> All Names
                {students.length > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/20">{students.length}</span>
                )}
              </button>
            </div>
          </div>

          {view === "gallery" ? (
            <Gallery students={students} paused={paused} setPaused={setPaused} />
          ) : (
            <NamesList students={students} />
          )}
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
              { title: "Early Childhood", desc: "Play Group, Nursery, and Kindergarten programs designed for holistic early development.", color: "from-pink-500 to-rose-500" },
              { title: "Primary Education", desc: "Comprehensive curriculum from STD-I to STD-V building strong academic foundations.", color: "from-indigo-500 to-blue-500" },
              { title: "Special Programs", desc: "Hifzul Quran program and special coaching for students seeking additional guidance.", color: "from-emerald-500 to-teal-500" },
            ].map(({ title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5`}>
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
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
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur text-white text-[11px] font-semibold">
                    {s.className}
                  </span>
                </div>
                <div className="p-4 text-center flex-1 flex flex-col justify-center">
                  <p className="font-bold text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.studentId}</p>
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
          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === effIndex ? "w-7 bg-indigo-600" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ ALL STUDENTS (names only) ============

function NamesList({ students }) {
  const groups = useMemo(() => {
    const out = [];
    students.forEach((s) => {
      const last = out[out.length - 1];
      if (last && last.className === s.className) {
        last.students.push(s);
      } else {
        out.push({ className: s.className, students: [s] });
      }
    });
    return out;
  }, [students]);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-4">Loading student names...</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((g) => (
        <div key={g.className} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
            <h3 className="font-bold text-white">{g.className}</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/20 text-white">{g.students.length}</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {g.students.map((s) => (
              <div key={s._id} className="px-6 py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  {s.photo ? (
                    <img src={s.photo} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xs flex-shrink-0">
                      {s.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-700 truncate">{s.name}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono flex-shrink-0">{s.studentId}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}