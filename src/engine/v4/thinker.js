// Hard bot: normal's judgment plus lookahead. For its few best placements and buys it plays the game forward
// with normal bots to the end of the round (to the end of the game in round III) and keeps the option with the
// best average result. Work is counted in simulated moves, not wall time, so a seed always gives the same move;
// the default budget keeps a move well under ~150ms in a browser.
import { applyMove, followers } from './core.js';
import { chooseNormalMove, scoreOptions } from './bots.js';
import { seededRandom } from './rng.js';

const margin = (state, id) =>
  followers(state, state.players[id]) - Math.max(...state.players.filter(p => p.id !== id).map(p => followers(state, p)));

/**
 * opts.budget: simulated moves to spend on this decision (default 100).
 * opts.candidates: how many of normal's top options to look at (default 3).
 * opts.full: play every rollout to game end (slow; for offline balance checks).
 */
export function chooseThinkerMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  if (!['place', 'buy'].includes(pend.kind)) return chooseNormalMove(state, rand);
  const me = pend.player;
  const first = chooseNormalMove(state, rand);
  const chosen = pend.options.find(o => o.id === first.option);
  // an activation, or a buy with one real choice: nothing to think about
  if (chosen?.kind === 'use') return first;
  const ranked = scoreOptions(state, rand);
  if (ranked.length <= 1) return first;
  const { candidates = 3, budget = 100, full = false } = opts;
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
    if (counts[i] > 0 && spent >= budget) break;
    const r = seededRandom(Math.floor(rand() * 2 ** 31));
    let s = applyMove(state, { player: me, option: pool[i].o.id });
    let steps = 1;
    while (!s.over && (full || (s.round === round && steps < cap)) && steps < 800) {
      s = applyMove(s, chooseNormalMove(s, r, { noise: 0.6, payWays: 2 }));
      steps++;
    }
    spent += steps;
    // at a round boundary, value what's left the way normal does (followers + resources' worth)
    totals[i] += s.over ? margin(s, me) : valueAtBoundary(s, me);
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
  return scoreOptions(probe, () => 0)[0].v;
}
