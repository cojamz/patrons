// Patrons v4 engine. Pure and deterministic: state in, move in, state out.
// Everything runs through a task queue. When a task needs a decision, the engine stops and publishes
// state.pending = { player, kind, prompt, options:[{ id, label, kind, ... }] }. A move is { player, option }.
import { quadrant, defById, handlerById, defaultQuadrants, guestMembers } from './content/index.js';
import { shuffleInPlace } from './rng.js';
import { CUT, FULL_DECK } from './content/cull.js';
import { startEffects, stopEffects, abandonEffects, underCause } from './effects.js';

export const RING_VALUE = [2, 4, 6];
export const WORKERS = [3, 4, 5];
export const SHOP_SIZE = 8;
// Any colors, no stock limit. The three rounds remain the game clock.
export const TIERS = [
  { key: 'small', cost: 1, get: 1, colors: 1, label: '1 of anything' },
  { key: 'mid', cost: 5, get: 5, colors: 1, label: '5 of anything' },
  { key: 'top', cost: 10, get: 10, colors: 1, label: '10 of anything' },
];
/** How many buys of a limited tier are left (Infinity for unlimited tiers). */
export const tierLeft = (state, tier) => (tier.limited ? state.stock?.[tier.key] ?? 0 : Infinity);
const LOG_MAX = 300;
// Rule flags a table can toggle (sims flip them). release: once per round, on your turn, release one of your
// members (it goes to the bottom of the pile) for its colored part in its own color (not one recruited this round). guests: rule-bending guest
// members join the deck.
export const DEFAULT_RULES = { release: false, guests: true, cull: true };

// ---------- creation ----------

/**
 * @param {{ seats: { name?: string, kind?: 'human'|'bot' }[], seed?: number, quadrants?: string[], rules?: object }} opts
 */
export function createGame({ seats, seed = 1, quadrants, rules = {} }) {
  if (!Array.isArray(seats) || seats.length < 2 || seats.length > 4) throw new Error('Patrons needs 2 to 4 seats.');
  // as many spheres as players by default (Cory, 2026-10-15); a test or a sim may still pass any table of 2 to 4
  if (!quadrants) quadrants = defaultQuadrants(seats.length);
  if (!Array.isArray(quadrants) || quadrants.length < 2 || quadrants.length > 4) throw new Error('A table has 2 to 4 spheres.');
  const resources = quadrants.map(q => quadrant(q).resource);
  const zero = Object.fromEntries(resources.map(r => [r, 0]));
  const cards = {};
  let uid = 0;
  const table = { ...DEFAULT_RULES, ...(FULL_DECK.tests ? { cull: false } : {}), ...rules }; // tests: content/cull.js
  const dealt = def => !(table.cull && CUT.has(def.id)); // the cull (content/cull.js)
  for (const q of quadrants) for (const def of quadrant(q).members.filter(dealt))
    for (let k = 0; k < def.copies; k++) { cards[uid] = { uid, def: def.id }; uid++; }
  if (table.guests) for (const def of guestMembers().filter(dealt))
    for (let k = 0; k < def.copies; k++) { cards[uid] = { uid, def: def.id }; uid++; }
  const state = {
    v: 4, seed: seed >>> 0, rng: seed >>> 0, quadrants: [...quadrants], resources, rules: table,
    players: seats.map((s, i) => ({
      id: i, name: s.name || `P${i + 1}`, kind: s.kind || 'human', ...(s.emoji ? { emoji: String(s.emoji) } : {}), // emoji: the player's pick (display only)
      res: { ...zero }, bonus: 0, contest: 0, bought: 0, members: [], discount: 0, left: 0, turnRecruits: 0, final: null,
    })),
    cards, pile: Object.keys(cards).map(Number), shop: [],
    round: 0, slots: {}, squats: {}, order: [], turnIndex: 0, current: null,
    recruits: 0, stock: Object.fromEntries(TIERS.filter(t => t.limited).map(t => [t.key, t.stock(seats.length)])),
    // contests: each round's scoring as the engine decided it (see contestTable); turns: who has taken a turn this round
    contests: [], turns: [],
    queue: [], pending: null, log: [], moves: 0, over: false, ranking: null,
  };
  shuffleInPlace(state, state.pile);
  refill(state);
  // Round I's turn order is drawn now, before the starting picks, and the picks run in it (Cory, 2026-10-15: "it had us
  // pick resources THEN it randomized the order???"). Everyone is tied at round I, so it's random (Cory, 2026-10-14);
  // nothing between here and round I draws from the rng, so a seed deals the same order it always did.
  state.firstOrder = shuffleInPlace(state, state.players.map(p => p.id));
  state.startPool = [...state.quadrants];
  for (const id of [...state.firstOrder].reverse()) state.queue.push({ t: 'setupPick', p: id });
  state.queue.push({ t: 'round', r: 1 });
  log(state, `Round I's turn order: ${state.firstOrder.map(id => state.players[id].name).join(', ')}. Draft 1 resource each in reverse order; each color can be taken once.`);
  advance(state);
  return state;
}

// ---------- public API ----------

export function legalMoves(state) {
  if (!state.pending) return [];
  return state.pending.options.map(o => ({ player: state.pending.player, option: o.id }));
}

export function isLegal(state, move) {
  return !!(state.pending && move && move.player === state.pending.player && state.pending.options.some(o => o.id === move.option));
}

/** Returns a new state. Throws on an illegal move. */
export function applyMove(prev, move, { effects = false } = {}) {
  if (!isLegal(prev, move)) throw new Error(`Illegal move: ${JSON.stringify(move)}`);
  const state = structuredClone(prev);
  const task = state.queue.shift();
  state.pending = null;
  state.moves += 1;
  // effects (effects.js): what moved and why, for the table to play back; recorded only when asked (the play session)
  if (effects) startEffects(state, moveCause(state, task, move), { followers, worth: valueOf });
  try {
    resolveTask(state, task, move.option);
    clearFresh(state);
    advance(state);
  } catch (err) { if (effects) abandonEffects(); throw err; }
  if (effects) Object.defineProperty(state, 'effects', { value: stopEffects(), enumerable: false, configurable: true, writable: true });
  return state;
}
function moveCause(state, task, move) {
  const o = String(move.option);
  if (task.t === 'setupPick' && o.startsWith('color:')) return { kind: 'setup', pid: task.p, qid: o.slice(6) };
  if (o.startsWith('use:')) { const uid = Number(o.slice(4)); return { kind: 'member', pid: task.p, uid, def: state.cards[uid] ? state.cards[uid].def : null }; }
  return { kind: 'move', pid: task.p, option: o };
}

/**
 * Runs queued tasks until the next decision (or game over). For tools and tests that edit a state
 * directly and need the engine to pick up from there. Mutates and returns the state.
 */
export function resume(state) {
  state.pending = null;
  advance(state);
  return state;
}

// ---------- derived values (also used by the UI) ----------

// A Doppelganger becomes a copy of the member card it copies: its follower value and member count too.
const valueOf = card => (card.copy ? Math.max(defById(card.def).f, defById(card.copy).f) : defById(card.def).f);
export const followers = (state, p) => 1 + p.bonus + p.members.reduce((s, u) => s + valueOf(state.cards[u]), 0);
// Printed followers also count as members; explicit member counts (Revelers) still apply.
// Bonus followers never enter this value, and a copied card counts its effective printed value.
const printedMembers = def => Math.max(def.f || 0, def.n ?? 1);
const countOf = card => Math.max(printedMembers(defById(card.def)), card.copy ? printedMembers(defById(card.copy)) : 0);
export const memberWeight = (state, uid) => countOf(state.cards[uid]);
export const memberCount = (state, p) => p.members.reduce((s, u) => s + countOf(state.cards[u]), 0);
export const countMembersOfColor = (state, p, q) => p.members.reduce((s, u) => {
  const c = state.cards[u]; return s + (defById(c.def).quadrant === q ? countOf(c) : 0);
}, 0);
export const cardDef = (state, uid) => defById(state.cards[uid].def);
export function actionAt(state, q, i) { return quadrant(state.quadrants[q]).actions[i]; }
/** A space is open from its ring's round on, and shuts after its lastRound if it has one (Overtime: rounds I–II only, Cory 2026-10-15). */
export const spaceOpen = (a, round) => a.ring <= round && !(a.lastRound && round > a.lastRound);
export function openSlots(state) {
  const out = [];
  state.quadrants.forEach((qid, q) => quadrant(qid).actions.forEach((a, i) => {
    if (spaceOpen(a, state.round) && state.slots[`${q}-${i}`] === undefined) out.push([q, i]);
  }));
  return out;
}

// ---------- the price of a member: one rule for every recruit ----------
// A member's colored part is paid in its quadrant's resource. Some sphere drafts still relabel
// def.quadrant to a color name, so a bare color is accepted too.
const colorOf = def => { try { return quadrant(def.quadrant).resource; } catch { return def.quadrant; } };
// The colored part may be paid in any colors when the member's color isn't on the table, or when one of your
// members says so (Freelancer: flag anyColorPart).
const colorPartFree = (state, p, def) => !state.resources.includes(colorOf(def)) || sumMemberFlag(state, p, 'anyColorPart') > 0;
/**
 * What p owes for a member, in units: { q, colored, total, worth }. q is the colored part's resource (null when no
 * colored part is owed), colored the units of q owed, total the units owed in all, worth(c) what one coin of c pays.
 * Discounts (Intro Offer and the like, p.discount) and cost reductions (Sponsor) come off the colored part first
 * (Cory: you choose where a discount comes off; the colored part first is always at least as good). Gold you spend
 * counts double with Penny Pincher (flag goldPaysDouble), toward either part. how.anyColors: the colored part in any
 * colors (Snap Up); how.half: half the printed cost, rounded down, in any colors (Half Price).
 */
function priceParts(state, p, def, how = {}) {
  let s = def.s, w = def.w;
  if (how.half) { w = Math.floor((s + w) / 2); s = 0; }
  if (how.anyColors || colorPartFree(state, p, def)) { w += s; s = 0; }
  const off = (p.discount || 0) + sumMemberFlag(state, p, 'costReduction');
  const colored = Math.max(0, s - off), total = Math.max(0, s + w - off);
  const goldDouble = sumMemberFlag(state, p, 'goldPaysDouble') > 0;
  return { q: colored > 0 ? colorOf(def) : null, colored, total, worth: c => (c === 'gold' && goldDouble ? 2 : 1) };
}
const unitsOf = (v, worth) => Object.entries(v).reduce((t, [c, n]) => t + (n || 0) * worth(c), 0);
/** Does paying the coins `v` cover the price? The colored units from q, the rest from anything (q's spare too). */
function memberPayOk(state, p, def, v, how) {
  const { q, colored, total, worth } = priceParts(state, p, def, how);
  return (!q || (v[q] || 0) * worth(q) >= colored) && unitsOf(v, worth) >= total;
}
/**
 * The exact price p pays for member uid right now, after every discount and rule-changer, and what's missing:
 * { color, colored, total, afford, short }. color: the resource the colored part is owed in (null when none is);
 * colored: units of it owed; total: units owed in all (a Penny Pincher gold pays 2). short (null when affordable):
 * { [color]: coins of that color, any: coins of any color, total, text: "4 green" | "2 gold, 1 any" }.
 * The buy step, the pay choices, Snap Up, Half Price, Talent Scout and the shop's "need" all read this.
 */
export function memberPrice(state, p, uid, how = {}) {
  const def = cardDef(state, uid);
  const { q, colored, total, worth } = priceParts(state, p, def, how);
  const res = p.res;
  const haveQ = q ? (res[q] || 0) * worth(q) : 0;
  const shortQ = q ? Math.ceil(Math.max(0, colored - haveQ) / worth(q)) : 0;
  const shortAny = Math.max(0, total - unitsOf(res, worth) - shortQ * (q ? worth(q) : 1));
  const afford = shortQ === 0 && shortAny === 0;
  let short = null;
  if (!afford) {
    const text = [shortQ ? `${shortQ} ${q}` : '', shortAny ? `${shortAny} any` : ''].filter(Boolean).join(', ');
    short = { ...(q ? { [q]: shortQ } : {}), any: shortAny, total: shortQ + shortAny, text };
  }
  return { color: q, colored, total, afford, short };
}
/** A way p can pay for member uid now ({ color: n }), or null if p can't: the colored part from its color, the rest
 *  from the colors p holds most of, gold last (gold scores the Crown). */
export function paymentPlan(state, p, uid, how = {}) {
  const { q, colored, total, worth } = priceParts(state, p, cardDef(state, uid), how);
  const res = { ...p.res };
  const spend = Object.fromEntries(Object.keys(res).map(r => [r, 0]));
  let paid = 0;
  if (q && colored > 0) {
    const k = Math.ceil(colored / worth(q));
    if ((res[q] || 0) < k) return null;
    res[q] -= k; spend[q] = (spend[q] || 0) + k; paid += k * worth(q);
  }
  while (paid < total) {
    const c = Object.keys(res).filter(r => r !== 'gold' && res[r] > 0).sort((a, b) => res[b] - res[a])[0] || (res.gold > 0 ? 'gold' : null);
    if (!c) return null;
    res[c] -= 1; spend[c] += 1; paid += worth(c);
  }
  return spend;
}

// ---------- choosing how to pay ----------
// Every way to pay that is legal and has no wasted coin. The player picks one; the plan above is the default.
function vectors(res, keys, maxTotal, exactTotal) {
  const out = [];
  const walk = (i, left, cur) => {
    if (i === keys.length) { if (exactTotal === undefined || left === 0) out.push({ ...cur }); return; }
    for (let k = 0; k <= Math.min(res[keys[i]], left); k++) { cur[keys[i]] = k; walk(i + 1, left - k, cur); }
    cur[keys[i]] = 0;
  };
  walk(0, exactTotal ?? maxTotal, {});
  return out;
}
const vecKey = (state, v) => state.resources.map(r => v[r] || 0).join('-');
/** Every way p can pay for member uid now (no coin wasted), the default way first. how: as memberPrice. */
export function paymentChoices(state, p, uid, how = {}) {
  const def = cardDef(state, uid);
  const keys = state.resources;
  if (!memberPrice(state, p, uid, how).afford) return [];
  const all = vectors(p.res, keys, priceParts(state, p, def, how).total).filter(v => memberPayOk(state, p, def, v, how));
  const minimal = all.filter(v => keys.every(c => !v[c] || !memberPayOk(state, p, def, { ...v, [c]: v[c] - 1 }, how)));
  return orderChoices(state, minimal, paymentPlan(state, p, uid, how), p);
}
// Resources that count as any color when buying followers (Gold: "gold is money").
const wildColors = state => state.quadrants.map(quadrant).filter(q => q.wildInFollowerBuys).map(q => q.resource);
const colorsCovered = (state, v) => {
  const wild = wildColors(state);
  let n = 0;
  for (const c of state.resources) if (v[c] > 0) n += wild.includes(c) ? v[c] : 1;
  return n;
};
export function followerChoices(state, p, tier) {
  if (tierLeft(state, tier) <= 0) return [];
  const keys = state.resources;
  const all = vectors(p.res, keys, tier.cost, tier.cost).filter(v => colorsCovered(state, v) >= tier.colors);
  return orderChoices(state, all, followerPlan(state, p, tier), p);
}
/**
 * Colors a player shouldn't spend by default: those where they lead or tie a contest that counts that color
 * (a quadrant whose score drops when they hold one less of it). Display/default only; any legal spend stays legal.
 */
function protectedColors(state, p) {
  const ctx = ctxFor(state);
  const out = new Set();
  for (const qid of state.quadrants) {
    const q = quadrant(qid);
    const r = q.resource;
    if (!r || !(p.res[r] > 0)) continue;
    let mine, top, less;
    try {
      mine = q.scoring.score(ctx, p);
      top = Math.max(...state.players.map(o => q.scoring.score(ctx, o)));
      p.res[r] -= 1;
      try { less = q.scoring.score(ctx, p); } finally { p.res[r] += 1; }
    } catch { continue; }
    if (less < mine && top > 0 && mine >= top) out.add(r);
  }
  return out;
}

/**
 * How a payment `v` would move p's rims: { lost } the contests p leads or ties now and wouldn't after paying (the
 * others' scores stay put), and { near } the coins spent from colors whose contest p is chasing (behind by 3 or
 * less). Display/default only.
 */
function rimCost(state, p) {
  const ctx = ctxFor(state);
  const rims = [];
  for (const qid of state.quadrants) {
    const q = quadrant(qid);
    if (!q.resource || !state.resources.includes(q.resource)) continue;
    try {
      const mine = q.scoring.score(ctx, p);
      const best = Math.max(0, ...state.players.filter(o => o !== p).map(o => q.scoring.score(ctx, o)));
      rims.push({ q, r: q.resource, best, held: mine > 0 && mine >= best, tie: mine > 0 && mine === best, near: !(mine > 0 && mine >= best) && best > 0 });
    } catch { /* a scoring rule that can't be read here */ }
  }
  // members whose game-end bonus counts what you hold (Kingpin: +1 per 2 magenta; Magnate): spending can cut it, and
  // Kingpin paid +0 with no warning (tester A, live panel r1)
  const endBonus = () => {
    const out = [];
    for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) {
      if (!def.onGameEnd) continue;
      try { out.push([def.name, def.onGameEnd(ctx, p, wrap(state, state.cards[uid])) || 0]); } catch { /* unread */ }
    }
    return out;
  };
  const ends0 = endBonus();
  return v => {
    let lost = 0, near = 0;
    const colors = [], ties = [], cuts = [];
    const saved = { ...p.res };
    try {
      for (const c in v) p.res[c] = (p.res[c] || 0) - (v[c] || 0);
      if (ends0.length && Object.values(v).some(n => n > 0)) endBonus().forEach(([name, n], k) => {
        if (ends0[k] && n < ends0[k][1]) { cuts.push({ member: name, from: ends0[k][1], to: n }); lost++; }
      });
      // every rim, not only the spent color's: paying silver can break your only full set (Most full sets, keyed to
      // yellow), and the default way paid it without a word (live panel r1)
      const any = Object.values(v).some(n => n > 0);
      for (const x of rims) {
        if (!any) continue;
        const now = x.q.scoring.score(ctx, p);
        if (x.held && !(now > 0 && now >= x.best)) { lost++; colors.push(x.r); if (x.tie) ties.push(x.r); }
        if (v[x.r] > 0 && x.near && x.best - now <= 3 + (v[x.r] || 0)) near += v[x.r];
      }
    } catch { /* leave it unranked */ } finally { for (const c in p.res) if (!(c in saved)) delete p.res[c]; Object.assign(p.res, saved); }
    return { lost, near, colors, ties, cuts };
  };
}

function orderChoices(state, list, preferred, p) {
  const pk = preferred ? vecKey(state, preferred) : null;
  const guard = p ? protectedColors(state, p) : new Set();
  const risk = v => [...guard].reduce((s, c) => s + (v[c] || 0), 0);
  const seen = new Set();
  const out = [];
  for (const v of list) { const k = vecKey(state, v); if (!seen.has(k)) { seen.add(k); out.push(v); } }
  // The default way to pay comes first (Claude, under Cory's go-with-your-gut, 2026-10-15, wave-2 tester A #5): it
  // breaks as few rim leads or ties you hold as it can (none, when any legal way keeps them all); then it spends as
  // few coins of colors whose rim you lead or tie, then of colors whose rim you're chasing; then as little gold (wild,
  // and it scores its own rim); then the usual plan (surplus colors first). Every legal way stays on the sheet.
  const cost = p ? rimCost(state, p) : () => ({ lost: 0, near: 0 });
  const rank = new Map(out.map(v => [v, cost(v)]));
  out.sort((a, b) => rank.get(a).lost - rank.get(b).lost || risk(a) - risk(b) || rank.get(a).near - rank.get(b).near
    || (a.gold || 0) - (b.gold || 0) || (vecKey(state, b) === pk) - (vecKey(state, a) === pk));
  return out;
}
/**
 * A way to pay, as an option. lost (display only): the colors whose contest p leads or ties now and wouldn't after
 * paying this way, so the screen can say so and never pays it without asking (wave-2 testers A#4, B#2).
 */
function payOption(state, v, i, lost = null) {
  const got = lost ? lost(v) : { colors: [], ties: [] };
  const breaks = got.colors, ties = got.ties || [], cuts = got.cuts || [];
  // ties: the broken ones that were a share of the lead, so the sheet says "your tie for most gold", never "your lead"
  // when you only tied (blind tester B read the warning as wrong: they didn't lead)
  return { id: `pay:${vecKey(state, v)}`, label: payString(v), kind: 'pay', spend: Object.fromEntries(state.resources.map(r => [r, v[r] || 0])), default: i === 0, ...(breaks.length ? { breaks } : {}), ...(ties.length ? { ties } : {}), ...(cuts.length ? { cuts } : {}) };
}

/** Paying for a follower buy: needs `colors` different resources; each wild one (gold) covers a color. Gold is spent last. */
export function followerPlan(state, p, tier) {
  if (tierLeft(state, tier) <= 0) return null;
  const res = { ...p.res };
  const spend = Object.fromEntries(Object.keys(res).map(r => [r, 0]));
  const order = () => Object.keys(res).filter(c => res[c] > 0).sort((a, b) => (a === 'gold') - (b === 'gold') || res[b] - res[a]);
  const wild = wildColors(state);
  let need = tier.colors;
  for (const c of order().filter(c => !wild.includes(c)).slice(0, need)) { res[c]--; spend[c]++; need--; }
  for (const c of wild) while (need > 0 && res[c] > 0) { res[c]--; spend[c]++; need--; }
  if (need > 0) return null;
  let left = tier.cost - tier.colors;
  while (left > 0) { const c = order()[0]; if (!c) return null; res[c]--; spend[c]++; left--; }
  return spend;
}

// ---------- task queue ----------

function advance(state) {
  while (state.queue.length) {
    const task = state.queue[0];
    const ask = inputFor(state, task);
    if (ask) {
      if (ask.options.length) { const { onEmpty, ...shown } = ask; void onEmpty; state.pending = { player: task.p, ...shown }; return; }
      // nothing to choose: skip the task quietly
      state.queue.shift();
      if (ask.onEmpty) ask.onEmpty();
      continue;
    }
    state.queue.shift();
    runTask(state, task);
    clearFresh(state);
  }
  state.pending = null;
}

// Tasks that need a decision describe it here; all others return null and just run.
function inputFor(state, task) {
  const p = task.p !== undefined ? state.players[task.p] : null;
  switch (task.t) {
    // the preview's stop (preview.js): the round's turns wait behind it, there for content to read (Crunch Time), never run
    case 'previewHold': return { kind: 'hold', prompt: '', options: [{ id: 'hold', label: '', kind: 'hold' }] };
    case 'setupPick':
      if (state.startPool?.length === 1) return null;
      return {
        kind: 'setup', prompt: `${p.name}: draft 1 resource`,
        options: (state.startPool || state.quadrants).map(q => ({ id: `color:${q}`, label: quadrant(q).name, kind: 'color', value: q })),
      };
    case 'place': {
      const slots = [
        ...openSlots(state).filter(([q, i]) => !task.ring || actionAt(state, q, i).ring <= task.ring)
          .map(([q, i]) => ({ id: `slot:${q}-${i}`, label: actionAt(state, q, i).name, kind: 'slot', q, i })),
        ...squatSlots(state, p).filter(([q, i]) => !task.ring || actionAt(state, q, i).ring <= task.ring)
          .map(([q, i]) => ({ id: `squat:${q}-${i}`, label: `${actionAt(state, q, i).name} (join ${state.players[state.slots[`${q}-${i}`]].name})`, kind: 'slot', squat: true, q, i })),
      ];
      // a member's activation can be used any time on your own turn (Cory, 2026-10-15): here too, beside the spaces
      // (only while there is a space to take, so a use is never forced on you)
      return { kind: 'place', prompt: `${p.name}: place a minion`, options: slots.length ? [...slots, ...useOptions(state, p)] : [], onEmpty: () => { p.left -= 1; log(state, `No open space: ${p.name}'s minion sits out.`); } };
    }
    case 'buy': {
      // a second buy (Big Spender) is offered only after a real first buy, while an unspent one is held
      if (task.extra && !(p.turnBuys > 0 && allowance(state, p, 'extraBuy'))) return { kind: 'buy', prompt: '', options: [] };
      const opts = [];
      for (const uid of state.shop) if (paymentChoices(state, p, uid).length)
        opts.push({ id: `card:${uid}`, label: cardDef(state, uid).name, kind: 'card', uid });
      // the top of the pile, for a player who can reach it (Insider: flag pileReach)
      for (const uid of state.pile.slice(0, pileReach(state, p))) if (paymentChoices(state, p, uid).length)
        opts.push({ id: `card:${uid}`, label: `${cardDef(state, uid).name} (from the pile)`, kind: 'card', uid, fromPile: true });
      TIERS.forEach(t => { if (followerChoices(state, p, t).length) opts.push({ id: `tier:${t.key}`, label: `+${t.get} followers`, kind: 'tier', tier: t.key }); });
      for (const uid of p.members) {
        const c = state.cards[uid], d = defById(c.def);
        // a Doppelganger offers what it copies too
        const eff = effectiveDefs(c);
        opts.push(...useOptions(state, p, [uid]));
        if (eff.some(e => e.toggle)) opts.push({ id: `toggle:${uid}`, label: `${d.name}: switch ${c.on === false ? 'on' : 'off'}`, kind: 'toggle', uid });
      }
      if (canRelease(state, p)) for (const uid of p.members) {
        if (!canRelease(state, p, uid)) continue;
        const d = cardDef(state, uid), back = releaseRefund(state, uid);
        if (back.n > 0) opts.push({ id: `release:${uid}`, label: `Release ${d.name} for ${back.label}`, kind: 'release', uid, refund: back.n, color: back.color });
      }
      const real = opts.filter(o => o.kind === 'card' || o.kind === 'tier' || o.kind === 'use' || o.kind === 'release');
      if (!real.length) return { kind: 'buy', prompt: '', options: [], onEmpty: task.extra ? undefined : () => log(state, `${p.name} couldn't buy anything.`) };
      opts.push({ id: 'pass', label: 'Pass', kind: 'pass' });
      return { kind: 'buy', extra: !!task.extra, prompt: task.extra ? `${p.name}: buy again (Big Spender), or pass` : `${p.name}: recruit a member, buy followers, or pass`, options: opts };
    }
    case 'choose': {
      // only the options whose cards are still where they were when the choice was queued (see liveOptions)
      // an answer that spends your coins (option.spend, or a pay option's value) says which leads it gives up (breaks),
      // worked out when it's shown, so a space's payment warns like the pay sheet does (panel tester C #1)
      const options = withBreaks(state, p, liveOptions(state, task));
      // count: a counted pick's progress; blocked: { [player id]: why you can't pick them now } (a steal's limit)
      if (options.length || !task.options.length) return { kind: 'choose', prompt: task.prompt, options, ...(task.count ? { count: task.count } : {}), ...(task.blocked ? { blocked: task.blocked } : {}) };
      return {
        kind: 'choose', prompt: task.prompt, options: [],
        onEmpty: () => log(state, `${task.prompt.split(':')[0]}: nothing left to choose (${p.name}'s options were taken or moved first), so nothing happens.`),
      };
    }
    case 'release': {
      const opts = [];
      for (const c of state.resources) {
        // target: your own stack of that color takes one (the board picker); "all" keeps its button while more are left
        opts.push({ id: `all:${c}`, label: `All ${task.left} as ${c}`, kind: 'color', value: c, hint: -(p.res[c] || 0), ...(task.left === 1 ? { target: { res: c } } : {}) });
        if (task.left > 1) opts.push({ id: `one:${c}`, label: `1 ${c}`, kind: 'color', value: c, hint: -(p.res[c] || 0) - 0.5, target: { res: c } });
      }
      return { kind: 'choose', prompt: `${p.name}: take ${task.left} more from the release, in any colors`, options: opts };
    }
    case 'pay': {
      const list = task.uid !== undefined ? paymentChoices(state, p, task.uid) : followerChoices(state, p, TIERS.find(t => t.key === task.tier));
      const what = task.uid !== undefined ? cardDef(state, task.uid).name : `${TIERS.find(t => t.key === task.tier).get} followers`;
      const lost = list.length ? rimCost(state, p) : null;
      return {
        kind: 'pay', prompt: `${p.name}: choose how to pay for ${what}`, ...(task.uid !== undefined ? { uid: task.uid } : { tier: task.tier }),
        options: [...list.map((v, i) => payOption(state, v, i, lost)), { id: 'back', label: 'Back', kind: 'back' }],
      };
    }
    default:
      return null;
  }
}

/**
 * `use:` options: p's members (all, or `uids`) with an activation not used yet; a Doppelganger offers what it copies.
 * idle: true when using it now would change nothing (Safecracker's half of 1 magenta), so the screen can mute it.
 * Worked out for people's seats only (a dry run per option; bots don't read it).
 */
function useOptions(state, p, uids = p.members) {
  const out = [];
  for (const uid of uids) {
    const c = state.cards[uid];
    if (!c.used && effectiveDefs(c).some(e => e.activate)) {
      out.push({ id: `use:${uid}`, label: `Use ${defById(c.def).name}`, kind: 'use', uid, ...(p.kind !== 'bot' && useIdle(state, p, uid) ? { idle: true } : {}) });
    }
  }
  return out;
}
/** Would using p's member uid right now change nothing? A dry run on a copy: no resource, follower, member, discount,
 *  minion or shop changes anywhere, and nothing queued to decide or do. */
export function useIdle(state, p, uid) {
  try {
    const s = structuredClone({ ...state, log: [], pending: null, queue: [], notes: undefined });
    const look = x => JSON.stringify([x.players.map(o => [o.res, o.bonus, o.discount || 0, o.members, o.left]), x.shop, x.pile.length]);
    const before = look(s);
    useMember(s, s.players[p.id], uid, { t: 'idle-check' });
    if (s.queue.some(t => t.t !== 'idle-check')) return false;
    return look(s) === before;
  } catch { return false; }
}
/**
 * Use a member's activation now. Its whole effect resolves first, its choices included (a Stunt Double copying Open
 * House asks "which of the cheapest?" right away), and then `resume` (the step the player was in: this placement or
 * this buy) comes back with fresh options. Before the gut call of 2026-10-15 the buy step came back first, so the
 * choice waited until after the player's next buy.
 */
function useMember(state, p, uid, resume) {
  const c = state.cards[uid];
  c.used = true;
  const act = effectiveDefs(c).find(e => e.onActivate);
  const before = traceSnapshot(state);
  // used beside the spaces: this turn's minion is still to land, so a space must stay free for it (spareSpace, purple.js)
  if (resume.t === 'place') state.unplaced = 1;
  try { act.onActivate(ctxFor(state), p, wrap(state, c)); } finally { delete state.unplaced; }
  traceChanges(state, before, p, act);
  const at = state.queue.findIndex(t => !t._fresh);
  state.queue.splice(at < 0 ? state.queue.length : at, 0, resume);
}

function resolveTask(state, task, optionId) {
  const p = state.players[task.p];
  switch (task.t) {
    case 'setupPick': {
      const q = optionId.slice('color:'.length);
      p.res[quadrant(q).resource] += 1;
      if (state.startPool) state.startPool = state.startPool.filter(id => id !== q);
      log(state, `${p.name} drafts +1 ${quadrant(q).resource}.`);
      return;
    }
    case 'place': {
      // using a member first: its whole effect resolves, then this placement comes back with fresh options
      if (optionId.startsWith('use:')) { useMember(state, p, Number(optionId.slice(4)), { ...task }); return; }
      const squat = optionId.startsWith('squat:');
      const [q, i] = optionId.slice(optionId.indexOf(':') + 1).split('-').map(Number);
      const key = `${q}-${i}`;
      if (squat) {
        spendAllowance(state, p, 'squat');
        (state.squats[key] = state.squats[key] || []).push(p.id);
      } else state.slots[key] = p.id;
      p.lastSlot = { key, joined: squat }; // the minion Straggler moves (Cory, 2026-10-15: it's always the last one)
      p.left -= 1;
      const a = actionAt(state, q, i);
      log(state, squat ? `${p.name} joined ${state.players[state.slots[key]].name} on ${a.name} (${quadrant(state.quadrants[q]).name}).`
        : `${p.name} took ${a.name} (${quadrant(state.quadrants[q]).name}).`);
      state.queue.unshift({ t: 'act', p: p.id, q, i });
      return;
    }
    case 'buy': {
      if (optionId === 'pass') { log(state, `${p.name} passed.`); return; }
      const [kind, rest] = optionId.split(':');
      if (kind === 'card') {
        // One way to buy: always the payment step (the suggestion preselected), unless there's nothing to pay.
        const uid = Number(rest), list = paymentChoices(state, p, uid);
        const nothing = list.length === 1 && Object.values(list[0]).every(v => !v);
        if (nothing) { boughtOnce(state, p, task); recruit(state, p, uid, { free: false, spend: list[0] }); }
        else state.queue.unshift({ t: 'pay', p: p.id, uid, ...extraOf(task) });
        return;
      }
      if (kind === 'tier') {
        const tier = TIERS.find(t => t.key === rest);
        state.queue.unshift({ t: 'pay', p: p.id, tier: tier.key, ...extraOf(task) });
        return;
      }
      if (kind === 'use') { useMember(state, p, Number(rest), { t: 'buy', p: p.id, ...extraOf(task) }); return; }
      if (kind === 'toggle') {
        const c = state.cards[Number(rest)];
        c.on = c.on === false;
        log(state, `${p.name} switched ${defById(c.def).name} ${c.on ? 'on' : 'off'}.`);
        state.queue.unshift({ t: 'buy', p: p.id, ...extraOf(task) });
        return;
      }
      if (kind === 'release') {
        const uid = Number(rest), def = state.cards[uid].def;
        const back = release(state, p, uid);
        // the colors come first (a refund in any colors), then what reacts to the release (Social Climber), then this buy step again
        state.queue.unshift(...(back.color ? [] : [{ t: 'release', p: p.id, left: back.n }]), { t: 'released', p: p.id, def }, { t: 'buy', p: p.id, ...extraOf(task) });
        return;
      }
      throw new Error(`Bad buy option ${optionId}`);
    }
    case 'choose': {
      const o = task.options.find(x => x.id === optionId);
      const mark = fMark(state);
      handlerById(task.h)(ctxFor(state), p, o.value, task.data);
      // follower changes the choice made itself, under the name of what asked ("Cheap Seats: …")
      fCredit(state, mark, String(task.prompt).split(':')[0]);
      return;
    }
    case 'release': {
      const [how, c] = optionId.split(':');
      const n = how === 'all' ? task.left : 1;
      p.res[c] = (p.res[c] || 0) + n;
      log(state, `${p.name} takes ${n} ${c} from the release.`);
      if (task.left - n > 0) state.queue.unshift({ t: 'release', p: p.id, left: task.left - n });
      return;
    }
    case 'pay': {
      if (optionId === 'back') { state.queue.unshift({ t: 'buy', p: p.id, ...extraOf(task) }); return; }
      const v = Object.fromEntries(optionId.slice(4).split('-').map((n, i) => [state.resources[i], Number(n)]));
      boughtOnce(state, p, task);
      if (task.uid !== undefined) recruit(state, p, task.uid, { free: false, spend: v });
      else buyFollowers(state, p, TIERS.find(t => t.key === task.tier), v);
      return;
    }
    default:
      throw new Error(`Task ${task.t} takes no input`);
  }
}

function runTask(state, task) {
  const p = task.p !== undefined ? state.players[task.p] : null;
  switch (task.t) {
    case 'setupPick': return resolveTask(state, task, `color:${state.startPool[0]}`);
    case 'round': return underCause({ kind: 'round', round: task.r }, () => startRound(state, task.r));
    case 'turn': {
      state.current = p.id;
      (state.turns = state.turns || []).push(p.id);
      p.turnRecruits = 0;
      p.turnBuys = 0;
      // task.ring: a turn limited to spaces of that ring or lower (a weaker extra worker)
      state.queue.unshift({ t: 'place', p: p.id, ...(task.ring ? { ring: task.ring } : {}) }, { t: 'buy', p: p.id }, { t: 'buy', p: p.id, extra: true }, { t: 'endTurn', p: p.id });
      return;
    }
    case 'act': {
      const qid = state.quadrants[task.q];
      const a = actionAt(state, task.q, task.i);
      const ctx = ctxFor(state);
      // follower changes the space makes itself (Your Call), after its members' own (credited to them)
      const mark = fMark(state);
      const out = underCause({ kind: 'space', key: `${task.q}-${task.i}`, qid, pid: p.id }, () => {
        // hooks that react to taking a space (Hustler) fire first so follow-up choices keep their order;
        // afterRivalAction: a member reacting to a rival taking a space (Silversmith)
        eachMember(state, (owner, card, def) => {
          if (owner === p && def.afterAction) def.afterAction(ctx, owner, card, qid);
          if (owner !== p && def.afterRivalAction) def.afterRivalAction(ctx, owner, card, qid, p);
        });
        a.resolve(ctx, p);
      });
      fCredit(state, mark, a.name);
      return out;
    }
    case 'endTurn': {
      const ctx = ctxFor(state);
      eachMember(state, (owner, card, def) => { if (def.onTurnEnd) def.onTurnEnd(ctx, owner, card, p); });
      state.current = null;
      return;
    }
    case 'allPlaced': {
      // after the round's last placement, before its contests: members that act then (Straggler), in turn order
      const ctx = ctxFor(state);
      for (const id of turnOrder(state)) eachMemberOf(state, state.players[id], (card, def) => { if (def.onAllPlaced) def.onAllPlaced(ctx, state.players[id], card); });
      return;
    }
    case 'released': {
      // members that react to their owner releasing another member (Social Climber); task.def is the released member's def id
      const ctx = ctxFor(state);
      eachMemberOf(state, p, (card, def) => { if (def.onRelease) def.onRelease(ctx, p, card, defById(task.def)); });
      return;
    }
    case 'endRound': return endRound(state);
    case 'afterRound':
      if (state.round < 3) state.queue.push({ t: 'round', r: state.round + 1 });
      else state.queue.push({ t: 'finish' });
      return;
    case 'finish': return underCause({ kind: 'final' }, () => finish(state));
    default:
      throw new Error(`Unknown task ${task.t}`);
  }
}

// ---------- rounds ----------

function startRound(state, r) {
  state.round = r;
  // Fresh face-up market between rounds; old cards remain in the deck, at the bottom.
  if (r > 1) {
    const old = state.shop.splice(0);
    state.pile.push(...old);
    refill(state);
    log(state, `The member market refreshes for round ${roman(r)}.`);
  }
  state.slots = {};
  state.squats = {};
  state.recruits = 0;
  state.turns = [];
  const n = WORKERS[r - 1];
  // extra workers this round (Extra Hand: flag extraWorkers = [I, II, III]); p.workers keeps the round's count
  const more = id => sumMemberFlag(state, state.players[id], 'extraWorkers', v => v[r - 1] || 0);
  for (const p of state.players) { p.left = n + more(p.id); p.workers = p.left; }
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => { if (def.onRoundStart) def.onRoundStart(ctx, owner, card); });
  // late hooks see everything the round-start income gave (Investor sets aside after Banker pays)
  eachMember(state, (owner, card, def) => { if (def.onRoundStartLate) def.onRoundStartLate(ctx, owner, card); });
  // Fewest followers picks first. Ties: whoever was later in last round's turn order.
  // The first pass of last round's snake is its turn order (the last pass is reversed in even rounds).
  const prev = state.order.length ? state.order.slice(0, state.players.length) : [...state.players.map(p => p.id)];
  const lastPos = id => prev.indexOf(id);
  // Round I: everyone is tied, so the order is random (Cory, 2026-10-14).
  const base = r === 1 && state.order.length === 0
    ? (Array.isArray(state.firstOrder) && state.firstOrder.length === state.players.length ? [...state.firstOrder] : shuffleInPlace(state, state.players.map(p => p.id)))
    : [...state.players].sort((a, b) => followers(state, a) - followers(state, b) || lastPos(b.id) - lastPos(a.id)).map(p => p.id);
  // Whoever always picks first (Front-runner: flag pickFirst) moves to the front. Two of them keep their usual order.
  const first = id => sumMemberFlag(state, state.players[id], 'pickFirst') > 0;
  const lead = base.filter(first);
  if (lead.length) base.splice(0, base.length, ...lead, ...base.filter(id => !first(id)));
  state.order = [];
  for (let k = 0; k < n; k++) state.order.push(...(k % 2 ? [...base].reverse() : base));
  // extra workers go after the snake, in this round's order
  // (a member with extraWorkerRing limits its worker to spaces of that ring or lower)
  const extras = Object.fromEntries(base.map(id => {
    const rings = [];
    for (const uid of state.players[id].members) for (const d of effectiveDefs(state.cards[uid]))
      for (let k = 0; k < ((d.extraWorkers || [])[r - 1] || 0); k++) rings.push(d.extraWorkerRing || 0);
    return [id, rings];
  }));
  const snake = state.order.map(id => ({ t: 'turn', p: id }));
  const most = Math.max(0, ...base.map(id => extras[id].length));
  for (let k = 0; k < most; k++) for (const id of base) if (extras[id].length > k) {
    state.order.push(id);
    snake.push({ t: 'turn', p: id, ...(extras[id][k] ? { ring: extras[id][k] } : {}) });
  }
  // the cards that bend this round's order and workers are named, so the order and the extra worker trace to them
  const hands = base.filter(id => extras[id].length).map(id => `${state.players[id].name}'s ${flagName(state, state.players[id], 'extraWorkers')}: +${extras[id].length} minion${extras[id].length > 1 ? 's' : ''}.`);
  log(state, `Round ${roman(r)} begins. ${state.players[base[0]].name} picks first.${lead.length ? ` (${lead.map(id => `${state.players[id].name}'s ${flagName(state, state.players[id], 'pickFirst')}`).join(', ')}: always pick${lead.length === 1 ? 's' : ''} first.)` : ''}${hands.length ? ` ${hands.join(' ')}` : ''}`);
  state.queue.push(...snake, { t: 'allPlaced' }, { t: 'endRound' }, { t: 'afterRound' });
}

function endRound(state) {
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => { if (def.onRoundEnd) def.onRoundEnd(ctx, owner, card); });
  const v = RING_VALUE[state.round - 1];
  const table = contestTable(state, ctx);
  const msg = [];
  for (const c of table) {
    if (!c.winners.length) continue;
    const winners = c.winners.map(id => state.players[id]);
    underCause({ kind: 'contest', qid: c.qid, round: state.round }, () => { for (const w of winners) { w.bonus += c.prize; w.contest += c.prize; fBump(state, w, c.prize); } });
    msg.push(`${c.label}: ${winners.map(w => w.name).join(' & ')} +${c.prize}`);
  }
  // the round's scoring, kept as decided: the round-end card and the results read it back (never re-derived)
  state.contests = [...(state.contests || []), { round: state.round, prize: v, results: table }];
  log(state, `Round ${roman(state.round)} ends. ${msg.join(' · ') || 'No one scored.'}`);
}

// ---------- contests: one function decides them, and every screen shows it ----------
const ruleOf = label => label.replace(/\s*\(.*\)\s*$/, '');
/**
 * Each quadrant's contest, scored by the rule endRound uses, as if the round ended now:
 * [{ qid, label, rule, counts, tiebreak, prize, rows:[{ player, score, count, tiebreak? }], winners:[ids] }].
 * rows are best first (seat order among equals). count is the number the rule measures and tiebreak the number
 * that breaks a tie (a quadrant's scoring.show says how its score splits; without it the score is the count).
 * winners take the prize; nobody does when the best score is 0. tiebreak (top level) is { unit, text } or null.
 */
export function contestTable(state, ctx = ctxFor(state)) {
  const prize = RING_VALUE[Math.min(3, Math.max(1, state.round)) - 1];
  return state.quadrants.map(qid => {
    const q = quadrant(qid);
    const sc = q.scoring;
    const scores = state.players.map(p => sc.score(ctx, p));
    const top = Math.max(...scores);
    const winners = top > 0 ? state.players.filter((p, i) => scores[i] === top).map(p => p.id) : [];
    const rows = state.players.map((p, i) => {
      const shown = sc.show ? sc.show(ctx, p) : { count: scores[i] };
      const row = { player: p.id, score: scores[i], count: shown.count };
      if (shown.tiebreak !== undefined) row.tiebreak = shown.tiebreak;
      return row;
    }).sort((a, b) => b.score - a.score || a.player - b.player);
    return {
      qid, label: sc.label, rule: ruleOf(sc.label), counts: sc.counts || null, tiebreak: sc.tiebreak || null,
      prize: winners.length > 1 ? prize / 2 : prize, fullPrize: prize, rows, winners,
    };
  });
}

function finish(state) {
  const ctx = ctxFor(state);
  // final.cards: each bonus with the member that scored it (the results' scoring pops it over that member's head)
  // final.zero: members that score at game end and scored nothing this time, so the summary never says "no end-game
  // bonuses" over a Kingpin that came to +0 (blind tester, aminus r1 #5)
  for (const p of state.players) p.final = { total: 0, parts: [], cards: [], zero: [] };
  eachMember(state, (owner, card, def) => {
    if (!def.onGameEnd) return;
    const got = def.onGameEnd(ctx, owner, card) || 0;
    if (got) {
      owner.bonus += got; fBump(state, owner, got); owner.final.total += got;
      owner.final.parts.push(`${def.name} ${got > 0 ? '+' : '−'}${Math.abs(got)}`);
      owner.final.cards.push({ uid: card.uid, name: def.name, n: got });
    } else owner.final.zero.push({ uid: card.uid, name: def.name });
  });
  const ranked = [...state.players].sort((a, b) => followers(state, b) - followers(state, a) || memberCount(state, b) - memberCount(state, a));
  state.ranking = ranked.map(p => p.id);
  state.over = true;
  state.current = null;
  log(state, `Game over. ${ranked[0].name} wins with ${followers(state, ranked[0])} followers.`);
}

/**
 * This round's turns in order: done (taken, oldest first), current (the seat whose turn is running, or null) and
 * next (the turns still queued, extra turns included). Read straight from the engine's record and queue.
 */
export function turnRail(state) {
  const taken = state.turns || [];
  const current = state.current ?? null;
  return { done: current != null ? taken.slice(0, -1) : [...taken], current, next: state.queue.filter(t => t.t === 'turn').map(t => t.p) };
}
/**
 * This round's planned order (state.order: the snake, then extra minions) with the turns players took early moved up
 * (Crunch Time: "taking two immediate turns with existing minions", Cory 2026-10-15). state.order itself keeps the
 * round's first pass, which seats and next round's tiebreak read. Returns { order: [pid], early: [why|null], src:
 * [index each turn had in state.order] }.
 */
export function roundOrder(state) {
  const order = [...(state.order || [])], early = order.map(() => null), src = order.map((_, i) => i);
  const e = state.early;
  if (e && e.round === state.round) for (const m of e.moves) {
    const [pid] = order.splice(m.from, 1); early.splice(m.from, 1); const [i] = src.splice(m.from, 1);
    order.splice(m.to, 0, pid); early.splice(m.to, 0, m.why); src.splice(m.to, 0, i);
  }
  return { order, early, src };
}
/** Workers p had this round (Extra Hand adds to the round's count); older saves fall back to the round's count. */
export const roundWorkers = (state, p) => p.workers ?? WORKERS[Math.max(1, state.round) - 1];

// ---------- recruiting, buying, gaining ----------

function refill(state) {
  while (state.shop.length < SHOP_SIZE && state.pile.length) state.shop.push(state.pile.shift());
}

// how: a recruit priced by a space's own rule (Snap Up: { anyColors }, Half Price: { anyColors, half }), as memberPrice
function recruit(state, p, uid, opts) {
  return underCause(() => ({ kind: 'recruit', pid: p.id, uid, index: state.shop.indexOf(uid) }), () => recruitNow(state, p, uid, opts));
}
function recruitNow(state, p, uid, { free, spend: chosen, how = {} }) {
  const idx = state.shop.indexOf(uid);
  const fromPile = idx < 0 ? state.pile.indexOf(uid) : -1;
  if (idx < 0 && (fromPile < 0 || fromPile >= pileReach(state, p))) throw new Error(`Card ${uid} is not in the shop`);
  let paid = 'free';
  if (!free) {
    const spend = chosen || paymentPlan(state, p, uid, how);
    if (!spend || !memberPayOk(state, p, cardDef(state, uid), spend, how) || Object.keys(spend).some(r => spend[r] > (p.res[r] || 0))) throw new Error('Cannot afford');
    for (const r in spend) p.res[r] -= spend[r];
    paid = payString(spend);
    // name what made it cheaper: a discount, cost reductions, gold paying double
    const notes = [];
    const def0 = cardDef(state, uid);
    // each note says what it actually took off this price (a discount of 4 on a member costing 2 saves 2; Sponsor
    // saves nothing on a member that costs nothing): the discount first, then the cost reductions, in member order
    let room = how.half ? Math.floor((def0.s + def0.w) / 2) : def0.s + def0.w;
    const off = n => { const x = Math.min(n, room); room -= x; return x; };
    if (p.discount && def0.s + def0.w > 0) { const x = off(p.discount); if (x) notes.push(`discount −${x}`); }
    for (const flag of ['costReduction', 'goldPaysDouble']) {
      for (const u of p.members) for (const d of effectiveDefs(state.cards[u])) {
        if (!d[flag]) continue;
        if (flag === 'goldPaysDouble' && !spend.gold) continue;
        if (flag === 'costReduction') { const x = off(d[flag] === true ? 1 : d[flag]); if (x) notes.push(`${d.name} saves ${x}`); }
        else notes.push(`${d.name}: gold counts double`);
      }
    }
    // Freelancer (anyColorPart): say so when the colored part was paid in other colors
    const q0 = colorOf(def0);
    if (!how.anyColors && !how.half && state.resources.includes(q0) && sumMemberFlag(state, p, 'anyColorPart') > 0) {
      const needS = Math.max(0, def0.s - p.discount - sumMemberFlag(state, p, 'costReduction'));
      const worth = q0 === 'gold' && sumMemberFlag(state, p, 'goldPaysDouble') > 0 ? 2 : 1;
      if ((spend[q0] || 0) * worth < needS) notes.push(`${flagName(state, p, 'anyColorPart')}: colored part in any colors`);
    }
    if (notes.length) paid += `; ${notes.join(', ')}`;
    // a discount waits for a member that actually costs something
    if (cardDef(state, uid).s + cardDef(state, uid).w > 0) p.discount = 0;
  }
  if (idx >= 0) state.shop.splice(idx, 1);
  else state.pile.splice(fromPile, 1);
  refill(state);
  p.members.push(uid);
  state.recruits += memberWeight(state, uid);
  p.turnRecruits += memberWeight(state, uid);
  const card = state.cards[uid], def = defById(card.def);
  // who recruited it and when: a member can't be released in the round its owner recruited it
  card.recruitedRound = state.round; card.recruitedBy = p.id;
  log(state, `${p.name} recruited ${def.name}${idx < 0 ? ` from the pile with ${p.name}'s ${flagName(state, p, 'pileReach')}` : ''} (${paid}).`);
  const ctx = ctxFor(state);
  const w = wrap(state, card);
  eachMember(state, (owner, c, d) => { if (d.onAnyRecruit) d.onAnyRecruit(ctx, owner, c, p, w); });
  // a when-recruited effect leaves a trace like any other member hook (Seed Money, Pilgrim, Retinue…)
  if (def.onRecruited) { const before = traceSnapshot(state); def.onRecruited(ctx, p, w); traceChanges(state, before, p, def); }
  joinNow(state, p, w, [def]);
  workersNow(state, p, def);
}
/**
 * A member's "now" part, as it joins p: "Now and at round start" members (flag now) fire their round-start effect once
 * (Cory, 2026-10-14). It fires however the member arrives, recruited, swapped or stolen: the card says "now", and a
 * Banker taken by Even Swap paid nothing (live panel r1 blocker; Claude, under Cory's go-with-your-gut, 2026-10-15).
 * defs: the member's own def on a recruit (a Doppelganger fires its copy itself), every effective def on a move.
 */
function joinNow(state, p, w, defs) {
  const ctx = ctxFor(state);
  for (const def of defs) if (def.now) for (const hook of ['onRoundStart', 'onRoundStartLate']) if (def[hook]) {
    const before = traceSnapshot(state); def[hook](ctx, p, w); traceChanges(state, before, p, def);
  }
}
/** A member that moved to p by a swap or a steal: its "now" part fires (Lender's +5 stays once a game: cards-trading test). */
function memberJoined(state, p, uid) {
  const card = state.cards[uid], w = wrap(state, card), defs = effectiveDefs(card), ctx = ctxFor(state);
  joinNow(state, p, w, defs);
  for (const def of defs) if (def.onJoined) { const before = traceSnapshot(state); def.onJoined(ctx, p, w); traceChanges(state, before, p, def); }
}
/**
 * A member that adds minions in this round (Extra Hand: "+1 minion in round III"), recruited during it, adds them at
 * once: extra turns after everyone else's, before the round closes, as at round start (Claude, under Cory's
 * go-with-your-gut, 2026-10-15: bought in round III it was a dead buy). Recruited earlier, round start counts it.
 */
function workersNow(state, p, def) {
  const r = state.round;
  const k = r >= 1 ? (def.extraWorkers || [])[r - 1] || 0 : 0;
  const at = state.queue.findIndex(t => t.t === 'allPlaced');
  if (!k || at < 0) return;
  const turns = Array.from({ length: k }, () => ({ t: 'turn', p: p.id, ...(def.extraWorkerRing ? { ring: def.extraWorkerRing } : {}) }));
  state.queue.splice(at, 0, ...turns);
  state.order.push(...turns.map(() => p.id));
  p.workers = (p.workers ?? WORKERS[r - 1]) + k;
  p.left += k;
  log(state, `${p.name}'s ${def.name}: +${k} minion${k > 1 ? 's' : ''} this round, after everyone else's turns.`);
}

function buyFollowers(state, p, tier, chosen) {
  return underCause({ kind: 'buy', pid: p.id, tier: tier.key, get: tier.get }, () => buyFollowersNow(state, p, tier, chosen));
}
function buyFollowersNow(state, p, tier, chosen) {
  const spend = chosen || followerPlan(state, p, tier);
  if (!spend) throw new Error('Cannot afford');
  for (const r in spend) p.res[r] -= spend[r];
  p.bonus += tier.get;
  fBump(state, p, tier.get);
  p.bought = (p.bought || 0) + tier.get;
  log(state, `${p.name} bought ${tier.get} follower${tier.get > 1 ? 's' : ''} (${payString(spend)}).`);
  if (tier.limited) state.stock[tier.key] -= 1;
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => { if (def.onBuyFollowers) def.onBuyFollowers(ctx, owner, card, p, tier); });
}

// again: a later part of a gain the same action already paid (Collect Debts' second victim), so "whenever an action
// gains you gold" members (Prospector) pay once per action
function gain(state, p, color, n, { fromAction = false, again = false } = {}) {
  if (!(n > 0)) return;
  const g = { color, n, fromAction, again, doubled: false };
  const ctx = ctxFor(state);
  // conversions (Midas) first, then amount changes (Underdog), so member order never matters.
  // Each one that changes the gain says so in the log ("Ana's Underdog: gold gain 4 → 8").
  // In a preview (state.notes), a member that could have changed the gain and didn't says why (def.whyNot).
  const said = (card, def, c0, n0) => {
    if (g.color === c0 && g.n === n0) {
      const why = state.notes && def.whyNot ? def.whyNot(ctx, p, card, g) : null;
      if (why) note(state, p, def.name, why);
      return;
    }
    const what = g.color === c0 ? `${c0} gain ${n0} → ${g.n}` : `${n0} ${c0} comes as ${g.n} ${g.color}`;
    log(state, `${p.name}'s ${def.name}: ${what}.`);
    note(state, p, def.name, what);
  };
  eachMemberOf(state, p, (card, def) => { if (def.convertGain) { const c0 = g.color, n0 = g.n; def.convertGain(ctx, p, card, g); said(card, def, c0, n0); } });
  eachMemberOf(state, p, (card, def) => { if (def.modifyGain) { const c0 = g.color, n0 = g.n; def.modifyGain(ctx, p, card, g); said(card, def, c0, n0); } });
  p.res[g.color] = (p.res[g.color] || 0) + g.n;
  eachMemberOf(state, p, (card, def) => { if (def.afterGain) def.afterGain(ctx, p, card, g); });
  return { color: g.color, n: g.n };
}

// ---------- member iteration (a Doppelganger also runs the hooks of the member it copies) ----------

function effectiveDefs(card) {
  const own = defById(card.def);
  if (!card.copy) return [own];
  const copied = defById(card.copy);
  const { onRecruited, ...hooks } = copied; void onRecruited;
  return [own, hooks];
}
function eachMemberOf(state, p, fn) {
  for (const uid of [...p.members]) {
    const card = state.cards[uid];
    for (const def of effectiveDefs(card)) {
      const before = traceSnapshot(state);
      underCause({ kind: 'member', pid: p.id, uid, def: card.def }, () => fn(wrap(state, card), def));
      traceChanges(state, before, p, def);
    }
  }
}

// Every member trigger leaves a trace: if a hook changed anyone's resources or followers and didn't say so itself,
// the log says it for the hook ("Kay's Tax Collector: +1 gold"), so every number on the table traces to a line.
function traceSnapshot(state) {
  return { len: state.log.length, last: state.log[state.log.length - 1], players: state.players.map(o => ({ res: { ...o.res }, bonus: o.bonus, discount: o.discount })), f: fMark(state) };
}
function traceChanges(state, before, owner, def) {
  const name = def && def.name;
  if (!name) return;
  if (before.f) fCredit(state, before.f, name, owner);
  const out = [];
  state.players.forEach((o, i) => {
    const b = before.players[i];
    if (!b) return;
    const parts = Object.keys({ ...b.res, ...o.res }).map(r => [r, (o.res[r] || 0) - (b.res[r] || 0)]).filter(([, d]) => d)
      .map(([r, d]) => `${d > 0 ? '+' : '−'}${Math.abs(d)} ${r}`);
    const f = o.bonus - b.bonus;
    if (f) parts.push(`${f > 0 ? '+' : '−'}${Math.abs(f)} follower${Math.abs(f) === 1 ? '' : 's'}`);
    // a discount for the next member (Planner, Sommelier…) is a number on the table too
    const d = (o.discount || 0) - (b.discount || 0);
    if (d > 0) parts.push(`next member costs ${d} less`);
    if (!parts.length) return;
    if (o === owner && state.notes) note(state, owner, name, parts.join(', '), Object.fromEntries(Object.keys({ ...b.res, ...o.res }).map(r => [r, (o.res[r] || 0) - (b.res[r] || 0)]).filter(([, d]) => d)));
    out.push(o === owner ? `${owner.name}'s ${name}: ${parts.join(', ')}.` : `${o.name} ${parts.join(', ')} (${owner.name}'s ${name}).`);
  });
  if (!out.length) return;
  // the hook said so itself: a new line names it. A nested line that doesn't (Underdog doubling Banker's gold) doesn't count.
  const fresh = state.log.length < LOG_MAX ? state.log.slice(before.len) : state.log.slice(state.log.lastIndexOf(before.last) + 1);
  if (fresh.some(l => l.includes(name))) return;
  for (const line of out) log(state, line);
}
function eachMember(state, fn) {
  for (const owner of state.players) eachMemberOf(state, owner, (card, def) => fn(owner, card, def));
}
/** Name of p's member that carries a flag (a Doppelganger copying it reads as the copied card). */
function flagName(state, p, flag) {
  for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) if (def[flag]) return def.name;
  return 'member';
}
function sumMemberFlag(state, p, flag, map) {
  let s = 0;
  for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) {
    const v = def[flag];
    if (v === undefined) continue;
    s += map ? map(v) : v === true ? 1 : typeof v === 'number' ? v : 0;
  }
  return s;
}

// ---------- rule-bending allowances ----------
// A member with a once-per-round flag (squat, extraBuy) gives one use per round. Each card tracks its own use
// (card.spent[flag] = round), so a Doppelganger copy is a second use, and a stolen card that was used stays used.
function allowanceCards(state, p, flag) {
  const out = [];
  for (const uid of p.members) {
    const card = state.cards[uid];
    if (card.spent?.[flag] === state.round) continue;
    if (effectiveDefs(card).some(d => d[flag])) out.push(card);
  }
  return out;
}
const allowance = (state, p, flag) => allowanceCards(state, p, flag).length;
function spendAllowance(state, p, flag) {
  const card = allowanceCards(state, p, flag)[0];
  if (!card) throw new Error(`${p.name} has no ${flag} left this round`);
  card.spent = { ...(card.spent || {}), [flag]: state.round };
  log(state, `${p.name} uses ${defById(card.def).name}.`);
}
// Queue tasks stay plain JSON: only a second buy carries the flag.
const extraOf = task => (task.extra ? { extra: true } : {});
// A real buy (member or followers) in a buy step. The second one spends a Big Spender.
function boughtOnce(state, p, task) {
  if (task.extra) spendAllowance(state, p, 'extraBuy');
  p.turnBuys = (p.turnBuys || 0) + 1;
}
/** How many cards off the top of the pile p may recruit from (Insider: flag pileReach; copies don't stack). */
export function pileReach(state, p) {
  let n = 0;
  for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) if (def.pileReach) n = Math.max(n, def.pileReach);
  return n;
}
/** Rivals' taken spaces p may join this round (Squatter: flag squat). One extra worker per space. */
export function squatSlots(state, p) {
  if (!allowance(state, p, 'squat')) return [];
  const out = [];
  for (const [key, owner] of Object.entries(state.slots)) {
    if (owner === p.id || state.squats?.[key]?.length) continue;
    if (!spaceOpen(actionAt(state, ...key.split('-').map(Number)), state.round)) continue;
    out.push(key.split('-').map(Number));
  }
  return out;
}
/** Workers p has on the board: placed spaces plus spaces joined. */
export const workersOnBoard = (state, p) => Object.values(state.slots).filter(o => o === p.id).length
  + Object.values(state.squats || {}).reduce((s, list) => s + list.filter(o => o === p.id).length, 0);
/**
 * Release (a base rule): once per round, in your buy step. With uid: may p release that member now? Not in the
 * round p recruited it (stops buy-collect-release loops such as Lender's +5; Claude under Cory's go-with-your-gut,
 * from the dead-window audit, 2026-10-14).
 */
export const canRelease = (state, p, uid) => !!state.rules?.release && p.releasedRound !== state.round
  && (uid === undefined || (!(state.cards[uid]?.recruitedRound === state.round && state.cards[uid]?.recruitedBy === p.id)
    // a member whose once-per-game use is spent can't be released for its refund (Cory, 2026-10-15)
    && !state.cards[uid]?.used));
/**
 * What releasing a member gives back (Cory, 2026-10-14): only its colored part, in its own color: { n, color, label }.
 * When its color isn't on the table (a guest leaning to an absent sphere), the colored part comes back in any colors
 * (color null). A member with no colored part gives back nothing.
 */
export function releaseRefund(state, uid) {
  const def = cardDef(state, uid), c = colorOf(def), n = def.s;
  const color = state.resources.includes(c) ? c : null;
  return { n, color, label: !n ? 'nothing' : color ? `${n} ${color}` : `${n} in any colors` };
}
// The card goes to the bottom of the pile, wiped clean (a released Doppelganger forgets what it copied).
// A refund in its own color is paid here; one in any colors is picked in the release task. Returns the refund.
function release(state, p, uid) {
  return underCause({ kind: 'release', pid: p.id, uid }, () => releaseNow(state, p, uid));
}
function releaseNow(state, p, uid) {
  const def = cardDef(state, uid), back = releaseRefund(state, uid);
  cardLeaves(state, p, uid);
  p.members.splice(p.members.indexOf(uid), 1);
  state.cards[uid] = { uid, def: state.cards[uid].def };
  state.pile.push(uid);
  p.releasedRound = state.round;
  if (back.color) p.res[back.color] = (p.res[back.color] || 0) + back.n;
  log(state, `${p.name} released ${def.name} to the bottom of the pile, for ${back.label}.`);
  return back;
}
// A member leaves its owner (stolen, swapped, released, traded in): its onLeave hooks settle what it held for them
// (Investor's set-aside gold goes back to the owner, not doubled).
function cardLeaves(state, p, uid) {
  const card = state.cards[uid], ctx = ctxFor(state);
  for (const def of effectiveDefs(card)) if (def.onLeave) def.onLeave(ctx, p, wrap(state, card));
}
/** This round's turn order (its first pass). */
const turnOrder = state => (state.order.length ? state.order.slice(0, state.players.length) : state.players.map(p => p.id));

// Cards in state are plain JSON. Content code sees a live view with `.def` attached.
function wrap(state, card) {
  return new Proxy(card, {
    get(target, key) { return key === 'def' ? defById(target.def) : target[key]; },
    set(target, key, value) { if (key === 'def') throw new Error('def is read-only'); target[key] = value; return true; },
  });
}

// ---------- the context handed to content ----------

/** The helper context content code runs with. Bots use it read-only for estimates. */
export function contextFor(state) { return ctxFor(state); }

function ctxFor(state) {
  const ctx = {
    state,
    player: id => state.players[id],
    rivals: p => state.players.filter(o => o !== p),
    quadrant,
    followers: p => followers(state, p),
    memberCount: p => memberCount(state, p),
    memberWeight: card => memberWeight(state, typeof card === 'number' ? card : card.uid),
    countMembersOfColor: (p, q) => countMembersOfColor(state, p, q),
    card: uid => wrap(state, state.cards[uid]),
    defOf: c => (typeof c === 'number' ? cardDef(state, c) : c.def),
    membersOf: p => p.members.map(u => wrap(state, state.cards[u])),
    ownerOf: uid => state.players.find(o => o.members.includes(uid)),
    shopCards: () => state.shop.map(u => wrap(state, state.cards[u])),
    gain: (p, color, n, opts) => gain(state, p, color, n, opts),
    recruit: (p, uid, opts) => recruit(state, p, uid, opts),
    /** The one price rule (memberPrice) and the ways to pay it (paymentChoices), for recruits outside the buy step. */
    price: (p, uid, how) => memberPrice(state, p, uid, how),
    payChoices: (p, uid, how) => paymentChoices(state, p, uid, how),
    /** The colors whose contest lead or tie p holds now and would give up by spending `v` ({ color: n }; a negative n
     *  is a gain, for a swap). Display and asking only: a one-way payment that gives up a lead asks first. */
    leadsLost: (p, v) => { const g = rimCost(state, p)(v); return [...g.colors, ...g.cuts.map(c => c.member)]; },
    log: text => log(state, text),
    /** A preview's reason for a member's effect content applies itself (Grand Host's double): the "Why" row. */
    note: (p, member, text, res = null) => note(state, p, member, text, res),
    /** This round's order with turns taken early moved up (roundOrder). */
    roundOrder: () => roundOrder(state),
    cardLeaves: (p, uid) => cardLeaves(state, p, uid),
    /** Run fn on behalf of owner's member `name` (a hook content code calls itself, e.g. Choir reacting to a copy):
     *  whatever it changes and doesn't log is logged under that name, like the engine's own member hooks. */
    asMember(owner, name, fn) {
      const before = traceSnapshot(state);
      const uid = owner.members.find(u => { try { return cardDef(state, u).name === name; } catch { return false; } });
      const out = underCause({ kind: 'member', pid: owner.id, uid: uid ?? null, def: uid != null ? state.cards[uid].def : null }, fn);
      traceChanges(state, before, owner, { name });
      return out;
    },
    buryFromShop(uid) {
      const i = state.shop.indexOf(uid);
      if (i < 0) return;
      state.shop.splice(i, 1);
      state.pile.push(uid);
      refill(state);
    },
    moveMember(uid, from, to) {
      cardLeaves(state, from, uid);
      from.members.splice(from.members.indexOf(uid), 1);
      to.members.push(uid);
      memberJoined(state, to, uid);
    },
    // ---- stealing: one shared verb, so protections and reactions apply to every sphere's steals ----
    /** May `thief` steal from `victim`? kind is 'res' (resources, piles) or 'member'. Quadrants and the
     *  victim's members can refuse (guardSteal returns true). */
    canSteal(thief, victim, kind = 'res') {
      if (!victim || victim === thief) return false;
      for (const qid of state.quadrants) { const q = quadrant(qid); if (q.guardSteal && q.guardSteal(ctx, thief, victim, kind)) return false; }
      let blocked = false;
      eachMemberOf(state, victim, (card, def) => { if (def.guardSteal && def.guardSteal(ctx, victim, card, thief, kind)) blocked = true; });
      return !blocked;
    },
    /** How many a steal of `base` takes for this thief (members: stealMore adds, stealDouble(ctx, owner) doubles). */
    stealCount(thief, base, { say = false } = {}) {
      let extra = 0, double = false;
      const who = [], why = [];
      eachMemberOf(state, thief, (card, def) => {
        if (typeof def.stealMore === 'number') { extra += def.stealMore; if (def.stealMore) { who.push(`${thief.name}'s ${def.name}: +${def.stealMore}`); why.push([def.name, `+${def.stealMore} to steal`]); } }
        if (def.stealDouble && def.stealDouble(ctx, thief)) { double = true; who.push(`${thief.name}'s ${def.name}: doubled`); why.push([def.name, 'steal doubled']); }
      });
      const out = (double ? base * 2 : base) + extra;
      // say: a real steal (not an estimate) names the members that changed its size, in the log and in a hover's Why
      // (live panel r1: Help Yourself's face said +4 and its hover +8, and neither named Desperado)
      if (say && base > 0 && out !== base) {
        log(state, `${thief.name}'s steal takes ${out}, not ${base} (${who.join('; ')}).`);
        for (const [name, text] of why) note(state, thief, name, `${text} (${base} → ${out})`);
      }
      return out;
    },
    /** One steal event from one victim. what: { take: {color: n} } moves resources (clamped to what they hold),
     *  { uid } moves a member, { other: n } reports units the caller already moved (e.g. a loot pile).
     *  what.give(n) hands the thief the proceeds before anyone reacts (so a reaction can take from the thief).
     *  what.led: whether the victim led when a multi-victim steal began (reactions read it as info.led).
     *  Then fires onSteal on every quadrant and member. Returns units taken. */
    steal(thief, victim, what = {}) {
      if (!ctx.canSteal(thief, victim, what.uid !== undefined ? 'member' : 'res')) return 0;
      const took = {};
      let n = what.other || 0;
      for (const [c, k] of Object.entries(what.take || {})) {
        const x = Math.max(0, Math.min(k, victim.res[c] || 0));
        if (x) { victim.res[c] -= x; took[c] = x; n += x; }
      }
      if (what.uid !== undefined) { ctx.moveMember(what.uid, victim, thief); n += 1; }
      if (!n) return 0;
      if (what.give) what.give(n);
      const info = { thief, victim, took, uid: what.uid, n, reaction: !!what.reaction, ...(what.led !== undefined ? { led: !!what.led } : {}) };
      for (const qid of state.quadrants) { const q = quadrant(qid); if (q.onSteal) q.onSteal(ctx, info); }
      eachMember(state, (owner, card, def) => { if (def.onSteal) def.onSteal(ctx, owner, card, info); });
      return n;
    },
    // Queue a decision for player p. It runs before anything else still queued. extra.blocked: why each player who
    // can't be picked now can't (shown on their dimmed seat). extra.count: a counted pick's
    // progress, { of, left } (Collect Debts: 1 of 3 taken), kept on the task so it survives a save and load.
    choose(p, prompt, options, handler, data = null, extra = {}) {
      if (!options.length) return;
      // follow-up choices queued during one resolution keep their call order
      const at = state.queue.findIndex(t => !t._fresh);
      const task = { t: 'choose', p: p.id, prompt, options: withTargets(state, options).map(o => pinCards(state, o)), h: handler, data, ...(extra.count ? { count: extra.count } : {}), ...(extra.blocked && Object.keys(extra.blocked).length ? { blocked: extra.blocked } : {}), _fresh: true };
      state.queue.splice(at < 0 ? state.queue.length : at, 0, task);
    },
  };
  return ctx;
}

// A queued choice can wait while other things happen first (a member used in the buy step queues its choice behind
// the buy re-offer; a copy's free member waits for earlier copies). An option that names cards (a face-up member, a
// member someone holds, a trade pair) remembers where each card was when the choice was queued (`at`), and the choice
// is shown with only the options whose cards are still there: a card bought, stolen or released in the meantime is
// dropped, never picked (that threw "Card N is not in the shop"). No option left: the choice resolves to nothing,
// with a log line.
const CARD_KINDS = new Set(['card', 'member', 'trade']);
function whereIs(state, uid) {
  if (state.shop.includes(uid)) return 'shop';
  if (state.pile.includes(uid)) return 'pile';
  const o = state.players.find(q => q.members.includes(uid));
  return o ? `p${o.id}` : 'gone';
}
function pinCards(state, o) {
  const uids = CARD_KINDS.has(o.kind) ? [].concat(o.value).filter(u => Number.isInteger(u) && state.cards[u]) : [];
  return uids.length ? { ...o, at: Object.fromEntries(uids.map(u => [u, whereIs(state, u)])) } : o;
}
// An option that points at something on the board says so in one structured field, so a screen lights that thing
// and never reads the label (the board picker, src/v4/game/boardPick.js). Ids never change.
//   { space: 'q-i' }      a space on the wheel (Echo's and Encore's copies, Straggler's moves)
//   { uid }               a member: face up in the shop, or on someone's seat (Hand-pick, Shake Down, Poach)
//   { pid }               a player (Kickback, Benefactor)
//   { pid, res }          one of a player's resource stacks (a steal's take:pid:color; give: true for Good Deed's gift)
//   { res }               a color, shown as your own stack of it (a gift's color, a release's colors)
// An option that sets its own target keeps it.
function withTargets(state, options) {
  const colors = options.filter(o => o.kind === 'color' && !o.target).map(o => o.value);
  // a color pick names resources, or quadrants (Hustler): a quadrant is shown as its resource
  const asQuadrant = colors.length > 0 && colors.every(v => state.quadrants.includes(v)) && !colors.every(v => state.resources.includes(v));
  return options.map(o => {
    if (o.target) return o;
    const v = o.value;
    let target = null;
    if ((o.kind === 'take' || o.kind === 'give') && Array.isArray(v) && Number.isInteger(v[0]) && typeof v[1] === 'string') target = { pid: v[0], res: v[1], ...(o.kind === 'give' ? { give: true } : {}) };
    else if (o.kind === 'player' && Number.isInteger(v)) target = { pid: v };
    else if ((o.kind === 'card' || o.kind === 'member') && Number.isInteger(v) && state.cards[v]) target = { uid: v };
    else if ((o.kind === 'space' || o.kind === 'slot') && (typeof v === 'string' || (v && typeof v.key === 'string'))) {
      const key = String(typeof v === 'string' ? v : v.key).split('+')[0];
      if (/^\d+-\d+$/.test(key)) target = { space: key };
    } else if (o.kind === 'color' && typeof v === 'string') {
      if (asQuadrant) target = { res: quadrant(v).resource };
      else if (state.resources.includes(v)) target = { res: v };
    }
    return target ? { ...o, target } : o;
  });
}
/** A queued choice's options that are still good: every card an option names is where it was when it was queued. */
/** Options that spend p's coins (o.spend, or a pay option's vector value) get breaks: the leads that spend gives up. */
function withBreaks(state, p, options) {
  const spendOf = o => (o.spend && typeof o.spend === 'object' ? o.spend : o.kind === 'pay' && o.value && typeof o.value === 'object' ? o.value : null);
  if (!p || !options.some(spendOf)) return options;
  const cost = rimCost(state, p);
  return options.map(o => {
    const v = spendOf(o);
    if (!v) return o;
    const got = cost(v);
    // cuts: a member's game-end bonus this spend lowers ({ member, from, to }: "Kingpin +2 → +0")
    return got.colors.length || got.cuts.length ? { ...o, ...(got.colors.length ? { breaks: got.colors } : {}), ...(got.ties.length ? { ties: got.ties } : {}), ...(got.cuts.length ? { cuts: got.cuts } : {}) } : o;
  });
}

export function liveOptions(state, task) {
  return task.options.filter(o => !o.at || Object.entries(o.at).every(([u, w]) => whereIs(state, Number(u)) === w));
}

// Follow-up choices queued while one task resolves are marked fresh so they keep their call order.
function clearFresh(state) { for (const t of state.queue) if (t._fresh) delete t._fresh; }

// ---------- misc ----------

// ---------- the follower ledger: where every follower came from (the results breakdown) ----------
// state.ledger[pid] = { label: n }: every change to a player's loose followers (p.bonus) during play that isn't a
// follower buy (p.bought), a prize (p.contest) or an end-game bonus (p.final), credited once to its innermost cause:
// a member ("Robin Hood"; a rival's member reads "P2's Raider"), a space ("Your Call") or a choice ("Cheap Seats").
// Losses are negative. state.fcredit[pid] is a running total of what's been credited (buys, prizes and end-game
// bonuses too), so an outer cause only counts what its inner causes didn't.
const fMark = state => state.players.map(o => [o.bonus, (state.fcredit && state.fcredit[o.id]) || 0]);
function fBump(state, o, d) {
  if (!d) return;
  state.fcredit = state.fcredit || {};
  state.fcredit[o.id] = (state.fcredit[o.id] || 0) + d;
}
function fCredit(state, mark, label, owner = null) {
  state.players.forEach((o, i) => {
    if (!mark[i]) return;
    const d = (o.bonus - mark[i][0]) - (((state.fcredit && state.fcredit[o.id]) || 0) - mark[i][1]);
    if (!d) return;
    const key = owner && owner !== o ? `${owner.name}'s ${label}` : label || 'other';
    state.ledger = state.ledger || {};
    const row = state.ledger[o.id] = state.ledger[o.id] || {};
    row[key] = (row[key] || 0) + d;
    fBump(state, o, d);
  });
}

/**
 * Preview-only reasons. previewSpace runs a space on a copy that carries state.notes (an array); there, every member
 * effect that changes the player's numbers adds { p, member, text, res } and a member that could have and didn't
 * says why (def.whyNot). A real game's state never has notes, so this does nothing there.
 */
function note(state, p, member, text, res = null) {
  if (Array.isArray(state.notes)) state.notes.push({ p: p.id, member, text, ...(res ? { res } : {}) });
}

function log(state, text) {
  state.log.push(text);
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX);
}
const payString = s => Object.entries(s).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(', ') || 'free';
export const roman = r => ['I', 'II', 'III'][r - 1] || String(r);
