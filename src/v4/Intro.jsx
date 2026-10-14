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
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import './intro.css';
import { emojiIds } from './art/emojis.js';
import { Cast, Clock, Camera, Lamp, BEAT_MS, BEGIN_AT, STAGE, nowT0 } from './intro/shared.jsx';
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

// ---------- the four beats: Cory's words, one line each ----------
const BEATS = [
  { Beat: Beat1, mod: B1, line: <>You are a <em>cult leader</em>.</> },
  { Beat: Beat2, mod: B2, line: <>You and your <em>minions</em> have learned to tap into <em>mysterious powers</em> to gain influence and followers.</> },
  { Beat: Beat3, mod: B3, line: <>Take <em>actions</em> granted by the mysterious powers to add to your resources, recruit new <em>members</em>, and become more powerful.</> },
  { Beat: Beat4, mod: B4, line: <>After three rounds, the cult with the most <em>followers</em> (including members!) wins!</> },
];
const LAST = BEATS.length - 1;

/** One beat's world, on its own clock (t0 = when it mounted; at = a frozen moment, for the lab). */
function Scene({ b, still, leaving, at = null }) {
  const [t0] = useState(nowT0);
  const { Beat } = BEATS[b];
  return (
    <Clock.Provider value={{ still, t0, at }}>
      <div className={`intro-scene${leaving ? ' leaving' : ''}`} aria-hidden="true" data-scene={b + 1}><Beat /></div>
    </Clock.Provider>
  );
}

const durationOf = b => BEATS[b].mod.DURATION ?? BEAT_MS[b];

/**
 * The intro itself. onClose runs once it's gone. still: a storyboard (defaults to prefers-reduced-motion).
 * The lab (?lab=intro): only = N loops beat N alone; at = MS freezes it MS into the beat.
 */
export default function Intro({ onClose, still: stillProp, only = null, at = null }) {
  const [still] = useState(() => (stillProp ?? reducedMotion()));
  const [c] = useState(cast);
  const [beat, setBeat] = useState(only ? only - 1 : 0);
  const [shot, setShot] = useState({ b: only ? only - 1 : 0, i: 0 }); // the camera: shot i of beat b
  const [loop, setLoop] = useState(0); // the lab replays its one beat
  const [prev, setPrev] = useState(null); // the beat fading out under this one
  const [closing, setClosing] = useState(false);
  const [uk, setUk] = useState(null); // CSS px per stage unit
  const root = useRef(null);
  const stage = useRef(null);
  const state = useRef({});
  state.current = { beat, closing };

  const close = useCallback(() => {
    if (state.current.closing) return;
    setClosing(true);
    if (still) onClose(); else state.current.timer = setTimeout(onClose, 220);
  }, [still, onClose]);
  const go = useCallback(n => {
    const b = state.current.beat;
    if (n < 0 || n > LAST || n === b || state.current.closing) return;
    setPrev(still ? null : b);
    setBeat(n);
    setShot({ b: n, i: 0 });
  }, [still]);

  // the clock: each beat plays, holds, and hands over (the last one waits for Begin); its camera shots on cue
  useEffect(() => {
    if (still || closing || at != null) return undefined;
    const shots = BEATS[beat].mod.shots || [];
    const ids = shots.map((s, i) => (i ? setTimeout(() => setShot({ b: beat, i }), s.t) : null));
    if (only) ids.push(setTimeout(() => { setShot({ b: beat, i: 0 }); setLoop(k => k + 1); }, (durationOf(beat) || 7000) + 1500));
    else if (beat < LAST) ids.push(setTimeout(() => go(beat + 1), durationOf(beat)));
    return () => ids.forEach(id => id && clearTimeout(id));
  }, [beat, still, closing, go, only, at, loop]);
  useEffect(() => {
    if (prev == null) return undefined;
    const id = setTimeout(() => setPrev(null), 380);
    return () => clearTimeout(id);
  }, [prev, beat]);
  useEffect(() => () => clearTimeout(state.current.timer), []);
  // whole CSS px per stage unit, measured (the camera scales the world by it)
  useLayoutEffect(() => {
    const measure = () => { const el = stage.current; if (el && el.offsetWidth) setUk(el.offsetWidth / STAGE.w); };
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, []);

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
        const f = [...el.querySelectorAll('button:not([disabled])')];
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
  const shots = mod.shots || [{ t: 0, cam: [0, 0, 1] }];
  const cur = still ? (mod.stillShot || shots[shots.length - 1])
    : at != null ? shots.filter(s => s.t <= at).pop() || shots[0]
      : shots[shot.b === beat ? Math.min(shot.i, shots.length - 1) : 0];
  const shown = prev != null ? [prev, beat] : [beat];
  return (
    <div ref={root} className={`intro${still ? ' still' : ''}${closing ? ' out' : ''}${at != null ? ' frozen' : ''}`} role="dialog" aria-modal="true" aria-label="Cults in twenty seconds"
      data-intro={still ? 'still' : 'motion'} data-beat={beat + 1} onClick={onBackdrop} onKeyDown={e => e.stopPropagation()}>
      <p className="intro-kicker" aria-hidden="true">Cults <i>in twenty seconds</i></p>
      <button type="button" className="intro-skip" data-intro-skip onClick={close}>Skip intro</button>
      <div className="intro-main">
        <div className="intro-stage" ref={stage} style={uk ? { '--uk': uk } : null}>
          <Lamp shot={cur} />
          <div className="in-view">
            <Cast.Provider value={c}>
              <Camera shot={cur}>
                {shown.map(b => <Scene key={`${b}.${loop}`} b={b} still={still} at={at} leaving={b !== beat} />)}
              </Camera>
            </Cast.Provider>
          </div>
        </div>
        <div className="intro-lines" aria-live="polite">
          {BEATS.map((B, i) => (i === beat
            ? <p key={`now${beat}`} className="intro-line now">{B.line}</p>
            : <p key={i} className="intro-line sizer" aria-hidden="true">{B.line}</p>))}
        </div>
        <div className="intro-dots" aria-hidden="true">
          {BEATS.map((_, i) => <i key={i} className={i === beat ? 'on' : i < beat ? 'done' : ''} />)}
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
            {beat === LAST && <button type="button" className="intro-btn in-cta" style={{ animationDelay: `${durationOf(LAST) ?? BEGIN_AT}ms` }} onClick={close} data-intro-begin>Begin</button>}
          </div>
        )}
      </div>
    </div>
  );
}
