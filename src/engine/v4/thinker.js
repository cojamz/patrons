// Hard bot: normal's judgment plus lookahead. For its few best placements and buys it plays the game forward
// with normal bots to the end of the round (to the end of the game in round III) and keeps the option with the
// best average result. Work is counted in simulated moves, not wall time, so a seed always gives the same move;
// chooseBotMove also caps a move at 250ms of wall time for the UI (see opts.maxMs).
import { applyMove, followers } from './core.js';
import { chooseNormalMove, chooseGreedyMove, scoreOptions, buyShortcut } from './bots.js';
import { seededRandom } from './rng.js';

// rollouts play normal, a little noisier, comparing fewer ways to pay
const ROLLOUT = { noise: 0.6, payWays: 2, payOptions: 2 };
const margin = (state, id) =>
  followers(state, state.players[id]) - Math.max(...state.players.filter(p => p.id !== id).map(p => followers(state, p)));

/**
 * opts.budget: simulated moves to spend on this decision (default 100).
 * opts.candidates: how many of normal's top options to look at (default 3).
 * opts.full: play every rollout to game end (slow; for offline balance checks).
 * opts.rollout: 'normal' (default) or 'greedy' — the policy the rollouts play (measured: greedy rollouts lose the edge).
 * opts.maxMs: a wall-clock cap for the UI (chooseBotMove sets 250). Off by default, so direct calls and sims stay
 *   deterministic; when it bites, rollouts stop early and are scored statically, so a slow machine plays a bit weaker.
 * opts.now: the clock for maxMs (default performance.now).
 * opts.noMembers: never recruit, here or in its own rollout turns (the buy-followers tester at Hard).
 * opts.grab: false ranks placements the old way, without what grabbing a space first is worth (default on).
 */
export function chooseThinkerMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  if (!['place', 'buy'].includes(pend.kind)) return chooseNormalMove(state, rand);
  const me = pend.player;
  // an activation or a Release normal would take: nothing to think about
  const short = pend.kind === 'buy' ? buyShortcut(state) : null;
  if (short) return { player: me, option: short.id };
  // Placements: normal's own ranking picks the shortlist, and grab first (bots.js grabFirst: what a space is worth
  // because a rival may take it before your next turn) nominates one more. Without it Crunch Time ("Take your next 2
  // turns right away") read as an empty space and never got looked at. The rollouts decide; grab's own ranking only
  // nominates (as a ranking it measured no better than normal's: 46–49%, 400 games). opts.grab = false: the old Hard.
  const grab = pend.kind === 'place' && opts.grab !== false;
  const scored = scoreOptions(state, rand, { grab, grabWeight: opts.grabWeight, noMembers: opts.noMembers });
  const ranked = grab ? [...scored].sort((a, b) => b.base - a.base).map(r => ({ o: r.o, v: r.base, g: r.v })) : scored;
  if (!ranked.length) return chooseNormalMove(state, rand);
  if (ranked.length === 1) return { player: me, option: ranked[0].o.id };
  const { candidates = 3, budget = 100, full = false, maxMs = Infinity } = opts;
  const now = opts.now ?? (globalThis.performance ? () => globalThis.performance.now() : () => Date.now());
  const until = Number.isFinite(maxMs) ? now() + maxMs : Infinity;
  const late = () => until !== Infinity && now() > until;
  // only weigh options normal rates close to its best
  const pool = ranked.slice(0, candidates).filter((r, i) => i === 0 || r.v >= ranked[0].v - 4);
  if (grab && !pool.some(r => r.o.id === scored[0].o.id)) pool.push(ranked.find(r => r.o.id === scored[0].o.id));
  if (pool.length === 1) return { player: me, option: pool[0].o.id };
  const round = state.round;
  const totals = pool.map(() => 0), counts = pool.map(() => 0);
  let spent = 0;
  const seeds = [];
  // a rollout stops at the round end, or when its share of the budget is used up (then it's scored statically)
  const cap = Math.max(8, Math.floor(budget / pool.length));
  // round-robin rollouts until the budget is gone; every candidate gets at least one
  for (let k = 0; spent < budget || counts.some(c => c === 0); k++) {
    const i = k % pool.length;
    if (counts[i] > 0 && (spent >= budget || late())) break;
    // paired rollouts: the j-th rollout of every candidate plays the same dice, so candidates are compared on the same
    // luck (opts.paired = false: a fresh seed per rollout, the old way)
    const j = Math.floor(k / pool.length);
    if (opts.paired === false || seeds[j] === undefined) seeds[j] = Math.floor(rand() * 2 ** 31);
    const r = seededRandom(seeds[j]);
    let s, steps = 1, value;
    try {
      s = applyMove(state, { player: me, option: pool[i].o.id });
      while (!s.over && (full || (s.round === round && steps < cap)) && steps < 800 && !late()) {
        // the cap counts placements and buys only: a follow-up choice (who gets the gold, which member) is part of the
        // same turn, and counting it ended rollouts mid-turn (Hard-20 fell from 41% to 33% against 3 Normal when Blue
        // became a held-color contest, where those mid-turn endings misjudge the line; counting only turns: 43%)
        const counted = s.pending && (s.pending.kind === 'place' || s.pending.kind === 'buy');
        // a follower buyer's own future turns stay follower buying (opts.noMembers)
        const mine = opts.noMembers && s.pending?.player === me;
        s = applyMove(s, opts.rollout === 'greedy' ? chooseGreedyMove(s, r, { noise: 1 }) : chooseNormalMove(s, r, mine ? { ...ROLLOUT, noMembers: true } : ROLLOUT));
        if (counted) steps++;
      }
      // at a round boundary, value what's left the way normal does (followers + resources' worth)
      value = s.over ? margin(s, me) : valueAtBoundary(s, me);
    } catch (err) {
      // an engine error down a hypothetical line must never break the real move: count it as a very bad line
      // (the real game would crash there too), and keep a copy for a repro when THINKER_DUMP is set
      if (globalThis.process?.env?.THINKER_DUMP) rolloutCrash(state, pool[i].o.id, err);
      value = -100;
    }
    spent += steps;
    totals[i] += value;
    counts[i] += 1;
    if (k > 200) break;
  }
  // A candidate gets one or two rollouts, so one lucky line can carry a weak option. Normal's own rating counts as
  // opts.prior rollouts more (shrinkage toward its ranking; 0 = rollouts alone, the old way). Ratings and rollouts
  // sit on different scales, so the prior is normal's gap to the pool's average, added to the average rollout.
  const w0 = opts.prior ?? 0;
  const allMean = totals.reduce((a, b) => a + b, 0) / counts.reduce((a, b) => a + b, 0);
  const vMean = pool.reduce((a, r) => a + r.v, 0) / pool.length;
  const score = i => (totals[i] + w0 * (allMean + pool[i].v - vMean)) / (counts[i] + w0);
  let best = 0;
  for (let i = 1; i < pool.length; i++) if (score(i) > score(best)) best = i;
  return { player: me, option: pool[best].o.id };
}

// A position mid-game, scored the way normal scores a pass: followers, contests, and what resources can still become.
function valueAtBoundary(s, me) {
  if (!s.pending) return margin(s, me);
  const probe = { ...s, pending: { player: me, kind: 'buy', options: [{ id: 'pass', kind: 'pass' }] } };
  return scoreOptions(probe, () => 0, { spite: 1 })[0].v; // the same yardstick as a finished game's margin
}

let dumped = 0;
function rolloutCrash(state, option, err) {
  if (dumped++ > 2) return;
  const fs = globalThis.process.getBuiltinModule?.('node:fs');
  fs?.writeFileSync(`${globalThis.process.env.THINKER_DUMP}-${Date.now()}.json`, JSON.stringify({ error: String(err), stack: err.stack, option, state }));
}
