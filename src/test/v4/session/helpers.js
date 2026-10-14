// Shared helpers for session tests.
import { chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

/** Polls until cond() is truthy (real timers). */
export async function until(cond, { timeout = 8000, label = 'condition' } = {}) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeout) throw new Error(`Timed out waiting for ${label}`);
    await new Promise(r => setTimeout(r, 2));
  }
}

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
