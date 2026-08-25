import { Link } from "react-router-dom";
import { School, Users, BookOpen, Award, Phone, Mail, MapPin, ChevronRight, GraduationCap, Shield, Heart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-200">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Ruhama United School</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/student-login"
              className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
            >
              Student Login
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Nurturing Minds,<br />Building Futures
            </h2>
            <p className="text-indigo-200/70 mt-6 text-lg leading-relaxed">
              Ruhama United School is committed to providing quality education that empowers students to become confident, creative, and responsible global citizens.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to="/login"
                className="px-8 py-3.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 transition shadow-xl"
              >
                Staff Portal
              </Link>
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

      {/* Stats */}
      <section className="py-12 px-6 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Users, label: "Students", value: "500+", color: "text-indigo-600" },
            { icon: GraduationCap, label: "Teachers", value: "30+", color: "text-emerald-600" },
            { icon: BookOpen, label: "Programs", value: "10+", color: "text-amber-600" },
            { icon: Award, label: "Years", value: "10+", color: "text-purple-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center">
              <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} strokeWidth={1.5} />
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-6">
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
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-300">
                <School className="w-12 h-12 text-white" />
              </div>
              <p className="text-2xl font-bold text-indigo-800 mt-6">Ruhama United School</p>
              <p className="text-indigo-600/60 mt-2">Excellence in Education</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20 px-6 bg-gray-50">
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
      <section className="py-20 px-6">
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <School className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Ruhama United School</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Ruhama United School. All rights reserved.</p>
          <Link to="/login" className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
            Staff Portal <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
