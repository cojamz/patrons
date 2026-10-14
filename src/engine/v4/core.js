// Patrons v4 engine. Pure and deterministic: state in, move in, state out.
// Everything runs through a task queue. When a task needs a decision, the engine stops and publishes
// state.pending = { player, kind, prompt, options:[{ id, label, kind, ... }] }. A move is { player, option }.
import { quadrant, defById, handlerById, DEFAULT_QUADRANTS } from './content/index.js';
import { shuffleInPlace } from './rng.js';

export const RING_VALUE = [2, 4, 6];
export const WORKERS = [3, 4, 5];
export const SHOP_SIZE = 6;
export const TIERS = [
  { key: 'small', cost: 2, get: 1, colors: 1, label: '2 of anything' },
  { key: 'mid', cost: 4, get: 3, colors: 2, label: '4, at least 2 colors' },
  { key: 'big', cost: 6, get: 6, colors: 3, label: '6, at least 3 colors', limited: true },
];
const LOG_MAX = 300;

// ---------- creation ----------

/**
 * @param {{ seats: { name?: string, kind?: 'human'|'bot' }[], seed?: number, quadrants?: string[] }} opts
 */
export function createGame({ seats, seed = 1, quadrants = DEFAULT_QUADRANTS }) {
  if (!Array.isArray(seats) || seats.length < 2 || seats.length > 4) throw new Error('Patrons needs 2 to 4 seats.');
  const resources = quadrants.map(q => quadrant(q).resource);
  const zero = Object.fromEntries(resources.map(r => [r, 0]));
  const cards = {};
  let uid = 0;
  for (const q of quadrants) for (const def of quadrant(q).members)
    for (let k = 0; k < def.copies; k++) { cards[uid] = { uid, def: def.id }; uid++; }
  const state = {
    v: 4, seed: seed >>> 0, rng: seed >>> 0, quadrants: [...quadrants], resources,
    players: seats.map((s, i) => ({
      id: i, name: s.name || `P${i + 1}`, kind: s.kind || 'human',
      res: { ...zero }, bonus: 0, contest: 0, members: [], discount: 0, left: 0, turnRecruits: 0, final: null,
    })),
    cards, pile: Object.keys(cards).map(Number), shop: [],
    round: 0, slots: {}, order: [], turnIndex: 0, current: null,
    recruits: 0, bigLeft: 2 * seats.length, endEarly: false,
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

export const followers = (state, p) => 1 + p.bonus + p.members.reduce((s, u) => s + defById(state.cards[u].def).f, 0);
export const memberCount = (state, p) => p.members.reduce((s, u) => s + defById(state.cards[u].def).n, 0);
export const countMembersOfColor = (state, p, q) => p.members.reduce((s, u) => {
  const d = defById(state.cards[u].def); return s + (d.quadrant === q ? d.n : 0);
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
export function paymentPlan(state, p, uid) {
  const def = cardDef(state, uid);
  let s = def.s, w = def.w;
  let off = p.discount + sumMemberFlag(state, p, 'costReduction');
  const ds = Math.min(s, off); s -= ds; off -= ds; w = Math.max(0, w - off);
  const goldDouble = sumMemberFlag(state, p, 'goldPaysDouble') > 0;
  const res = { ...p.res };
  const spend = Object.fromEntries(Object.keys(res).map(r => [r, 0]));
  const q = def.quadrant;
  const need = goldDouble && q === 'gold' ? Math.ceil(s / 2) : s;
  if ((res[q] ?? 0) < need) return null;
  res[q] -= need; spend[q] += need;
  // "Any" is paid from the colors you hold most of, gold last (gold scores the Crown).
  let left = w;
  while (left > 0) {
    const c = Object.keys(res).filter(r => r !== 'gold' && res[r] > 0).sort((a, b) => res[b] - res[a])[0] || (res.gold > 0 ? 'gold' : null);
    if (!c) return null;
    res[c] -= 1; spend[c] += 1; left -= c === 'gold' && goldDouble ? 2 : 1;
  }
  return spend;
}

/** Paying for a follower buy: needs `colors` different resources. Gold is spent last. */
export function followerPlan(state, p, tier) {
  if (tier.limited && state.bigLeft <= 0) return null;
  const res = { ...p.res };
  const spend = Object.fromEntries(Object.keys(res).map(r => [r, 0]));
  const order = () => Object.keys(res).filter(c => res[c] > 0).sort((a, b) => (a === 'gold') - (b === 'gold') || res[b] - res[a]);
  const cols = order();
  if (cols.length < tier.colors) return null;
  for (let i = 0; i < tier.colors; i++) { res[cols[i]]--; spend[cols[i]]++; }
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
        kind: 'place', prompt: `${p.name}: place a worker`,
        options: openSlots(state).map(([q, i]) => ({ id: `slot:${q}-${i}`, label: actionAt(state, q, i).name, kind: 'slot', q, i })),
        onEmpty: () => { p.left -= 1; },
      };
    case 'buy': {
      const opts = [];
      for (const uid of state.shop) if (paymentPlan(state, p, uid))
        opts.push({ id: `card:${uid}`, label: cardDef(state, uid).name, kind: 'card', uid });
      TIERS.forEach(t => { if (followerPlan(state, p, t)) opts.push({ id: `tier:${t.key}`, label: `+${t.get} followers`, kind: 'tier', tier: t.key }); });
      for (const uid of p.members) {
        const c = state.cards[uid], d = defById(c.def);
        // a Doppelganger offers what it copies too
        const eff = effectiveDefs(c);
        if (eff.some(e => e.activate) && !c.used) opts.push({ id: `use:${uid}`, label: `Use ${d.name}`, kind: 'use', uid });
        if (eff.some(e => e.toggle)) opts.push({ id: `toggle:${uid}`, label: `${d.name}: switch ${c.on === false ? 'on' : 'off'}`, kind: 'toggle', uid });
      }
      const real = opts.filter(o => o.kind === 'card' || o.kind === 'tier' || o.kind === 'use');
      if (!real.length) return { kind: 'buy', prompt: '', options: [], onEmpty: () => log(state, `${p.name} couldn't buy anything.`) };
      opts.push({ id: 'pass', label: 'Pass', kind: 'pass' });
      return { kind: 'buy', prompt: `${p.name}: recruit a member, buy followers, or pass`, options: opts };
    }
    case 'choose':
      return { kind: 'choose', prompt: task.prompt, options: task.options };
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
      const [q, i] = optionId.slice('slot:'.length).split('-').map(Number);
      state.slots[`${q}-${i}`] = p.id;
      p.left -= 1;
      const a = actionAt(state, q, i);
      log(state, `${p.name} took ${a.name} (${quadrant(state.quadrants[q]).name}).`);
      state.queue.unshift({ t: 'act', p: p.id, q, i });
      return;
    }
    case 'buy': {
      if (optionId === 'pass') { log(state, `${p.name} passed.`); return; }
      const [kind, rest] = optionId.split(':');
      if (kind === 'card') { recruit(state, p, Number(rest), { free: false }); return; }
      if (kind === 'tier') { buyFollowers(state, p, TIERS.find(t => t.key === rest)); return; }
      if (kind === 'use') {
        const c = state.cards[Number(rest)];
        c.used = true;
        effectiveDefs(c).find(e => e.onActivate).onActivate(ctxFor(state), p, wrap(state, c));
        state.queue.unshift({ t: 'buy', p: p.id });
        return;
      }
      if (kind === 'toggle') {
        const c = state.cards[Number(rest)];
        c.on = c.on === false;
        log(state, `${p.name} switched ${defById(c.def).name} ${c.on ? 'on' : 'off'}.`);
        state.queue.unshift({ t: 'buy', p: p.id });
        return;
      }
      throw new Error(`Bad buy option ${optionId}`);
    }
    case 'choose': {
      const o = task.options.find(x => x.id === optionId);
      handlerById(task.h)(ctxFor(state), p, o.value, task.data);
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
      p.turnRecruits = 0;
      state.queue.unshift({ t: 'place', p: p.id }, { t: 'buy', p: p.id }, { t: 'endTurn', p: p.id });
      return;
    }
    case 'act': {
      const qid = state.quadrants[task.q];
      const a = actionAt(state, task.q, task.i);
      const ctx = ctxFor(state);
      // hooks that react to taking a space (Hustler) fire first so follow-up choices keep their order
      eachMember(state, (owner, card, def) => { if (owner === p && def.afterAction) def.afterAction(ctx, owner, card, qid); });
      a.resolve(ctx, p);
      return;
    }
    case 'endTurn': {
      const ctx = ctxFor(state);
      eachMember(state, (owner, card, def) => { if (def.onTurnEnd) def.onTurnEnd(ctx, owner, card, p); });
      state.current = null;
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
  state.recruits = 0;
  const n = WORKERS[r - 1];
  for (const p of state.players) p.left = n;
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => { if (def.onRoundStart) def.onRoundStart(ctx, owner, card); });
  // Fewest followers picks first. Ties: whoever was later in last round's turn order (round I: later seat).
  // The first pass of last round's snake is its turn order (the last pass is reversed in even rounds).
  const prev = state.order.length ? state.order.slice(0, state.players.length) : [...state.players.map(p => p.id)];
  const lastPos = id => prev.indexOf(id);
  const base = [...state.players].sort((a, b) => followers(state, a) - followers(state, b) || lastPos(b.id) - lastPos(a.id)).map(p => p.id);
  state.order = [];
  for (let k = 0; k < n; k++) state.order.push(...(k % 2 ? [...base].reverse() : base));
  log(state, `Round ${roman(r)} begins. ${state.players[base[0]].name} picks first.`);
  state.queue.push(...state.order.map(id => ({ t: 'turn', p: id })), { t: 'endRound' }, { t: 'afterRound' });
}

function endRound(state) {
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => { if (def.onRoundEnd) def.onRoundEnd(ctx, owner, card); });
  const v = RING_VALUE[state.round - 1];
  const msg = [];
  for (const qid of state.quadrants) {
    const q = quadrant(qid);
    const scores = state.players.map(p => q.scoring.score(ctx, p));
    const top = Math.max(...scores);
    if (top <= 0) continue;
    const winners = state.players.filter((p, i) => scores[i] === top);
    for (const w of winners) { w.bonus += v; w.contest += v; }
    msg.push(`${q.scoring.label}: ${winners.map(w => w.name).join(' & ')} +${v}`);
  }
  log(state, `Round ${roman(state.round)} ends. ${msg.join(' · ') || 'No one scored.'}`);
}

function finish(state) {
  const ctx = ctxFor(state);
  for (const p of state.players) p.final = { total: 0, parts: [] };
  eachMember(state, (owner, card, def) => {
    if (!def.onGameEnd) return;
    const got = def.onGameEnd(ctx, owner, card) || 0;
    if (got) { owner.bonus += got; owner.final.total += got; owner.final.parts.push(`${def.name} +${got}`); }
  });
  const ranked = [...state.players].sort((a, b) => followers(state, b) - followers(state, a) || memberCount(state, b) - memberCount(state, a));
  state.ranking = ranked.map(p => p.id);
  state.over = true;
  state.current = null;
  log(state, `Game over. ${ranked[0].name} wins with ${followers(state, ranked[0])} followers.`);
}

// ---------- recruiting, buying, gaining ----------

function refill(state) {
  while (state.shop.length < SHOP_SIZE && state.pile.length) state.shop.push(state.pile.shift());
}

function recruit(state, p, uid, { free }) {
  const idx = state.shop.indexOf(uid);
  if (idx < 0) throw new Error(`Card ${uid} is not in the shop`);
  let paid = 'free';
  if (!free) {
    const spend = paymentPlan(state, p, uid);
    if (!spend) throw new Error('Cannot afford');
    for (const r in spend) p.res[r] -= spend[r];
    paid = payString(spend);
    p.discount = 0;
  }
  state.shop.splice(idx, 1);
  refill(state);
  p.members.push(uid);
  state.recruits += 1;
  p.turnRecruits += 1;
  const card = state.cards[uid], def = defById(card.def);
  log(state, `${p.name} recruited ${def.name} (${paid}).`);
  const ctx = ctxFor(state);
  const w = wrap(state, card);
  eachMember(state, (owner, c, d) => { if (d.onAnyRecruit) d.onAnyRecruit(ctx, owner, c, p, w); });
  if (def.onRecruited) def.onRecruited(ctx, p, w);
}

function buyFollowers(state, p, tier) {
  const spend = followerPlan(state, p, tier);
  if (!spend) throw new Error('Cannot afford');
  for (const r in spend) p.res[r] -= spend[r];
  p.bonus += tier.get;
  if (tier.limited) {
    state.bigLeft -= 1;
    if (state.bigLeft <= 0 && !state.endEarly) { state.endEarly = true; log(state, 'The last 6-follower buy is gone. The game ends after this round.'); }
  }
  log(state, `${p.name} bought ${tier.get} follower${tier.get > 1 ? 's' : ''} (${payString(spend)}).`);
  const ctx = ctxFor(state);
  eachMember(state, (owner, card, def) => { if (def.onBuyFollowers) def.onBuyFollowers(ctx, owner, card, p); });
}

function gain(state, p, color, n, { fromAction = false } = {}) {
  if (!(n > 0)) return;
  const g = { color, n, fromAction, doubled: false };
  const ctx = ctxFor(state);
  // conversions (Midas) first, then amount changes (Underdog), so member order never matters
  eachMemberOf(state, p, (card, def) => { if (def.convertGain) def.convertGain(ctx, p, card, g); });
  eachMemberOf(state, p, (card, def) => { if (def.modifyGain) def.modifyGain(ctx, p, card, g); });
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
    for (const def of effectiveDefs(card)) fn(wrap(state, card), def);
  }
}
function eachMember(state, fn) {
  for (const owner of state.players) eachMemberOf(state, owner, (card, def) => fn(owner, card, def));
}
function sumMemberFlag(state, p, flag) {
  let s = 0;
  for (const uid of p.members) for (const def of effectiveDefs(state.cards[uid])) {
    const v = def[flag];
    s += v === true ? 1 : typeof v === 'number' ? v : 0;
  }
  return s;
}

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
    buryFromShop(uid) {
      const i = state.shop.indexOf(uid);
      if (i < 0) return;
      state.shop.splice(i, 1);
      state.pile.push(uid);
      refill(state);
    },
    moveMember(uid, from, to) {
      from.members.splice(from.members.indexOf(uid), 1);
      to.members.push(uid);
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
const payString = s => Object.entries(s).filter(([, v]) => v).map(([c, v]) => `${v} ${c}`).join(', ') || 'nothing';
export const roman = r => ['I', 'II', 'III'][r - 1] || String(r);
