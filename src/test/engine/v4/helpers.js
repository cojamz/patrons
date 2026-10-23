// Test helpers for the v4 engine: build a game, set it up by hand, then drive it by option id.
import { beforeEach, afterEach } from 'vitest';
import { createGame, applyMove, resume, actionAt, followers, pileKeyOf, pileOf, shopSize, ROW_SIZE } from '../../../engine/v4/core.js';
import { defById, quadrant } from '../../../engine/v4/content/index.js';
import { STRAYS, stray } from './stray.js';

/**
 * Build a game and put it in a hand-made position.
 * - res: per player, resources to set (others 0)
 * - members: per player, member def ids to hand over (taken out of the pile/shop)
 * - shop: def ids to put face up (in order); the old face-up cards go back on top of the pile
 * - queue: tasks to run from (default: player `turn`'s turn)
 */
export function scene({
  n = 2, seed = 7, round = 1, res = [], members = [], shop = null, bonus = [],
  turn = 0, queue = null, discount = [], pileFirst = null, quadrants,
} = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, ...(quadrants ? { quadrants } : {}) });
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
    if (k < 0) { if (!STRAYS.has(def)) throw new Error(`no free card of ${def}`); return stray(s, def); }
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

// Paying auto-picks the default way to pay unless a test asks to choose ({ manualPay: true }).
export function move(s, option, { manualPay = false } = {}) {
  if (!s.pending) throw new Error('game is over');
  let next = applyMove(s, { player: s.pending.player, option });
  if (!manualPay && next.pending?.kind === 'pay') next = applyMove(next, { player: next.pending.player, option: next.pending.options.find(o => o.default).id });
  return next;
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

/** An action's printed name from its id ("gold.rush" → its current name); a name passes through. Tests pick spaces
 *  by id, so renaming a space never breaks them. */
export function actionName(idOrName) {
  if (!String(idOrName).includes('.')) return idOrName;
  const [q, key] = idOrName.split('.');
  const a = quadrant(q).actions.find(x => x.key === key);
  if (!a) throw new Error(`no action ${idOrName}`);
  return a.name;
}

/** Place the pending player's worker on the action with this id ("gold.rush") or name. */
export function take(s, name) {
  if (s.pending?.kind !== 'place') throw new Error(`not placing: ${s.pending?.kind}`);
  const want = actionName(name);
  // spaces only: a member's `use:` is offered beside them on your turn
  const o = s.pending.options.find(x => x.kind === 'slot' && actionAt(s, x.q, x.i).name === want);
  if (!o) throw new Error(`${name} is not open; open: ${s.pending.options.map(x => x.label).join(', ')}`);
  return move(s, o.id);
}

export const ids = s => (s.pending ? s.pending.options.map(o => o.id) : []);
export const hasOpt = (s, id) => ids(s).includes(id);
export const fol = (s, i) => followers(s, s.players[i]);
export const total = res => Object.values(res).reduce((a, b) => a + b, 0);
export const zero = { gold: 0, red: 0, blue: 0, green: 0 };

// Member costs [color part, wild part] the unit tests are written against. Balance changes to the real
// defs don't touch these tests: useTestCosts() pins this table for every test in a file and restores
// the real costs afterwards. The fuzz tests run on the real costs.
export const TEST_COSTS = {
  'gold.midas': [3, 2], 'gold.banker': [2, 1], 'gold.prospector': [2, 1], 'gold.taxman': [1, 1],
  'gold.merchant': [1, 1], 'gold.thrift': [2, 0], 'gold.coinpurse': [1, 1], 'gold.underdog': [1, 1],
  'gold.tinker': [1, 1], 'gold.investor': [2, 2], 'gold.jackpot': [3, 3], 'gold.speculator': [3, 2],
  'gold.tycoon': [3, 1], 'gold.seed': [2, 0], 'gold.hustler': [2, 1],
  'red.twins': [1, 1], 'red.bigfamily': [2, 2], 'red.volunteer': [0, 0], 'red.intern': [1, 0],
  'red.mentor': [3, 2], 'red.proselytizer': [3, 3], 'red.mob': [2, 1], 'red.recruiter': [1, 1],
  'red.drive': [1, 1], 'red.host': [1, 1], 'red.sponsor': [2, 1], 'red.crowd': [1, 0],
  'echo.doppel': [2, 2], 'red.patriarch': [3, 1], 'red.reserve': [1, 0],
  ...Object.fromEntries(['blue', 'green'].flatMap(q => [
    ['recruit', 1, 0], ['hand', 1, 1], ['helper', 2, 0], ['regular', 2, 1],
    ['devotee', 2, 2], ['elder', 3, 1], ['pillar', 3, 3], ['patron', 4, 2],
  ].map(([k, s, w]) => [`${q}.${k}`, [s, w]]))),
};

/** Override member costs; returns a function that restores the real ones. */
export function pinCosts(costs) {
  const saved = Object.keys(costs).map(id => { const d = defById(id); return [d, d.s, d.w]; });
  for (const [id, [s, w]] of Object.entries(costs)) Object.assign(defById(id), { s, w });
  return () => { for (const [d, s, w] of saved) Object.assign(d, { s, w }); };
}

/** Pin TEST_COSTS around every test in the calling file. */
export function useTestCosts() {
  let restore = null;
  beforeEach(() => { restore = pinCosts(TEST_COSTS); });
  afterEach(() => { restore?.(); restore = null; });
}

/** Two shops: the cheap row is full while its pile lasts; from round II the pricey row is too (10 face up at most). */
export function rowsFull(s) {
  const row = k => s.shop.filter(u => pileKeyOf(s, u) === k).length;
  const cheap = row('cheap') >= ROW_SIZE || !pileOf(s, 'cheap').length;
  return cheap && (s.round <= 1 || row('pricey') >= ROW_SIZE || s.shop.length >= shopSize(s) || !pileOf(s, 'pricey').length);
}
