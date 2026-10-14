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
const SETUP_WEIGHTS = { gold: 3, red: 3, blue: 1, green: 1 };

/** The level a seat plays at: opts.level, else the seat's `bot` field, else 'normal'. */
export function botLevel(state, player, opts = {}) {
  const l = opts.level ?? state.players[player]?.bot;
  return BOT_LEVELS.includes(l) ? l : 'normal';
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
  if (level === 'hard') return chooseThinkerMove(state, rand, opts);
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
// How much a member's ability is worth, in followers per resource of its cost, if it has the whole game ahead.
// A member bought with 9 of 12 placements left is worth K × cost × 0.75 on top of its stars.
const K_ABILITY = 0.42;
// How many ways to pay a buy are compared (the engine lists the contest-safe ones first).
const PAY_WAYS = 10;
const lightClone = s => {
  const { log, queue, pending, ...rest } = s; void log; void queue; void pending;
  const c = structuredClone(rest);
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
function contests(s, ctx, p, roundLeft) {
  if (s.over || !s.round) return 0;
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
    out += v * (certain * (1 - roundLeft) + rough * roundLeft);
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
  const hooks = Object.keys(def).filter(k => typeof def[k] === 'function' || ['activate', 'costReduction', 'goldPaysDouble', 'stealMore'].includes(k));
  const engine = hooks.filter(k => !['onGameEnd', 'onRecruited', 'botActivate', 'estimate'].includes(k));
  if (!engine.length) return 0; // pays on recruit or at game end: measured directly
  return k * (def.s + def.w) * Math.min(1, placementsLeft / 12);
}

/**
 * Expected final followers of every player in state s, as seen from a decision point.
 * buysLeft[i]: buys each player still has; incomeLeft[i]: resources they can still expect from placements.
 */
function evaluate(s, buysLeft, incomeLeft, roundLeft, extraAbility = {}) {
  const ctx = contextFor(s);
  const wild = new Set(s.quadrants.map(quadrant).filter(q => q.wildInFollowerBuys).map(q => q.resource));
  return s.players.map(p => {
    const extra = incomeLeft[p.id];
    return followers(s, p) + gameEndPay(s, ctx, p) + (extraAbility[p.id] || 0)
      + liquidate(s, p.res, extra, buysLeft[p.id], wild) + contests(s, ctx, p, roundLeft);
  });
}
const marginOf = (vals, me) => vals[me] - Math.max(...vals.filter((_, i) => i !== me));

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
  const nowIncome = INCOME[state.round - 1];
  // buys and income still ahead; extraNow: this turn's buy is still ahead for the deciding player
  const buysAt = (s, extraNow) => {
    const lt = laterTurns(s).turns;
    return state.players.map((_, i) => turns[i] + lt + (i === me ? extraNow : 0));
  };
  const incomeAt = s => { const li = laterTurns(s).income; return turns.map(t => t * nowIncome + li); };
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
        s.slots[`${o.q}-${o.i}`] = me;
        p.left -= 1;
        const qid = s.quadrants[o.q];
        for (const c of ctx.membersOf(p)) for (const id of [c.def.id, c.copy].filter(Boolean)) defById(id).afterAction?.(ctx, p, c, qid);
        actionAt(s, o.q, o.i).resolve(ctx, p);
        settle(s, ctx);
        v = marginOf(evaluate(s, buysAt(s, 1), incomeAt(s), roundLeft), me);
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
        return marginOf(evaluate(s, buysAt(s, 0), incomeAt(s), roundLeft, extraAbility), me);
      } catch {
        return -1e6;
      }
    };
    // the ways to pay worth comparing (they differ in which contests they give up)
    const ways = what => (what.uid !== undefined ? paymentChoices(state, state.players[me], what.uid) : followerChoices(state, state.players[me], TIERS.find(t => t.key === what.tier))).slice(0, PAY_WAYS);
    if (pend.kind === 'pay') {
      const what = pend.uid !== undefined ? { uid: pend.uid } : { tier: pend.tier };
      for (const o of pend.options) if (o.kind === 'pay') out.push({ o, v: valueOf(what, o.spend) + (o.default ? 0.01 : 0) });
    } else {
      for (const o of pend.options) {
        if (o.kind === 'toggle' || o.kind === 'use') continue;
        if (opts.noMembers && o.kind === 'card') continue;
        let v;
        if (o.kind === 'pass') v = valueOf({}, {});
        else v = Math.max(-1e6, ...ways(o.kind === 'card' ? { uid: o.uid } : { tier: o.tier }).map(w => valueOf(o.kind === 'card' ? { uid: o.uid } : { tier: o.tier }, w)));
        out.push({ o, v: v + rand() * (opts.noise ?? 0.05) });
      }
    }
  }
  return out.sort((a, b) => b.v - a.v);
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
      const use = useOption(state, pend, contextFor(state), p);
      if (use) return move(use);
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
