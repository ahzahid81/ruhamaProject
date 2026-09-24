let ctx = null;

// Create/resume a shared AudioContext. Mobile browsers only allow audio to
// start inside a user gesture, so call this from tap handlers (Start Camera,
// manual Mark submit) to "unlock" it before a scan beep is needed.
export const initAudio = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
  } catch {
    // audio unavailable
  }
};

// Short high "pip" played on a successful scan.
export const playBeep = () => {
  try {
    initAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore playback errors
  }
};