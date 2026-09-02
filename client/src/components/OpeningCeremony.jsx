import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import {
  GraduationCap,
  CheckSquare,
  BarChart3,
  Wallet,
  ClipboardList,
  BookOpen,
  Sparkles,
  ArrowRight,
  PartyPopper,
} from "lucide-react";

const FEATURES = [
  { icon: GraduationCap, title: "Student Portal", desc: "Attendance, results & fees at your fingertips" },
  { icon: CheckSquare, title: "Smart Attendance", desc: "Daily mark & track with live reports" },
  { icon: BarChart3, title: "Exam Results", desc: "Grades, report cards & merit sheets" },
  { icon: Wallet, title: "Fee Management", desc: "Payments, receipts & ledgers in seconds" },
  { icon: ClipboardList, title: "Daily Reports", desc: "Class work & homework diary for parents" },
  { icon: BookOpen, title: "Hifz Progress", desc: "Quran memorization tracked beautifully" },
];

const SESSION_KEY = "ruhama_opening_ceremony_seen";

export default function OpeningCeremony({ onFinish, autoPlay = true }) {
  const [phase, setPhase] = useState("countdown");
  const [count, setCount] = useState(5);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [burst, setBurst] = useState(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const timers = [];
    const after = (ms, fn) => timers.push(setTimeout(fn, ms));

    if (autoPlay) {
      // Countdown phase: 5 -> 1, 800ms each
      after(800, () => setCount(4));
      after(1600, () => setCount(3));
      after(2400, () => setCount(2));
      after(3200, () => setCount(1));
      after(4000, () => {
        setBurst(true);
        setPhase("grand");
      });
      // Grand opening duration
      after(6900, () => setPhase("showcase"));
    }

    return () => timers.forEach(clearTimeout);
  }, [autoPlay]);

  // Feature showcase auto-advance
  useEffect(() => {
    if (phase !== "showcase" || !autoPlay) return;
    const t = setTimeout(() => {
      setFeatureIndex((i) => {
        if (i >= FEATURES.length - 1) return i;
        return i + 1;
      });
    }, 1800);
    return () => clearTimeout(t);
  }, [phase, featureIndex, autoPlay]);

  const handleEnter = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch { /* ignore */ }
    if (onFinishRef.current) onFinishRef.current();
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#050014] text-white flex flex-col items-center justify-center select-none">
      {/* Animated nebula background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full bg-purple-700/20 blur-[140px]" />
        {/* twinkles */}
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: i % 5 === 0 ? 3 : 2,
              height: i % 5 === 0 ? 3 : 2,
              opacity: 0.5 + (i % 5) * 0.1,
              animationDuration: `${2 + (i % 4) * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* ===== COUNTDOWN ===== */}
      {phase === "countdown" && (
        <div className="relative z-10 flex flex-col items-center">
          <p className="text-sm sm:text-base uppercase tracking-[0.5em] text-white/50 mb-8 animate-pulse">
            Almost there
          </p>
          <div key={count} className="countdown-pop text-[7rem] sm:text-[10rem] font-black leading-none bg-gradient-to-br from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(129,140,248,0.55)]">
            {count}
          </div>
          <div className="mt-6 h-1.5 w-56 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-fuchsia-400 rounded-full transition-all duration-700 ease-linear"
              style={{ width: `${(6 - count) * 20}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== GRAND OPENING ===== */}
      {phase === "grand" && (
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div className="grand-ring relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-white/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-fuchsia-400 animate-spin" style={{ animationDuration: "1.4s" }} />
            <div className="absolute inset-2 rounded-full border-b-2 border-indigo-400 animate-spin" style={{ animationDuration: "2.2s", animationDirection: "reverse" }} />
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500/80 to-fuchsia-600/80 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.6)]">
              <img src={logo} alt="Ruhama" className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full" />
            </div>
          </div>

          <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-fuchsia-300 mb-2 grand-rise">
            We are delighted to announce
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black grand-rise leading-tight">
            <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(217,70,239,0.5)]">
              Ruhama United School
            </span>
          </h1>
          <p className="mt-3 text-white/70 text-sm sm:text-base grand-rise">
            Grand Opening &nbsp;·&nbsp; A New Beginning
          </p>

          {burst && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
              {Array.from({ length: 18 }).map((_, i) => (
                <PartyPopper
                  key={i}
                  className="absolute text-white/80 confetti"
                  style={{
                    left: `${(i * 61) % 100}%`,
                    top: `${8 + ((i * 29) % 60)}%`,
                    animationDelay: `${(i % 6) * 0.15}s`,
                    color: ["#f472b6", "#a78bfa", "#fbbf24", "#34d399", "#60a5fa"][i % 5],
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== FEATURE SHOWCASE ===== */}
      {phase === "showcase" && (
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <p className="text-xs sm:text-sm uppercase tracking-[0.4em] text-white/40 mb-4">
            What awaits you
          </p>
          <div key={featureIndex} className="feature-slide flex flex-col items-center max-w-md">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_50px_rgba(129,140,248,0.5)] mb-6">
              {(() => {
                const Icon = FEATURES[featureIndex].icon;
                return <Icon className="w-10 h-10 sm:w-12 sm:h-12" />;
              })()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">{FEATURES[featureIndex].title}</h2>
            <p className="mt-2 text-white/60 text-sm sm:text-base">{FEATURES[featureIndex].desc}</p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2 mt-8">
            {FEATURES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === featureIndex ? "w-6 bg-fuchsia-400" : "w-1.5 bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ===== CTA ===== */}
      {phase === "showcase" && featureIndex >= FEATURES.length - 1 && (
        <button
          onClick={handleEnter}
          className="relative z-20 mt-8 inline-flex items-center gap-2 group bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 text-white font-bold text-base px-8 py-3.5 rounded-full shadow-[0_10px_40px_rgba(168,85,247,0.45)] transition-all hover:scale-105 animate-pulse"
        >
          <Sparkles className="w-5 h-5" />
          Enter the Website
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Skip */}
      {phase !== "countdown" && autoPlay && (
        <button
          onClick={handleEnter}
          className="absolute bottom-6 right-6 z-20 text-xs text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest"
        >
          Skip ▸
        </button>
      )}
    </div>
  );
}
