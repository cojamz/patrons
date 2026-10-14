// Test helpers for the v4 engine: build a game, set it up by hand, then drive it by option id.
import { createGame, applyMove, resume, actionAt, followers } from '../../../engine/v4/core.js';

/**
 * Build a game and put it in a hand-made position.
 * - res: per player, resources to set (others 0)
 * - members: per player, member def ids to hand over (taken out of the pile/shop)
 * - shop: def ids to put face up (in order); the old face-up cards go back on top of the pile
 * - queue: tasks to run from (default: player `turn`'s turn)
 */
export function scene({
  n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [],
  turn = 0, queue = null, discount = [], pileFirst = null,
} = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed });
  s.queue = [];
  s.pending = null;
  s.round = round;
  s.slots = {};
  s.order = [];
  s.log = [];
  s.players.forEach((p, i) => {
    for (const r of s.resources) p.res[r] = 0;
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0;
    p.discount = discount[i] || 0;
    p.left = 3;
  });
  // all cards back to the pile, then deal out exactly what the scene asks for
  s.pile = [...s.shop, ...s.pile];
  s.shop = [];
  const grab = def => {
    const k = s.pile.findIndex(u => s.cards[u].def === def);
    if (k < 0) throw new Error(`no free card of ${def}`);
    return s.pile.splice(k, 1)[0];
  };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  if (shop) for (const d of shop) s.shop.push(grab(d));
  if (pileFirst) { const u = pileFirst.map(grab); s.pile.unshift(...u); }
  if (!shop) while (s.shop.length < 6 && s.pile.length) s.shop.push(s.pile.shift());
  s.queue = queue || [{ t: 'turn', p: turn }];
  return resume(s);
}

/** uid of the first card with this def owned by player i (or in the shop if i is 'shop'). */
export function uidOf(s, def, where) {
  const list = where === 'shop' ? s.shop : where === 'pile' ? s.pile : s.players[where].members;
  const u = list.find(x => s.cards[x].def === def);
  if (u === undefined) throw new Error(`${def} not found in ${where}`);
  return u;
}

export function move(s, option) {
  if (!s.pending) throw new Error('game is over');
  return applyMove(s, { player: s.pending.player, option });
}

/** Apply a series of option ids (or predicates on options) for whoever is pending. */
export function play(s, ...opts) {
  for (const o of opts) {
    if (typeof o === 'function') {
      const hit = s.pending.options.find(o);
      if (!hit) throw new Error(`no option matched; have ${s.pending.options.map(x => x.id).join(', ')}`);
      s = move(s, hit.id);
    } else s = move(s, o);
  }
  return s;
}

/** Place the pending player's worker on the named action. */
export function take(s, name) {
  if (s.pending?.kind !== 'place') throw new Error(`not placing: ${s.pending?.kind}`);
  const o = s.pending.options.find(x => actionAt(s, x.q, x.i).name === name);
  if (!o) throw new Error(`${name} is not open; open: ${s.pending.options.map(x => x.label).join(', ')}`);
  return move(s, o.id);
}

export const ids = s => (s.pending ? s.pending.options.map(o => o.id) : []);
export const hasOpt = (s, id) => ids(s).includes(id);
export const fol = (s, i) => followers(s, s.players[i]);
export const total = res => Object.values(res).reduce((a, b) => a + b, 0);
export const zero = { gold: 0, red: 0, blue: 0, green: 0 };
