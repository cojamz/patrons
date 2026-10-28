// Bots: pure functions that pick one legal option. Used for empty seats, simulation and fuzz tests.
//
// Difficulty levels. A seat's level comes from `state.players[i].bot` ('easy' | 'normal' | 'hard'), or from
// `chooseBotMove(state, rand, { level })`, which wins over the seat. Anything else plays 'normal'.
//   easy   – normal's end-of-game judgment, played carelessly: noisy placements and buys, a soft spot for members,
//            little attention to rivals. Spends down like normal (the old greedy easy hoarded 50+ gold and recruited
//            11 members; it lives on as chooseGreedyMove for sims).
//   normal – the same greedy shape, fixed: it values every option by what it's worth at game end (followers now,
//            a member's ability over the turns left, what its resources can still turn into with the buys it has
//            left, and the ring contests it leads). Never ends holding resources a follower buy could use.
//   hard   – normal plus lookahead (thinker.js): plays its best few options out to the round end with normal
//            bots and keeps the best. Its work is counted in moves, not milliseconds, so it stays deterministic.
// Every level is deterministic for a given state and rand.
import {
  contextFor, actionAt, cardDef, TIERS, followers, memberCount, RING_VALUE, WORKERS, tierLeft,
  paymentChoices, followerChoices, releaseRefund, liveOptions,
} from './core.js';
import { defById, quadrant, handlerById } from './content/index.js';
import { plainCopy } from './copy.js';
import { chooseThinkerMove } from './thinker.js';

export const BOT_LEVELS = ['easy', 'normal', 'hard'];
// A liking for members on top of what they're measured to be worth, in followers, fading to BIAS_FLOOR of itself
// as the game runs out. The valuation alone under-recruits: with it, normal beat the old normal 37% to 21% and
// recruits ~7 members instead of ~4 (400 games each; design/eval/bots.md). SPITE: how much the best rival's
// expected total counts against the bot's own (1 = pure margin; 0.4 measured stronger than 1 and than 0).
const MEMBER_BIAS = 2, BIAS_FLOOR = 0.3, SPITE = 0.4;
// Easy and casual are normal with other options (see scoreOptions): noise = random spread on placements, buyNoise
// on buys, memberBias = followers added to every recruit (biasFloor: what's left of it at game end), k = weight of
// member abilities, spite = how much the best rival's total counts. Easy is sloppy and blind to engines.
const EASY = { noise: 6, buyNoise: 4, k: 1, spite: 1, memberBias: 0, biasFloor: 1 };
const NORMAL = { noise: 0.3, buyNoise: 0.05, k: 2, spite: SPITE, memberBias: MEMBER_BIAS, biasFloor: BIAS_FLOOR };
/** A level between easy (t = 0) and normal (t = 1): every option interpolated. For sims. */
export const blendProfile = t => Object.fromEntries(Object.keys(NORMAL).map(key => [key, EASY[key] + (NORMAL[key] - EASY[key]) * t]));
// Sim-only levels (not offered in setup). casual: halfway between easy and normal, a stand-in for a table of
// reasonable people. collector: loose play and a love of members that never fades (recruits ~9 a player).
export const SIM_LEVELS = [...BOT_LEVELS, 'casual', 'collector'];
export const BOT_PROFILES = {
  easy: EASY,
  casual: blendProfile(0.5),
  collector: { noise: 3, buyNoise: 2, memberBias: 3, biasFloor: 1, spite: 1 },
  normal: {},
};
// Hard's wall-clock cap per move (pass { maxMs: Infinity } for deterministic sims).
const HARD_MAX_MS = 200; // plus ~10–40ms of setup before the clock starts: under 300ms a move in a browser
const SETUP_WEIGHTS = { gold: 3, red: 3, blue: 1, green: 1 };

/** For a setup screen: the levels in order, with a name and a one-line blurb. */
export const BOT_LEVEL_INFO = [
  { level: 'easy', name: 'Easy', blurb: 'Careless: often takes a worse move, and undervalues what members do.' },
  { level: 'normal', name: 'Normal', blurb: 'Plays for the end: builds a following of members, then spends down into followers.' },
  { level: 'hard', name: 'Hard', blurb: 'Normal, plus it plays its best few moves ahead before choosing.' },
];
export const DEFAULT_BOT_LEVEL = 'normal';

/** The level a seat plays at: opts.level, else the seat's `bot` field ('hard' or { level: 'hard' }), else 'normal'. */
export function botLevel(state, player, opts = {}) {
  const b = state.players[player]?.bot;
  const l = opts.level ?? (b && typeof b === 'object' ? b.level : b);
  return SIM_LEVELS.includes(l) ? l : DEFAULT_BOT_LEVEL;
}

/** Sets seat levels on a fresh game (levels[i] for player i; missing or unknown entries are left alone). */
export function setBotLevels(state, levels = []) {
  levels.forEach((l, i) => { if (BOT_LEVELS.includes(l) && state.players[i]) state.players[i].bot = l; });
  return state;
}

/**
 * @param {object} state
 * @param {() => number} rand
 * @param {{ level?: 'easy'|'normal'|'hard', budget?: number }} opts
 * @returns {{ player: number, option: string } | null}
 */
export function chooseBotMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  const level = botLevel(state, pend.player, opts);
  if (level === 'hard') return chooseThinkerMove(state, rand, { maxMs: HARD_MAX_MS, ...opts });
  return chooseNormalMove(state, rand, { ...BOT_PROFILES[level], ...opts });
}

/** The easy level: normal, played carelessly. */
export const chooseEasyMove = (state, rand = Math.random, opts = {}) => chooseNormalMove(state, rand, { ...BOT_PROFILES.easy, ...opts });

// ---------- greedy: the first bot (the old easy level), kept for sims ----------

/** The first greedy bot: rates each option on its own. Recruits nearly anything affordable and can hoard. */
export function chooseGreedyMove(state, rand = Math.random, { noise = 1.6 } = {}) {
  const pend = state.pending;
  if (!pend) return null;
  const p = state.players[pend.player];
  const ctx = contextFor(state);
  const move = o => ({ player: pend.player, option: o.id });
  const best = (opts, score) => opts.reduce((a, b) => (score(b) > score(a) ? b : a));

  switch (pend.kind) {
    case 'setup': return setupPick(pend, rand);
    case 'place':
      return move(best(pend.options.filter(o => o.kind === 'slot'), o => {
        const a = actionAt(state, o.q, o.i);
        const qid = state.quadrants[o.q];
        const hustle = p.members.filter(u => state.cards[u].def === 'gold.hustler' && state.cards[u].color === qid).length;
        return a.estimate(ctx, p) + hustle + rand() * 1.2 * noise;
      }));
    case 'buy': {
      const use = useOption(state, pend, ctx, p);
      if (use) return move(use);
      const tiers = pend.options.filter(o => o.kind === 'tier');
      const tierOf = o => TIERS.find(t => t.key === o.tier);
      const last = state.round === 3 && p.left === 0;
      if (last && tiers.length) return move(best(tiers, o => tierOf(o).get));
      const cards = pend.options.filter(o => o.kind === 'card').map(o => {
        const d = cardDef(state, o.uid), c = d.s + d.w;
        const v = d.f * 1.4 + (d.vanilla ? 0 : 1.6) + c * 0.3 - (state.round === 3 ? c * 0.5 : 0) + rand() * 0.5 * noise;
        return { o, v };
      });
      const top = cards.length ? cards.reduce((a, b) => (b.v > a.v ? b : a)) : null;
      if (top && top.v > 1.5) return move(top.o);
      const bulk = tiers.filter(o => tierOf(o).limited);
      if (bulk.length) return move(best(bulk, o => tierOf(o).get));
      const mid = tiers.find(o => tierOf(o).get === 3);
      const held = Object.values(p.res).reduce((a, b) => a + b, 0);
      if (mid && state.round >= 2 && held >= 7) return move(mid);
      return move(pend.options.find(o => o.kind === 'pass'));
    }
    default: return followUp(pend, rand, state);
  }
}

function setupPick(pend, rand) {
  const total = pend.options.reduce((s, o) => s + (SETUP_WEIGHTS[o.value] || 1), 0);
  let r = rand() * total;
  for (const o of pend.options) { r -= SETUP_WEIGHTS[o.value] || 1; if (r <= 0) return { player: pend.player, option: o.id }; }
  return { player: pend.player, option: pend.options[0].id };
}

// pay: the default way (it already spares colors whose contest you lead). choose: the content's hint; a swap is
// valued on a copy of the game (chooseSwap).
function followUp(pend, rand, state) {
  const move = o => ({ player: pend.player, option: o.id });
  // Red's swaps can be skipped ("Don't swap"); bots still swap, as before the skip existed
  const trades = pend.kind === 'choose' ? pend.options.filter(o => o.kind === 'trade') : [];
  if (state && trades.length && pend.options.every(o => o.kind === 'trade' || o.kind === 'pass')) {
    return move(trades.length === 1 ? trades[0] : chooseSwap(state, { ...pend, options: trades }));
  }
  if (pend.kind === 'pay') return move(pend.options.find(o => o.default) || pend.options[0]);
  if (pend.kind === 'choose') {
    const opts = state && pend.options.length > 1 ? avoidUndo(state, pend) : pend.options;
    return move(opts.reduce((a, b) => ((b.hint || 0) + rand() * 0.01 > (a.hint || 0) ? b : a)));
  }
  return move(pend.options[0]);
}

// A choice that leads into a swap handing back a member you swapped away (Reprise: "copy which of your spaces?" →
// Even Swap) is dropped while another choice is left.
function avoidUndo(state, pend) {
  const me = pend.player, task = state.queue[0];
  if (!task || task.t !== 'choose' || !task.h || !givenAway(state, me).size) return pend.options;
  const ok = pend.options.filter(o => {
    try {
      const s = lightClone(state);
      const ctx = contextFor(s);
      handlerById(task.h)(ctx, s.players[me], o.value, task.data);
      let undo = false;
      settle(s, ctx, t => { undo = undo || undoesSwap(state, s, me, t); });
      return !undo;
    } catch { return true; }
  });
  return ok.length ? ok : pend.options;
}

// Swaps (Even Swap, Swap Sides) must take one when any fits, so a bot facing only even trades used to pick at random
// and could hand a rival back the very member it swapped for a turn earlier: two turns gone, nothing changed (blind
// tester, 2026-10-15). Each swap is valued on a copy of the game (followers, contests, what the members still do), and
// taking back a member you gave away is ruled out while anything else fits.
/** Is choice t (queued on copy s by the move just tried) a swap whose every option takes back a member `me` swapped away? */
function undoesSwap(state, s, me, t) {
  if (t.p !== me || !t.options.every(o => o.kind === 'trade')) return false;
  const given = givenAway(state, me);
  return given.size > 0 && t.options.every(o => { const u = swapSides(s, me, o.value).in; return u !== null && given.has(cardDef(s, u).name); });
}

/** A swap of cards a and b, from `me`'s side: { out: my card it moves away, in: the card it brings me }, or nulls when
 *  it moves none of mine, or only swaps two of mine (Red's swaps take either orientation, and any two cults or the shop). */
function swapSides(state, me, [a, b]) {
  const mine = u => state.players[me].members.includes(u);
  if (mine(a) && !mine(b)) return { out: a, in: b };
  if (mine(b) && !mine(a)) return { out: b, in: a };
  return { out: null, in: null };
}

/** Names of members player `me` has swapped away this game (read from the log). Red's swaps log
 *  "P1 swapped P1's X and Shop's Y." (red.js trade); the older "P1 traded X for P2's Y." is read too. */
function givenAway(state, me) {
  const p = state.players[me], given = new Set();
  const owners = [...state.players.map(o => o.name), 'Shop'];
  for (const line of state.log || []) {
    if (typeof line !== 'string') continue;
    const m = line.startsWith(`${p.name} traded `) && line.match(/ traded (.+) for .+'s (.+)\.$/);
    if (m) { given.add(m[1]); continue; }
    const head = `${p.name} swapped `;
    if (!line.startsWith(head) || !line.endsWith('.')) continue;
    const body = line.slice(head.length, -1);
    for (const left of owners) for (const right of owners) {
      if (!body.startsWith(`${left}'s `) || left === right && left === p.name) continue;
      const k = body.indexOf(` and ${right}'s `, left.length + 3);
      if (k < 0) continue;
      if (left === p.name) given.add(body.slice(left.length + 3, k));
      if (right === p.name) given.add(body.slice(k + ` and ${right}'s `.length));
    }
  }
  return given;
}
// A space whose only swap hands back a member you swapped for: the turn undoes your own earlier one, and people read it
// as a broken bot, even when the bot rates the member it gets back higher now. Rated this much worse, in followers:
// enough that it's never taken while any other space is open.
const UNDO_SWAP = 20;

function chooseSwap(state, pend) {
  const me = pend.player;
  const given = givenAway(state, me);
  const { turns, roundLeft } = horizon(state);
  const lt = laterTurns(state);
  const placesLeft = turns[me] + lt.turns;
  const buys = state.players.map((_, i) => turns[i] + lt.turns + (i === me ? 1 : 0));
  const income = turns.map(t => (t * INCOME[Math.max(1, state.round) - 1] + lt.income) * INCOME_SCALE);
  // the queued choice carries its handler and data (Even Swap's mode, Swap Sides'); without them every trade threw and fell back to its hint
  const task = state.queue.find(t => t.t === 'choose' && t.p === me);
  const rated = pend.options.map(o => {
    // either orientation, and swaps that move none of mine (two rivals', or a rival's and the shop's)
    const side = swapSides(state, me, o.value);
    let v;
    try {
      const s = lightClone(state);
      const ctx = contextFor(s);
      handlerById(task?.h || 'red.trade')(ctx, s.players[me], o.value, task?.data);
      const ability = side.in === null ? 0 : abilityValue(cardDef(s, side.in), placesLeft) - abilityValue(cardDef(s, side.out), placesLeft);
      v = marginOf(evaluate(s, buys, income, roundLeft, { [me]: ability }), me);
    } catch (e) { globalThis.__swapFail = (globalThis.__swapFail || 0) + 1; v = (o.hint || 0) - 100; }
    if (side.in !== null && given.has(cardDef(state, side.in).name)) v -= 100;
    return { o, v };
  });
  return rated.reduce((a, b) => (b.v > a.v ? b : a)).o;
}

function useOption(state, pend, ctx, p) {
  const canUse = c => [c.def, c.copy].some(id => id && defById(id).botActivate?.(ctx, p));
  return pend.options.find(o => o.kind === 'use' && canUse(state.cards[o.uid]));
}

// ---------- normal: greedy on an end-of-game value ----------

// Rough resources one placement brings in, by round (the ring budget, plus what members add).
const INCOME = [3.5, 5.5, 8];
// Bots plan as if only part of that income will need its own buy (measured: planning on all of it hoards).
const INCOME_SCALE = 0.4;
// How much a member's ability is worth, in followers per resource of its cost, if it has the whole game ahead.
// A member bought with 9 of 12 placements left is worth K × cost × 0.75 on top of its stars. Set by head-to-head
// sims (normal with K = 2 or 3 beat K = 1 and recruited more; 200 games each); it also covers the contests and
// member counts a member keeps paying into.
const K_ABILITY = 2;
// How many ways to pay a buy are compared (the engine lists the contest-safe ones first).
const PAY_WAYS = 4; // 4 vs 10: same win rate (200 games), ~20% faster, far lower worst case
// Extra ways to pay compared: the ones that spend only what's over a contest lead.
const SURPLUS_WAYS = 3;
/** Per color, what a player can spend without giving up a lead in a contest that counts it: all of it where they
 * don't lead, and what's over the runner-up (+1) where they do. */
export function surplus(state, me) {
  const p = state.players[me];
  const out = {};
  for (const r of state.resources) {
    const mine = p.res[r] || 0;
    const counted = state.quadrants.some(q => quadrant(q).resource === r);
    const next = Math.max(0, ...state.players.filter(o => o !== p).map(o => o.res[r] || 0));
    out[r] = counted && mine > next ? Math.max(0, mine - next - 1) : mine;
  }
  return out;
}
// Weight of later rounds' contests in a lead held now.
const FUTURE_CONTESTS = 0.4;
// A copy of the game for trying a move: everything but the log, queue and pending decision (state is plain JSON,
// and a hand copy is several times faster than structuredClone).
const copy = plainCopy;
const lightClone = s => {
  const c = {};
  for (const k in s) if (k !== 'log' && k !== 'queue' && k !== 'pending') c[k] = copy(s[k]);
  c.log = []; c.queue = []; c.pending = null;
  return c;
};
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

/** Turns each player still has (not counting the one being played), and how far through its round the game is. */
export function horizon(state) {
  const n = state.players.length;
  const turns = Array(n).fill(0);
  for (const t of state.queue) if (t.t === 'turn') turns[t.p] += 1;
  const roundTotal = (WORKERS[state.round - 1] || 1) * n;
  return { turns, roundLeft: Math.min(1, turns.reduce((a, b) => a + b, 0) / roundTotal) };
}
// Turns (and the income they bring) in rounds not started yet. The game always ends after round III (no clock).
function laterTurns(s) {
  if (s.round >= 3) return { turns: 0, income: 0 };
  let turns = 0, income = 0;
  for (let r = s.round; r < 3; r++) { turns += WORKERS[r]; income += WORKERS[r] * INCOME[r]; }
  return { turns, income };
}

// What a pile of resources can still become: the best follower buys it can make with the buys that are left.
// `extra` is income still to come (spread over colors like what's held). Leftovers are worth almost nothing.
function liquidate(s, res, extra, buys, wild) {
  if (buys <= 0) return 0;
  const keys = s.resources;
  const tot = sum(res);
  const pool = {};
  for (const k of keys) pool[k] = (res[k] || 0) + (extra * ((res[k] || 0) + 1)) / (tot + keys.length);
  const n = s.players.length;
  const used = {};
  let got = 0;
  const tiers = [...TIERS].sort((a, b) => b.get - a.get);
  for (let b = 0; b < buys; b++) {
    let bought = false;
    for (const t of tiers) {
      // a fair share of a limited stock: the rest will likely go to rivals (so a scarce buy is worth taking now)
      if (t.limited && (used[t.key] || 0) >= Math.floor(tierLeft(s, t) / n)) continue;
      if (sum(pool) < t.cost - 1e-9) continue;
      const plain = keys.filter(k => !wild.has(k) && pool[k] >= 1).sort((x, y) => pool[y] - pool[x]);
      const wilds = keys.filter(k => wild.has(k));
      if (plain.length + wilds.reduce((a, k) => a + Math.floor(pool[k]), 0) < t.colors) continue;
      let need = t.cost, c = t.colors;
      for (const k of plain) { if (!c) break; pool[k] -= 1; need -= 1; c -= 1; }
      for (const k of wilds) while (c > 0 && pool[k] >= 1) { pool[k] -= 1; need -= 1; c -= 1; }
      while (need > 1e-9) {
        const k = keys.reduce((x, y) => (pool[y] > pool[x] ? y : x));
        const x = Math.min(pool[k], need);
        pool[k] -= x; need -= x;
      }
      got += t.get; used[t.key] = (used[t.key] || 0) + 1; bought = true;
      break;
    }
    if (!bought) break;
  }
  return got + 0.2 * Math.min(2, sum(pool));
}

// Expected followers from this round's ring contests, given who leads each one now.
function contests(s, ctx, p, roundLeft, future = FUTURE_CONTESTS) {
  if (s.over || !s.round) return 0;
  // later rounds' rings count too, discounted: a lead in members lasts, a pile of resources mostly gets spent
  const later = RING_VALUE.slice(s.round).reduce((a, b) => a + b, 0) * future;
  const v = RING_VALUE[s.round - 1];
  let out = 0;
  for (const qid of s.quadrants) {
    const q = quadrant(qid);
    let mine, other;
    try {
      mine = q.scoring.score(ctx, p);
      other = Math.max(...s.players.filter(o => o !== p).map(o => q.scoring.score(ctx, o)));
    } catch { continue; }
    if (!(mine > 0)) continue;
    const certain = mine >= other ? 1 : 0;
    const rough = mine > other ? 0.75 : mine === other ? 0.55 : 0.15;
    out += v * (certain * (1 - roundLeft) + rough * roundLeft) + later * rough;
  }
  return out;
}

// Followers members will pay at game end if it ended now (Tycoon, Patriarch…).
function gameEndPay(s, ctx, p) {
  let out = 0;
  for (const c of ctx.membersOf(p)) for (const id of [c.def.id, c.copy].filter(Boolean)) {
    const d = defById(id);
    if (!d.onGameEnd) continue;
    try { out += d.onGameEnd(ctx, p, c) || 0; } catch { /* estimate only */ }
  }
  return out;
}

// A member's own data, not an ability. Every other key is a hook or a rule flag (halfTurns, brokerBonus, toggle…).
const DATA_KEYS = new Set(['key', 'name', 's', 'w', 'text', 'f', 'n', 'id', 'quadrant', 'copies', 'vanilla', 'lean', 'guest']);
// Hooks whose payout the evaluation already sees (the recruit itself, game-end pay) or that only steer bots.
const MEASURED = new Set(['onGameEnd', 'onRecruited', 'botActivate', 'estimate']);
const PLAIN_TEXT = /^(Free\. )?((Worth \d+ followers?\.|No effect\.|Counts as \d+ members\.)\s*)+$/;
/** A member's ability, in followers, for the turns left (its stars are counted separately). */
export function abilityValue(def, placementsLeft, k = K_ABILITY) {
  if (def.vanilla || PLAIN_TEXT.test((def.text || '').trim())) return 0;
  const keys = Object.keys(def).filter(x => !DATA_KEYS.has(x));
  // pays on recruit or at game end only: measured directly
  if (keys.length && keys.every(x => MEASURED.has(x))) return 0;
  // anything else keeps working: hooks, rule flags (Corner-Cutter's halfTurns, Broker), or a passive its sphere reads
  // by key (Choir, Muse, Wallflower). Flags and key-read passives used to count as no ability at all, so bots released
  // Corner-Cutter for its refund before it ever halved a turn (fire audit, 2026-10-15).
  return k * (def.s + def.w) * Math.min(1, placementsLeft / 12);
}

/**
 * Expected final followers of every player in state s, as seen from a decision point.
 * buysLeft[i]: buys each player still has; incomeLeft[i]: resources they can still expect from placements.
 */
function evaluate(s, buysLeft, incomeLeft, roundLeft, extraAbility = {}, future) {
  const ctx = contextFor(s);
  const wild = new Set(s.quadrants.map(quadrant).filter(q => q.wildInFollowerBuys).map(q => q.resource));
  return s.players.map(p => {
    const extra = incomeLeft[p.id];
    return followers(s, p) + gameEndPay(s, ctx, p) + (extraAbility[p.id] || 0)
      + liquidate(s, p.res, extra, buysLeft[p.id], wild) + contests(s, ctx, p, roundLeft, future);
  });
}
const marginOf = (vals, me, spite = SPITE) => vals[me] - spite * Math.max(...vals.filter((_, i) => i !== me));

// Resolve follow-up choices a hypothetical move queued (Hand-pick, Open Door ties, Kickback's gift…) by their hints.
function settle(s, ctx, seen) {
  for (let k = 0; k < 40 && s.queue.length; k++) {
    const t = s.queue.shift();
    if (t.t !== 'choose' || !t.options?.length) continue;
    seen?.(t);
    // the options still good (a card an option names may have moved since the choice was queued)
    const live = liveOptions(s, t);
    if (!live.length) continue;
    const o = live.reduce((a, b) => ((b.hint || 0) > (a.hint || 0) ? b : a));
    handlerById(t.h)(ctx, s.players[t.p], o.value, t.data);
  }
}

/**
 * Every buy or placement option of the pending decision with its value to the deciding player:
 * the expected final follower margin over the best rival, after that option. Sorted best first.
 * opts.noMembers: never recruit (the pure follower-buying strategy).
 */
export function scoreOptions(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  const me = pend.player;
  const { turns, roundLeft } = horizon(state);
  const nowIncome = INCOME[state.round - 1] * (opts.income ?? INCOME_SCALE);
  // buys and income still ahead; extraNow: this turn's buy is still ahead for the deciding player
  const buysAt = (s, extraNow) => {
    const lt = laterTurns(s).turns;
    return state.players.map((_, i) => turns[i] + lt + (i === me ? extraNow : 0));
  };
  // extra: placements still ahead for the decider that this move adds (extra turns), each worth a placement's income
  const incomeAt = (s, extra = 0) => { const li = laterTurns(s).income * (opts.income ?? INCOME_SCALE); return turns.map((t, i) => (t + (i === me ? extra : 0)) * nowIncome + li); };
  // extra turns a move queued for the decider (Overtime, Crunch Time, Errand Runner…): each is a placement and a buy
  const turnsQueued = s => s.queue.filter(t => t.t === 'turn' && t.p === me).length;
  const placesLeft = turns[me] + laterTurns(state).turns;
  const buyNoise = opts.buyNoise ?? opts.noise ?? 0.05;
  // a liking for members, fading to biasFloor of itself as the game runs out (1 = flat)
  const floor = opts.biasFloor ?? BIAS_FLOOR;
  const memberBias = (opts.memberBias ?? MEMBER_BIAS) * (floor + (1 - floor) * Math.min(1, placesLeft / 12));
  const out = [];
  if (pend.kind === 'place') {
    // spaces only: a member's activation is also offered here (Cory, 2026-10-15), but bots use members in the buy
    // step, where their botActivate rules are tuned (buyShortcut), so they rate only where to place
    for (const o of pend.options) {
      if (o.kind !== 'slot') continue;
      let v;
      try {
        const s = lightClone(state);
        const ctx = contextFor(s);
        const p = s.players[me];
        const before = memberCount(s, p);
        const had = new Set(p.members);
        const turns0 = turnsQueued(s);
        s.slots[`${o.q}-${o.i}`] = me;
        p.left -= 1;
        const qid = s.quadrants[o.q];
        for (const c of ctx.membersOf(p)) for (const id of [c.def.id, c.copy].filter(Boolean)) defById(id).afterAction?.(ctx, p, c, qid);
        actionAt(s, o.q, o.i).resolve(ctx, p);
        // buys the action queues (Spree…) are buys still ahead, like this turn's own
        const moreBuys = s.queue.filter(t => t.t === 'buy' && t.p === me && !t.extra).length;
        const moreTurns = Math.max(0, turnsQueued(s) - turns0);
        // a swap the space queues, directly or through a copy (Reprise copying Even Swap)
        let undo = false;
        settle(s, ctx, t => { undo = undo || undoesSwap(state, s, me, t); });
        // members the action brought in (Open Door, Hand-pick…) bring their abilities too
        const gained = p.members.filter(u => !had.has(u)).reduce((a, u) => a + abilityValue(cardDef(s, u), placesLeft, opts.k), 0);
        v = marginOf(evaluate(s, buysAt(s, 1 + moreBuys + moreTurns), incomeAt(s, moreTurns), roundLeft, { [me]: gained }, opts.future), me, opts.spite);
        if (opts.noMembers && memberCount(s, p) > before) v -= 100;
        if (undo) v -= UNDO_SWAP;
      } catch {
        v = -50 + actionAt(state, o.q, o.i).estimate(contextFor(state), state.players[me]);
      }
      out.push({ o, v: v + rand() * (opts.noise ?? 0.3) });
    }
  } else if (pend.kind === 'buy' || pend.kind === 'pay') {
    // One buy, paid one way, valued on a copy of the game.
    const valueOf = (what, spend) => {
      try {
        const s = lightClone(state);
        const ctx = contextFor(s);
        const p = s.players[me];
        const extraAbility = {};
        const turns0 = turnsQueued(s);
        const full = Object.fromEntries(s.resources.map(r => [r, spend[r] || 0]));
        if (what.uid !== undefined) {
          ctx.recruit(p, what.uid, { free: false, spend: full });
          settle(s, ctx);
          extraAbility[me] = abilityValue(cardDef(s, what.uid), placesLeft, opts.k);
        } else if (what.tier) {
          const tier = TIERS.find(t => t.key === what.tier);
          for (const r of s.resources) p.res[r] -= full[r];
          p.bonus += tier.get;
          if (tier.limited) s.stock[tier.key] -= 1;
        }
        const moreTurns = Math.max(0, turnsQueued(s) - turns0);
        return marginOf(evaluate(s, buysAt(s, moreTurns), incomeAt(s, moreTurns), roundLeft, extraAbility, opts.future), me, opts.spite);
      } catch {
        return -1e6;
      }
    };
    // Release (a base rule): lose the member (its stars and what its ability would still bring), take back its
    // colored part (in its color, or spread over the colors held least), and keep this turn's buy.
    const releaseValue = uid => {
      try {
        const s = lightClone(state);
        const p = s.players[me];
        const def = cardDef(s, uid);
        refundInto(s, p, uid);
        p.members = p.members.filter(u => u !== uid);
        return marginOf(evaluate(s, buysAt(s, 1), incomeAt(s), roundLeft, { [me]: -abilityValue(def, placesLeft, opts.k) }), me, opts.spite) - 0.5;
      } catch {
        return -1e6;
      }
    };
    // the ways to pay worth comparing (they differ in which contests they give up)
    // The engine lists first the ways that spare every color you lead, so a big lead (30 gold against 10) never
    // got spent and piled up. Also try the ways that spend only the surplus over what a lead needs.
    const ways = what => {
      const all = what.uid !== undefined ? paymentChoices(state, state.players[me], what.uid) : followerChoices(state, state.players[me], TIERS.find(t => t.key === what.tier));
      const first = all.slice(0, opts.payWays ?? PAY_WAYS);
      if (all.length <= first.length) return first;
      const spare = surplus(state, me);
      const over = v => state.resources.reduce((a, r) => a + Math.max(0, (v[r] || 0) - spare[r]), 0);
      const extra = [...all.slice(first.length)].sort((a, b) => over(a) - over(b)).slice(0, SURPLUS_WAYS);
      return [...first, ...extra];
    };
    if (pend.kind === 'pay') {
      const what = pend.uid !== undefined ? { uid: pend.uid } : { tier: pend.tier };
      // all the ways (the menu is the engine's); rollouts pass payOptions to look at only the first few
      const pays = pend.options.filter(o => o.kind === 'pay').slice(0, opts.payOptions ?? Infinity);
      for (const o of pays) out.push({ o, v: valueOf(what, o.spend) + (o.default ? 0.01 : 0) });
    } else {
      for (const o of pend.options) {
        if (!['card', 'tier', 'pass'].includes(o.kind)) continue;
        if (opts.noMembers && o.kind === 'card') continue;
        if (o.kind === 'release') { out.push({ o, v: releaseValue(o.uid) + rand() * buyNoise }); continue; }
        if (o.kind !== 'pass' && o.kind !== 'card' && o.kind !== 'tier') continue;
        let v;
        if (o.kind === 'pass') v = valueOf({}, {});
        else v = Math.max(-1e6, ...ways(o.kind === 'card' ? { uid: o.uid } : { tier: o.tier }).map(w => valueOf(o.kind === 'card' ? { uid: o.uid } : { tier: o.tier }, w)));
        if (o.kind === 'card') v += memberBias;
        out.push({ o, v: v + rand() * buyNoise });
      }
    }
  }
  return out.sort((a, b) => b.v - a.v);
}

/**
 * What a release gives back, added to p in a copy of the game (Cory, 2026-10-14): only the colored part, in the
 * member's color; when that color isn't on the table, in any colors (bots spread it over the colors held least).
 */
function refundInto(s, p, uid) {
  const back = releaseRefund(s, uid);
  if (back.color) { p.res[back.color] = (p.res[back.color] || 0) + back.n; return; }
  for (let k = 0; k < back.n; k++) {
    const c = s.resources.reduce((a, b) => ((p.res[b] || 0) < (p.res[a] || 0) ? b : a));
    p.res[c] = (p.res[c] || 0) + 1;
  }
}

/**
 * Release (when the table plays it): a free move before the buy that turns a member back into its colored part.
 * Worth it when the resources buy more than the member is still worth, mostly on the last turns.
 */
function releaseOption(state, opts) {
  const pend = state.pending;
  // a person uses a member's ability before letting it go: a member whose activation is still unused (Rainmaker,
  // Lottery Winner…) is not released (bots released Rainmaker for its refund before ever using it; fire audit 2026-10-15)
  const unused = uid => { const c = state.cards[uid]; return !c.used && [c.def, c.copy].some(id => id && defById(id).activate); };
  const rels = pend.options.filter(o => o.kind === 'release' && !unused(o.uid));
  if (!rels.length) return null;
  const me = pend.player;
  const { turns, roundLeft } = horizon(state);
  const lt = laterTurns(state);
  const buys = state.players.map((_, i) => turns[i] + lt.turns + (i === me ? 1 : 0));
  const income = turns.map(t => t * INCOME[state.round - 1] * (opts.income ?? INCOME_SCALE) + lt.income * (opts.income ?? INCOME_SCALE));
  const placesLeft = turns[me] + lt.turns;
  const base = marginOf(evaluate(lightClone(state), buys, income, roundLeft, {}, opts.future), me, opts.spite);
  let best = null, bestV = base + 1; // only for a clear gain
  for (const o of rels) {
    try {
      const s = lightClone(state);
      const p = s.players[me];
      const def = cardDef(s, o.uid);
      refundInto(s, p, o.uid);
      p.members = p.members.filter(u => u !== o.uid);
      const v = marginOf(evaluate(s, buys, income, roundLeft, { [me]: -abilityValue(def, placesLeft, opts.k) }, opts.future), me, opts.spite);
      if (v > bestV) { bestV = v; best = o; }
    } catch { /* skip */ }
  }
  return best;
}

/** A buy decision normal takes before weighing purchases: an activation worth using, or a Release worth taking. */
export function buyShortcut(state, opts = {}) {
  const pend = state.pending;
  return useOption(state, pend, contextFor(state), state.players[pend.player]) || releaseOption(state, opts);
}

/** The fixed greedy bot. */
export function chooseNormalMove(state, rand = Math.random, opts = {}) {
  const pend = state.pending;
  if (!pend) return null;
  const move = o => ({ player: pend.player, option: o.id });
  switch (pend.kind) {
    case 'setup': return setupPick(pend, rand);
    case 'place': return move(scoreOptions(state, rand, opts)[0].o);
    case 'buy': {
      const p = state.players[pend.player];
      const short = buyShortcut(state, opts);
      if (short) return move(short);
      const ranked = scoreOptions(state, rand, opts);
      return move(ranked.length ? ranked[0].o : pend.options.find(o => o.kind === 'pass'));
    }
    case 'pay': {
      const ranked = scoreOptions(state, rand, opts);
      return ranked.length ? move(ranked[0].o) : followUp(pend, rand, state);
    }
    default: return followUp(pend, rand, state);
  }
}

/** The pure "big followers" strategy: never recruits, plays for follower buys. For balance sims. */
export const chooseFollowerBuyerMove = (state, rand = Math.random) => {
  const pend = state.pending;
  if (pend?.kind === 'buy') {
    const ranked = scoreOptions(state, rand, { noMembers: true });
    return { player: pend.player, option: (ranked[0]?.o || pend.options.find(o => o.kind === 'pass')).id };
  }
  return chooseNormalMove(state, rand, { noMembers: true });
};
