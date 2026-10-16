// A number that changes visibly: small changes roll like an odometer (old number slides out, new slides in),
// bigger ones count up; either way it lights up in a color and can float a brief +N / −N.
import { useEffect, useRef, useState } from 'react';
import { MO, slowed } from '../motion.js';
import { arrivalFor } from './flight.js';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let floatId = 0;

/** How long a change of d takes to count: long enough to see each step (about 330–550ms; src/v4/motion.js). */
export const countMs = (d, dur = 0) => Math.max(dur, Math.min(MO.tickMax, MO.tickBase + MO.tickPer * Math.abs(d)));

export default function Tick({ value, from, color, className = '', float = true, dur = 0 }) {
  // React draws the count's start and, once it has run, its end; every number in between is written straight to the
  // text node each frame (perf, 2026-10-15: a render per frame per count interrupted the table's own renders)
  const [shown, setShown] = useState(from ?? value);
  const [floats, setFloats] = useState([]);
  const [bump, setBump] = useState(0);
  const last = useRef(from ?? value);
  const disp = useRef(from ?? value); // the number on screen right now
  const tv = useRef(null);
  const write = n => {
    disp.current = n;
    const node = tv.current && tv.current.firstChild;
    if (node && node.nodeType === 3) { if (node.nodeValue !== String(n)) node.nodeValue = String(n); } else if (tv.current) tv.current.textContent = String(n);
  };
  const box = useRef(null);
  useEffect(() => {
    // count from what's on screen (a change mid-count carries on from there), through every whole number
    const start = disp.current;
    last.current = value;
    if (start === value) return undefined;
    const d = value - start;
    // pieces flying here (flight.js flyGains): the count starts as the first one lands and runs while the rest do
    const coming = dur ? null : arrivalFor(box.current);
    const wait = coming ? coming.delay : 0;
    // pieces landing here: the number rolls as they land (MO.roll, at full brightness), never on a slow count of its own
    const ms = coming ? Math.max(MO.roll, coming.span + 120) : countMs(d, dur);
    const timers = [];
    // the number lights up as it starts to count (with flying pieces: as the first one lands, never before)
    if (!coming) { setBump(d > 0 ? 1 : -1); timers.push(setTimeout(() => setBump(0), ms + 220)); }
    if (typeof window !== 'undefined') window.__patronsTicks = (window.__patronsTicks || 0) + 1;
    if (float) {
      const id = ++floatId;
      setFloats(f => [...f.slice(-2), { id, d }]);
      timers.push(setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), slowed(900))); // (v4.css .floater: .9s × --mo-slow)
    }
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') { disp.current = value; setShown(value); return () => timers.forEach(clearTimeout); }
    // with pieces coming, the count starts when the first one lands (the director says so; the plan's time is the
    // fallback), however late a loaded box paints it
    let t0 = coming && !coming.landed ? Infinity : performance.now();
    const go = () => {
      if (t0 !== Infinity) return;
      t0 = performance.now();
      setBump(d > 0 ? 1 : -1);
      timers.push(setTimeout(() => setBump(0), ms + 220));
    };
    if (coming && coming.landed) { setBump(d > 0 ? 1 : -1); timers.push(setTimeout(() => setBump(0), ms + 220)); }
    if (coming && !coming.landed) {
      coming.el.addEventListener('patrons:land', go, { once: true });
      timers.push(setTimeout(go, wait + 600));
    }
    let raf = 0;
    const lo = Math.min(start, value), hi = Math.max(start, value);
    // a small change shows every whole number for at least one painted frame, however late the frames come (a loaded
    // box paints rarely: a pure clock would skip numbers); a big one keeps to the clock in even strides
    const stride = Math.max(1, Math.ceil(Math.abs(d) / 12));
    const step = now => {
      const k = t0 === Infinity ? 0 : Math.max(0, Math.min(1, (now - t0) / ms));
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out: the middle numbers stay readable
      const aim = Math.max(lo, Math.min(hi, Math.round(start + d * e)));
      const was = disp.current;
      const next = Math.abs(aim - was) > stride ? was + Math.sign(aim - was) * stride : aim;
      write(next);
      if (k < 1 || next !== value) raf = requestAnimationFrame(step);
      else setShown(value); // one render, at the end
    };
    raf = requestAnimationFrame(step);
    // a skipped chain (a click, Space: director.js) lands the count at once
    const skip = () => { cancelAnimationFrame(raf); t0 = 0; write(value); setShown(value); if (coming) coming.el.removeEventListener('patrons:land', go); };
    addEventListener('patrons:chain-skip', skip);
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); removeEventListener('patrons:chain-skip', skip); if (coming) coming.el.removeEventListener('patrons:land', go); };
  }, [value, float, dur]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span ref={box} className={`tick ${className}${bump > 0 ? ' bump' : bump < 0 ? ' dip' : ''}`} style={bump && color ? { '--tc': color } : undefined}>
      <span className="tv" ref={tv}>{shown}</span>
      {floats.map(f => (
        <span key={f.id} className={`floater ${f.d > 0 ? 'up' : 'down'}`} style={color ? { color } : undefined} aria-hidden="true">
          {f.d > 0 ? '+' : '−'}{Math.abs(f.d)}
        </span>
      ))}
    </span>
  );
}
