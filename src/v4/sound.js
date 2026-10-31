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

/** A coin landing on a pile: one strike of a small inharmonic bell per coin (Cory: "the sounds should line up with
 *  the number of coins"). Four or more land as one bundle, so they sound as one handful: a quick shower of strikes. */
function coin(ctx, dest, t, r, n = 1) {
  const f = 2350 * (1 + (r() - 0.5) * 0.12);
  const strike = (at, ff, amp) => {
    [[1, 0.26, 0.32], [2.76, 0.12, 0.17], [5.4, 0.05, 0.07]].forEach(([m, a, d]) => tone(ctx, 'sine', ff * m, at, d, env(ctx, dest, at, a * amp, 0.002, d)));
    const n = ctx.createBufferSource(); n.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
    n.connect(hp); hp.connect(env(ctx, dest, at, 0.12 * amp, 0.001, 0.008));
    n.start(at, r() * 0.3); n.stop(at + 0.02);
  };
  if (n < 4) { strike(t, f, 1); return 0.35; }
  // the handful: up to nine strikes inside 140ms, each its own coin's pitch, the first loudest, then a soft shimmer
  const k = Math.min(9, 3 + Math.round(n / 2));
  for (let i = 0; i < k; i++) strike(t + (i ? 0.01 + r() * 0.13 : 0), f * (0.88 + r() * 0.3), (i ? 0.45 + r() * 0.25 : 1) / Math.sqrt(k / 3));
  const sh = ctx.createBufferSource(); sh.buffer = noise(ctx);
  const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 7000; hp.Q.value = 0.8;
  sh.connect(hp); hp.connect(env(ctx, dest, t, 0.05, 0.03, 0.18));
  sh.start(t, r() * 0.2); sh.stop(t + 0.25);
  return 0.5;
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
export function gibberish(r, most = 4) {
  const n = 2 + Math.floor(r() * (most - 1));
  const on = Object.keys(ONSETS), vo = Object.keys(VOWELS);
  const out = [];
  // sometimes a giggle: one syllable said three times, falling
  if (most > 2 && r() < 0.2) { const s = [['h', 't'][Math.floor(r() * 2)], ['e', 'i'][Math.floor(r() * 2)]]; return [s, s, s]; }
  for (let i = 0; i < n; i++) out.push([on[Math.floor(r() * on.length)], vo[Math.floor(r() * vo.length)]]);
  return out;
}
function follower(ctx, dest, t, r, o = {}) {
  const word = o.word || gibberish(r, o.most || 4);
  const giggle = word.length === 3 && word[0] === word[1] && word[1] === word[2];
  const f0 = (560 + r() * 160) * (o.pitch || 1);
  const rise = o.rise != null ? o.rise : !giggle && r() < 0.55;
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
    const dur = o.quick ? 0.16 + r() * 0.04 : giggle ? 0.075 : last ? 0.13 + r() * 0.05 : 0.07 + r() * 0.05;
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

// Many followers at once (Cory, 2026-10-15: "the collective sound should be good, not just the same clip played all
// at once x3"): a little crowd, not a stack. Each voice is its own creature (its own pitch, word, and place left to
// right), they come in staggered and overlap like a cheer, and they all end rising together; the bigger the haul, the
// more voices (up to five) and the brighter the finish, while the whole stays about as loud as one.
const PITCHES = [1, 1.26, 0.86, 1.12, 1.4];
/** Voice i of a few: its own pitch, word and place left to right. */
function crowdVoice(ctx, dest, t, r, i, o = {}) {
  const g = ctx.createGain(); g.gain.value = o.gain ?? 1;
  let out = g;
  if (i && ctx.createStereoPanner) { const pan = ctx.createStereoPanner(); pan.pan.value = (i % 2 ? -1 : 1) * Math.min(0.8, 0.25 * Math.ceil(i / 2) + 0.15); g.connect(pan); out = pan; }
  out.connect(dest);
  return follower(ctx, g, t, r, i ? { pitch: PITCHES[i % PITCHES.length] * (1 + (r() - 0.5) * 0.06), ...o } : o);
}
/** Four or more followers at once (Cory: "they should just be all together in a quick sound"): one quick cheer, a
 *  handful of voices crying out together on one rising "yay", with two bright chimes. The bigger the haul, the more
 *  voices (four to six) and the higher it lifts. */
function cheer(ctx, dest, t, r, n) {
  const k = Math.min(6, 4 + Math.floor((n - 4) / 4));
  const lift = 1 + Math.min(0.12, (n - 4) * 0.01);
  let len = 0;
  for (let i = 0; i < k; i++) {
    const g = ctx.createGain(); g.gain.value = 0.9 / Math.sqrt(k);
    let out = g;
    if (ctx.createStereoPanner) { const pan = ctx.createStereoPanner(); pan.pan.value = (i / (k - 1) - 0.5) * 1.4; g.connect(pan); out = pan; }
    out.connect(dest);
    len = Math.max(len, follower(ctx, g, t + r() * 0.03, r, { pitch: PITCHES[i % PITCHES.length] * lift * (1 + (r() - 0.5) * 0.08), word: [[r() < 0.5 ? '' : 'h', r() < 0.6 ? 'e' : 'a']], rise: true, quick: true }));
  }
  [1568, 2093].forEach((f, j) => tone(ctx, 'sine', f * lift, t + 0.05 + j * 0.05, 0.25, env(ctx, dest, t + 0.05 + j * 0.05, 0.03, 0.004, 0.22)));
  return Math.max(len, 0.35);
}
/** n followers: one voice each up to three, staggered as their pieces land; four or more, one quick cheer. */
function crowd(ctx, dest, t, r, n = 1) {
  if (n >= 4) return cheer(ctx, dest, t, r, n);
  let len = 0;
  for (let i = 0; i < n; i++) len = Math.max(len, i * 0.06 + crowdVoice(ctx, dest, t + i * 0.06, r, i, { most: 3, gain: i ? 0.65 : 1 }));
  return len;
}

// A shared quiet two-syllable greeting for a member landing; independent of its changing name/art.
function member(ctx, dest, t, r) {
  return follower(ctx, dest, t, r, { word: [['h', 'u'], ['m', 'a']], pitch: 0.82, rise: false });
}
export const VOICES = { place, coin, fanfare, follower: crowd, member };
// each voice's loudness against the others (set by ear and by peak, scripts/v4-sounds.mjs)
export const LEVEL = { place: 0.55, coin: 0.7, fanfare: 0.75, follower: 0.32, member: 0.2 };

/** Render a voice into ctx at time t (offline rendering uses this too). Returns its length in seconds. */
export function voice(ctx, dest, name, t, seed = Math.floor(Math.random() * 1e9), n = 1) {
  const fn = VOICES[name];
  if (!fn) return 0;
  const g = ctx.createGain(); g.gain.value = LEVEL[name] ?? 0.5; g.connect(dest);
  return fn(ctx, g, t, rng(seed), n);
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

// how loud, 0 to 1, kept in this browser (Cory, 2026-10-27, from Mike's playtest: "turning down audio noises with a
// slider"); off stays its own switch
const VOL_KEY = 'patrons.v4.volume';
let vol = (() => { try { const v = Number(globalThis.localStorage?.getItem(VOL_KEY)); return Number.isFinite(v) && globalThis.localStorage?.getItem(VOL_KEY) != null ? Math.min(1, Math.max(0, v)) : 1; } catch { return 1; } })();
const volSubs = new Set();
export const soundVolume = () => vol;
export const onVolume = fn => { volSubs.add(fn); return () => volSubs.delete(fn); };
export function setVolume(v) {
  v = Math.min(1, Math.max(0, Number(v) || 0));
  if (v === vol) return;
  vol = v;
  try { globalThis.localStorage?.setItem(VOL_KEY, String(v)); } catch { /* private window */ }
  if (master) master.gain.value = MASTER * vol;
  for (const fn of volSubs) fn(v);
}
const MASTER = 0.6;

let ctx = null, master = null;
function unlock() {
  try {
    if (!ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      ctx = new AC({ latencyHint: 'interactive' });
      master = ctx.createGain(); master.gain.value = MASTER * vol;
      // a gentle limiter, so a pile of coins never clips
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -10; lim.knee.value = 6; lim.ratio.value = 8; lim.attack.value = 0.002; lim.release.value = 0.12;
      master.connect(lim); lim.connect(ctx.destination);
      noise(ctx); // made now, at the first press, so no later sound pays for it
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
const GAP = { place: 0.04, coin: 0.04, fanfare: 0.5, follower: 0.1, member: 0.12 };
const last = {};
let ringing = 0;
// Followers line up with their number (Cory, 2026-10-15). One to three fly as single pieces 60ms apart, and each one
// that lands is its own voice: the next voice of the same little group (another pitch, word and place), never the same
// clip again. Four or more fly as one bundle and sound as one quick cheer.
let group = null; // { at (audio time), voices, r }
/** Play a sound now (or `delay` seconds from now). `n`: how many coins or followers landed together. Never throws. */
export function play(name, { delay = 0, n = 1 } = {}) {
  if (name !== 'follower' || n >= 4) { sound(name, delay, n); return; }
  if (!on) return;
  try { const c = (globalThis.__patronsSounds ||= {}); c[name] = (c[name] || 0) + 1; } catch { /* no global */ }
  if (!ctx || ctx.state !== 'running') return;
  try {
    const now = ctx.currentTime + 0.005 + delay;
    if (!group || now - group.at > 0.3) group = { at: now, voices: 0, r: rng(Math.floor(Math.random() * 1e9)) };
    group.at = now;
    const g = ctx.createGain(); g.gain.value = LEVEL.follower; g.connect(master);
    for (let j = 0; j < n; j++, group.voices++) crowdVoice(ctx, g, now + j * 0.06, group.r, group.voices % 5, { most: 3, gain: group.voices ? 0.65 : 1 });
  } catch { /* a sound is never worth an error */ }
}
function sound(name, delay, n) {
  if (!on || !VOICES[name]) return;
  // what the game asked for, for the gates (e2e/v4/sound.mjs)
  try { const c = (globalThis.__patronsSounds ||= {}); c[name] = (c[name] || 0) + 1; } catch { /* no global */ }
  if (!ctx || ctx.state !== 'running') return;
  try {
    const now = ctx.currentTime + 0.005 + delay;
    if (last[name] != null && now - last[name] < (GAP[name] ?? 0)) return;
    if (ringing >= 6) return;
    last[name] = now;
    const len = voice(ctx, master, name, now, undefined, n);
    ringing++;
    setTimeout(() => { ringing = Math.max(0, ringing - 1); }, (delay + len) * 1000 + 50);
  } catch { /* a sound is never worth an error */ }
}
