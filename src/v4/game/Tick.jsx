// A number that changes visibly: small changes roll like an odometer (old number slides out, new slides in),
// bigger ones count up; either way it lights up in a color and can float a brief +N / −N.
import { useEffect, useRef, useState } from 'react';
import { MO } from '../motion.js';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let floatId = 0;

/** How long a change of d takes to count: long enough to see each step (about 330–550ms; src/v4/motion.js). */
export const countMs = (d, dur = 0) => Math.max(dur, Math.min(MO.tickMax, MO.tickBase + MO.tickPer * Math.abs(d)));

export default function Tick({ value, from, color, className = '', float = true, dur = 0 }) {
  const [shown, setShown] = useState(from ?? value);
  const [floats, setFloats] = useState([]);
  const [bump, setBump] = useState(0);
  const last = useRef(from ?? value);
  const shownRef = useRef(from ?? value);
  shownRef.current = shown;
  useEffect(() => {
    // count from what's on screen (a change mid-count carries on from there), through every whole number
    const start = shownRef.current;
    last.current = value;
    if (start === value) return undefined;
    const d = value - start;
    const ms = countMs(d, dur);
    const timers = [];
    setBump(d > 0 ? 1 : -1);
    timers.push(setTimeout(() => setBump(0), ms + 220));
    if (typeof window !== 'undefined') window.__patronsTicks = (window.__patronsTicks || 0) + 1;
    if (float) {
      const id = ++floatId;
      setFloats(f => [...f.slice(-2), { id, d }]);
      timers.push(setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 900));
    }
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') { setShown(value); return () => timers.forEach(clearTimeout); }
    const t0 = performance.now();
    let raf = 0;
    const lo = Math.min(start, value), hi = Math.max(start, value);
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // ease in-out: the middle numbers stay readable
      setShown(Math.max(lo, Math.min(hi, Math.round(start + d * e))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, [value, float, dur]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className={`tick ${className}${bump > 0 ? ' bump' : bump < 0 ? ' dip' : ''}`} style={bump && color ? { '--tc': color } : undefined}>
      <span className="tv">{shown}</span>
      {floats.map(f => (
        <span key={f.id} className={`floater ${f.d > 0 ? 'up' : 'down'}`} style={color ? { color } : undefined} aria-hidden="true">
          {f.d > 0 ? '+' : '−'}{Math.abs(f.d)}
        </span>
      ))}
    </span>
  );
}
