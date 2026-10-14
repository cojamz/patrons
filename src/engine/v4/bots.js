// Bots: pure functions that pick one legal option. Used for empty seats, simulation and fuzz tests.
import { contextFor, actionAt, cardDef, TIERS, followerPlan } from './core.js';
import { defById } from './content/index.js';

const SETUP_WEIGHTS = { gold: 3, red: 3, blue: 1, green: 1 };

/** @returns {{ player: number, option: string } | null} */
export function chooseBotMove(state, rand = Math.random) {
  const pend = state.pending;
  if (!pend) return null;
  const p = state.players[pend.player];
  const ctx = contextFor(state);
  const move = o => ({ player: pend.player, option: o.id });
  const best = (opts, score) => opts.reduce((a, b) => (score(b) > score(a) ? b : a));

  switch (pend.kind) {
    case 'setup': {
      const total = pend.options.reduce((s, o) => s + (SETUP_WEIGHTS[o.value] || 1), 0);
      let r = rand() * total;
      for (const o of pend.options) { r -= SETUP_WEIGHTS[o.value] || 1; if (r <= 0) return move(o); }
      return move(pend.options[0]);
    }
    case 'place':
      return move(best(pend.options, o => {
        const a = actionAt(state, o.q, o.i);
        const qid = state.quadrants[o.q];
        const hustle = p.members.filter(u => state.cards[u].def === 'gold.hustler' && state.cards[u].color === qid).length;
        return a.estimate(ctx, p) + hustle + rand() * 1.2;
      }));
    case 'buy': {
      const canUse = c => [c.def, c.copy].some(id => id && defById(id).botActivate?.(ctx, p));
      const use = pend.options.find(o => o.kind === 'use' && canUse(state.cards[o.uid]));
      if (use) return move(use);
      const tiers = pend.options.filter(o => o.kind === 'tier');
      const tierOf = o => TIERS.find(t => t.key === o.tier);
      const last = (state.round === 3 || state.endEarly) && p.left === 0;
      if (last && tiers.length) return move(best(tiers, o => tierOf(o).get));
      const cards = pend.options.filter(o => o.kind === 'card').map(o => {
        const d = cardDef(state, o.uid), c = d.s + d.w;
        const v = d.f * 1.4 + (d.text.startsWith('Stand-in') ? 0 : 1.6) + c * 0.3 - (state.round === 3 ? c * 0.5 : 0) + rand() * 0.5;
        return { o, v };
      });
      const top = cards.length ? cards.reduce((a, b) => (b.v > a.v ? b : a)) : null;
      if (top && top.v > 1.5) return move(top.o);
      const big = tiers.find(o => tierOf(o).get === 6);
      if (big) return move(big);
      const mid = tiers.find(o => tierOf(o).get === 3);
      const held = Object.values(p.res).reduce((a, b) => a + b, 0);
      if (mid && state.round >= 2 && held >= 7) return move(mid);
      return move(pend.options.find(o => o.kind === 'pass'));
    }
    case 'pay':
      return move(pend.options.find(o => o.default) || pend.options[0]);
    case 'choose':
      return move(best(pend.options, o => (o.hint || 0) + rand() * 0.01));
    default:
      return move(pend.options[0]);
  }
}

// Not used by bots, exported for tests that want follower plans per tier.
export const tierPlans = (state, p) => TIERS.map(t => followerPlan(state, p, t));
