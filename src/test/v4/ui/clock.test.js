import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as clock from '../../../v4/game/clock.js';

// one frame loop for every rolling count and the chain clock (eng-audit S3/Q5)
let frames, raf0, caf0;
beforeEach(() => {
  frames = new Map(); let id = 0;
  raf0 = globalThis.requestAnimationFrame; caf0 = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = vi.fn(cb => { frames.set(++id, cb); return id; });
  globalThis.cancelAnimationFrame = vi.fn(k => frames.delete(k));
});
afterEach(() => { globalThis.requestAnimationFrame = raf0; globalThis.cancelAnimationFrame = caf0; });
const paint = now => { const due = [...frames.values()]; frames.clear(); for (const cb of due) cb(now); };

it('runs every callback off one frame, starts a callback added mid-frame on the next, and stops when empty', () => {
  const seen = [];
  const b = now => seen.push(['b', now]);
  const a = now => { seen.push(['a', now]); if (now === 16) clock.add(b); if (now === 48) clock.remove(a); };
  clock.add(a);
  expect(frames.size).toBe(1);
  paint(16);
  expect(seen).toEqual([['a', 16]]);
  expect(frames.size).toBe(1); // one frame asked for both
  paint(32);
  expect(seen.slice(1)).toEqual([['a', 32], ['b', 32]]);
  paint(48);
  clock.remove(b);
  expect(frames.size).toBe(0); // nothing registered: no frame pending
  expect(clock.running(a) || clock.running(b)).toBe(false);
});

it('a callback removed earlier in the same frame does not run', () => {
  const seen = [];
  const b = () => seen.push('b');
  const a = () => { seen.push('a'); clock.remove(b); };
  clock.add(a); clock.add(b);
  paint(16);
  expect(seen).toEqual(['a']);
  clock.remove(a);
});
