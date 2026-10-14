// A bot that thinks ahead: for each candidate move it plays the game out several times with greedy bots
// and picks the move with the best average final margin. Slow; for balance checks, not for the UI.
import { applyMove, followers } from './core.js';
import { chooseBotMove } from './bots.js';
import { seededRandom } from './rng.js';

function margin(state, id) {
  const mine = followers(state, state.players[id]);
  const best = Math.max(...state.players.filter(p => p.id !== id).map(p => followers(state, p)));
  return mine - best;
}

/** Think only about placements and buys; follow-up choices go to the greedy bot. */
export function chooseThinkerMove(state, rand = Math.random, { rollouts = 6, maxOptions = 10 } = {}) {
  const pend = state.pending;
  if (!pend || !['place', 'buy'].includes(pend.kind)) return chooseBotMove(state, rand);
  const me = pend.player;
  let options = pend.options.filter(o => o.kind !== 'toggle' && o.kind !== 'back');
  if (options.length === 1) return { player: me, option: options[0].id };
  // trim to a manageable set: keep the greedy pick plus a spread of others
  if (options.length > maxOptions) {
    const greedy = chooseBotMove(state, rand).option;
    options = [options.find(o => o.id === greedy), ...options.filter(o => o.id !== greedy).sort(() => rand() - 0.5).slice(0, maxOptions - 1)];
  }
  let best = null, bestScore = -Infinity;
  for (const o of options) {
    let total = 0;
    for (let k = 0; k < rollouts; k++) {
      const r = seededRandom(Math.floor(rand() * 2 ** 31));
      let s = applyMove(state, { player: me, option: o.id });
      let guard = 0;
      while (!s.over && guard++ < 600) s = applyMove(s, chooseBotMove(s, r));
      total += margin(s, me);
    }
    const avg = total / rollouts;
    if (avg > bestScore) { bestScore = avg; best = o; }
  }
  return { player: me, option: best.id };
}
