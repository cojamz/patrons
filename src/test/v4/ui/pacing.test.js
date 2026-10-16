// The table's pace on real bot turns (the motion language's H2 and H3, design/prototypes/motion/grammar.md §4): every
// step of whole seeded games (seat 0 is "you", played by a bot so the games are recorded, not scripted) goes through
// the director's own plan (planChain) and the table's own hold (holdAfter), exactly as useTable paces the screen.
// At Steady: a rival's whole turn ≤ 2.0s p50 and ≤ 3.0s p95 (H3); the wait from the end of your turn to your next
// turn ≤ 6.5s p50 (H2), the snake's long gap (several rival turns in a row) ≤ 13s. This is the schedule; what the
// box spends drawing comes on top of it (e2e/v4/snappy.mjs s5 reads both on a real screen).
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { planChain, holdAfter, foldBuys } from '../../../v4/game/director.js';
import { MO, SPEEDS, motionSpeed, setMotionSpeed } from '../../../v4/motion.js';

const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };

function paceGame(seed, mine = [0]) {
  const seats = Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' }));
  let s = createGame({ seats, seed });
  const rand = seededRandom(seed);
  const rivalTurns = [], waits = [], byRound = { 1: [], 2: [], 3: [] };
  let turn = null, wait = null, between = 0;
  const states = [s];
  for (let k = 0; k < 800 && !s.over; k++) { s = applyMove(s, chooseBotMove(s, rand), { effects: true }); states.push(s); }
  s = states[0];
  for (let i = 0; i + 1 < states.length;) {
    // the table shows a rival's run of follower buys as one step (director.js foldBuys; here the whole run is known)
    const fold = foldBuys(s, states[i + 1], states.slice(i + 2, i + 40), mine, true);
    i += 1 + fold.used;
    const next = states[i];
    const actor = s.pending ? s.pending.player : null;
    // round ends are the Reckoning's (its own budget, H10): a turn or wait that spans one isn't counted
    if (next.round !== s.round) { turn = null; wait = null; s = next; continue; }
    if (s.round >= 1 && actor != null) {
      const plan = planChain(s, next, { mine });
      const sameNext = !!(next.pending && next.pending.player === actor);
      const rivalStep = !mine.includes(actor);
      const hold = holdAfter(plan, { sameNext, rivalStep, floor: MO.stepFloor, base: 0, nextPlaces: !!(next.pending && next.pending.kind === 'place'), placing: s.pending.kind === 'place' });
      if (rivalStep) {
        // a snake turnaround (the same bot places again right away) is a second turn, not a longer one
        if (turn != null && s.pending.kind === 'place') { rivalTurns.push(turn); byRound[s.round].push(turn); turn = null; if (wait != null) between++; }
        turn = (turn || 0) + hold;
        if (!sameNext) { rivalTurns.push(turn); byRound[s.round].push(turn); turn = null; if (wait != null) between++; }
        if (wait != null) wait += hold;
      } else if (!sameNext) {
        // your turn ends here (your own chain has played): the wait runs until your next turn starts
        wait = 0; between = 0;
      }
      // your next turn: after the rivals' turns, or at once (the snake hands it straight back: a wait of one breath)
      if (next.pending && mine.includes(next.pending.player) && wait != null && (!mine.includes(actor) || (!sameNext && next.pending.kind === 'place'))) { waits.push({ ms: wait + (between ? 0 : hold), turns: between }); wait = null; }
    }
    s = next;
  }
  return { rivalTurns, waits, byRound };
}

// Cory's play note (morning fixes, 2026-10-16: "too fast even on Relaxed"): Steady plays ×1.2 the motion language's first
// table and Relaxed twice Steady (src/v4/motion.js SPEEDS), so H2 and H3's budgets, set on that first table, stretch by
// the same ×1.2 at Steady. The shape of the budget (a rival's turn, the wait, the snake's long gap) is unchanged.
const K = SPEEDS.steady;
const rivalTurnsAt = sp => {
  setMotionSpeed(sp);
  try { const turns = []; for (const seed of [2, 7, 13, 21]) turns.push(...paceGame(seed, [0]).rivalTurns); return turns; } finally { setMotionSpeed('steady'); }
};

describe('the table\'s pace at Steady (H2, H3)', () => {
  it('a rival\'s turn and the wait between your turns stay inside the motion budget', () => {
    expect(motionSpeed()).toBe('steady');
    const turns = [], waits = [], r1 = [], r3 = [];
    // you sit in every seat in turn (the snake gives an end seat long and short gaps, a middle seat even ones)
    for (const seed of [2, 7, 13, 21]) for (const seat of [0, 1, 2, 3]) { const g = paceGame(seed, [seat]); if (seat === 0) { turns.push(...g.rivalTurns); r1.push(...g.byRound[1]); r3.push(...g.byRound[3]); } waits.push(...g.waits); }
    // H2 judges the wait at p50 over every seat and every turn (the snake's gaps run 2/4 rival turns for a middle seat,
    // 6/0 for an end seat: three on average), and caps every wait (the snake's run of six) at 13s
    const usual = waits.map(w => w.ms);
    // the long gap is the snake's run of up to six rival turns; members that give extra turns make longer runs, outside it
    const h3p50 = pct(turns, 0.5), h3p95 = pct(turns, 0.95), h2p50 = pct(usual, 0.5), h2max = Math.max(...waits.filter(w => w.turns <= 6).map(w => w.ms));
    const over = waits.filter(w => w.turns > 6).map(w => `${w.ms}ms/${w.turns} turns`);
    if (over.length) console.log(`[pacing] runs of more than six rival turns (extra turns): ${over.join(', ')}`);
    console.log(`[pacing] round I rival turn p50 ${pct(r1, 0.5)}ms p95 ${pct(r1, 0.95)}ms; round III p50 ${pct(r3, 0.5)}ms p95 ${pct(r3, 0.95)}ms`);
    console.log(`[pacing] rival turn p50 ${h3p50}ms p95 ${h3p95}ms (${turns.length} turns); the usual wait for your turn p50 ${h2p50}ms (${usual.length}), longest ${h2max}ms (${waits.length} waits)`);
    expect(turns.length).toBeGreaterThan(40);
    expect(usual.length).toBeGreaterThan(10);
    expect(h3p50).toBeLessThanOrEqual(2000 * K);
    expect(h3p95).toBeLessThanOrEqual(3000 * K);
    expect(h2p50).toBeLessThanOrEqual(6500 * K);
    expect(h2max).toBeLessThanOrEqual(13000 * K);
  });
  it('Relaxed plays a rival\'s turn about twice as long as Steady, and Steady a little slower than the first table', () => {
    const steady = rivalTurnsAt('steady'), relaxed = rivalTurnsAt('relaxed'), quick = rivalTurnsAt('quick');
    const [s, r, q] = [pct(steady, 0.5), pct(relaxed, 0.5), pct(quick, 0.5)];
    console.log(`[pacing] rival turn p50: Quick ${q}ms, Steady ${s}ms, Relaxed ${r}ms (Relaxed/Steady ${(r / s).toFixed(2)})`);
    expect(steady.length).toBe(relaxed.length); // the same games, step for step
    expect(r / s).toBeGreaterThanOrEqual(1.8);
    expect(r / s).toBeLessThanOrEqual(2.6);
    // the old Steady's p50 on these games was 1541ms (2026-10-15); "a little slower" is about a fifth more
    expect(s).toBeGreaterThan(1541 * 1.1);
    expect(q).toBeLessThan(s);
  });
});
