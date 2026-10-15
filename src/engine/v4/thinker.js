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
 */
export function chooseThinkerMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  if (!['place', 'buy'].includes(pend.kind)) return chooseNormalMove(state, rand);
  const me = pend.player;
  // an activation or a Release normal would take: nothing to think about
  const short = pend.kind === 'buy' ? buyShortcut(state) : null;
  if (short) return { player: me, option: short.id };
  const ranked = scoreOptions(state, rand);
  if (!ranked.length) return chooseNormalMove(state, rand);
  if (ranked.length === 1) return { player: me, option: ranked[0].o.id };
  const { candidates = 3, budget = 100, full = false, maxMs = Infinity } = opts;
  const now = opts.now ?? (globalThis.performance ? () => globalThis.performance.now() : () => Date.now());
  const until = Number.isFinite(maxMs) ? now() + maxMs : Infinity;
  const late = () => until !== Infinity && now() > until;
  // only weigh options normal rates close to its best
  const pool = ranked.slice(0, candidates).filter((r, i) => i === 0 || r.v >= ranked[0].v - 4);
  if (pool.length === 1) return { player: me, option: pool[0].o.id };
  const round = state.round;
  const totals = pool.map(() => 0), counts = pool.map(() => 0);
  let spent = 0;
  // a rollout stops at the round end, or when its share of the budget is used up (then it's scored statically)
  const cap = Math.max(8, Math.floor(budget / pool.length));
  // round-robin rollouts until the budget is gone; every candidate gets at least one
  for (let k = 0; spent < budget || counts.some(c => c === 0); k++) {
    const i = k % pool.length;
    if (counts[i] > 0 && (spent >= budget || late())) break;
    const r = seededRandom(Math.floor(rand() * 2 ** 31));
    let s, steps = 1, value;
    try {
      s = applyMove(state, { player: me, option: pool[i].o.id });
      while (!s.over && (full || (s.round === round && steps < cap)) && steps < 800 && !late()) {
        // the cap counts placements and buys only: a follow-up choice (who gets the gold, which member) is part of the
        // same turn, and counting it ended rollouts mid-turn (Hard-20 fell from 41% to 33% against 3 Normal when Blue
        // became a held-color contest, where those mid-turn endings misjudge the line; counting only turns: 43%)
        const counted = s.pending && (s.pending.kind === 'place' || s.pending.kind === 'buy');
        s = applyMove(s, opts.rollout === 'greedy' ? chooseGreedyMove(s, r, { noise: 1 }) : chooseNormalMove(s, r, ROLLOUT));
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
  let best = 0;
  for (let i = 1; i < pool.length; i++) if (totals[i] / counts[i] > totals[best] / counts[best]) best = i;
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
