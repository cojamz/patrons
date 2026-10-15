// The table's pace on real bot turns (the motion language's H2 and H3, design/prototypes/motion/grammar.md §4): every
// step of whole seeded games (seat 0 is "you", played by a bot so the games are recorded, not scripted) goes through
// the director's own plan (planChain) and the table's own hold (holdAfter), exactly as useTable paces the screen.
// At Steady: a rival's whole turn ≤ 2.0s p50 and ≤ 3.0s p95 (H3); the wait from the end of your turn to your next
// turn ≤ 6.5s p50 (H2), the snake's long gap (several rival turns in a row) ≤ 13s. This is the schedule; what the
// box spends drawing comes on top of it (e2e/v4/snappy.mjs s5 reads both on a real screen).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { planChain, holdAfter } from '../../../v4/game/director.js';
import { motionSpeed } from '../../../v4/motion.js';

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };

function paceGame(seed, mine = [0]) {
  const seats = Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
  let s = createGame({ seats, seed });
  const rand = seededRandom(seed);
  const rivalTurns = [], waits = [];
  let turn = null, wait = null;
  for (let k = 0; k < 800 && !s.over; k++) {
    const next = applyMove(s, chooseBotMove(s, rand), { effects: true });
    const actor = s.pending ? s.pending.player : null;
    // round ends are the Reckoning's (its own budget, H10): a turn or wait that spans one isn't counted
    if (next.round !== s.round) { turn = null; wait = null; s = next; continue; }
    if (s.round >= 1 && actor != null) {
      const plan = planChain(s, next, { mine });
      const sameNext = !!(next.pending && next.pending.player === actor);
      const rivalStep = !mine.includes(actor);
      const hold = holdAfter(plan, { sameNext, rivalStep, floor: 400, base: 0 });
      if (rivalStep) {
        turn = (turn || 0) + hold;
        if (!sameNext) { rivalTurns.push(turn); turn = null; }
        if (wait != null) wait += hold;
      } else if (!sameNext) {
        // your turn ends here (your own chain has played): the wait runs until your next turn starts
        wait = 0;
      }
      if (next.pending && mine.includes(next.pending.player) && !mine.includes(actor) && wait != null) { waits.push(wait); wait = null; }
    }
    s = next;
  }
  return { rivalTurns, waits };
}

describe('the table\'s pace at Steady (H2, H3)', () => {
  it('a rival\'s turn and the wait between your turns stay inside the motion budget', () => {
    expect(motionSpeed()).toBe('steady');
    const turns = [], waits = [];
    for (const seed of [2, 7, 13, 21]) { const g = paceGame(seed); turns.push(...g.rivalTurns); waits.push(...g.waits); }
    const h3p50 = pct(turns, 0.5), h3p95 = pct(turns, 0.95), h2p50 = pct(waits, 0.5), h2max = Math.max(...waits);
    console.log(`[pacing] rival turn p50 ${h3p50}ms p95 ${h3p95}ms (${turns.length} turns); wait for your turn p50 ${h2p50}ms max ${h2max}ms (${waits.length} waits)`);
    expect(turns.length).toBeGreaterThan(40);
    expect(waits.length).toBeGreaterThan(10);
    expect(h3p50).toBeLessThanOrEqual(2000);
    expect(h3p95).toBeLessThanOrEqual(3000);
    expect(h2p50).toBeLessThanOrEqual(6500);
    expect(h2max).toBeLessThanOrEqual(13000);
  });
});
