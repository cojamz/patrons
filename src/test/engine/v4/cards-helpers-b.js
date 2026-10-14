// Helpers for the second card verifier (cards-market/thieves/trading/echo.test.js): a hand-built position on any
// table with an exact face-up row, cost pinning, and the shared "does a log line name this card" check.
import { beforeEach, afterEach } from 'vitest';
import { createGame, resume } from '../../../engine/v4/core.js';
import { pinCosts } from './helpers.js';
import { linesNaming } from './cards-helpers.js';

/**
 * A position on `quads`. res/members/bonus per player; shop: def ids face up in order (the row is left short
 * otherwise; a card a player holds is skipped); pileFirst: def ids on top of the pile; queue: tasks to run (default P1's turn).
 */
export function table(quads, {
  n = 2, seed = 7, round = 1, res = [], members = [], shop = [], bonus = [], queue = null, pileFirst = null, left = 3, rules = {}, discount = [],
} = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: quads, rules });
  Object.assign(s, { queue: [], pending: null, round, slots: {}, squats: {}, order: [], log: [] });
  delete s.echo;
  s.players.forEach((p, i) => {
    p.res = Object.fromEntries(s.resources.map(r => [r, 0]));
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = discount[i] || 0; p.left = left;
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(`no free card of ${def}`); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  // a face-up card someone already holds is left out of the row (one copy of each member)
  for (const d of shop) if (s.pile.some(u => s.cards[u].def === d)) s.shop.push(grab(d));
  if (pileFirst) s.pile.unshift(...pileFirst.map(grab));
  s.queue = queue || [{ t: 'turn', p: 0 }];
  return resume(s);
}

/** Pin these member costs ([color, any]) around every test in the file. */
export function useCosts(costs) {
  let restore = null;
  beforeEach(() => { restore = pinCosts(costs); });
  afterEach(() => { restore?.(); restore = null; });
}

/** Log lines that name a card as acting (the shared rule in cards-helpers.js). */
export const named = (s, name) => linesNaming(s.log, name);
export const uidIn = (s, def, where) => {
  const list = where === 'shop' ? s.shop : where === 'pile' ? s.pile : s.players[where].members;
  const u = list.find(x => s.cards[x].def === def);
  if (u === undefined) throw new Error(`${def} not in ${where}`);
  return u;
};
export const owns = (s, i, def) => s.players[i].members.some(u => s.cards[u].def === def || s.cards[u].copy === def);
