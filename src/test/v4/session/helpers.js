// Shared helpers for session tests.
import { vi } from 'vitest';
import { chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

/**
 * Fake-timer wait: advances vi's fake clock in `step` ms slices until cond() is truthy. Bounded by a slice count, not
 * the wall clock, so a loaded box can't time it out. Call vi.useFakeTimers() first.
 */
export async function untilFake(cond, { step = 50, maxSteps = 20000, label = 'condition' } = {}) {
  for (let i = 0; i < maxSteps && !cond(); i++) await vi.advanceTimersByTimeAsync(step);
  if (!cond()) throw new Error(`Never reached ${label} within ${maxSteps} fake-timer steps of ${step} ms`);
}

/**
 * Polls until cond() is truthy. Bounded by a poll count (timeout / step), never by the wall clock: under fake timers
 * (vi.useFakeTimers(), what session tests use) each poll advances fake time by `step` ms; with real timers (the
 * BroadcastChannel test) each poll sleeps `step` ms, so a loaded box stretches the wait instead of failing it.
 */
export async function until(cond, { timeout = 8000, step = 2, label = 'condition' } = {}) {
  const polls = Math.ceil(timeout / step);
  const fake = vi.isFakeTimers();
  for (let i = 0; i < polls && !cond(); i++) {
    if (fake) await vi.advanceTimersByTimeAsync(step); else await new Promise(r => setTimeout(r, step));
  }
  if (!cond()) throw new Error(`Never reached ${label} within ${polls} polls of ${step} ms${fake ? ' of fake time' : ''}`);
}

/** Waits `ms`: advances fake time under fake timers, else really sleeps. */
export const pause = ms => (vi.isFakeTimers() ? vi.advanceTimersByTimeAsync(ms) : new Promise(r => setTimeout(r, ms)));

/**
 * Plays every seat this session owns with the bot brain, through session.submit().
 * Returns a stop function. `errors` collects unexpected rejections.
 */
export function autoPlay(session, { seed = 7, errors = [] } = {}) {
  const rand = seededRandom(seed);
  let lastVersion = -1;
  let stopped = false;
  const off = session.subscribe((state, info) => {
    if (stopped || !state.pending || state.over) return;
    if (!session.mySeats.includes(state.pending.player)) return;
    if (info.version === lastVersion) return;
    lastVersion = info.version;
    const move = chooseBotMove(state, rand);
    session.submit(move).catch(err => { if (!/Stale|Not your turn|closed/i.test(err.message)) errors.push(err); });
  });
  return () => { stopped = true; off(); };
}

/** The state with the volatile log trimmed, for comparing clients. */
export const fingerprint = state => JSON.stringify(state);
