// Bots: pure functions that pick one legal option. Used for empty seats, simulation and fuzz tests.
//
// Difficulty levels. A seat's level comes from `state.players[i].bot` ('easy' | 'normal' | 'hard'), or from
// `chooseBotMove(state, rand, { level })`, which wins over the seat. Anything else plays 'normal'.
//   easy   – the original greedy bot, a little noisier. Recruits nearly anything affordable, can hoard.
//   normal – the same greedy shape, fixed: it values every option by what it's worth at game end (followers now,
//            a member's ability over the turns left, what its resources can still turn into with the buys it has
//            left, and the ring contests it leads). Never ends holding resources a follower buy could use.
//   hard   – normal plus lookahead (thinker.js): plays its best few options out to the round end with normal
//            bots and keeps the best. Its work is counted in moves, not milliseconds, so it stays deterministic.
// Every level is deterministic for a given state and rand.
import {
  contextFor, actionAt, cardDef, TIERS, followers, memberCount, RING_VALUE, WORKERS, tierLeft,
  paymentChoices, followerChoices,
} from './core.js';
import { defById, quadrant, handlerById } from './content/index.js';
import { chooseThinkerMove } from './thinker.js';

export const BOT_LEVELS = ['easy', 'normal', 'hard'];
// Hard's wall-clock cap per move (pass { maxMs: Infinity } for deterministic sims).
const HARD_MAX_MS = 250;
const SETUP_WEIGHTS = { gold: 3, red: 3, blue: 1, green: 1 };

/** For a setup screen: the levels in order, with a name and a one-line blurb. */
export const BOT_LEVEL_INFO = [
  { level: 'easy', name: 'Easy', blurb: 'Greedy and a little careless.' },
  { level: 'normal', name: 'Normal', blurb: 'Plays for the end: spends down, stops recruiting when it no longer pays.' },
  { level: 'hard', name: 'Hard', blurb: 'Normal, plus it plays its best few moves ahead before choosing.' },
];
export const DEFAULT_BOT_LEVEL = 'normal';

/** The level a seat plays at: opts.level, else the seat's `bot` field ('hard' or { level: 'hard' }), else 'normal'. */
export function botLevel(state, player, opts = {}) {
  const b = state.players[player]?.bot;
  const l = opts.level ?? (b && typeof b === 'object' ? b.level : b);
  return BOT_LEVELS.includes(l) ? l : DEFAULT_BOT_LEVEL;
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
  if (level === 'easy') return chooseEasyMove(state, rand);
  if (level === 'hard') return chooseThinkerMove(state, rand, { maxMs: HARD_MAX_MS, ...opts });
  return chooseNormalMove(state, rand, opts);
}

// ---------- easy: the original greedy bot ----------

/** The first greedy bot, kept as the easy level (with a little more noise). */
export function chooseEasyMove(state, rand = Math.random, { noise = 1.6 } = {}) {
  const pend = state.pending;
  if (!pend) return null;
  const p = state.players[pend.player];
  const ctx = contextFor(state);
  const move = o => ({ player: pend.player, option: o.id });
  const best = (opts, score) => opts.reduce((a, b) => (score(b) > score(a) ? b : a));

  switch (pend.kind) {
    case 'setup': return setupPick(pend, rand);
    case 'place':
      return move(best(pend.options, o => {
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
      const last = (state.round === 3 || state.endEarly) && p.left === 0;
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
    default: return followUp(pend, rand);
  }
}

function setupPick(pend, rand) {
  const total = pend.options.reduce((s, o) => s + (SETUP_WEIGHTS[o.value] || 1), 0);
  let r = rand() * total;
  for (const o of pend.options) { r -= SETUP_WEIGHTS[o.value] || 1; if (r <= 0) return { player: pend.player, option: o.id }; }
  return { player: pend.player, option: pend.options[0].id };
}

// pay: the default way (it already spares colors whose contest you lead). choose: the content's hint.
function followUp(pend, rand) {
  const move = o => ({ player: pend.player, option: o.id });
  if (pend.kind === 'pay') return move(pend.options.find(o => o.default) || pend.options[0]);
  if (pend.kind === 'choose') return move(pend.options.reduce((a, b) => ((b.hint || 0) + rand() * 0.01 > (a.hint || 0) ? b : a)));
  return move(pend.options[0]);
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
const copy = v => {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(copy);
  const o = {};
  for (const k in v) o[k] = copy(v[k]);
  return o;
};
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
// Turns (and the income they bring) in rounds not started yet. The 6-follower clock may cut them short.
function laterTurns(s) {
  if (s.round >= 3 || s.endEarly) return { turns: 0, income: 0 };
  const clock = TIERS.find(t => t.clock);
  const left = clock ? tierLeft(s, clock) : Infinity;
  const risk = left <= 1 ? 0.35 : left <= s.players.length / 2 ? 0.7 : 1;
  let turns = 0, income = 0;
  for (let r = s.round; r < 3; r++) { turns += WORKERS[r]; income += WORKERS[r] * INCOME[r]; }
  return { turns: turns * risk, income: income * risk };
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
  const later = s.endEarly ? 0 : RING_VALUE.slice(s.round).reduce((a, b) => a + b, 0) * future;
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

/** A member's ability, in followers, for the turns left (its stars are counted separately). */
export function abilityValue(def, placementsLeft, k = K_ABILITY) {
  if (def.vanilla) return 0;
  const hooks = Object.keys(def).filter(k => typeof def[k] === 'function' || ['activate', 'costReduction', 'goldPaysDouble', 'stealMore', 'bends'].includes(k));
  const engine = hooks.filter(k => !['onGameEnd', 'onRecruited', 'botActivate', 'estimate'].includes(k));
  if (!engine.length) return 0; // pays on recruit or at game end: measured directly
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
const marginOf = (vals, me, spite = 1) => vals[me] - spite * Math.max(...vals.filter((_, i) => i !== me));

// Resolve follow-up choices a hypothetical move queued (Take, Hire ties, Joint Venture's gift…) by their hints.
function settle(s, ctx) {
  for (let k = 0; k < 40 && s.queue.length; k++) {
    const t = s.queue.shift();
    if (t.t !== 'choose' || !t.options?.length) continue;
    const o = t.options.reduce((a, b) => ((b.hint || 0) > (a.hint || 0) ? b : a));
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
  // extra turns a move queued for the decider (Overtime, Rally, Errand Runner…): each is a placement and a buy
  const turnsQueued = s => s.queue.filter(t => t.t === 'turn' && t.p === me).length;
  const placesLeft = turns[me] + laterTurns(state).turns;
  const out = [];
  if (pend.kind === 'place') {
    for (const o of pend.options) {
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
        settle(s, ctx);
        // members the action brought in (Hire, Take…) bring their abilities too
        const gained = p.members.filter(u => !had.has(u)).reduce((a, u) => a + abilityValue(cardDef(s, u), placesLeft, opts.k), 0);
        v = marginOf(evaluate(s, buysAt(s, 1 + moreBuys + moreTurns), incomeAt(s, moreTurns), roundLeft, { [me]: gained }, opts.future), me, opts.spite);
        if (opts.noMembers && memberCount(s, p) > before) v -= 100;
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
          if (tier.limited) {
            s.stock[tier.key] -= 1;
            if (tier.clock && s.stock[tier.key] <= 0) s.endEarly = true;
          }
        }
        const moreTurns = Math.max(0, turnsQueued(s) - turns0);
        return marginOf(evaluate(s, buysAt(s, moreTurns), incomeAt(s, moreTurns), roundLeft, extraAbility, opts.future), me, opts.spite);
      } catch {
        return -1e6;
      }
    };
    // Release (a base rule): lose the member (its stars and what its ability would still bring), take its cost
    // spread over the colors held least, and keep this turn's buy.
    const releaseValue = uid => {
      try {
        const s = lightClone(state);
        const p = s.players[me];
        const def = cardDef(s, uid);
        p.members = p.members.filter(u => u !== uid);
        for (let k = 0; k < def.s + def.w; k++) {
          const c = s.resources.reduce((x, y) => ((p.res[y] || 0) < (p.res[x] || 0) ? y : x));
          p.res[c] = (p.res[c] || 0) + 1;
        }
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
        if (o.kind === 'release') { out.push({ o, v: releaseValue(o.uid) + rand() * (opts.noise ?? 0.05) }); continue; }
        if (o.kind !== 'pass' && o.kind !== 'card' && o.kind !== 'tier') continue;
        let v;
        if (o.kind === 'pass') v = valueOf({}, {});
        else v = Math.max(-1e6, ...ways(o.kind === 'card' ? { uid: o.uid } : { tier: o.tier }).map(w => valueOf(o.kind === 'card' ? { uid: o.uid } : { tier: o.tier }, w)));
        out.push({ o, v: v + rand() * (opts.noise ?? 0.05) });
      }
    }
  }
  return out.sort((a, b) => b.v - a.v);
}

/**
 * Release (when the table plays it): a free move before the buy that turns a member back into its cost in any
 * colors. Worth it when the resources buy more than the member is still worth, mostly on the last turns.
 */
function releaseOption(state, opts) {
  const pend = state.pending;
  const rels = pend.options.filter(o => o.kind === 'release');
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
      p.members = p.members.filter(u => u !== o.uid);
      // the resources come in whatever colors help most: spread over the colors held least
      for (let k = 0; k < def.s + def.w; k++) {
        const c = s.resources.reduce((a, b) => ((p.res[b] || 0) < (p.res[a] || 0) ? b : a));
        p.res[c] = (p.res[c] || 0) + 1;
      }
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
      return ranked.length ? move(ranked[0].o) : followUp(pend, rand);
    }
    default: return followUp(pend, rand);
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
