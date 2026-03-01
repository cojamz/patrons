/**
 * useAnimatedValue — Smoothly tweens a numeric value.
 *
 * Used for favor counters, resource counts, etc.
 * Returns the current animated value and a "changed" flag
 * for triggering visual flourishes.
 */
import { useState, useEffect, useRef } from 'react';

export function useAnimatedValue(target, { duration = 300 } = {}) {
  const [display, setDisplay] = useState(target);
  const [direction, setDirection] = useState(null); // 'up' | 'down' | null
  const prevRef = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === target) return;

    setDirection(target > prev ? 'up' : 'down');
    const start = performance.now();
    const from = prev;
    const delta = target - from;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + delta * eased);
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        // Clear direction after a beat
        setTimeout(() => setDirection(null), 400);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    prevRef.current = target;

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return { value: display, direction };
}
