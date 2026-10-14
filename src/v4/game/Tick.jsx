// A number that changes visibly: small changes roll like an odometer (old number slides out, new slides in),
// bigger ones count up; either way it lights up in a color and can float a brief +N / −N.
import { useEffect, useRef, useState } from 'react';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let floatId = 0;

export default function Tick({ value, from, color, className = '', float = true, dur = 320 }) {
  const [shown, setShown] = useState(from ?? value);
  const [floats, setFloats] = useState([]);
  const [bump, setBump] = useState(0);
  const [roll, setRoll] = useState(null); // { from, n } while the old number slides out
  const last = useRef(from ?? value);
  useEffect(() => {
    const start = last.current;
    last.current = value;
    if (start === value) return undefined;
    const d = value - start;
    const timers = [];
    setBump(d > 0 ? 1 : -1);
    timers.push(setTimeout(() => setBump(0), Math.max(dur, 380)));
    if (typeof window !== 'undefined') window.__patronsTicks = (window.__patronsTicks || 0) + 1;
    if (float) {
      const id = ++floatId;
      setFloats(f => [...f.slice(-2), { id, d }]);
      timers.push(setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 900));
    }
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') { setShown(value); return () => timers.forEach(clearTimeout); }
    if (Math.abs(d) <= 3) {
      setShown(value);
      setRoll({ from: start, n: Date.now(), up: d > 0 });
      timers.push(setTimeout(() => setRoll(null), 520));
      return () => { setRoll(null); setBump(0); timers.forEach(clearTimeout); };
    }
    const t0 = performance.now();
    let raf = 0;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      setShown(Math.round(start + d * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); setShown(value); setBump(0); timers.forEach(clearTimeout); };
  }, [value, float, dur]);
  return (
    <span className={`tick ${className}${bump > 0 ? ' bump' : bump < 0 ? ' dip' : ''}${roll ? (roll.up ? ' rolling up' : ' rolling down') : ''}`} style={bump && color ? { '--tc': color } : undefined}>
      <span className="tv" key={roll ? roll.n : 'v'}>{shown}</span>
      {roll && <span className="tv-out" aria-hidden="true">{roll.from}</span>}
      {floats.map(f => (
        <span key={f.id} className={`floater ${f.d > 0 ? 'up' : 'down'}`} style={color ? { color } : undefined} aria-hidden="true">
          {f.d > 0 ? '+' : '−'}{Math.abs(f.d)}
        </span>
      ))}
    </span>
  );
}
