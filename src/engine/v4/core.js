// Patrons v4 engine. Pure and deterministic: state in, move in, state out.
// Everything runs through a task queue. When a task needs a decision, the engine stops and publishes
// state.pending = { player, kind, prompt, options:[{ id, label, kind, ... }] }. A move is { player, option }.
import { quadrant, defById, handlerById, DEFAULT_QUADRANTS, guestMembers } from './content/index.js';
import { shuffleInPlace } from './rng.js';

export const RING_VALUE = [2, 4, 6];
export const WORKERS = [3, 4, 5];
export const SHOP_SIZE = 10; // a bigger community pool, so a member you want is more often still there (Cory, 2026-10-14)
// Follower buys take any resources (Cory, 2026-10-14: no color requirements). A limited tier has a stock per game (stock: seats -> count). The clock tier ends the game:
// when its last buy is gone, the game ends after that round.
export const TIERS = [
  { key: 'small', cost: 2, get: 1, colors: 1, label: '2 of anything' },
  { key: 'mid', cost: 4, get: 3, colors: 1, label: '4 of anything' },
  { key: 'big', cost: 8, get: 6, colors: 1, label: '8 of anything', limited: true, stock: n => 2 * n },
  { key: 'top', cost: 10, get: 10, colors: 1, label: '10 of anything', limited: true, stock: () => 4, clock: true },
];
/** How many buys of a limited tier are left (Infinity for unlimited tiers). */
export const tierLeft = (state, tier) => (tier.limited ? state.stock?.[tier.key] ?? 0 : Infinity);
const LOG_MAX = 300;
// Rule flags a table can toggle (sims flip them). release: once per round, on your turn, release one of your
// members (it goes to the bottom of the pile) for its colored part in its own color (not one recruited this round). guests: rule-bending guest
// members join the deck.
export const DEFAULT_RULES = { release: true, guests: true };

// ---------- creation ----------

/**
 * @param {{ seats: { name?: string, kind?: 'human'|'bot' }[], seed?: number, quadrants?: string[], rules?: object }} opts
 */
export function createGame({ seats, seed = 1, quadrants = DEFAULT_QUADRANTS, rules = {} }) {
  if (!Array.isArray(seats) || seats.length < 2 || seats.length > 4) throw new Error('Patrons needs 2 to 4 seats.');
  const resources = quadrants.map(q => quadrant(q).resource);
  const zero = Object.fromEntries(resources.map(r => [r, 0]));
  const cards = {};
  let uid = 0;
  for (const q of quadrants) for (const def of quadrant(q).members)
    for (let k = 0; k < def.copies; k++) { cards[uid] = { uid, def: def.id }; uid++; }
  const table = { ...DEFAULT_RULES, ...rules };
  if (table.guests) for (const def of guestMembers())
    for (let k = 0; k < def.copies; k++) { cards[uid] = { uid, def: def.id }; uid++; }
  const state = {
    v: 4, seed: seed >>> 0, rng: seed >>> 0, quadrants: [...quadrants], resources, rules: table,
    players: seats.map((s, i) => ({
      id: i, name: s.name || `P${i + 1}`, kind: s.kind || 'human', ...(s.emoji ? { emoji: String(s.emoji) } : {}), // emoji: the player's pick (display only)
      res: { ...zero }, bonus: 0, contest: 0, bought: 0, members: [], discount: 0, left: 0, turnRecruits: 0, final: null,
    })),
    cards, pile: Object.keys(cards).map(Number), shop: [],
    round: 0, slots: {}, squats: {}, order: [], turnIndex: 0, current: null,
    recruits: 0, stock: Object.fromEntries(TIERS.filter(t => t.limited).map(t => [t.key, t.stock(seats.length)])), endEarly: false,
    // contests: each round's scoring as the engine decided it (see contestTable); turns: who has taken a turn this round
    contests: [], turns: [],
    queue: [], pending: null, log: [], moves: 0, over: false, ranking: null,
  };
  shuffleInPlace(state, state.pile);
  refill(state);
  for (const p of state.players) state.queue.push({ t: 'setupPick', p: p.id, k: 1 }, { t: 'setupPick', p: p.id, k: 2 });
  state.queue.push({ t: 'round', r: 1 });
  log(state, 'Each player picks 2 starting resources, first seat to last.');
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
export function applyMove(prev, move) {
  if (!isLegal(prev, move)) throw new Error(`Illegal move: ${JSON.stringify(move)}`);
  const state = structuredClone(prev);
  const task = state.queue.shift();
  state.pending = null;
  state.moves += 1;
  resolveTask(state, task, move.option);
  clearFresh(state);
  advance(state);
  return state;
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
const countOf = card => (card.copy ? Math.max(defById(card.def).n, defById(card.copy).n) : defById(card.def).n);
export const memberCount = (state, p) => p.members.reduce((s, u) => s + countOf(state.cards[u]), 0);
export const countMembersOfColor = (state, p, q) => p.members.reduce((s, u) => {
  const c = state.cards[u]; return s + (defById(c.def).quadrant === q ? countOf(c) : 0);
}, 0);
export const cardDef = (state, uid) => defById(state.cards[uid].def);
export function actionAt(state, q, i) { return quadrant(state.quadrants[q]).actions[i]; }
export function openSlots(state) {
  const out = [];
  state.quadrants.forEach((qid, q) => quadrant(qid).actions.forEach((a, i) => {
    if (a.ring <= state.round && state.slots[`${q}-${i}`] === undefined) out.push([q, i]);
  }));
  return out;
}

/** What a member would cost this player right now: { spend, colorPart, anyPart } or null if unaffordable. */
// A member's colored part is paid in its quadrant's resource. Some sphere drafts still relabel
// def.quadrant to a color name, so a bare color is accepted too.
const colorOf = def => { try { return quadrant(def.quadrant).resource; } catch { return def.quadrant; } };
// The colored part may be paid in any colors when the member's color isn't on the table, or when one of your
// members says so (Freelancer: flag anyColorPart).
const colorPartFree = (state, p, def) => !state.resources.includes(colorOf(def)) || sumMemberFlag(state, p, 'anyColorPart') > 0;
export function paymentPlan(state, p, uid) {
  const def = cardDef(state, uid);
  let s = def.s, w = def.w;
  let off = p.discount + sumMemberFlag(state, p, 'costReduction');
  const ds = Math.min(s, off); s -= ds; off -= ds; w = Math.max(0, w - off);
  if (colorPartFree(state, p, def)) { w += s; s = 0; }
  const goldDouble = sumMemberFlag(state, p, 'goldPaysDouble') > 0;
  const res = { ...p.res };
  const spend = Object.fromEntries(Object.keys(res).map(r => [r, 0]));
  const q = colorOf(def);
  const need = goldDouble && q === 'gold' ? Math.ceil(s / 2) : s;
  if (need > 0) {
    if ((res[q] ?? 0) < need) return null;
    res[q] -= need; spend[q] += need;
  }
  // "Any" is paid from the colors you hold most of, gold last (gold scores the Crown).
  let left = w;
  while (left > 0) {
    const c = Object.keys(res).filter(r => r !== 'gold' && res[r] > 0).sort((a, b) => res[b] - res[a])[0] || (res.gold > 0 ? 'gold' : null);
    if (!c) return null;
    res[c] -= 1; spend[c] += 1; left -= c === 'gold' && goldDouble ? 2 : 1;
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
function memberPayOk(state, p, def, v) {
  const goldDouble = sumMemberFlag(state, p, 'goldPaysDouble') > 0;
  const worth = c => (c === 'gold' && goldDouble ? 2 : 1);
  const d = p.discount + sumMemberFlag(state, p, 'costReduction');
  const q = colorOf(def);
  if (colorPartFree(state, p, def)) {
    let total = 0;
    for (const c in v) total += v[c] * worth(c);
    return total >= Math.max(0, def.s + def.w - d);
  }
  for (let ds = 0; ds <= Math.min(def.s, d); ds++) {
    const needS = def.s - ds, needW = Math.max(0, def.w - (d - ds));
    for (let a = 0; a <= (v[q] || 0); a++) {
      if (a * worth(q) < needS) continue;
      let rest = ((v[q] || 0) - a) * worth(q);
      for (const c in v) if (c !== q) rest += v[c] * worth(c);
      if (rest >= needW) return true;
    }
  }
  return false;
}
const vecKey = (state, v) => state.resources.map(r => v[r] || 0).join('-');
export function paymentChoices(state, p, uid) {
  const def = cardDef(state, uid);
  const keys = state.resources;
  const all = vectors(p.res, keys, def.s + def.w).filter(v => memberPayOk(state, p, def, v));
  const minimal = all.filter(v => keys.every(c => !v[c] || !memberPayOk(state, p, def, { ...v, [c]: v[c] - 1 })));
  return orderChoices(state, minimal, paymentPlan(state, p, uid), p);
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

function orderChoices(state, list, preferred, p) {
  const pk = preferred ? vecKey(state, preferred) : null;
  const guard = p ? protectedColors(state, p) : new Set();
  const risk = v => [...guard].reduce((s, c) => s + (v[c] || 0), 0);
  const seen = new Set();
  const out = [];
  for (const v of list) { const k = vecKey(state, v); if (!seen.has(k)) { seen.add(k); out.push(v); } }
  // The default way to pay comes first. It never spends a color whose contest you lead or tie when another way
  // exists; then as little gold as possible; then the usual plan (surplus colors first).
  // Gold is wild and scores its own contest, so among ways that spare your contests, spend the least gold.
  out.sort((a, b) => risk(a) - risk(b) || (a.gold || 0) - (b.gold || 0) || (vecKey(state, b) === pk) - (vecKey(state, a) === pk));
  return out;
}
function payOption(state, v, i) {
  return { id: `pay:${vecKey(state, v)}`, label: payString(v), kind: 'pay', spend: Object.fromEntries(state.resources.map(r => [r, v[r] || 0])), default: i === 0 };
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
    case 'setupPick':
      return {
        kind: 'setup', prompt: `${p.name}: pick a starting resource (${task.k} of 2)`,
        options: state.quadrants.map(q => ({ id: `color:${q}`, label: quadrant(q).name, kind: 'color', value: q })),
      };
    case 'place':
      return {
        kind: 'place', prompt: `${p.name}: place a minion`,
        options: [
          ...openSlots(state).filter(([q, i]) => !task.ring || actionAt(state, q, i).ring <= task.ring)
            .map(([q, i]) => ({ id: `slot:${q}-${i}`, label: actionAt(state, q, i).name, kind: 'slot', q, i })),
          ...squatSlots(state, p).filter(([q, i]) => !task.ring || actionAt(state, q, i).ring <= task.ring)
            .map(([q, i]) => ({ id: `squat:${q}-${i}`, label: `${actionAt(state, q, i).name} (join ${state.players[state.slots[`${q}-${i}`]].name})`, kind: 'slot', squat: true, q, i })),
        ],
        onEmpty: () => { p.left -= 1; },
      };
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
        if (eff.some(e => e.activate) && !c.used) opts.push({ id: `use:${uid}`, label: `Use ${d.name}`, kind: 'use', uid });
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
    case 'choose':
      return { kind: 'choose', prompt: task.prompt, options: task.options };
    case 'release': {
      const opts = [];
      for (const c of state.resources) {
        opts.push({ id: `all:${c}`, label: `All ${task.left} as ${c}`, kind: 'color', value: c, hint: -(p.res[c] || 0) });
        if (task.left > 1) opts.push({ id: `one:${c}`, label: `1 ${c}`, kind: 'color', value: c, hint: -(p.res[c] || 0) - 0.5 });
      }
      return { kind: 'choose', prompt: `${p.name}: take ${task.left} more from the release, in any colors`, options: opts };
    }
    case 'pay': {
      const list = task.uid !== undefined ? paymentChoices(state, p, task.uid) : followerChoices(state, p, TIERS.find(t => t.key === task.tier));
      const what = task.uid !== undefined ? cardDef(state, task.uid).name : `${TIERS.find(t => t.key === task.tier).get} followers`;
      return {
        kind: 'pay', prompt: `${p.name}: choose how to pay for ${what}`, ...(task.uid !== undefined ? { uid: task.uid } : { tier: task.tier }),
        options: [...list.map((v, i) => payOption(state, v, i)), { id: 'back', label: 'Back', kind: 'back' }],
      };
    }
    default:
      return null;
  }
}

function resolveTask(state, task, optionId) {
  const p = state.players[task.p];
  switch (task.t) {
    case 'setupPick': {
      const q = optionId.slice('color:'.length);
      p.res[quadrant(q).resource] += 1;
      log(state, `${p.name} starts with +1 ${quadrant(q).resource}.`);
      return;
    }
    case 'place': {
      const squat = optionId.startsWith('squat:');
      const [q, i] = optionId.slice(optionId.indexOf(':') + 1).split('-').map(Number);
      const key = `${q}-${i}`;
      if (squat) {
        spendAllowance(state, p, 'squat');
        (state.squats[key] = state.squats[key] || []).push(p.id);
      } else state.slots[key] = p.id;
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
      if (kind === 'use') {
        const c = state.cards[Number(rest)];
        c.used = true;
        const act = effectiveDefs(c).find(e => e.onActivate);
        const before = traceSnapshot(state);
        act.onActivate(ctxFor(state), p, wrap(state, c));
        traceChanges(state, before, p, act);
        state.queue.unshift({ t: 'buy', p: p.id, ...extraOf(task) });
        return;
      }
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
      handlerById(task.h)(ctxFor(state), p, o.value, task.data);
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
    case 'round': return startRound(state, task.r);
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
      // hooks that react to taking a space (Hustler) fire first so follow-up choices keep their order;
      // afterRivalAction: a member reacting to a rival taking a space (Silversmith)
      eachMember(state, (owner, card, def) => {
        if (owner === p && def.afterAction) def.afterAction(ctx, owner, card, qid);
        if (owner !== p && def.afterRivalAction) def.afterRivalAction(ctx, owner, card, qid, p);
      });
      a.resolve(ctx, p);
      return;
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
      if (state.round < 3 && !state.endEarly) state.queue.push({ t: 'round', r: state.round + 1 });
      else state.queue.push({ t: 'finish' });
      return;
    case 'finish': return finish(state);
    default:
      throw new Error(`Unknown task ${task.t}`);
  }
}

// ---------- rounds ----------

function startRound(state, r) {
  state.round = r;
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
    ? shuffleInPlace(state, state.players.map(p => p.id))
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
    for (const w of winners) { w.bonus += v; w.contest += v; }
    msg.push(`${c.label}: ${winners.map(w => w.name).join(' & ')} +${v}`);
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
      prize, rows, winners,
    };
  });
}

function finish(state) {
  const ctx = ctxFor(state);
  for (const p of state.players) p.final = { total: 0, parts: [] };
  eachMember(state, (owner, card, def) => {
    if (!def.onGameEnd) return;
    const got = def.onGameEnd(ctx, owner, card) || 0;
    if (got) { owner.bonus += got; owner.final.total += got; owner.final.parts.push(`${def.name} ${got > 0 ? '+' : '−'}${Math.abs(got)}`); }
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
/** Workers p had this round (Extra Hand adds to the round's count); older saves fall back to the round's count. */
export const roundWorkers = (state, p) => p.workers ?? WORKERS[Math.max(1, state.round) - 1];

// ---------- recruiting, buying, gaining ----------

function refill(state) {
  while (state.shop.length < SHOP_SIZE && state.pile.length) state.shop.push(state.pile.shift());
}

function recruit(state, p, uid, { free, spend: chosen }) {
  const idx = state.shop.indexOf(uid);
  const fromPile = idx < 0 ? state.pile.indexOf(uid) : -1;
  if (idx < 0 && (fromPile < 0 || fromPile >= pileReach(state, p))) throw new Error(`Card ${uid} is not in the shop`);
  let paid = 'free';
  if (!free) {
    const spend = chosen || paymentPlan(state, p, uid);
    if (!spend || !memberPayOk(state, p, cardDef(state, uid), spend) || Object.keys(spend).some(r => spend[r] > (p.res[r] || 0))) throw new Error('Cannot afford');
    for (const r in spend) p.res[r] -= spend[r];
    paid = payString(spend);
    // name what made it cheaper: a discount, cost reductions, gold paying double
    const notes = [];
    const def0 = cardDef(state, uid);
    if (p.discount && def0.s + def0.w > 0) notes.push(`discount −${p.discount}`);
    for (const flag of ['costReduction', 'goldPaysDouble']) {
      for (const u of p.members) for (const d of effectiveDefs(state.cards[u])) {
        if (!d[flag]) continue;
        if (flag === 'goldPaysDouble' && !spend.gold) continue;
        notes.push(flag === 'costReduction' ? `${d.name} saves ${d[flag] === true ? 1 : d[flag]}` : `${d.name}: gold counts double`);
      }
    }
    // Freelancer (anyColorPart): say so when the colored part was paid in other colors
    const q0 = colorOf(def0);
    if (state.resources.includes(q0) && sumMemberFlag(state, p, 'anyColorPart') > 0) {
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
  state.recruits += 1;
  p.turnRecruits += 1;
  const card = state.cards[uid], def = defById(card.def);
  // who recruited it and when: a member can't be released in the round its owner recruited it
  card.recruitedRound = state.round; card.recruitedBy = p.id;
  log(state, `${p.name} recruited ${def.name}${idx < 0 ? ` from the pile with ${p.name}'s ${flagName(state, p, 'pileReach')}` : ''} (${paid}).`);
  const ctx = ctxFor(state);
  const w = wrap(state, card);
  eachMember(state, (owner, c, d) => { if (d.onAnyRecruit) d.onAnyRecruit(ctx, owner, c, p, w); });
  // a when-recruited effect leaves a trace like any other member hook (Seed Money, Pilgrim, Retinue…)
  if (def.onRecruited) { const before = traceSnapshot(state); def.onRecruited(ctx, p, w); traceChanges(state, before, p, def); }
  // "Now and at round start" members (flag now): their round-start effect also fires once when recruited (Cory, 2026-10-14)
  if (def.now) for (const hook of ['onRoundStart', 'onRoundStartLate']) if (def[hook]) {
    const before = traceSnapshot(state); def[hook](ctx, p, w); traceChanges(state, before, p, def);
  }
}

function buyFollowers(state, p, tier, chosen) {
  const spend = chosen || followerPlan(state, p, tier);
  if (!spend) throw new Error('Cannot afford');
  for (const r in spend) p.res[r] -= spend[r];
  p.bonus += tier.get;
  p.bought = (p.bought || 0) + tier.get;
  log(state, `${p.name} bought ${tier.get} follower${tier.get > 1 ? 's' : ''} (${payString(spend)}).`);
  if (tier.limited) {
    state.stock[tier.key] -= 1;
    if (tier.clock && state.stock[tier.key] <= 0 && !state.endEarly) { state.endEarly = true; log(state, `The last ${tier.get}-follower buy is gone. The game ends after this round.`); }
  }
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => { if (def.onBuyFollowers) def.onBuyFollowers(ctx, owner, card, p, tier); });
}

function gain(state, p, color, n, { fromAction = false } = {}) {
  if (!(n > 0)) return;
  const g = { color, n, fromAction, doubled: false };
  const ctx = ctxFor(state);
  // conversions (Midas) first, then amount changes (Underdog), so member order never matters.
  // Each one that changes the gain says so in the log ("Ana's Underdog: gold gain 4 → 8").
  const said = (def, c0, n0) => {
    if (g.color === c0 && g.n === n0) return;
    const what = g.color === c0 ? `${c0} gain ${n0} → ${g.n}` : `${n0} ${c0} comes as ${g.n} ${g.color}`;
    log(state, `${p.name}'s ${def.name}: ${what}.`);
  };
  eachMemberOf(state, p, (card, def) => { if (def.convertGain) { const c0 = g.color, n0 = g.n; def.convertGain(ctx, p, card, g); said(def, c0, n0); } });
  eachMemberOf(state, p, (card, def) => { if (def.modifyGain) { const c0 = g.color, n0 = g.n; def.modifyGain(ctx, p, card, g); said(def, c0, n0); } });
  p.res[g.color] = (p.res[g.color] || 0) + g.n;
  eachMemberOf(state, p, (card, def) => { if (def.afterGain) def.afterGain(ctx, p, card, g); });
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
      fn(wrap(state, card), def);
      traceChanges(state, before, p, def);
    }
  }
}

// Every member trigger leaves a trace: if a hook changed anyone's resources or followers and didn't say so itself,
// the log says it for the hook ("Kay's Tax Collector: +1 gold"), so every number on the table traces to a line.
function traceSnapshot(state) {
  return { len: state.log.length, last: state.log[state.log.length - 1], players: state.players.map(o => ({ res: { ...o.res }, bonus: o.bonus, discount: o.discount })) };
}
function traceChanges(state, before, owner, def) {
  const name = def && def.name;
  if (!name) return;
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
  && (uid === undefined || !(state.cards[uid]?.recruitedRound === state.round && state.cards[uid]?.recruitedBy === p.id));
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
    countMembersOfColor: (p, q) => countMembersOfColor(state, p, q),
    card: uid => wrap(state, state.cards[uid]),
    defOf: c => (typeof c === 'number' ? cardDef(state, c) : c.def),
    membersOf: p => p.members.map(u => wrap(state, state.cards[u])),
    ownerOf: uid => state.players.find(o => o.members.includes(uid)),
    shopCards: () => state.shop.map(u => wrap(state, state.cards[u])),
    gain: (p, color, n, opts) => gain(state, p, color, n, opts),
    recruit: (p, uid, opts) => recruit(state, p, uid, opts),
    log: text => log(state, text),
    cardLeaves: (p, uid) => cardLeaves(state, p, uid),
    /** Run fn on behalf of owner's member `name` (a hook content code calls itself, e.g. Choir reacting to a copy):
     *  whatever it changes and doesn't log is logged under that name, like the engine's own member hooks. */
    asMember(owner, name, fn) {
      const before = traceSnapshot(state);
      const out = fn();
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
      let n = base, double = false;
      const who = [];
      eachMemberOf(state, thief, (card, def) => {
        if (typeof def.stealMore === 'number') { n += def.stealMore; if (def.stealMore) who.push(`${thief.name}'s ${def.name}: +${def.stealMore}`); }
        if (def.stealDouble && def.stealDouble(ctx, thief)) { double = true; who.push(`${thief.name}'s ${def.name}: doubled`); }
      });
      const out = double ? n * 2 : n;
      // say: a real steal (not an estimate) names the members that changed its size
      if (say && base > 0 && out !== base) log(state, `${thief.name}'s steal takes ${out}, not ${base} (${who.join('; ')}).`);
      return out;
    },
    /** One steal event from one victim. what: { take: {color: n} } moves resources (clamped to what they hold),
     *  { uid } moves a member, { other: n } reports units the caller already moved (e.g. a loot pile).
     *  what.give(n) hands the thief the proceeds before anyone reacts (so a reaction can take from the thief).
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
      const info = { thief, victim, took, uid: what.uid, n, reaction: !!what.reaction };
      for (const qid of state.quadrants) { const q = quadrant(qid); if (q.onSteal) q.onSteal(ctx, info); }
      eachMember(state, (owner, card, def) => { if (def.onSteal) def.onSteal(ctx, owner, card, info); });
      return n;
    },
    // Queue a decision for player p. It runs before anything else still queued.
    choose(p, prompt, options, handler, data = null) {
      if (!options.length) return;
      // follow-up choices queued during one resolution keep their call order
      const at = state.queue.findIndex(t => !t._fresh);
      const task = { t: 'choose', p: p.id, prompt, options, h: handler, data, _fresh: true };
      state.queue.splice(at < 0 ? state.queue.length : at, 0, task);
    },
  };
  return ctx;
}

// Follow-up choices queued while one task resolves are marked fresh so they keep their call order.
function clearFresh(state) { for (const t of state.queue) if (t._fresh) delete t._fresh; }

// ---------- misc ----------

function log(state, text) {
  state.log.push(text);
  if (state.log.length > LOG_MAX) state.log.splice(0, state.log.length - LOG_MAX);
}
const payString = s => Object.entries(s).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(', ') || 'free';
export const roman = r => ['I', 'II', 'III'][r - 1] || String(r);
