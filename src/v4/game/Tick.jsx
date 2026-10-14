// A number that counts to its new value (~300ms) and floats a brief +N / −N in a color.
import { useEffect, useRef, useState } from 'react';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let floatId = 0;

export default function Tick({ value, from, color, className = '', float = true, dur = 320 }) {
  const [shown, setShown] = useState(from ?? value);
  const [floats, setFloats] = useState([]);
  const last = useRef(from ?? value);
  useEffect(() => {
    const start = last.current;
    last.current = value;
    if (start === value) return undefined;
    const d = value - start;
    const timers = [];
    if (float) {
      const id = ++floatId;
      setFloats(f => [...f.slice(-2), { id, d }]);
      timers.push(setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 900));
    }
    if (reducedMotion() || typeof requestAnimationFrame !== 'function') { setShown(value); return () => timers.forEach(clearTimeout); }
    const t0 = performance.now();
    let raf = 0;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      setShown(Math.round(start + d * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); setShown(value); timers.forEach(clearTimeout); };
  }, [value, float, dur]);
  return (
    <span className={`tick ${className}`}>
      {shown}
      {floats.map(f => (
        <span key={f.id} className={`floater ${f.d > 0 ? 'up' : 'down'}`} style={color ? { color } : undefined} aria-hidden="true">
          {f.d > 0 ? '+' : '−'}{Math.abs(f.d)}
        </span>
      ))}
    </span>
  );
}
