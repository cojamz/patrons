// The intro (Cory's script, 2026-10-14): four beats, ~24 seconds, one camera over one pixel world on the walnut table
// (design/prototypes/intro2/storyboard.md): you are a cult leader → you and your minions tap mysterious powers →
// take actions, gain resources, recruit members, grow powerful → after three rounds the biggest cult wins.
// The beats live in ./intro/Beat1–4.jsx on the kit in ./intro/shared.jsx; this file is the shell around them.
//
// Per player and local only: it shows on this browser's first game start (a localStorage flag), never on a resume,
// never pauses the table or touches the engine or session (bots and other seats carry on underneath). Skip is
// always on screen; after the first beat Esc or a tap anywhere also closes it. prefers-reduced-motion gets a still
// storyboard with Back/Next instead. replayIntro() opens it again from a menu. ?intro=0 never shows it on a game
// start (the e2e suites), ?intro=1 shows it on every one (review).
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './intro.css';
import { emojiIds } from './art/emojis.js';
import { Cast, Clock, Camera, Lamp, BEAT_MS, BEGIN_AT, STAGE, nowT0, clockIn, toStage } from './intro/shared.jsx';
import Beat1, * as B1 from './intro/Beat1.jsx';
import Beat2, * as B2 from './intro/Beat2.jsx';
import Beat3, * as B3 from './intro/Beat3.jsx';
import Beat4, * as B4 from './intro/Beat4.jsx';

// ---------- when it shows ----------
const SEEN = 'patrons.v4.introSeen';
const EVENT = 'patrons:intro';
let seenThisPage = false; // storage can be blocked: then it still shows at most once per page load
const urlIntro = () => { try { return new URLSearchParams(location.search).get('intro'); } catch { return null; } };
/** Has this browser seen the intro? */
export function introSeen() {
  if (seenThisPage) return true;
  try { return localStorage.getItem(SEEN) === '1'; } catch { return false; }
}
function markSeen() {
  seenThisPage = true;
  try { localStorage.setItem(SEEN, '1'); } catch { /* private mode: the page-load flag above covers it */ }
}
/** A new game started on this device: the intro shows if this browser hasn't seen it. */
export function introOnGameStart() { dispatchEvent(new CustomEvent(EVENT, { detail: { replay: false } })); }
/** "Replay intro" (a menu item): show it again now, seen or not. */
export function replayIntro() { dispatchEvent(new CustomEvent(EVENT, { detail: { replay: true } })); }

/** Mounted once at the app root; opens the intro on introOnGameStart() / replayIntro(). */
export function IntroGate() {
  const [open, setOpen] = useState(0); // a counter: every opening starts fresh
  useEffect(() => {
    const on = e => {
      const replay = !!(e.detail && e.detail.replay);
      const q = urlIntro();
      if (!replay && (q === '0' || (q !== '1' && introSeen()))) return;
      markSeen();
      setOpen(k => k + 1);
    };
    addEventListener(EVENT, on);
    return () => removeEventListener(EVENT, on);
  }, []);
  const close = useCallback(() => setOpen(0), []);
  return open ? <Intro key={open} onClose={close} /> : null;
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- the cast: your cult wears pizza (Cory: cheerful, and it reads on the 8×8 medallion); rivals cheerful too ----------
function cast() {
  const emo = emojiIds();
  const you = ['pizza', 'cactus'].find(id => emo.includes(id)) || emo[0] || null;
  const rest = ['frog', 'robot', 'unicorn', 'bee', 'crab', 'santa'].filter(id => emo.includes(id) && id !== you);
  const more = emo.filter(id => id !== you && !rest.includes(id));
  const [a, b, c] = [...rest, ...more];
  return { you, a: a || null, b: b || null, c: c || null };
}

// ---------- the four beats: Cory's words, one line each, in word groups (the caption dissolves group by group) ----------
// *…* is emphasis. Joined with spaces, the groups are the line exactly as Cory said it.
const BEATS = [
  { Beat: Beat1, mod: B1, line: ['You are', 'a *cult leader*.'] },
  { Beat: Beat2, mod: B2, line: ['You and your *minions*', 'have learned to tap into', '*mysterious powers*', 'to gain influence', 'and followers.'] },
  { Beat: Beat3, mod: B3, line: ['Take *actions*', 'granted by the mysterious powers', 'to add to your resources,', 'recruit new *members*,', 'and become more powerful.'] },
  { Beat: Beat4, mod: B4, line: ['After three rounds,', 'the cult with the most *followers*', '(including members!)', 'wins!'] },
];
const LAST = BEATS.length - 1;
const durationOf = b => BEATS[b].mod.DURATION ?? BEAT_MS[b] ?? BEGIN_AT;
/** Where each beat starts on the one timeline, and when Begin shows (the end). */
const STARTS = BEATS.map((_, b) => BEATS.slice(0, b).reduce((t, _x, k) => t + durationOf(k), 0));
const END = STARTS[LAST] + durationOf(LAST);
const groupText = g => g.replace(/\*/g, '');
const lineText = b => BEATS[b].line.map(groupText).join(' ');
const rich = g => g.split(/(\*[^*]+\*)/).map((part, i) => (part.startsWith('*') ? <em key={i}>{part.slice(1, -1)}</em> : part));

const CAM_EASE = 'cubic-bezier(.45,.05,.25,1)';
/** Keyframes for one value that eases between holds: steps [{ t, v, d }] → offsets over `total` ms. */
function holds(steps, total, fmt) {
  const k = [];
  steps.forEach((st, i) => {
    if (i === 0) { k.push({ offset: 0, ...fmt(st.v), easing: 'linear' }); return; }
    const prev = steps[i - 1].v;
    k.push({ offset: st.t / total, ...fmt(prev), easing: CAM_EASE });
    k.push({ offset: Math.min(1, (st.t + (st.d ?? 1100)) / total), ...fmt(st.v), easing: 'linear' });
  });
  k.push({ offset: 1, ...fmt(steps[steps.length - 1].v) });
  return k.sort((a, b) => a.offset - b.offset);
}
/** Runs keyframes on an element on the intro's clock (t0, or frozen at `at`); rebuilt when deps change. */
function useClocked(ref, build, deps, { t0, at, on }) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!on || !el || typeof el.animate !== 'function') return undefined;
    const [frames, opts] = build();
    let last = 0; // offsets must never go back (a short beat can squeeze a caption's fade)
    for (const f of frames) { f.offset = Math.min(1, Math.max(last, f.offset)); last = f.offset; }
    const a = clockIn(el.animate(frames, { fill: 'both', ...opts }), t0, at);
    return () => a.cancel();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/** One beat's world on the intro's clock. In the one-shot world (window), it shows only during its own beat. */
function Scene({ b, still, at = null, t0 = null, base = 0, window: win = null }) {
  const ref = useRef(null);
  const clock = useMemo(() => ({ still, t0, at, run: true, base }), [still, t0, at, base]);
  useClocked(ref, () => {
    const [from, to] = win;
    const k = [{ offset: 0, visibility: from > 0 ? 'hidden' : 'visible', easing: 'step-end' }];
    if (from > 0) k.push({ offset: from / END, visibility: 'visible', easing: 'step-end' });
    if (to != null) k.push({ offset: to / END, visibility: 'hidden', easing: 'step-end' });
    k.push({ offset: 1, visibility: to != null ? 'hidden' : 'visible' });
    return [k, { duration: END }];
  }, [t0, at], { t0, at, on: !!win && !still });
  const { Beat } = BEATS[b];
  // until its clock runs (and where there is none), a later beat waits out of sight
  const wait = win && win[0] > 0 && typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  return (
    <Clock.Provider value={clock}>
      <div ref={ref} className="intro-scene" aria-hidden="true" data-scene={b + 1} style={wait ? { visibility: 'hidden' } : undefined}><Beat /></div>
    </Clock.Provider>
  );
}

/**
 * The intro itself. onClose runs once it's gone. still: a storyboard (defaults to prefers-reduced-motion).
 * Motion is ONE continuous shot: all four beats live in one world on one clock; the camera glides between framings,
 * each beat's things show during its own beat (the next picks up exactly where it left off), and only the caption
 * changes, dissolving group by group. The lab (?lab=intro): only = N plays beat N alone on a loop; at = MS freezes the
 * timeline (the whole intro's, or beat N's) at MS — the recorder steps every animation from there.
 */
export default function Intro({ onClose, still: stillProp, only = null, at = null }) {
  const [still] = useState(() => (stillProp ?? reducedMotion()));
  const [c] = useState(cast);
  const one = !still && !only; // the one-shot world
  const [beat, setBeat] = useState(only ? only - 1 : 0);
  const [t0, setT0] = useState(nowT0); // the timeline's 0 on the document clock
  const [loop, setLoop] = useState(0); // the lab replays its one beat
  const [closing, setClosing] = useState(false);
  const [uk, setUk] = useState(null); // CSS px per stage unit
  const root = useRef(null);
  const stage = useRef(null);
  const cam = useRef(null);
  const lamp = useRef(null);
  const origin = useRef(typeof performance !== 'undefined' ? performance.now() : 0); // wall time at the timeline's 0
  const state = useRef({});
  state.current = { beat, closing };

  const close = useCallback(() => {
    if (state.current.closing) return;
    setClosing(true);
    if (still) onClose(); else state.current.timer = setTimeout(onClose, 220);
  }, [still, onClose]);
  // a step (arrows, the storyboard's buttons): the storyboard shows that beat; the shot seeks the timeline to it
  const go = useCallback(n => {
    const b = state.current.beat;
    if (n < 0 || n > LAST || n === b || state.current.closing) return;
    setBeat(n);
    if (!one) return;
    const now = nowT0();
    origin.current = performance.now() - STARTS[n];
    if (now != null) setT0(now - STARTS[n]);
  }, [one]);

  // the beat (for the caption's live region, Esc, the dots): follows the timeline; the lab loops its one beat
  useEffect(() => {
    if (still || closing || at != null) return undefined;
    if (only) {
      const id = setTimeout(() => { setT0(nowT0()); origin.current = performance.now(); setLoop(k => k + 1); }, (durationOf(only - 1) || 7000) + 1500);
      return () => clearTimeout(id);
    }
    const ids = [];
    for (let b = beat + 1; b <= LAST; b++) {
      const wait = STARTS[b] - (performance.now() - origin.current);
      ids.push(setTimeout(() => setBeat(b), Math.max(0, wait)));
    }
    return () => ids.forEach(clearTimeout);
  }, [beat, still, closing, only, at, loop, t0]);
  useEffect(() => () => clearTimeout(state.current.timer), []);
  // whole CSS px per stage unit, measured (the camera scales the world by it)
  useLayoutEffect(() => {
    const measure = () => { const el = stage.current; if (el && el.offsetWidth) setUk(el.offsetWidth / STAGE.w); };
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, []);

  // the camera and the lamp, on the clock: every beat's shots on one timeline (or beat N's alone, in the lab)
  const shotList = useMemo(() => {
    const list = (only ? [only - 1] : BEATS.map((_, b) => b)).flatMap(b => (BEATS[b].mod.shots || []).map(s => ({ ...s, t: s.t + (only ? 0 : STARTS[b]) })));
    return list.length ? list : [{ t: 0, cam: [0, 0, 1] }];
  }, [only]);
  const span = only ? (durationOf(only - 1) || 7000) + 1500 : END;
  const motion = !still && uk != null;
  useClocked(cam, () => [holds(shotList.map(s => ({ t: s.t, d: s.d, v: s.cam })), span, ([cx, cy, z]) => ({ transform: `scale(${uk * z}) translate(${-cx}px, ${-cy}px)` })), { duration: span }],
    [uk, t0, at, loop, shotList], { t0, at, on: motion });
  useClocked(lamp, () => [holds(shotList.map(s => ({ t: s.t, d: s.d, v: s })), span, s => {
    const [wx, wy, w = 230, h = 170] = s.lamp || [0, 0];
    const [lx, ly] = toStage(s.cam, [wx, wy]);
    return { left: `${lx * uk}px`, top: `${ly * uk}px`, width: `${w * uk}px`, height: `${h * uk}px` };
  }), { duration: span }], [uk, t0, at, loop, shotList], { t0, at, on: motion });

  // keys: Esc closes after the first beat, arrows step, Tab stays inside; nothing reaches the table underneath
  useEffect(() => {
    const back = document.activeElement;
    const first = root.current && root.current.querySelector(still ? '[data-intro-next]' : '[data-intro-skip]');
    if (first) first.focus({ preventScroll: true });
    const onKey = e => {
      const el = root.current;
      if (!el) return;
      const inside = el.contains(e.target);
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (state.current.beat >= 1 || still) close(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(state.current.beat + 1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(state.current.beat - 1); return; }
      if (e.key === 'Tab') {
        const f = [...el.querySelectorAll('button:not([disabled])')].filter(x => getComputedStyle(x).visibility !== 'hidden');
        if (!f.length) return;
        const i = f.indexOf(document.activeElement);
        e.preventDefault(); e.stopPropagation();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        return;
      }
      if (!inside) { e.stopPropagation(); if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }
    };
    addEventListener('keydown', onKey, true);
    return () => {
      removeEventListener('keydown', onKey, true);
      if (back && back.isConnected && back.focus) back.focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onBackdrop = e => {
    if (still || beat < 1 || (e.target.closest && e.target.closest('button'))) return;
    close();
  };
  const { mod } = BEATS[beat];
  const stillShot = mod.stillShot || (mod.shots || [])[(mod.shots || []).length - 1] || { t: 0, cam: [0, 0, 1] };
  const first = shotList[0];
  const timed = { t0, at, on: !still };
  return (
    <div ref={root} className={`intro${still ? ' still' : ''}${closing ? ' out' : ''}${at != null ? ' frozen' : ''}`} role="dialog" aria-modal="true" aria-label="Cults in twenty seconds"
      data-intro={still ? 'still' : 'motion'} data-beat={beat + 1} data-intro-end={END} data-intro-starts={STARTS.join(",")} onClick={onBackdrop} onKeyDown={e => e.stopPropagation()}>
      <p className="intro-kicker" aria-hidden="true">Cults <i>in twenty seconds</i></p>
      <button type="button" className="intro-skip" data-intro-skip onClick={close}>Skip intro</button>
      <div className="intro-main">
        <div className="intro-stage" ref={stage} style={uk ? { '--uk': uk } : null}>
          {still ? <Lamp shot={stillShot} /> : <span ref={lamp} className="intro-lamp timed" style={uk ? lampAt(first, uk) : null} />}
          <div className="in-view">
            <Cast.Provider value={c}>
              {still ? (
                <Camera shot={stillShot}><Scene b={beat} still /></Camera>
              ) : (
                <div ref={cam} className="in-cam timed" style={uk ? { transform: `scale(${uk * first.cam[2]}) translate(${-first.cam[0]}px, ${-first.cam[1]}px)` } : null}>
                  {only
                    ? <Scene key={`${only}.${loop}`} b={only - 1} still={false} t0={t0} at={at} />
                    : BEATS.map((_, b) => <Scene key={b} b={b} still={false} t0={t0} at={at} base={STARTS[b]} window={[STARTS[b], b < LAST ? STARTS[b + 1] : null]} />)}
                </div>
              )}
            </Cast.Provider>
          </div>
        </div>
        <div className="intro-lines" aria-live="polite">
          {BEATS.map((B, i) => (
            <p key={i} className={`intro-line${i === beat ? ' now' : ''}`} aria-hidden={i === beat ? undefined : 'true'}>
              {B.line.map((g, k) => (
                <Fragment key={k}>
                  {k > 0 && ' '}
                  <Group b={i} k={k} n={B.line.length} timed={one ? timed : null} shown={still || !one ? i === beat : i === 0}>{rich(g)}</Group>
                </Fragment>
              ))}
            </p>
          ))}
        </div>
        <div className="intro-dots" aria-hidden="true">
          {BEATS.map((_, i) => <Dot key={i} i={i} beat={beat} timed={one ? timed : null} />)}
        </div>
        <span className="intro-sr">Step {beat + 1} of {BEATS.length}</span>
        {still ? (
          <div className="intro-nav">
            <button type="button" className="intro-btn ghost" onClick={() => go(beat - 1)} disabled={beat === 0} data-intro-back>Back</button>
            {beat < LAST
              ? <button type="button" className="intro-btn" onClick={() => go(beat + 1)} data-intro-next>Next</button>
              : <button type="button" className="intro-btn" onClick={close} data-intro-next data-intro-begin>Begin</button>}
          </div>
        ) : (
          <div className="intro-nav">
            {(one || beat === LAST) && <Begin onClick={close} timed={one ? timed : null} />}
          </div>
        )}
      </div>
    </div>
  );
}
const lampAt = (s, uk) => {
  const [wx, wy, w = 230, h = 170] = s.lamp || [0, 0];
  const [lx, ly] = toStage(s.cam, [wx, wy]);
  return { left: lx * uk, top: ly * uk, width: w * uk, height: h * uk };
};

/** A word group of a caption: it dissolves in after its beat starts (staggered) and out as the next beat's comes. */
function Group({ b, k, n, timed, shown, children }) {
  const ref = useRef(null);
  useClocked(ref, () => {
    const inAt = STARTS[b] + (b ? 260 : 350) + 150 * k, outAt = b < LAST ? STARTS[b + 1] : null;
    const kf = [{ offset: 0, opacity: 0, transform: 'translateY(4px)', easing: 'linear' }];
    kf.push({ offset: inAt / END, opacity: 0, transform: 'translateY(4px)', easing: 'cubic-bezier(.2,.8,.3,1)' });
    kf.push({ offset: Math.min(1, (inAt + 650) / END), opacity: 1, transform: 'none', easing: 'linear' });
    if (outAt != null) {
      kf.push({ offset: (outAt - 40 + 30 * (n - 1 - k)) / END, opacity: 1, transform: 'none', easing: 'ease-in' });
      kf.push({ offset: (outAt + 320 + 30 * (n - 1 - k)) / END, opacity: 0, transform: 'none', easing: 'linear' });
    }
    kf.push({ offset: 1, opacity: outAt != null ? 0 : 1, transform: 'none' });
    return [kf, { duration: END }];
  }, [timed && timed.t0, timed && timed.at], timed || { on: false });
  return <span ref={ref} className="intro-group" style={timed || shown ? undefined : { opacity: 0 }}>{children}</span>;
}
/** A progress dot, lit on its beat (on the clock in the one-shot world). */
function Dot({ i, beat, timed }) {
  const ref = useRef(null);
  useClocked(ref, () => {
    const on = { backgroundColor: '#ffd99a', boxShadow: '0 0 8px #ffd99a' }, done = { backgroundColor: '#8f7f66', boxShadow: 'inset 0 0 0 1px #8f7f66' }, off = { backgroundColor: 'rgba(0,0,0,0)', boxShadow: 'inset 0 0 0 1px #8f7f66' };
    const kf = [{ offset: 0, ...(i === 0 ? on : off), easing: 'step-end' }];
    if (i > 0) kf.push({ offset: STARTS[i] / END, ...on, easing: 'step-end' });
    if (i < LAST) kf.push({ offset: STARTS[i + 1] / END, ...done, easing: 'step-end' });
    kf.push({ offset: 1, ...(i < LAST ? done : on) });
    return [kf, { duration: END }];
  }, [timed && timed.t0, timed && timed.at], timed || { on: false });
  return <i ref={ref} className={timed ? 'timed' : i === beat ? 'on' : i < beat ? 'done' : ''} />;
}
/** Begin: it comes when the last beat has played (on the clock in the one-shot world). */
function Begin({ onClick, timed }) {
  const ref = useRef(null);
  useClocked(ref, () => [[
    { offset: 0, opacity: 0, visibility: 'hidden', easing: 'step-end' },
    { offset: (END - 1) / (END + 600), opacity: 0, visibility: 'visible', easing: 'ease' },
    { offset: 1, opacity: 1, visibility: 'visible' },
  ], { duration: END + 600 }], [timed && timed.t0, timed && timed.at], timed || { on: false });
  return <button ref={ref} type="button" className={`intro-btn${timed ? '' : ' in-cta'}`} style={timed ? undefined : { animationDelay: `${durationOf(LAST)}ms` }} onClick={onClick} data-intro-begin>Begin</button>;
}
