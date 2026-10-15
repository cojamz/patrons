// The game's sounds (Cory, 2026-10-15: "yes 100%, and a little noise for a follower as well … like a little high
// pitched gibberish snippet"). Four, all synthesized here with Web Audio, so there are no recordings to license:
//  - place:    a soft wooden click as a minion lands on a space
//  - coin:     a small clink as a resource lands in a pile
//  - fanfare:  a short brass flourish for a round prize's winner
//  - follower: a tiny voice chirping gibberish as followers join (original formant synthesis; a fresh line each time)
// A sound never waits on anything and nothing waits on it: play() schedules on the audio clock and returns. Muted is
// kept in this browser (☰ menu); ?sound=off in the address mutes that page.
//
// This file has no imports on purpose: scripts/v4-sounds.mjs renders the same voices offline to .wav files.

// ---------- the voices (pure: any BaseAudioContext, a destination, a start time) ----------

/** A small seeded random, so a rendered file is the same every time. */
export function rng(seed = 1) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const noiseBuf = new WeakMap();
function noise(ctx) {
  let b = noiseBuf.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = b.getChannelData(0), r = rng(7);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    noiseBuf.set(ctx, b);
  }
  return b;
}
const env = (ctx, dest, t, peak, attack, decay) => {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(dest);
  return g;
};
const tone = (ctx, type, f, t, dur, out) => {
  const o = ctx.createOscillator();
  o.type = type; o.frequency.setValueAtTime(f, t);
  o.connect(out); o.start(t); o.stop(t + dur + 0.02);
  return o;
};

/** A minion set down on wood: a felted knock and a short tick on top. */
function place(ctx, dest, t, r) {
  const v = 1 + (r() - 0.5) * 0.08;
  const n = ctx.createBufferSource(); n.buffer = noise(ctx);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2100 * v; bp.Q.value = 1.4;
  n.connect(bp); bp.connect(env(ctx, dest, t, 0.55, 0.001, 0.03));
  n.start(t, r() * 0.3); n.stop(t + 0.05);
  const k = tone(ctx, 'sine', 210 * v, t, 0.1, env(ctx, dest, t, 0.7, 0.002, 0.075));
  k.frequency.exponentialRampToValueAtTime(120 * v, t + 0.06);
  tone(ctx, 'triangle', 820 * v, t, 0.06, env(ctx, dest, t, 0.16, 0.001, 0.04));
  return 0.12;
}

/** A small coin landing on a pile: two quick strikes of an inharmonic bell. */
function coin(ctx, dest, t, r) {
  const f = 2350 * (1 + (r() - 0.5) * 0.12);
  const strike = (at, ff, amp) => {
    [[1, 0.26, 0.32], [2.76, 0.12, 0.17], [5.4, 0.05, 0.07]].forEach(([m, a, d]) => tone(ctx, 'sine', ff * m, at, d, env(ctx, dest, at, a * amp, 0.002, d)));
    const n = ctx.createBufferSource(); n.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    n.connect(hp); hp.connect(env(ctx, dest, at, 0.12 * amp, 0.001, 0.008));
    n.start(at, r() * 0.3); n.stop(at + 0.02);
  };
  strike(t, f, 1);
  strike(t + 0.045 + r() * 0.02, f * 1.13, 0.55);
  return 0.4;
}

/** A round prize's winner: a quick rising call and a held chord, warm brass with a glint on top. */
function fanfare(ctx, dest, t) {
  const brass = (f, at, dur, amp) => {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(700, at);
    lp.frequency.exponentialRampToValueAtTime(2800, at + 0.04);
    lp.frequency.exponentialRampToValueAtTime(1500, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(amp, at + 0.018);
    g.gain.setValueAtTime(amp * 0.8, at + Math.max(0.03, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.06);
    lp.connect(g); g.connect(dest);
    for (const det of [-6, 5]) { const o = tone(ctx, 'sawtooth', f, at, dur + 0.08, lp); o.detune.value = det; }
  };
  const step = 0.085;
  [392, 523.25, 659.25].forEach((f, i) => brass(f, t + i * step, step * 0.9, 0.11));
  const hold = t + 3 * step;
  [523.25, 659.25, 783.99, 1046.5].forEach(f => brass(f, hold, 0.42, 0.075));
  [2093, 2637].forEach((f, i) => tone(ctx, 'sine', f, hold + 0.03 + i * 0.05, 0.4, env(ctx, dest, hold + 0.03 + i * 0.05, 0.05, 0.003, 0.35)));
  return hold - t + 0.55;
}

// The follower's voice. A buzzy source at a small creature's pitch goes through three formant filters (the mouth),
// which glide from a consonant to a vowel each syllable; the pitch bobs and the line ends rising or falling. Every call
// makes up a new word from a seeded random, so it never repeats exactly.
const VOWELS = { a: [1050, 1650, 3300], e: [620, 2500, 3500], i: [420, 2900, 3800], o: [700, 1150, 3100], u: [460, 1050, 2900] };
const ONSETS = { b: [300, 900], d: [300, 1900], g: [300, 2300], m: [300, 1100], n: [300, 1700], l: [380, 1400], p: [300, 900], t: [300, 1900], k: [300, 2300], h: null, '': null };
const BURST = { p: 1200, t: 4200, k: 2600 };
/** A made-up word: [onset, vowel] pairs. */
export function gibberish(r) {
  const n = 2 + Math.floor(r() * 3);
  const on = Object.keys(ONSETS), vo = Object.keys(VOWELS);
  const out = [];
  // sometimes a giggle: one syllable said three times, falling
  if (r() < 0.2) { const s = [['h', 't'][Math.floor(r() * 2)], ['e', 'i'][Math.floor(r() * 2)]]; return [s, s, s]; }
  for (let i = 0; i < n; i++) out.push([on[Math.floor(r() * on.length)], vo[Math.floor(r() * vo.length)]]);
  return out;
}
function follower(ctx, dest, t, r) {
  const word = gibberish(r);
  const giggle = word.length === 3 && word[0] === word[1] && word[1] === word[2];
  const f0 = 560 + r() * 160;
  const rise = !giggle && r() < 0.55;
  const src = ctx.createOscillator(); src.type = 'sawtooth';
  const vib = ctx.createOscillator(); vib.frequency.value = 6 + r() * 3;
  const vibAmt = ctx.createGain(); vibAmt.gain.value = f0 * 0.025;
  vib.connect(vibAmt); vibAmt.connect(src.frequency);
  const mouth = ctx.createGain(); mouth.gain.value = 0.0001;
  const filters = [[8, 1], [12, 0.6], [14, 0.25]].map(([q, a]) => {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
    const g = ctx.createGain(); g.gain.value = a * 3.2;
    src.connect(bp); bp.connect(g); g.connect(mouth);
    return bp;
  });
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 260;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
  // an even voice whatever the vowel (an 'i' and an 'a' differ by 10 dB through the same mouth)
  const even = ctx.createDynamicsCompressor();
  even.threshold.value = -30; even.knee.value = 10; even.ratio.value = 6; even.attack.value = 0.003; even.release.value = 0.08;
  const lift = ctx.createGain(); lift.gain.value = 2.2;
  mouth.connect(hp); hp.connect(lp); lp.connect(even); even.connect(lift); lift.connect(dest);

  let at = t;
  word.forEach(([c, v], i) => {
    const last = i === word.length - 1;
    const dur = giggle ? 0.075 : last ? 0.13 + r() * 0.05 : 0.07 + r() * 0.05;
    const gap = giggle ? 0.035 : 0.012 + r() * 0.02;
    // the pitch: a bob per syllable, and the tail of the line rising (a question) or falling (a sigh)
    const p = giggle ? f0 * (1.15 - i * 0.09) : f0 * (1 + (r() - 0.5) * 0.25) * (last ? (rise ? 1.1 : 0.95) : 1);
    src.frequency.setValueAtTime(p, at);
    src.frequency.linearRampToValueAtTime(last ? p * (rise ? 1.35 : 0.78) : p * (1 + (r() - 0.5) * 0.12), at + dur);
    // the mouth: from the consonant's shape to the vowel's
    const target = VOWELS[v], from = ONSETS[c];
    filters.forEach((bp, k) => {
      const end = target[k] * (1 + (r() - 0.5) * 0.06);
      const start = from && k < 2 ? from[k] : end;
      bp.frequency.setValueAtTime(start, at);
      bp.frequency.linearRampToValueAtTime(end, at + Math.min(0.035, dur * 0.4));
    });
    // the loudness: a nasal or voiced onset swells in; an unvoiced one starts after its puff of air
    const soft = c === 'm' || c === 'n' || c === 'l' || c === 'h';
    const open = at + (BURST[c] ? 0.012 : 0);
    mouth.gain.setValueAtTime(0.0001, at);
    mouth.gain.exponentialRampToValueAtTime(0.5, open + (soft ? 0.025 : 0.008));
    mouth.gain.setValueAtTime(0.45, at + dur * 0.7);
    mouth.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    if (BURST[c] || c === 'h') {
      const n = ctx.createBufferSource(); n.buffer = noise(ctx);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = BURST[c] || 3000; bp.Q.value = 1.5;
      n.connect(bp); bp.connect(env(ctx, dest, at, c === 'h' ? 0.05 : 0.09, 0.002, c === 'h' ? 0.03 : 0.012));
      n.start(at, r() * 0.3); n.stop(at + 0.05);
    }
    at += dur + gap;
  });
  src.start(t); vib.start(t);
  src.stop(at + 0.05); vib.stop(at + 0.05);
  return at - t;
}

export const VOICES = { place, coin, fanfare, follower };
// each voice's loudness against the others (set by ear and by peak, scripts/v4-sounds.mjs)
export const LEVEL = { place: 0.55, coin: 0.7, fanfare: 0.75, follower: 0.42 };

/** Render a voice into ctx at time t (offline rendering uses this too). Returns its length in seconds. */
export function voice(ctx, dest, name, t, seed = Math.floor(Math.random() * 1e9)) {
  const fn = VOICES[name];
  if (!fn) return 0;
  const g = ctx.createGain(); g.gain.value = LEVEL[name] ?? 0.5; g.connect(dest);
  return fn(ctx, g, t, rng(seed));
}

// ---------- the player (the browser only) ----------

const KEY = 'patrons.v4.sound';
const urlOff = () => { try { return new URLSearchParams(globalThis.location?.search || '').get('sound') === 'off'; } catch { return false; } };
let on = (() => { if (urlOff()) return false; try { return globalThis.localStorage?.getItem(KEY) !== 'off'; } catch { return true; } })();
const subs = new Set();
export const soundOn = () => on;
export const onSound = fn => { subs.add(fn); return () => subs.delete(fn); };
export function setSound(v) {
  v = !!v;
  if (v === on) return;
  on = v;
  try { globalThis.localStorage?.setItem(KEY, v ? 'on' : 'off'); } catch { /* private window */ }
  if (v) unlock();
  for (const fn of subs) fn(v);
}

let ctx = null, master = null;
function unlock() {
  try {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC({ latencyHint: 'interactive' });
      master = ctx.createGain(); master.gain.value = 0.6;
      // a gentle limiter, so a pile of coins never clips
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 8; lim.attack.value = 0.002; lim.release.value = 0.12;
      master.connect(lim); lim.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}
// a browser lets a page make sound only after the player's first press or key
if (typeof addEventListener === 'function') {
  const first = () => { if (on) unlock(); };
  addEventListener('pointerdown', first, { capture: true, passive: true });
  addEventListener('keydown', first, { capture: true, passive: true });
}

// how close the same sound may repeat, and how many may ring at once (a dozen coins is a handful, not a din)
const GAP = { place: 0.04, coin: 0.045, fanfare: 0.5, follower: 0.32 };
const last = {};
let ringing = 0;
/** Play a sound now (or `delay` seconds from now). Never throws, never waits. */
export function play(name, { delay = 0 } = {}) {
  if (!on || !VOICES[name]) return;
  // what the game asked for, for the gates (e2e/v4/sound.mjs)
  try { const c = (globalThis.__patronsSounds ||= {}); c[name] = (c[name] || 0) + 1; } catch { /* no global */ }
  if (!ctx || ctx.state !== 'running') return;
  try {
    const now = ctx.currentTime + 0.005 + delay;
    if (last[name] != null && now - last[name] < (GAP[name] ?? 0)) return;
    if (ringing >= 6) return;
    last[name] = now;
    const len = voice(ctx, master, name, now);
    ringing++;
    setTimeout(() => { ringing = Math.max(0, ringing - 1); }, (delay + len) * 1000 + 50);
  } catch { /* a sound is never worth an error */ }
}
