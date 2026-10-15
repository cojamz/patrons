// The balance bench: one standing, seeded, reproducible run that triangulates every balance reading with two bot
// levels, so a finding can be told apart from a bot's blind spot. design/eval/bench/README.md explains every section.
//
//   node scripts/v4-bench.mjs [--quick] [--only=anchors,cards,spaces,archetypes,fairness,health] [--workers=N]
//   node scripts/v4-bench.mjs --records=<dir>        friends' exported game records, the same health metrics
//
// Writes design/eval/bench/latest.md + latest.json, keeps design/eval/bench/history/<date>-<sha>[-quick].json, and
// diffs against the newest earlier history file of the same mode ("what moved since last run").
//
// Instruments (named on every number in the report):
//   Normal   the default bot (bots.js), all four seats.
//   Hard-20  Hard (thinker.js: Normal plus rollouts) at budget 20 simulated moves a decision, uncapped wall clock so
//            it's deterministic. Measured here: a lone Hard-20 wins 39% against 3 Normals (Hard as shipped, budget 100,
//            ~48%; budget 40, 45%), at a fifth of the cost. The anchors section re-measures it every run.
// Method, in one breath: each seed plays a base game; at the start of a random round the game forks, and in each
// fork every seat gets its own probe (a private copy of a member it must recruit at its first affordable buy, or a
// wheel space it must take with its first minion, or a "null" minion whose action does nothing). Same seed, same
// dice, base vs fork: the follower-margin difference is the probe's worth. All probes are fitted jointly (a seat's
// margin also moves with its rivals' probes). Hard-20 then re-measures what Normal flags (plus the anchors): a card or
// space is listed only when both instruments put it outside its band.
import './v4-node-stamp.mjs'; // first: record.js must see the rules-source hash, as in the built app
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { cpus } from 'node:os';
import path from 'node:path';
import { createGame, applyMove, followers, memberCount, paymentChoices, contestTable, TIERS, actionAt } from '../src/engine/v4/core.js';
import { chooseNormalMove, chooseFollowerBuyerMove, scoreOptions } from '../src/engine/v4/bots.js';
import { chooseThinkerMove } from '../src/engine/v4/thinker.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { allQuadrantIds, quadrant, guestMembers } from '../src/engine/v4/content/index.js';
import { CONTENT_HASH, parseRecord } from '../src/v4/session/record.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'design/eval/bench');
const SEATS = 4;
const HARD_BUDGET = 20;
const CLASSIC = ['gold', 'red', 'market', 'echo'];
const ALL_Q = allQuadrantIds();
const ALL_DEFS = [...ALL_Q.flatMap(q => quadrant(q).members), ...guestMembers()];
const DEF = Object.fromEntries(ALL_DEFS.map(d => [d.id, d]));
const priceOf = d => d.s + d.w;
const split = (d, P) => { const T = priceOf(d); const s = T > 0 ? Math.round((P * d.s) / T) : 0; return { s, w: P - s }; };
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const Z90 = 1.645;
// ring bands in resources (u), design/eval/value-model.md: what one placement should yield in that round
const BANDS = { 1: [2, 3, 2.5], 2: [3, 5, 4], 3: [5, 9, 7] };
const SPACES = Object.fromEntries(ALL_Q.flatMap(q => quadrant(q).actions.map((a, i) => [`${q}.${a.key}`, { q, i, ring: a.ring, name: a.name, text: a.text }])));

// The anchors: cards whose worth is known well enough that a bench reading outside these ranges means the instrument
// is off, not the card. Fair price in cost points. Sources in design/eval/bench/README.md.
const ANCHORS = [
  { id: 'gold.banker', lo: 4.5, hi: 10.5, why: 'Banker ("Now and at round start, +3 gold"; 4, repriced to 8 in balance pass 1; the range is absolute). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.' },
  { id: 'red.bigfamily', lo: 0.5, hi: 6, why: 'Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].' },
  { id: 'red.sponsor', lo: 8, hi: Infinity, why: 'Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must read 8 or more (printed − 2).' },
  { id: 'gold.tycoon', lo: -Infinity, hi: 10, why: 'Tycoon ("Game end: +1 follower per 3 gold"), rework-candidates #3, known weak at its old 12: must read 10 or less (absolute; repriced to 6 in balance pass 1, so it no longer has to read under printed).' },
];
const ANCHOR_IDS = ANCHORS.map(a => a.id);

// ======================= instrumentation (worker side) =======================
// REAL is true only while the bench applies a move to a game it measures, so bots' look-ahead copies (scoreOptions,
// Hard's rollouts) never count as steals and never null an action.
let REAL = false;
let NULL_ACT = null; // { p, done }: the next action player p resolves for real does nothing (the null probe)
let STEALS = [];
for (const qid of ALL_Q) {
  const q = quadrant(qid);
  const orig = q.onSteal;
  // the engine calls every table quadrant's onSteal for each steal: count it once, at the table's first quadrant
  q.onSteal = function (ctx, info) { if (REAL && ctx.state.quadrants[0] === qid) STEALS.push(info.n); return orig ? orig.call(this, ctx, info) : undefined; };
  for (const a of q.actions) {
    const res = a.resolve;
    // keep the markers other wrappers read (echo's __orig: a copy redoes the unwrapped action)
    a.resolve = Object.assign(function (ctx, p) {
      if (REAL && NULL_ACT && !NULL_ACT.done && NULL_ACT.p === p.id) { NULL_ACT.done = true; ctx.log(`${p.name}'s minion does nothing (bench null probe).`); return undefined; }
      return res.call(this, ctx, p);
    }, res);
  }
}
let MOVES = 0; // real moves this job played (throughput)
const realApply = (s, mv) => { REAL = true; MOVES++; try { return applyMove(s, mv); } finally { REAL = false; } };

// ---------- movers ----------
const normalMove = (s, r) => chooseNormalMove(s, r);
const hardMove = (s, r, trace) => chooseThinkerMove(s, r, { budget: HARD_BUDGET, maxMs: Infinity, ...(trace ? { trace } : {}) });
const moverFor = inst => (inst === 'hard' ? hardMove : normalMove);

// ---------- archetypes: scripted strategies built on Normal's valuation ----------
const quadIndex = (s, qid) => s.quadrants.indexOf(qid);
function leadScore(s, me) {
  // round-end contest standing: the share of each ring prize this seat would take now, plus a little for the margin
  const prize = [2, 4, 6][Math.min(3, Math.max(1, s.round)) - 1];
  let v = 0;
  for (const c of contestTable(s)) {
    const mine = c.rows.find(r => r.player === me)?.score ?? 0;
    const best = Math.max(...c.rows.filter(r => r.player !== me).map(r => r.score));
    if (c.winners.includes(me)) v += prize / c.winners.length;
    v += 0.1 * Math.max(-5, Math.min(5, mine - best));
  }
  return v;
}
const ARCHETYPES = {
  buyer: { name: 'pure follower buyer', move: (s, r) => chooseFollowerBuyerMove(s, r) },
  hoarder: {
    name: 'member hoarder (recruits whenever it can)',
    move: (s, r) => {
      const pend = s.pending;
      if (pend.kind === 'buy' && pend.options.some(o => o.kind === 'card')) {
        const best = scoreOptions(s, r).find(x => x.o.kind === 'card');
        if (best) return { player: pend.player, option: best.o.id };
      }
      return chooseNormalMove(s, r);
    },
  },
  chaser: {
    name: 'contest chaser (maximizes round-end leads)',
    move: (s, r) => {
      const pend = s.pending;
      if (pend.kind !== 'place' && pend.kind !== 'buy') return chooseNormalMove(s, r);
      const ranked = scoreOptions(s, r).slice(0, 6);
      if (!ranked.length) return chooseNormalMove(s, r);
      let best = null, bv = -Infinity;
      for (const x of ranked) {
        let v = x.v;
        try { v += 2 * leadScore(applyMove(s, { player: pend.player, option: x.o.id }), pend.player); } catch { v -= 100; }
        if (v > bv) { bv = v; best = x.o; }
      }
      return { player: pend.player, option: best.id };
    },
  },
};
for (const qid of CLASSIC) ARCHETYPES[`spec:${qid}`] = {
  name: `${quadrant(qid).name} (${qid}) specialist`,
  move: (s, r) => {
    const pend = s.pending;
    if (pend.kind !== 'place' && pend.kind !== 'buy') return chooseNormalMove(s, r);
    if (pend.kind === 'buy') { const short = pend.options.find(o => o.kind === 'use'); if (short) return chooseNormalMove(s, r); }
    const qi = quadIndex(s, qid);
    const ranked = scoreOptions(s, r).map(x => {
      let v = x.v;
      if (x.o.kind === 'slot' && x.o.q === qi) v += 3;
      if (x.o.kind === 'card' && DEF[s.cards[x.o.uid]?.def]?.quadrant === qid) v += 2;
      return { o: x.o, v };
    }).sort((a, b) => b.v - a.v);
    if (!ranked.length) return chooseNormalMove(s, r);
    return { player: pend.player, option: ranked[0].o.id };
  },
};

// ---------- the tracker: health and fairness metrics from one real game (bots' or people's) ----------
function newTracker(s) {
  return { getsByTier: s.players.map(() => ({ small: 0, mid: 0, big: 0, top: 0, other: 0 })), places: [], orders: {}, steals: 0, stealUnits: 0, rich: [] };
}
const TIER_BY_GET = Object.fromEntries(TIERS.map(t => [t.get, t.key]));
function trackMove(T, prev, mv, next) {
  if (prev.pending?.kind === 'place') T.places.push(mv.player);
  next.players.forEach((p, i) => {
    let d = (p.bought || 0) - (prev.players[i].bought || 0);
    if (d <= 0) return;
    if (TIER_BY_GET[d]) { T.getsByTier[i][TIER_BY_GET[d]] += d; return; }
    for (const t of [...TIERS].sort((a, b) => b.get - a.get)) while (d >= t.get) { T.getsByTier[i][t.key] += t.get; d -= t.get; }
    T.getsByTier[i].other += d;
  });
  if (next.round !== prev.round || !T.orders[next.round]) if (next.order?.length && next.round >= 1) T.orders[next.round] = next.order.slice(0, next.players.length);
}
function finishTracker(T, s) {
  const fs = s.players.map(p => followers(s, p));
  const top = Math.max(...fs);
  const winners = s.ranking ? [s.ranking[0]] : fs.map((f, i) => (f === top ? i : -1)).filter(i => i >= 0);
  // longest run of consecutive placements by one player
  let run = 0, best = 0, last = -1;
  for (const p of T.places) { run = p === last ? run + 1 : 1; last = p; best = Math.max(best, run); }
  const contestByRound = s.players.map(() => [0, 0, 0]);
  const ties = { paid: 0, two: 0, three: 0 };
  for (const c of s.contests || []) for (const r of c.results) {
    const k = r.winners.length;
    if (!k) continue;
    ties.paid++; if (k >= 2) ties.two++; if (k >= 3) ties.three++;
    for (const id of r.winners) contestByRound[id][c.round - 1] += c.prize;
  }
  const players = s.players.map((p, i) => {
    const memberWorth = fs[i] - 1 - p.bonus;
    const bought = p.bought || 0, contest = p.contest || 0;
    return {
      f: fs[i], cards: p.members.length, members: memberCount(s, p), left: sum(p.res),
      src: { self: 1, members: memberWorth, ...T.getsByTier[i], c1: contestByRound[i][0], c2: contestByRound[i][1], c3: contestByRound[i][2], effects: p.bonus - bought - contest },
    };
  });
  return {
    winner: winners[0], fs, players, ties, moves: s.moves, longestRun: best, steals: STEALS.length, stealUnits: STEALS.reduce((a, b) => a + b, 0),
    r1order: T.orders[1] || null, r3first: T.orders[3]?.[0] ?? null, r3order: T.orders[3] || null, rich: T.rich,
  };
}

// ---------- probes ----------
// A card probe is a second, private copy of the real member (rivals never see it), so every rule that checks a member by
// its id still sees it as that member. Its probe price applies only while the seat checks it can pay and recruits it;
// the def is back at its printed price before anything else happens.
function withPrice(def, P, fn) {
  const was = { s: def.s, w: def.w };
  Object.assign(def, split(def, P));
  try { return fn(); } finally { Object.assign(def, was); }
}
function withOffer(s, uid) {
  return { ...s, shop: [uid, ...s.shop], pending: { ...s.pending, options: [...s.pending.options, { id: `card:${uid}`, label: 'probe', kind: 'card', uid }] } };
}
function buyProbe(s, uid, rand) {
  const seat = s.pending.player;
  s = realApply(withOffer(s, uid), { player: seat, option: `card:${uid}` });
  if (s.pending?.kind === 'pay' && s.pending.uid === uid) s = realApply(s, chooseNormalMove(s, rand));
  if (s.shop.includes(uid) && !s.players[seat].members.includes(uid)) s = { ...s, shop: s.shop.filter(u => u !== uid) };
  return s;
}
const gridFor = (T, deltas) => {
  const g = [...new Set(deltas.map(d => Math.max(0, T + d)))].sort((a, b) => a - b);
  while (g.length < deltas.length) g.push(g[g.length - 1] + 2);
  return g;
};

/**
 * Play a game from `snap` (the start of round r) to the end. probes[seat] = null | { kind: 'card', uid } |
 * { kind: 'space', q, i } | { kind: 'null' }. Returns per-seat { own, m, win, done, round } and, if track, the metrics.
 */
function playFrom(snap, seed, r, inst, probes, { track = false, snaps = null } = {}) {
  const mover = moverFor(inst);
  const rands = Array.from({ length: SEATS }, (_, i) => seededRandom(seed * 31 + i * 1009 + r * 7 + 7));
  let s = snap;
  const got = probes.map(() => ({ done: 0, round: 0 }));
  const firstPlace = probes.map(() => true);
  const T = track ? newTracker(s) : null;
  const trace = track && inst === 'hard' ? info => { if (info.means.length >= 2) { const m = [...info.means].sort((a, b) => b - a); T.rich.push(m[0] - m[1]); } } : null;
  if (track) STEALS = [];
  let n = 0;
  while (!s.over && n++ < 8000) {
    if (snaps && s.pending?.kind === 'place' && !snaps[s.round]) snaps[s.round] = s;
    const pend = s.pending, pl = pend.player, pr = probes[pl];
    if (pr && pr.kind === 'card' && !got[pl].done && pend.kind === 'buy' && withPrice(DEF[pr.def], pr.P, () => paymentChoices(s, s.players[pl], pr.uid).length)) {
      got[pl].round = s.round;
      s = withPrice(DEF[pr.def], pr.P, () => buyProbe(s, pr.uid, rands[pl]));
      got[pl].done = s.players[pl].members.includes(pr.uid) ? 1 : -1;
      continue;
    }
    if (pr && pend.kind === 'place' && firstPlace[pl]) {
      firstPlace[pl] = false;
      if (pr.kind === 'space') {
        const id = `slot:${pr.q}-${pr.i}`;
        if (pend.options.some(o => o.id === id)) { s = realApply(s, { player: pl, option: id }); got[pl].done = 1; got[pl].round = s.round; continue; }
        got[pl].done = -1; // blocked: a rival took it first
      } else if (pr.kind === 'null') {
        const mv = mover(s, rands[pl]);
        NULL_ACT = { p: pl, done: false };
        const prev = s;
        try { s = realApply(s, mv); } finally { got[pl].done = NULL_ACT.done ? 1 : -1; NULL_ACT = null; }
        got[pl].round = prev.round;
        if (T) trackMove(T, prev, mv, s);
        continue;
      }
    }
    const mv = pl === undefined ? null : mover(s, rands[pl], trace);
    const prev = s;
    s = realApply(s, mv);
    if (T) trackMove(T, prev, mv, s);
  }
  if (!s.over) throw new Error(`game did not finish in ${n} moves`);
  const fs = s.players.map(p => followers(s, p));
  const out = s.players.map((p, i) => ({ own: fs[i], m: fs[i] - mean(fs.filter((_, j) => j !== i)), win: s.ranking[0] === i ? 1 : 0, ...got[i] }));
  return { seats: out, metrics: T ? finishTracker(T, s) : null };
}

// ---------- jobs ----------
// seed job: one table, a base game per fork round, then card-probe games and space-probe games.
function seedJob(job) {
  const { inst, g, table, Kc, Ks, cardPool, cellPool, deltas, anchorBoost } = job;
  const seed = job.seedBase + g;
  const rng = seededRandom(seed * 13 + 5);
  const trunkRand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, quadrants: table });
  while (s.pending?.kind === 'setup' || (s.pending && s.round === 0)) s = realApply(s, moverFor(inst)(s, trunkRand));
  const snaps = { 1: s };
  const none = [null, null, null, null];
  const base = {};
  const b1 = playFrom(s, seed, 1, inst, none, { track: true, snaps });
  base[1] = b1.seats;
  const needRound = r => { if (!base[r]) base[r] = playFrom(snaps[r], seed, r, inst, none).seats; return base[r]; };
  const out = { inst, g, table, metrics: b1.metrics, cards: [], spaces: [] };
  // ---- cards ----
  const onTable = d => d.guest || table.includes(d.quadrant);
  const elig = ALL_DEFS.filter(d => onTable(d) && (!cardPool || cardPool.includes(d.id)));
  if (Kc && elig.length) {
    const deckOf = () => { const d = []; for (const x of elig) for (let k = 0; k < (ANCHOR_IDS.includes(x.id) ? anchorBoost : 1); k++) d.push(x); return d.sort(() => rng() - 0.5); };
    let deck = deckOf();
    for (let k = 0; k < Kc; k++) {
      const r = 1 + Math.floor(rng() * 3);
      const pick = [];
      for (let seat = 0; seat < SEATS; seat++) {
        if (!deck.length) deck = deckOf();
        let at = deck.findIndex(d => !pick.includes(d));
        if (at < 0) { pick.push(null); continue; }
        pick.push(deck.splice(at, 1)[0]);
      }
      const snap = snaps[r];
      const cards = { ...snap.cards };
      const probes = pick.map((d, i) => {
        if (!d) return null;
        const grid = gridFor(priceOf(d), deltas), P = grid[Math.floor(rng() * grid.length)];
        cards[9000 + i] = { uid: 9000 + i, def: d.id };
        return { kind: 'card', uid: 9000 + i, def: d.id, P };
      });
      const B = needRound(r);
      const res = playFrom({ ...snap, cards }, seed, r, inst, probes).seats;
      out.cards.push(probes.map((pr, i) => (pr ? [pr.def, pr.P, r, res[i].m - B[i].m, res[i].own - B[i].own, res[i].win - B[i].win, res[i].done, res[i].round] : null)));
    }
  }
  // ---- spaces ----
  if (Ks) {
    const cellsFor = r => table.flatMap(qid => quadrant(qid).actions.map((a, i) => ({ id: `${qid}.${a.key}`, q: table.indexOf(qid), i, ring: a.ring })))
      .filter(c => c.ring <= r && (!cellPool || cellPool.includes(`${c.id}@${r}`)));
    const weights = [1, 2, 3].map(r => cellsFor(r).length);
    const W = weights.reduce((a, b) => a + b, 0);
    for (let k = 0; W && k < Ks; k++) {
      let x = rng() * W, r = 1;
      while (x >= weights[r - 1]) { x -= weights[r - 1]; r++; }
      const pool = cellsFor(r).sort(() => rng() - 0.5);
      // the same round's other spaces fill the seats a short targeted pool leaves
      const all = table.flatMap(qid => quadrant(qid).actions.map((a, i) => ({ id: `${qid}.${a.key}`, q: table.indexOf(qid), i, ring: a.ring }))).filter(c => c.ring <= r).sort(() => rng() - 0.5);
      const nullSeat = (g + k) % SEATS;
      const used = new Set();
      const probes = Array.from({ length: SEATS }, (_, seat) => {
        if (seat === nullSeat) return { kind: 'null', cell: `null@${r}` };
        const c = pool.find(c => !used.has(c.id)) || all.find(c => !used.has(c.id));
        if (!c) return { kind: 'null', cell: `null@${r}` };
        used.add(c.id);
        return { kind: 'space', q: c.q, i: c.i, cell: `${c.id}@${r}` };
      });
      const B = needRound(r);
      const res = playFrom(snaps[r], seed, r, inst, probes).seats;
      out.spaces.push(probes.map((pr, i) => [pr.cell, r, res[i].m - B[i].m, res[i].own - B[i].own, res[i].win - B[i].win, res[i].done]));
    }
  }
  return out;
}

// archetype job: one scripted seat (rotating) against 3 bots of one level, on the Classic table.
function archJob({ inst, arch, g, seedBase }) {
  const seed = seedBase + g;
  const seat = g % SEATS;
  const A = ARCHETYPES[arch];
  const rands = Array.from({ length: SEATS }, (_, i) => seededRandom(seed * 31 + i * 1009 + 3));
  const mover = moverFor(inst);
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, quadrants: CLASSIC });
  let n = 0;
  while (!s.over && n++ < 8000) {
    const pl = s.pending.player;
    s = realApply(s, pl === seat ? A.move(s, rands[pl]) : mover(s, rands[pl]));
  }
  const fs = s.players.map(p => followers(s, p));
  const top = Math.max(...fs), k = fs.filter(f => f === top).length;
  return { inst, arch, g, win: fs[seat] === top ? 1 / k : 0, f: fs[seat], fRival: mean(fs.filter((_, i) => i !== seat)), members: memberCount(s, s.players[seat]), membersRival: mean(s.players.filter((_, i) => i !== seat).map(p => memberCount(s, p))) };
}

// calibration job: a lone Hard-20 against 3 Normals (Hard must beat Normal, or the second instrument means nothing).
function calibJob({ g, seedBase }) {
  const seed = seedBase + g, seat = g % SEATS;
  const rands = Array.from({ length: SEATS }, (_, i) => seededRandom(seed * 31 + i * 1009 + 5));
  let s = createGame({ seats: Array.from({ length: SEATS }, () => ({ kind: 'bot' })), seed, quadrants: CLASSIC });
  let n = 0;
  while (!s.over && n++ < 8000) { const pl = s.pending.player; s = realApply(s, pl === seat ? hardMove(s, rands[pl]) : normalMove(s, rands[pl])); }
  const fs = s.players.map(p => followers(s, p));
  const top = Math.max(...fs), k = fs.filter(f => f === top).length;
  return { g, win: fs[seat] === top ? 1 / k : 0 };
}

// a friends' game record, replayed through the same tracker
function recordJob({ file }) {
  const rec = parseRecord(readFileSync(file, 'utf8'));
  let s = createGame({ seats: rec.seats.map(x => ({ name: x.name, kind: x.kind })), seed: rec.seed, quadrants: rec.quadrants, rules: rec.rules || {} });
  const T = newTracker(s);
  STEALS = [];
  for (const [player, option] of rec.moves) { const prev = s; const mv = { player, option }; s = realApply(s, mv); trackMove(T, prev, mv, s); }
  if (!s.over) return { file, unfinished: true, moves: rec.moves.length, round: s.round };
  return { file, metrics: finishTracker(T, s), seats: rec.seats.map(x => x.kind), table: rec.quadrants, sameContent: rec.build?.content === CONTENT_HASH, players: s.players.length };
}

if (!isMainThread) {
  parentPort.on('message', job => {
    if (!job) process.exit(0);
    const t0 = Date.now();
    MOVES = 0;
    try {
      const r = job.type === 'seed' ? seedJob(job) : job.type === 'arch' ? archJob(job) : job.type === 'calib' ? calibJob(job) : recordJob(job);
      parentPort.postMessage({ id: job.id, ok: true, r, ms: Date.now() - t0, moves: MOVES, type: job.type });
    } catch (e) {
      parentPort.postMessage({ id: job.id, ok: false, error: String(e.stack || e).split('\n').slice(0, 4).join(' | '), job: { type: job.type, inst: job.inst, g: job.g, arch: job.arch, table: job.table, file: job.file }, ms: Date.now() - t0 });
    }
  });
}

// ======================= main: pool =======================
function runPool(jobs, workers, label) {
  if (!jobs.length) return Promise.resolve([]);
  // heaviest first, so the tail of the run isn't one long job
  jobs = jobs.map((j, id) => ({ ...j, id })).sort((a, b) => (b.cost || 1) - (a.cost || 1));
  const total = jobs.reduce((a, j) => a + (j.cost || 1), 0);
  return new Promise((resolve, reject) => {
    const results = new Array(jobs.length);
    let next = 0, done = 0, doneCost = 0;
    const t0 = Date.now();
    let lastSay = 0;
    const pool = Array.from({ length: Math.min(workers, jobs.length) }, () => new Worker(fileURLToPath(import.meta.url)));
    const feed = w => { if (next < jobs.length) w.postMessage(jobs[next++]); else w.postMessage(null); };
    pool.forEach(w => {
      w.on('message', msg => {
        const j = jobs.find(x => x.id === msg.id);
        results[jobs.indexOf(j)] = msg; done++; doneCost += j.cost || 1;
        const secs = (Date.now() - t0) / 1000;
        if (Date.now() - lastSay > 15000 || done === jobs.length) {
          lastSay = Date.now();
          process.stderr.write(`  ${label}: ${done}/${jobs.length} jobs, ${secs.toFixed(0)}s, eta ~${doneCost ? ((secs * (total - doneCost)) / doneCost).toFixed(0) : '?'}s\n`);
        }
        if (done === jobs.length) { pool.forEach(x => x.postMessage(null)); resolve(results); } else feed(w);
      });
      w.on('error', reject);
      feed(w);
    });
  });
}

// ======================= main: fits =======================
function solve(A, b) { // Gaussian elimination with partial pivoting
  const n = b.length, M = A.map((r, i) => { const x = Array.from(r); x.push(b[i]); return x; });
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const v = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / v; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / (r[i] || 1e-12));
}
const qtl = (a, p) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.max(0, Math.floor(p * s.length)))] : NaN; };
const poisson = rng => { let k = 0, p = 1; const L = Math.exp(-1); do { k++; p *= rng(); } while (p > L); return k - 1; };

/**
 * Least squares with a fixed effect per fork group (seed × round × seat): every row is demeaned within its group, the
 * base row (no probe, y = 0) included, so each fork's own baseline is estimated from all its games instead of the one
 * base game. Groups never span seeds, so a seed-level bootstrap weight leaves the demeaning unchanged.
 * rows: { gi, grp, y, x: Map(j → v) }. Returns the point fit and `boot` Poisson-bootstrap refits over seeds.
 */
function fitBoot(rows, K, ridge, nSeeds, boot) {
  const groups = new Map();
  for (const r of rows) { if (!groups.has(r.grp)) groups.set(r.grp, []); groups.get(r.grp).push(r); }
  const dm = [];
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const my = mean(g.map(r => r.y)), mx = new Map();
    for (const r of g) for (const [j, v] of r.x) mx.set(j, (mx.get(j) || 0) + v / g.length);
    for (const r of g) {
      const x = new Map(r.x);
      for (const [j, v] of mx) x.set(j, (x.get(j) || 0) - v);
      const xs = [...x].filter(([, v]) => Math.abs(v) > 1e-12);
      if (xs.length) dm.push({ gi: r.gi, y: r.y - my, x: xs, tag: r.tag });
    }
  }
  const bySeed = Array.from({ length: nSeeds }, () => []);
  for (const r of dm) bySeed[r.gi].push(r);
  // each seed's normal equations once; a bootstrap refit is a weighted sum of them
  const parts = bySeed.map(rs => {
    if (!rs.length) return null;
    const A = new Map(), b = new Map();
    for (const r of rs) for (const [i, vi] of r.x) {
      b.set(i, (b.get(i) || 0) + vi * r.y);
      for (const [j, vj] of r.x) { const k = i * K + j; A.set(k, (A.get(k) || 0) + vi * vj); }
    }
    return { A: [...A], b: [...b] };
  });
  const fit = w => {
    const A = Array.from({ length: K }, () => new Float64Array(K)), b = new Float64Array(K);
    parts.forEach((pt, s) => {
      const wt = w ? w[s] : 1; if (!pt || !wt) return;
      for (const [k, v] of pt.A) A[Math.floor(k / K)][k % K] += wt * v;
      for (const [i, v] of pt.b) b[i] += wt * v;
    });
    for (let j = 0; j < K; j++) A[j][j] += ridge[j];
    return solve(A, b);
  };
  const beta = fit(null);
  const rng = seededRandom(17);
  const bs = [];
  for (let k = 0; k < boot; k++) bs.push(fit(Array.from({ length: nSeeds }, () => poisson(rng))));
  return { beta, bs, rows: dm.length, dm };
}

// Card × sphere (and space × sphere) interactions: a thing that is fine overall but off on tables with one sphere.
// The fit's residuals on rows where the seat holds the item, grouped by each other sphere on the table: mean ± SE, in
// followers (the within-fork demeaning shrinks a row's residual a little, so this errs small).
function interactions(dm, beta, ownOf) {
  const g = new Map();
  for (const r of dm) {
    if (!r.tag) continue;
    let fit = 0; for (const [j, v] of r.x) fit += v * beta[j];
    const res = r.y - fit, own = ownOf(r.tag.id);
    for (const q of r.tag.table) if (q !== own) { const k = `${r.tag.id}|${q}`; if (!g.has(k)) g.set(k, []); g.get(k).push(res); }
  }
  return [...g].filter(([, v]) => v.length >= 15).map(([k, v]) => { const [id, sphere] = k.split('|'); return { id, sphere, n: v.length, dev: mean(v), se: sd(v) / Math.sqrt(v.length) }; });
}

// cards: Δmargin_i = a_c + b_r·(P_i − printed) − ⅓ Σ rivals' (a + b_r·ΔP), seat × fork fixed effects; b_r is the price
// slope of a fork at round r (a cost point paid in round I costs more margin than one paid in round III).
// fair_c = printed − a_c / b̄_c, b̄_c = the mean b_r over the rounds its probes were recruited from.
function fitCards(seedResults, boot) {
  const ids = [...new Set(seedResults.flatMap(R => R.cards.flatMap(game => game.filter(e => e && e[6] === 1).map(e => e[0]))))];
  const col = Object.fromEntries(ids.map((id, i) => [id, i]));
  const C = ids.length, K = C + 3;
  if (!C) return null;
  const rows = [];
  const bases = new Set();
  seedResults.forEach((R, gi) => R.cards.forEach(game => game.forEach((e, i) => {
    if (!e) return;
    const r = e[2], grp = `${gi}|${r}|${i}`;
    const x = new Map(), add = (j, v) => x.set(j, (x.get(j) || 0) + v);
    const put = (f, w) => { if (f[6] !== 1) return; add(col[f[0]], w); add(C + r - 1, w * (f[1] - priceOf(DEF[f[0]]))); };
    put(e, 1);
    game.forEach((f, k) => { if (f && k !== i) put(f, -1 / 3); });
    rows.push({ gi, grp, y: e[3], x, tag: e[6] === 1 ? { id: e[0], table: R.table } : null });
    if (!bases.has(grp)) { bases.add(grp); rows.push({ gi, grp, y: 0, x: new Map() }); }
  })));
  const ridge = [...Array(C).fill(1), 0, 0, 0];
  const { beta, bs, rows: nRows, dm } = fitBoot(rows, K, ridge, seedResults.length, boot);
  const stats = Object.fromEntries(ids.map(id => [id, { n: 0, tried: 0, round: 0, win: 0, rounds: [0, 0, 0], byRound: { 1: [], 2: [], 3: [] } }]));
  seedResults.forEach(R => R.cards.forEach(game => game.forEach(e => {
    if (!e || !stats[e[0]]) return;
    const st = stats[e[0]]; st.tried++;
    if (e[6] !== 1) return;
    st.n++; st.win += e[5]; st.round += e[7]; st.rounds[e[2] - 1]++;
    if (e[1] === priceOf(DEF[e[0]])) st.byRound[e[2]].push(e[3]);
  })));
  const slopeOf = (bb, j) => { const st = stats[ids[j]]; const n = st.rounds.reduce((a, b) => a + b, 0) || 1; return -st.rounds.reduce((a, k, r) => a + k * bb[C + r], 0) / n; };
  const fairOf = (bb, j) => { const sl = slopeOf(bb, j); return priceOf(DEF[ids[j]]) + (sl > 0.05 ? bb[j] / sl : bb[j] > 0 ? 30 : -30); };
  const avgSlope = bb => -(bb[C] + bb[C + 1] + bb[C + 2]) / 3;
  const cards = ids.map((id, j) => {
    const fs = bs.map(bb => fairOf(bb, j)), T = priceOf(DEF[id]), st = stats[id];
    return {
      id, name: DEF[id].name, printed: T, n: st.n, bought: st.tried ? st.n / st.tried : NaN, meanRound: st.n ? st.round / st.n : NaN, winDelta: st.n ? st.win / st.n : NaN,
      net: beta[j], fair: fairOf(beta, j), lo: qtl(fs, 0.05), hi: qtl(fs, 0.95),
      atPrintedByRound: Object.fromEntries([1, 2, 3].map(r => [r, st.byRound[r].length ? +mean(st.byRound[r]).toFixed(2) : null])),
    };
  });
  const byRound = [0, 1, 2].map(r => ({ v: -beta[C + r], lo: qtl(bs.map(bb => -bb[C + r]), 0.05), hi: qtl(bs.map(bb => -bb[C + r]), 0.95) }));
  const all = bs.map(avgSlope);
  const sl = Math.max(0.1, avgSlope(beta));
  const inter = interactions(dm, beta, id => DEF[id].quadrant).map(x => ({ ...x, name: DEF[x.id].name, pts: x.dev / sl, ptsSe: x.se / sl }));
  return { slope: avgSlope(beta), slopeLo: qtl(all, 0.05), slopeHi: qtl(all, 0.95), slopeByRound: byRound, probes: nRows, seeds: seedResults.length, cards, inter };
}

// spaces: Δmargin_i = v_cell_i − ⅓ Σ rivals' v_cell, seat × fork fixed effects; a blocked probe is the bot's own choice
// (v = 0). A space's worth = v_cell − v_null (same round), in followers; u = worth ÷ that round's price slope.
function fitSpaces(seedResults, boot, slopes, scaleFrom = null) {
  const done = e => e[5] === 1;
  const cells = [...new Set(seedResults.flatMap(R => R.spaces.flatMap(game => game.filter(done).map(e => e[0]))))];
  if (!cells.length) return null;
  const col = Object.fromEntries(cells.map((c, i) => [c, i]));
  const K = cells.length;
  const rows = [];
  const bases = new Set();
  seedResults.forEach((R, gi) => R.spaces.forEach(game => game.forEach((e, i) => {
    const grp = `${gi}|${e[1]}|${i}`;
    const x = new Map(), add = (j, v) => x.set(j, (x.get(j) || 0) + v);
    if (done(e)) add(col[e[0]], 1);
    game.forEach((f, k) => { if (k !== i && done(f)) add(col[f[0]], -1 / 3); });
    rows.push({ gi, grp, y: e[2], x, tag: done(e) && !e[0].startsWith('null@') ? { id: e[0], table: R.table } : null });
    if (!bases.has(grp)) { bases.add(grp); rows.push({ gi, grp, y: 0, x: new Map() }); }
  })));
  const { beta, bs, rows: nRows, dm } = fitBoot(rows, K, Array(K).fill(0.5), seedResults.length, boot);
  const stats = Object.fromEntries(cells.map(c => [c, { n: 0, tried: 0, win: 0 }]));
  seedResults.forEach(R => R.spaces.forEach(game => game.forEach(e => { const st = stats[e[0]]; if (!st) return; st.tried++; if (done(e)) { st.n++; st.win += e[4]; } })));
  const nul = r => col[`null@${r}`];
  const out = cells.filter(c => !c.startsWith('null@')).map(c => {
    const [id, rs] = c.split('@'), r = Number(rs), j = col[c], z = nul(r), sl = slopes[r - 1];
    const absOf = bb => bb[j] - (z !== undefined ? bb[z] : 0);
    const abs = bs.map(absOf), rel = bs.map(bb => bb[j]);
    const sp = SPACES[id];
    return {
      cell: c, id, name: sp.name, text: sp.text, ring: sp.ring, round: r, n: stats[c].n, blocked: stats[c].tried ? 1 - stats[c].n / stats[c].tried : 0,
      worth: absOf(beta), lo: qtl(abs, 0.05), hi: qtl(abs, 0.95), vsChoice: beta[j], vsChoiceLo: qtl(rel, 0.05), vsChoiceHi: qtl(rel, 0.95),
      u: absOf(beta) / sl, uLo: qtl(abs, 0.05) / sl, uHi: qtl(abs, 0.95) / sl, winDelta: stats[c].n ? stats[c].win / stats[c].n : NaN,
    };
  });
  // Raw u includes the buy a placement enables and early compounding, so the round's median space (well sampled) is
  // set to the band's middle: scaled u says how a space sits among its round's field, on the value model's ruler.
  // Hard-20 measures only targets (outliers), so it borrows Normal's scale.
  const scale = scaleFrom || [1, 2, 3].map(r => {
    const us = out.filter(x => x.round === r && x.n >= 10).map(x => x.u);
    const med = qtl(us, 0.5);
    return us.length >= 4 && med > 0.2 ? BANDS[r][2] / med : 1;
  });
  for (const x of out) { const k = scale[x.round - 1]; x.su = x.u * k; x.suLo = x.uLo * k; x.suHi = x.uHi * k; }
  const nulls = [1, 2, 3].filter(r => nul(r) !== undefined).map(r => ({ round: r, v: beta[nul(r)], lo: qtl(bs.map(bb => bb[nul(r)]), 0.05), hi: qtl(bs.map(bb => bb[nul(r)]), 0.95), n: stats[`null@${r}`].n }));
  const inter = interactions(dm, beta, cell => cell.split('.')[0]).map(x => {
    const r = Number(x.id.split('@')[1]), k = scale[r - 1] / slopes[r - 1];
    return { ...x, name: `${SPACES[x.id.split('@')[0]].name} r${r}`, su: x.dev * k, suSe: x.se * k };
  });
  return { slopes, scale, probes: nRows, seeds: seedResults.length, spaces: out, nulls, inter };
}

// verdicts per instrument
function cardVerdict(c, minN) {
  if (!c || c.n < minN) return { state: 'thin' };
  const T = c.printed, gap = c.fair - T;
  const outside = (c.lo > T || c.hi < T) && Math.abs(gap) >= 1.5;
  const worthless = c.fair <= 0.5 && c.hi < 1.5;
  const tooStrong = T > 1 && c.fair > 2 * T && c.lo > T;
  return { state: outside ? (gap > 0 ? 'cheap' : 'dear') : 'in', ability: worthless ? 'worth ~nothing free' : tooStrong ? 'would need > 2× its price' : null, gap };
}
function spaceVerdict(s, minN) {
  if (!s || s.n < minN) return { state: 'thin' };
  const [lo, hi] = BANDS[s.round];
  if (s.suLo > hi) return { state: 'strong' };
  if (s.ring === s.round && s.suHi < lo) return { state: 'weak' };
  if (s.hi < 0) return { state: 'never pays' };
  return { state: 'in' };
}

// ---------- intervals and tallies ----------
function wilson(k, n, z = Z90) {
  if (!n) return [NaN, NaN, NaN];
  const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return [p, Math.max(0, c - h), Math.min(1, c + h)];
}
const pct = x => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : '–');
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : (x === Infinity ? '∞' : x === -Infinity ? '−∞' : '–'));
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '–');
const wl = ([p, lo, hi]) => `${pct(p)} [${pct(lo)}–${pct(hi)}]`;

function healthOf(games) {
  const players = games.flatMap(g => g.players);
  const n = players.length;
  if (!n) return null;
  const keys = ['self', 'members', 'small', 'mid', 'big', 'top', 'other', 'c1', 'c2', 'c3', 'effects'];
  const src = Object.fromEntries(keys.map(k => [k, mean(players.map(p => p.src[k] || 0))]));
  const fTot = mean(players.map(p => p.f));
  const lefts = players.map(p => p.left).sort((a, b) => a - b);
  const ties = games.reduce((a, g) => ({ paid: a.paid + g.ties.paid, two: a.two + g.ties.two, three: a.three + g.ties.three }), { paid: 0, two: 0, three: 0 });
  const runs = games.map(g => g.longestRun);
  const rich = games.flatMap(g => g.rich || []);
  return {
    games: games.length, players: n,
    members: mean(players.map(p => p.members)), membersSd: sd(players.map(p => p.members)), cards: mean(players.map(p => p.cards)),
    membersIn67: mean(players.map(p => (p.members >= 6 && p.members <= 7 ? 1 : 0))),
    followers: fTot, src, srcShare: Object.fromEntries(keys.map(k => [k, src[k] / fTot])),
    left: mean(lefts), leftP90: qtl(lefts, 0.9), leftMax: lefts[lefts.length - 1], left30: mean(lefts.map(x => (x >= 30 ? 1 : 0))),
    ties: { paid: ties.paid, two: ties.paid ? ties.two / ties.paid : NaN, three: ties.paid ? ties.three / ties.paid : NaN },
    steals: mean(games.map(g => g.steals)), stealUnits: mean(games.map(g => g.stealUnits)),
    run: mean(runs), runMax: Math.max(...runs), run3: mean(runs.map(r => (r >= 3 ? 1 : 0))),
    rich: rich.length ? { n: rich.length, within1: mean(rich.map(d => (d <= 1 ? 1 : 0))), median: qtl(rich, 0.5) } : null,
  };
}
function fairnessOf(games) {
  const n = Math.max(0, ...games.map(g => g.fs.length));
  const seat = Array.from({ length: n }, (_, k) => wilson(games.filter(g => g.winner === k).length, games.filter(g => g.fs.length > k).length));
  const withR1 = games.filter(g => g.r1order), withR3 = games.filter(g => g.r3order);
  const r1 = Array.from({ length: n }, (_, k) => wilson(withR1.filter(g => g.r1order[k] === g.winner).length, withR1.filter(g => g.r1order.length > k).length));
  const r3 = Array.from({ length: n }, (_, k) => wilson(withR3.filter(g => g.r3order[k] === g.winner).length, withR3.filter(g => g.r3order.length > k).length));
  return { games: games.length, seat, r1, r3 };
}

// ======================= main =======================
// ---------- run configuration ----------
export function parseFlags(argv) {
  return Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
}
function gitStamp() {
  let sha = 'nosha', dirty = '';
  try { sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); dirty = execSync('git status --porcelain -- src', { cwd: ROOT }).toString().trim() ? '+dirty' : ''; } catch { /* not a repo */ }
  return { sha, dirty };
}
async function configure(flags) {
  const quick = !!flags.quick;
  const only = flags.only ? String(flags.only).split(',') : ['anchors', 'cards', 'spaces', 'archetypes', 'fairness', 'health'];
  const { makeTables } = await import('../src/test/engine/v4/fuzz-tables-runner.js');
  const TABLES = quick ? [CLASSIC] : makeTables(4242, 2).tables;
  // sizes: quick ≈ 8 min, full ≈ 75 min on 4 cores (README). --scale=k multiplies every game count (for shards).
  const P = quick
    ? { normalSeeds: 60, Kc: 12, Ks: 12, hardSeedsB: 4, KcB: 14, KsB: 8, cardsB: 6, cellsB: 6, hardBase: 0, calib: 32, archN: 40, archH: 0, boot: 120, minN: 20, minNH: 12, seedBase: 700000, perTarget: 0 }
    : { normalSeeds: 440, Kc: 12, Ks: 12, hardSeedsB: 44, KcB: 12, KsB: 10, cardsB: 26, cellsB: 24, hardBase: 24, calib: 200, archN: 240, archH: 64, boot: 200, minN: 30, minNH: 20, seedBase: 500000, perTarget: 0 };
  const scale = Number(flags.scale || 1);
  if (scale !== 1) for (const k of ['normalSeeds', 'hardSeedsB', 'hardBase', 'calib', 'archN', 'archH']) P[k] = Math.round(P[k] * scale);
  for (const k of Object.keys(P)) if (flags[k] !== undefined) P[k] = Number(flags[k]);
  return { quick, only, TABLES, P, scale, tablesDesc: quick ? 'Classic (gold, red, market, echo)' : `${TABLES.length} random 4-sphere tables (makeTables 4242, every compatible pair at least twice), dealt round-robin` };
}
const DELTAS = [-4, 0, 4];
const NORMAL_GAME = 1, HARD_GAME = 8; // relative costs, for scheduling and the eta

function planA({ only, TABLES, P }) {
  const want = k => only.includes(k);
  const needSeeds = want('cards') || want('spaces') || want('anchors') || want('fairness') || want('health');
  const doCards = want('cards') || want('anchors'), doSpaces = want('spaces');
  // stratified: seed g plays table g mod 38, so every card and space meets each sphere it can share a table with
  // in proportion, whatever the seed count
  const tableOf = g => TABLES[g % TABLES.length];
  const jobs = [];
  if (needSeeds) for (let g = 0; g < P.normalSeeds; g++) jobs.push({ type: 'seed', inst: 'normal', g, seedBase: P.seedBase, table: tableOf(g), Kc: doCards ? P.Kc : 0, Ks: doSpaces ? P.Ks : 0, cardPool: !want('cards') ? ANCHOR_IDS : null, cellPool: null, deltas: DELTAS, anchorBoost: 3, cost: NORMAL_GAME * (2.2 + 0.72 * ((doCards ? P.Kc : 0) + (doSpaces ? P.Ks : 0))) });
  if (want('anchors') || doCards || doSpaces) for (let g = 0; g < P.calib; g++) jobs.push({ type: 'calib', g, seedBase: P.seedBase + 90000, cost: 2.2 });
  if (want('archetypes')) for (const arch of Object.keys(ARCHETYPES)) {
    for (let g = 0; g < P.archN; g++) jobs.push({ type: 'arch', inst: 'normal', arch, g, seedBase: P.seedBase + 50000, cost: arch === 'chaser' ? 2 : 1 });
    for (let g = 0; g < P.archH; g++) jobs.push({ type: 'arch', inst: 'hard', arch, g, seedBase: P.seedBase + 60000, cost: 6.5 });
  }
  if ((want('fairness') || want('health')) && P.hardBase) for (let g = 0; g < P.hardBase; g++) jobs.push({ type: 'seed', inst: 'hard', g: 10000 + g, seedBase: P.seedBase, table: tableOf(10000 + g), Kc: 0, Ks: 0, cardPool: null, cellPool: null, deltas: DELTAS, anchorBoost: 1, cost: HARD_GAME * 2.2 });
  return jobs;
}
const shardOf = (jobs, shard) => { if (!shard) return jobs; const [i, n] = String(shard).split('/').map(Number); return jobs.filter((_, k) => k % n === i); };

// the per-round price slopes convert a space's worth into resources; a missing or unclear one falls back
const slopesOf = (fit, fallback) => [0, 1, 2].map(r => (fit && fit.slopeByRound[r].lo > 0.05 ? fit.slopeByRound[r].v : fallback[r]));

/** Fits stage A and picks stage B's targets and seeds. */
function analyseA(cfg, okA) {
  const { only, TABLES, P } = cfg;
  const want = k => only.includes(k);
  const doCards = want('cards') || want('anchors'), doSpaces = want('spaces');
  // seed order, whatever order shards and workers finished in: the same numbers to the last bit
  const normalSeeds = okA.filter(r => r.inst === 'normal' && r.cards).sort((x, y) => x.g - y.g);
  const cardsN = doCards ? fitCards(normalSeeds, P.boot) : null;
  let last = null;
  try { last = JSON.parse(readFileSync(path.join(OUT, 'latest.json'), 'utf8')).instruments?.normal; } catch { /* first run */ }
  const slopesN = slopesOf(cardsN, last?.slopes || [0.75, 0.75, 0.75]);
  const slopeN = cardsN && cardsN.slope > 0.1 ? cardsN.slope : last?.slope || 0.75;
  const spacesN = doSpaces ? fitSpaces(normalSeeds, P.boot, slopesN) : null;
  // Hard-20 re-measures the anchors and what Normal flags or reads far off, the clearest first (capped, so its probes
  // aren't spread too thin to say anything)
  const halfW = c => Math.max(0.5, (c.hi - c.lo) / 2);
  const cardCands = !(want('cards') && cardsN) ? [] : cardsN.cards.filter(c => !ANCHOR_IDS.includes(c.id) && Number.isFinite(c.fair)).map(c => {
    const v = cardVerdict(c, P.minN);
    const hit = v.state === 'cheap' || v.state === 'dear' || v.ability || Math.abs(c.fair - c.printed) >= 2.5;
    return { id: c.id, hit, flagged: v.state === 'cheap' || v.state === 'dear' || !!v.ability, z: Math.abs(c.fair - c.printed) / halfW(c) };
  }).filter(x => x.hit).sort((a, b) => b.flagged - a.flagged || b.z - a.z);
  const cardList = [...new Set([...(doCards ? ANCHOR_IDS : []), ...cardCands.slice(0, P.cardsB).map(x => x.id)])];
  const cellCands = !spacesN ? [] : spacesN.spaces.map(s => {
    const v = spaceVerdict(s, P.minN), [lo, hi] = BANDS[s.round];
    const flagged = v.state !== 'in' && v.state !== 'thin';
    const off = s.su > hi + 1 || (s.ring === s.round && s.su < lo - 1) || s.worth < 0;
    const hw = Math.max(0.5, (s.suHi - s.suLo) / 2);
    return { cell: s.cell, hit: flagged || off, flagged, z: (s.su > hi ? s.su - hi : lo - s.su) / hw };
  }).filter(x => x.hit).sort((a, b) => b.flagged - a.flagged || b.z - a.z);
  const cellList = cellCands.slice(0, P.cellsB).map(x => x.cell);
  // --perTarget=N sizes stage B so each target gets about N paired Hard-20 probes
  let seedsB = P.hardSeedsB;
  if (P.perTarget) seedsB = Math.max(cardList.length ? Math.ceil((cardList.length * P.perTarget) / (P.KcB * 4 * 0.5)) : 0, cellList.length ? Math.ceil((cellList.length * P.perTarget) / (P.KsB * 3 * 0.35)) : 0);
  const jobsB = [];
  if (seedsB && (cardList.length || cellList.length)) {
    // tables that hold the targets: each seed takes the table holding the most targets not yet well covered
    const holds = (t, id) => { const d = DEF[id]; return d.guest || t.includes(d.quadrant); };
    const cover = new Map();
    for (let g = 0; g < seedsB; g++) {
      const cand = TABLES.map(t => [t, cardList.filter(id => holds(t, id)).reduce((a, id) => a + 1 / (1 + (cover.get(id) || 0)), 0) + cellList.filter(c => t.includes(c.split('.')[0])).reduce((a, c) => a + 1 / (1 + (cover.get(c) || 0)), 0)]);
      cand.sort((a, b) => b[1] - a[1]);
      const table = cand[g % Math.min(3, cand.length)][0];
      cardList.filter(id => holds(table, id)).forEach(id => cover.set(id, (cover.get(id) || 0) + 1));
      cellList.filter(c => table.includes(c.split('.')[0])).forEach(c => cover.set(c, (cover.get(c) || 0) + 1));
      const hasCells = cellList.some(c => table.includes(c.split('.')[0]));
      jobsB.push({ type: 'seed', inst: 'hard', g, seedBase: P.seedBase + 20000, table, Kc: cardList.length ? P.KcB : 0, Ks: hasCells ? P.KsB : 0, cardPool: cardList, cellPool: cellList, deltas: DELTAS, anchorBoost: 1, cost: HARD_GAME * (2.2 + 0.72 * (P.KcB + P.KsB)) });
    }
  }
  return { normalSeeds, cardsN, spacesN, slopesN, slopeN, cardList, cellList, jobsB };
}

const partialOf = (stage, cfg, flags, res, stamp) => ({
  kind: 'patrons.v4.bench.partial', stage, shard: flags.shard || '0/1', sha: stamp.sha + stamp.dirty, content: CONTENT_HASH, date: new Date().toISOString(),
  config: { quick: cfg.quick, only: cfg.only, scale: cfg.scale, P: cfg.P, flags: Object.fromEntries(Object.entries(flags).filter(([k]) => !['shard', 'out', 'stage', 'plan', 'workers'].includes(k))) },
  results: res.filter(x => x.ok).map(x => ({ r: x.r, ms: x.ms, moves: x.moves, type: x.type })), crashes: res.filter(x => !x.ok).map(x => ({ ...x.job, error: x.error })),
  ms: res.reduce((a, x) => a + x.ms, 0),
});

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const workers = Number(flags.workers || cpus().length);
  const t0 = Date.now();
  const stamp = gitStamp();
  if (flags.records) return recordsMode(String(flags.records), workers, stamp.sha + stamp.dirty);
  const cfg = await configure(flags);
  const stage = String(flags.stage || 'all');
  const tag = `${cfg.quick ? 'quick' : 'full'}${stamp.sha}`;
  if (stage === 'A') {
    // one shard of stage A: a partial for scripts/v4-bench-merge.mjs
    const jobs = shardOf(planA(cfg), flags.shard);
    process.stderr.write(`bench stage A shard ${flags.shard || '0/1'}: ${jobs.length} jobs on ${workers} workers\n`);
    const res = await runPool(jobs, workers, 'stage A');
    const out = flags.out || path.join(OUT, `partial-A-${tag}-${String(flags.shard || '0/1').replace('/', 'of')}.json`);
    writeFileSync(out, JSON.stringify(partialOf('A', cfg, flags, res, stamp)));
    process.stderr.write(`wrote ${out}\n`);
    return;
  }
  if (stage === 'B') {
    // one shard of stage B, from the plan the merge of stage A wrote
    const plan = JSON.parse(readFileSync(String(flags.plan), 'utf8'));
    const jobs = shardOf(plan.jobsB, flags.shard);
    process.stderr.write(`bench stage B shard ${flags.shard || '0/1'}: ${jobs.length} Hard-20 jobs on ${workers} workers\n`);
    const res = await runPool(jobs, workers, 'stage B');
    const out = flags.out || path.join(OUT, `partial-B-${tag}-${String(flags.shard || '0/1').replace('/', 'of')}.json`);
    writeFileSync(out, JSON.stringify(partialOf('B', { ...cfg, ...plan.config }, flags, res, stamp)));
    process.stderr.write(`wrote ${out}\n`);
    return;
  }
  // stage all: both stages on this machine
  process.stderr.write(`bench ${cfg.quick ? 'quick' : 'full'} on ${workers} workers, ${stamp.sha}${stamp.dirty}: stage A\n`);
  const A = await runPool(planA(cfg), workers, 'stage A');
  const pA = partialOf('A', cfg, flags, A, stamp);
  const a = analyseA(cfg, pA.results.map(x => x.r));
  process.stderr.write(`stage B: Hard-20 re-measures ${a.cardList.length} cards and ${a.cellList.length} spaces, ${a.jobsB.length} seeds\n`);
  const B = await runPool(a.jobsB, workers, 'stage B');
  const pB = partialOf('B', cfg, flags, B, stamp);
  finalize(cfg, flags, [pA], [pB], a, { stamp, secs: (Date.now() - t0) / 1000, workers, shards: 1 });
}

/** Merge entry (scripts/v4-bench-merge.mjs): stage-A partials alone → stage B plan; A and B partials → the report. */
export async function mergeMain(files, flags) {
  const parts = files.map(f => JSON.parse(readFileSync(f, 'utf8')));
  const bad = parts.find(p => p.kind !== 'patrons.v4.bench.partial');
  if (bad) throw new Error('Not a bench partial.');
  const As = parts.filter(p => p.stage === 'A'), Bs = parts.filter(p => p.stage === 'B');
  if (!As.length) throw new Error('No stage-A partials.');
  const key = p => JSON.stringify([p.content, p.config.quick, p.config.only, p.config.P]);
  if (new Set(As.map(key)).size > 1) throw new Error('Stage-A partials come from different rules content or settings: they cannot be merged.');
  const shards = new Set(As.map(p => p.shard));
  const n = Number(As[0].shard.split('/')[1]);
  if (shards.size !== n) process.stderr.write(`warning: ${shards.size} of ${n} stage-A shards present (${[...shards].sort().join(', ')})\n`);
  const cfg = await configure({ ...As[0].config.flags, ...(As[0].config.quick ? { quick: true } : {}) });
  Object.assign(cfg.P, As[0].config.P);
  if (As[0].content !== CONTENT_HASH) process.stderr.write(`warning: partials were made on content ${As[0].content}, this tree is ${CONTENT_HASH}\n`);
  const a = analyseA(cfg, As.flatMap(p => p.results.map(x => x.r)));
  if (!Bs.length) {
    const out = flags.plan || path.join(OUT, `plan-B-${As[0].sha}.json`);
    writeFileSync(out, JSON.stringify({ config: { quick: cfg.quick, only: cfg.only, P: cfg.P }, cardList: a.cardList, cellList: a.cellList, jobsB: a.jobsB }));
    console.log(`Stage A merged (${As.reduce((s, p) => s + p.results.length, 0)} jobs from ${As.length} shards). Stage B: ${a.jobsB.length} Hard-20 seeds for ${a.cardList.length} cards and ${a.cellList.length} spaces.`);
    console.log(`Plan: ${out}\nRun on each machine i of n:  node scripts/v4-bench.mjs ${cfg.quick ? '--quick ' : ''}--stage=B --plan=${out} --shard=i/n\nThen:  node scripts/v4-bench-merge.mjs <every partial-A and partial-B file>`);
    return;
  }
  const stamp = { sha: As[0].sha.replace('+dirty', ''), dirty: As[0].sha.includes('+dirty') ? '+dirty' : '' };
  const secs = Math.max(0, (Date.parse(Bs.reduce((m, p) => (p.date > m ? p.date : m), '')) - Date.parse(As.reduce((m, p) => (p.date < m ? p.date : m), As[0].date))) / 1000);
  finalize(cfg, flags, As, Bs, a, { stamp, secs, workers: null, shards: n });
}

function finalize(cfg, flags, As, Bs, a, { stamp, secs, workers, shards }) {
  const { quick, only, P, tablesDesc } = cfg;
  const doCards = only.includes('cards') || only.includes('anchors');
  const byKey = r => `${r.arch || ''}|${r.inst || ''}|${String(r.g).padStart(8, '0')}`;
  const okA = As.flatMap(p => p.results.map(x => x.r)).sort((x, y) => (byKey(x) < byKey(y) ? -1 : 1));
  const crashes = [...As, ...Bs].flatMap(p => p.crashes);
  const msA = As.reduce((s, p) => s + p.ms, 0), msB = Bs.reduce((s, p) => s + p.ms, 0);
  const { normalSeeds, cardsN, spacesN, slopesN, slopeN, cardList, cellList } = a;
  const hardSeeds = Bs.flatMap(p => p.results.map(x => x.r)).sort((x, y) => x.g - y.g);
  const cardsH = cardList.length ? fitCards(hardSeeds, P.boot) : null;
  const slopeH = cardsH && cardsH.slope > 0.1 ? cardsH.slope : slopeN;
  const slopesH = slopesOf(cardsH, slopesN);
  const spacesH = cellList.length ? fitSpaces(hardSeeds, P.boot, slopesH, spacesN?.scale) : null;

  // ---------- throughput: real moves played, in full-game equivalents, per core-minute ----------
  const all = [...As, ...Bs].flatMap(p => p.results);
  const perGame = inst => mean(all.filter(x => x.r.inst === inst && x.r.metrics).map(x => x.r.metrics.moves)) || 190;
  const thr = inst => { const xs = all.filter(x => x.type === 'seed' && x.r.inst === inst); const mv = xs.reduce((s, x) => s + (x.moves || 0), 0), ms = xs.reduce((s, x) => s + x.ms, 0); return { games: mv / perGame(inst), coreMin: ms / 60000, perCoreMin: ms ? (mv / perGame(inst)) / (ms / 60000) : NaN }; };
  const throughput = { normal: thr('normal'), hard: thr('hard'), all: { games: all.reduce((s, x) => s + (x.moves || 0), 0) / perGame('normal') } };

  // ---------- anchors ----------
  const calib = okA.filter(r => r.win !== undefined && r.arch === undefined);
  const calibW = wilson(calib.reduce((s, r) => s + r.win, 0), calib.length);
  const anchorRows = [];
  for (const inst of ['normal', 'hard']) {
    const fit = inst === 'normal' ? cardsN : cardsH;
    for (const an of ANCHORS) {
      if (!doCards) continue;
      const c = fit?.cards.find(x => x.id === an.id);
      // off = the instrument confidently disagrees: its 90% interval misses the expected range (or it has too few probes to say)
      const ok = !!c && c.n >= (inst === 'normal' ? P.minN : P.minNH) && c.hi >= an.lo && c.lo <= an.hi;
      anchorRows.push({ inst, id: an.id, name: DEF[an.id].name, printed: priceOf(DEF[an.id]), fair: c?.fair, lo: c?.lo, hi: c?.hi, n: c?.n || 0, want: [an.lo, an.hi], ok, why: an.why });
    }
  }
  const instOk = {
    normal: anchorRows.filter(r => r.inst === 'normal').every(r => r.ok) && (!cardsN || cardsN.slopeLo > 0),
    hard: anchorRows.filter(r => r.inst === 'hard').every(r => r.ok) && (!calib.length || calibW[1] > 0.25) && (!cardsH || cardsH.slopeLo > 0),
  };
  const trusted = instOk.normal && instOk.hard;

  // ---------- verdicts, with power: the smallest gap each item's interval could have caught (80% power) ----------
  const mde = hw => 1.51 * hw; // (z.95 + z.80) / z.95 × the 90% half-width
  const cardRows = (cardsN?.cards || []).map(cN => {
    const cH = cardsH?.cards.find(x => x.id === cN.id);
    const vN = cardVerdict(cN, P.minN), vH = cardVerdict(cH, P.minNH);
    const both = (vN.state === 'cheap' || vN.state === 'dear') && vN.state === vH.state;
    const ability = !!(vN.ability && vH.ability);
    // Hard-20 confidently disagrees: it reads the card in band and its interval excludes Normal's reading
    const normalOnly = (vN.state === 'cheap' || vN.state === 'dear') && vH.state === 'in' && (cN.fair < cH.lo || cN.fair > cH.hi);
    return { id: cN.id, name: cN.name, printed: cN.printed, N: { ...cN, mde: Math.max(1.5, mde((cN.hi - cN.lo) / 2)) }, H: cH ? { ...cH, mde: Math.max(1.5, mde((cH.hi - cH.lo) / 2)) } : null, vN, vH, both, ability, normalOnly };
  });
  const spaceRows = (spacesN?.spaces || []).map(sN => {
    const sH = spacesH?.spaces.find(x => x.cell === sN.cell);
    const vN = spaceVerdict(sN, P.minN), vH = spaceVerdict(sH, P.minNH);
    const both = vN.state !== 'in' && vN.state !== 'thin' && vN.state === vH.state;
    const normalOnly = vN.state !== 'in' && vN.state !== 'thin' && vH.state === 'in' && (sN.su < sH.suLo || sN.su > sH.suHi);
    return { cell: sN.cell, id: sN.id, name: sN.name, round: sN.round, ring: sN.ring, N: { ...sN, mde: mde((sN.suHi - sN.suLo) / 2) }, H: sH ? { ...sH, mde: mde((sH.suHi - sH.suLo) / 2) } : null, vN, vH, both, normalOnly };
  });
  // interactions: Normal's screen, |deviation| ≥ 3 cost points (spaces: 3 scaled u) and |z| ≥ 3.5 (about one false
  // alarm in a full run's ~1,500 card × sphere pairs); Hard-20's reading beside it where it measured the pair
  const pickInter = (fit, hard, val, se) => (fit?.inter || []).filter(x => Math.abs(x[val]) >= 3 && Math.abs(x[val] / x[se]) >= 3.5)
    .sort((p, q) => Math.abs(q[val] / q[se]) - Math.abs(p[val] / p[se])).slice(0, 15)
    .map(x => ({ ...x, hard: (hard?.inter || []).find(y => y.id === x.id && y.sphere === x.sphere) || null }));
  const interCards = pickInter(cardsN, cardsH, 'pts', 'ptsSe'), interSpaces = pickInter(spacesN, spacesH, 'su', 'suSe');

  // ---------- archetypes ----------
  const archRes = okA.filter(r => r.arch);
  const archetypes = [];
  for (const arch of Object.keys(ARCHETYPES)) for (const inst of ['normal', 'hard']) {
    const rs = archRes.filter(r => r.arch === arch && r.inst === inst);
    if (!rs.length) continue;
    archetypes.push({ arch, name: ARCHETYPES[arch].name, inst, n: rs.length, win: wilson(rs.reduce((s, r) => s + r.win, 0), rs.length), f: mean(rs.map(r => r.f)), fRival: mean(rs.map(r => r.fRival)), members: mean(rs.map(r => r.members)), membersRival: mean(rs.map(r => r.membersRival)) });
  }

  // ---------- fairness and health (base games: Normal seeds, Hard bases and Hard stage-B seeds) ----------
  const metricsN = normalSeeds.map(r => r.metrics).filter(Boolean);
  const metricsH = [...okA.filter(r => r.inst === 'hard' && r.metrics), ...hardSeeds].map(r => r.metrics).filter(Boolean);
  const fairness = { normal: fairnessOf(metricsN), hard: fairnessOf(metricsH) };
  const health = { normal: healthOf(metricsN), hard: healthOf(metricsH) };

  const { sha, dirty } = stamp;
  const result = {
    kind: 'patrons.v4.bench', mode: quick ? 'quick' : 'full', only, sha: sha + dirty, content: CONTENT_HASH, date: new Date().toISOString(), secs, coreSecs: (msA + msB) / 1000, workers, shards, params: P, scale: cfg.scale,
    tables: tablesDesc, throughput,
    printed: Object.fromEntries(ALL_DEFS.map(d => [d.id, priceOf(d)])),
    instruments: {
      normal: { name: 'Normal', slope: slopeN, slopes: slopesN, slopeByRound: cardsN?.slopeByRound, slopeLo: cardsN?.slopeLo, slopeHi: cardsN?.slopeHi, cardProbes: cardsN?.probes || 0, spaceProbes: spacesN?.probes || 0, seeds: normalSeeds.length },
      hard: { name: `Hard-${HARD_BUDGET}`, slope: slopeH, slopes: slopesH, slopeByRound: cardsH?.slopeByRound, slopeLo: cardsH?.slopeLo, slopeHi: cardsH?.slopeHi, cardProbes: cardsH?.probes || 0, spaceProbes: spacesH?.probes || 0, seeds: hardSeeds.length, calib: { n: calib.length, win: calibW } },
    },
    anchors: { rows: anchorRows, instOk, trusted }, cards: cardRows, spaces: spaceRows, nulls: { normal: spacesN?.nulls, hard: spacesH?.nulls }, spaceScale: spacesN?.scale,
    interactions: { cards: interCards, spaces: interSpaces, pairs: { cards: cardsN?.inter?.length || 0, spaces: spacesN?.inter?.length || 0 } },
    archetypes, fairness, health, crashes,
  };
  mkdirSync(path.join(OUT, 'history'), { recursive: true });
  const prev = previousRun(result.mode, only);
  const diff = prev ? diffRuns(prev, result) : null;
  const tagOnly = flags.only ? `-${only.join('+')}` : '';
  const tagSeed = flags.seedBase ? `-s${P.seedBase}` : '';
  writeFileSync(path.join(OUT, 'history', `${result.date.slice(0, 10)}-${sha}${dirty ? '-dirty' : ''}${quick ? '-quick' : ''}${tagOnly}${tagSeed}.json`), JSON.stringify(result));
  // a full run of every section is "latest"; a quick or partial run never overwrites it
  const name = !quick && !flags.only ? 'latest' : `latest-${quick ? 'quick' : 'full'}${tagOnly}`;
  writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(result, null, 1));
  writeFileSync(path.join(OUT, `${name}.md`), report(result, diff, prev));
  writeFileSync(path.join(OUT, quick ? 'trend-quick.md' : 'trend.md'), trend(result.mode, only));
  process.stderr.write(`done in ${(secs / 60).toFixed(1)} min (${(result.coreSecs / 60).toFixed(0)} core-min, ${throughput.all.games.toFixed(0)} game-equivalents). design/eval/bench/${name}.md\n`);
}

// ======================= history =======================
function previousRun(mode, only) {
  const dir = path.join(OUT, 'history');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => { try { return { f, r: JSON.parse(readFileSync(path.join(dir, f), 'utf8')) }; } catch { return null; } })
    .filter(x => x && x.r.kind === 'patrons.v4.bench' && x.r.mode === mode && JSON.stringify(x.r.only) === JSON.stringify(only)).sort((a, b) => (a.r.date < b.r.date ? 1 : -1));
  return files[0]?.r || null;
}
function diffRuns(a, b) {
  const lines = [];
  if (a.content !== b.content) lines.push(`Rules content changed (${a.content} → ${b.content}).`);
  const repriced = Object.keys(b.printed).filter(id => a.printed[id] !== undefined && a.printed[id] !== b.printed[id]).map(id => `${DEF[id]?.name || id} ${a.printed[id]}→${b.printed[id]}`);
  const added = Object.keys(b.printed).filter(id => a.printed[id] === undefined).map(id => DEF[id]?.name || id);
  const gone = Object.keys(a.printed).filter(id => b.printed[id] === undefined);
  if (repriced.length) lines.push(`Repriced: ${repriced.join(', ')}.`);
  if (added.length) lines.push(`New cards: ${added.join(', ')}.`);
  if (gone.length) lines.push(`Cards gone: ${gone.join(', ')}.`);
  if (a.anchors.trusted !== b.anchors.trusted) lines.push(`Anchor check: ${a.anchors.trusted ? 'passed' : 'failed'} → ${b.anchors.trusted ? 'passed' : 'failed'}.`);
  const cardMoves = [];
  for (const c of b.cards) {
    const o = a.cards.find(x => x.id === c.id);
    if (!o) continue;
    const was = o.both ? o.vN.state : 'in', now = c.both ? c.vN.state : 'in';
    if (was !== now) cardMoves.push(`${c.name}: ${was === 'in' ? 'not flagged' : `flagged ${was}`} → ${now === 'in' ? 'not flagged' : `flagged ${now}`}`);
    else if (Number.isFinite(o.N.fair) && Number.isFinite(c.N.fair)) {
      const half = x => (x.hi - x.lo) / 2;
      const d = c.N.fair - o.N.fair, se = Math.hypot(half(c.N), half(o.N)) / Z90;
      if (Math.abs(d) >= 1.5 && Math.abs(d) > 2 * se) cardMoves.push(`${c.name}: Normal fair ${f1(o.N.fair)} → ${f1(c.N.fair)}`);
    }
  }
  if (cardMoves.length) lines.push(`Cards: ${cardMoves.join('; ')}.`);
  const spMoves = [];
  for (const s of b.spaces) {
    const o = a.spaces.find(x => x.cell === s.cell);
    if (!o) continue;
    const was = o.both ? o.vN.state : 'in', now = s.both ? s.vN.state : 'in';
    if (was !== now) spMoves.push(`${s.name} (round ${s.round}): ${was} → ${now}`);
  }
  if (spMoves.length) lines.push(`Spaces: ${spMoves.join('; ')}.`);
  for (const x of b.archetypes) {
    const o = a.archetypes.find(y => y.arch === x.arch && y.inst === x.inst);
    if (o && (x.win[0] < o.win[1] || x.win[0] > o.win[2]) && (o.win[0] < x.win[1] || o.win[0] > x.win[2])) lines.push(`${x.name} vs 3 ${x.inst === 'hard' ? 'Hard-20' : 'Normal'}: ${pct(o.win[0])} → ${pct(x.win[0])}.`);
  }
  for (const inst of ['normal', 'hard']) {
    const h0 = a.health?.[inst], h1 = b.health?.[inst];
    if (!h0 || !h1) continue;
    const moved = [];
    if (Math.abs(h1.members - h0.members) >= 0.5) moved.push(`members ${f1(h0.members)} → ${f1(h1.members)}`);
    if (Math.abs(h1.followers - h0.followers) >= 3) moved.push(`followers ${f1(h0.followers)} → ${f1(h1.followers)}`);
    if (Math.abs(h1.left - h0.left) >= 2) moved.push(`left at end ${f1(h0.left)} → ${f1(h1.left)}`);
    if (Math.abs((h1.ties.two || 0) - (h0.ties.two || 0)) >= 0.05) moved.push(`tied contests ${pct(h0.ties.two)} → ${pct(h1.ties.two)}`);
    if (moved.length) lines.push(`Health (${inst === 'hard' ? 'Hard-20' : 'Normal'}): ${moved.join(', ')}.`);
  }
  return lines;
}

// ======================= trend =======================
/** Each card's, space's and archetype's reading across this mode's runs (newest last), with what changed between. */
export function trend(mode, only) {
  const dir = path.join(OUT, 'history');
  const runs = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => { try { return JSON.parse(readFileSync(path.join(dir, f), 'utf8')); } catch { return null; } })
    .filter(r => r && r.kind === 'patrons.v4.bench' && r.mode === mode && JSON.stringify(r.only) === JSON.stringify(only)).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-8);
  const L = [`# Bench trend (${mode})`, '', `The last ${runs.length} ${mode} runs, oldest first. Cards: Normal's fair price (✱ = both instruments flag it). Spaces: Normal's scaled u. Archetypes: win %.`, ''];
  const head = runs.map(r => `${r.date.slice(5, 10)} ${r.sha}`);
  L.push('## Runs and what changed between them');
  runs.forEach((r, i) => {
    const p = runs[i - 1];
    let what = 'first run kept';
    if (p) {
      const rep = Object.keys(r.printed).filter(id => p.printed[id] !== undefined && p.printed[id] !== r.printed[id]).map(id => `${DEF[id]?.name || id} ${p.printed[id]}→${r.printed[id]}`);
      const added = Object.keys(r.printed).filter(id => p.printed[id] === undefined).map(id => DEF[id]?.name || id);
      const gone = Object.keys(p.printed).filter(id => r.printed[id] === undefined);
      what = [p.content === r.content ? 'same rules content' : `rules content ${p.content} → ${r.content}`, rep.length ? `repriced ${rep.join(', ')}` : '', added.length ? `new ${added.join(', ')}` : '', gone.length ? `gone ${gone.join(', ')}` : ''].filter(Boolean).join('; ');
    }
    L.push(`- ${head[i]}: ${r.anchors.trusted ? 'anchors pass' : 'ANCHORS FAIL'}; ${what}.`);
  });
  L.push('');
  if (!runs.length) return L.join('\n') + '\n';
  // Pooled: every kept run on the latest rules content, combined by inverse variance. One run's flags churn at the
  // edges (each run is an independent sample and many cards sit near the line); the pooled reading is the one to act on.
  const latest = runs[runs.length - 1];
  // independent samples only: a rerun with the same seeds replays the same games, so keep the newest of each seed base
  const same = runs.filter(r => r.content === latest.content).filter((r, i, xs) => !xs.slice(i + 1).some(o => o.params?.seedBase === r.params?.seedBase && o.scale === r.scale));
  const pool = (xs, val, lo, hi) => {
    const w = xs.filter(x => x && Number.isFinite(x[val]) && Number.isFinite(x[lo]) && x[hi] > x[lo]).map(x => ({ v: x[val], w: 1 / (((x[hi] - x[lo]) / (2 * Z90)) ** 2) }));
    if (!w.length) return null;
    const W = w.reduce((s2, x) => s2 + x.w, 0), v = w.reduce((s2, x) => s2 + x.w * x.v, 0) / W, h = Z90 / Math.sqrt(W);
    return { v, lo: v - h, hi: v + h, runs: w.length };
  };
  const pooledCards = [...new Set(same.flatMap(r => r.cards.map(c => c.id)))].map(id => {
    const T = latest.printed[id], N = pool(same.map(r => r.cards.find(c => c.id === id)?.N), 'fair', 'lo', 'hi'), Hh = pool(same.map(r => r.cards.find(c => c.id === id)?.H), 'fair', 'lo', 'hi');
    const dir = x => (!x ? null : x.lo > T && x.v - T >= 1.5 ? 'cheap' : x.hi < T && T - x.v >= 1.5 ? 'dear' : 'in');
    return { id, T, N, H: Hh, flag: dir(N) !== 'in' && dir(N) && dir(N) === dir(Hh) ? dir(N) : null, nOnly: (dir(N) === 'cheap' || dir(N) === 'dear') && dir(Hh) !== dir(N) };
  });
  const pooledSpaces = [...new Set(same.flatMap(r => r.spaces.map(x => x.cell)))].map(cell => {
    const r = Number(cell.split('@')[1]), [lo, hi] = BANDS[r], ring = SPACES[cell.split('@')[0]]?.ring;
    const N = pool(same.map(x => x.spaces.find(y => y.cell === cell)?.N), 'su', 'suLo', 'suHi'), Hh = pool(same.map(x => x.spaces.find(y => y.cell === cell)?.H), 'su', 'suLo', 'suHi');
    const dir = x => (!x ? null : x.lo > hi ? 'strong' : ring === r && x.hi < lo ? 'weak' : 'in');
    return { cell, N, H: Hh, flag: dir(N) !== 'in' && dir(N) && dir(N) === dir(Hh) ? dir(N) : null };
  });
  L.push(`## Pooled over the ${same.length} run${same.length > 1 ? 's' : ''} on today's rules content (${latest.content})`, '');
  L.push('Flagged when both pooled intervals miss printed by ≥ 1.5 cost points the same way (spaces: miss the band the same way). This is the list to act on.', '');
  const pc = pooledCards.filter(x => x.flag).sort((x, y) => Math.abs(y.N.v - y.T) - Math.abs(x.N.v - x.T));
  L.push(`| card | printed | Normal pooled [90%] | Hard-20 pooled [90%] | reads |`, '|---|---|---|---|---|');
  pc.forEach(x => L.push(`| ${DEF[x.id]?.name || x.id} (${x.id.split('.')[0]}) | ${x.T} | ${f1(x.N.v)} [${f1(x.N.lo)}–${f1(x.N.hi)}] (${x.N.runs}) | ${f1(x.H.v)} [${f1(x.H.lo)}–${f1(x.H.hi)}] (${x.H.runs}) | too ${x.flag} |`));
  if (!pc.length) L.push('| none | | | | |');
  const ps = pooledSpaces.filter(x => x.flag);
  L.push('', `| space | round | Normal pooled scaled u [90%] | Hard-20 pooled [90%] | reads |`, '|---|---|---|---|---|');
  ps.forEach(x => { const [id, r] = x.cell.split('@'); L.push(`| ${SPACES[id]?.name || id} (${id.split('.')[0]}) | ${r} | ${f1(x.N.v)} [${f1(x.N.lo)}–${f1(x.N.hi)}] | ${f1(x.H.v)} [${f1(x.H.lo)}–${f1(x.H.hi)}] | ${x.flag} |`); });
  if (!ps.length) L.push('| none | | | | |');
  const nOnlyP = pooledCards.filter(x => x.nOnly && x.H);
  if (nOnlyP.length) L.push('', `Normal flags on the pooled reading, Hard-20 doesn't agree: ${nOnlyP.map(x => `${DEF[x.id]?.name || x.id} ${x.T}→${f1(x.N.v)} (Hard-20 ${f1(x.H.v)})`).join('; ')}.`);
  L.push('');
  const cards = [...new Set(runs.flatMap(r => r.cards.map(c => c.id)))];
  L.push('## Cards', '', `| card | printed now | ${head.join(' | ')} |`, `|---|---|${head.map(() => '---').join('|')}|`);
  for (const id of cards.sort((a, b) => (DEF[a]?.name || a).localeCompare(DEF[b]?.name || b))) {
    const cells = runs.map(r => { const c = r.cards.find(x => x.id === id); return c ? `${f1(c.N.fair)}${c.both ? '✱' : ''}${r.printed[id] !== runs[runs.length - 1].printed[id] ? ` (@${r.printed[id]})` : ''}` : '–'; });
    L.push(`| ${DEF[id]?.name || id} | ${runs[runs.length - 1].printed[id] ?? '–'} | ${cells.join(' | ')} |`);
  }
  const cellsAll = [...new Set(runs.flatMap(r => r.spaces.map(s => s.cell)))];
  if (cellsAll.length) {
    L.push('', '## Spaces (scaled u)', '', `| space | round | ${head.join(' | ')} |`, `|---|---|${head.map(() => '---').join('|')}|`);
    for (const cell of cellsAll.sort()) {
      const [id, r] = cell.split('@');
      L.push(`| ${SPACES[id]?.name || id} (${id.split('.')[0]}) | ${r} | ${runs.map(x => { const s = x.spaces.find(y => y.cell === cell); return s ? `${f1(s.N.su ?? s.N.u)}${s.both ? '✱' : ''}` : '–'; }).join(' | ')} |`);
    }
  }
  const arch = [...new Set(runs.flatMap(r => r.archetypes.map(a => `${a.arch}|${a.inst}`)))];
  if (arch.length) {
    L.push('', '## Archetypes (win %)', '', `| archetype | vs | ${head.join(' | ')} |`, `|---|---|${head.map(() => '---').join('|')}|`);
    for (const k of arch) {
      const [a, inst] = k.split('|');
      L.push(`| ${ARCHETYPES[a]?.name || a} | 3 ${inst === 'hard' ? `Hard-${HARD_BUDGET}` : 'Normal'} | ${runs.map(r => { const x = r.archetypes.find(y => y.arch === a && y.inst === inst); return x ? pct(x.win[0]) : '–'; }).join(' | ')} |`);
    }
  }
  return L.join('\n') + '\n';
}

// ======================= report =======================
function report(R, diff, prev) {
  const L = [];
  const H = `Hard-${HARD_BUDGET}`;
  const iN = R.instruments.normal, iH = R.instruments.hard;
  const T = R.anchors.trusted;
  const mark = T ? '' : ' — UNTRUSTED (anchor check failed)';
  L.push(`# Balance bench (${R.mode})`);
  L.push('');
  const tp = R.throughput;
  L.push(`${R.date.slice(0, 16).replace('T', ' ')} UTC · commit ${R.sha} · content ${R.content} · ${(R.secs / 60).toFixed(1)} min ${R.shards > 1 ? `over ${R.shards} shards` : `on ${R.workers} workers`} (${(R.coreSecs / 60).toFixed(0)} core-min) · ${R.tables}.`);
  if (tp) L.push(`Games played: ${tp.all.games.toFixed(0)} full-game equivalents (probe games fork mid-game and count as the part they play). Throughput: Normal ${f1(tp.normal.perCoreMin)} games per core-minute, ${H} ${f1(tp.hard.perCoreMin)} (all four seats that level).`);
  L.push(`Instruments: **Normal** (all four seats) and **${H}** (Hard = Normal plus rollouts, at budget ${HARD_BUDGET}, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.`);
  L.push('');
  L.push(`One run is one sample: flags near the line churn from run to run (two full runs on the same rules kept 5 of 14 card flags, while estimates moved only as far as their intervals predict). **Act on the pooled list in ${R.mode === 'quick' ? 'trend-quick.md' : 'trend.md'}**, which combines every run on the same rules content.`);
  L.push('');
  L.push('## What moved since last run');
  if (!prev) L.push('First run of this mode: nothing to compare.');
  else if (!diff.length) L.push(`Nothing moved beyond its interval since ${prev.date.slice(0, 16).replace('T', ' ')} (${prev.sha}).`);
  else { L.push(`Against ${prev.date.slice(0, 16).replace('T', ' ')} (${prev.sha}):`); diff.forEach(d => L.push(`- ${d}`)); }
  L.push('');
  // 1. anchors
  L.push('## 1. Anchors');
  L.push(T ? 'Every anchor\'s interval reaches its expected range, Hard-20 beats Normal, and both price slopes are clearly positive: the instruments are trusted. (An anchor is off when its 90% interval misses the range, or it has too few probes to say.)' : '**The instrument is off: every section below is untrusted until the anchors pass.**');
  L.push('');
  const byR = i => (i.slopeByRound ? ` (by fork round I/II/III: ${i.slopeByRound.map(x => `${f2(x.v)} [${f2(x.lo)}–${f2(x.hi)}]`).join(', ')})` : '');
  L.push(`- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal ${f2(iN.slope)} [${f2(iN.slopeLo)}–${f2(iN.slopeHi)}]${byR(iN)}; ${H} ${f2(iH.slope)} [${f2(iH.slopeLo)}–${f2(iH.slopeHi)}]${byR(iH)}. ${iN.slopeLo > 0 ? '' : 'Normal slope not clearly positive. '}`);
  if (iH.calib.n) L.push(`- ${H} alone vs 3 Normal (Classic, n=${iH.calib.n}): wins ${wl(iH.calib.win)}; parity is 25%, and its interval must clear it. ${iH.calib.win[1] > 0.25 ? 'OK.' : 'FAIL: the second instrument is not clearly stronger than the first.'}`);
  L.push('');
  L.push('| instrument | anchor | printed | fair [90%] | n | expected | |');
  L.push('|---|---|---|---|---|---|---|');
  for (const a of R.anchors.rows) L.push(`| ${a.inst === 'hard' ? H : 'Normal'} | ${a.name} | ${a.printed} | ${f1(a.fair)} [${f1(a.lo)}–${f1(a.hi)}] | ${a.n} | ${f1(a.want[0])}–${f1(a.want[1])} | ${a.ok ? 'ok' : '**OFF**'} |`);
  L.push('');
  for (const a of ANCHORS) L.push(`- ${a.why}`);
  L.push('');
  // 2. cards
  if (R.cards.length) {
    const both = R.cards.filter(c => c.both).sort((a, b) => Math.abs(b.vN.gap) - Math.abs(a.vN.gap));
    const ability = R.cards.filter(c => c.ability);
    const nOnly = R.cards.filter(c => c.normalOnly);
    L.push(`## 2. Cards${mark}`);
    L.push(`Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: ${iN.cardProbes} probes over ${iN.seeds} seeds, every card. ${H}: ${iH.cardProbes} probes over ${iH.seeds} seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.`);
    L.push('');
    L.push(`### Both instruments agree (${both.length})`);
    if (!both.length) L.push('None.');
    else {
      L.push('| card | printed | Normal fair [90%] n | Hard-20 fair [90%] n | reads | bought round |');
      L.push('|---|---|---|---|---|---|');
      for (const c of both) L.push(`| ${c.name} (${c.id.split('.')[0]}) | ${c.printed} | ${f1(c.N.fair)} [${f1(c.N.lo)}–${f1(c.N.hi)}] ${c.N.n} | ${f1(c.H.fair)} [${f1(c.H.lo)}–${f1(c.H.hi)}] ${c.H.n} | ${c.vN.state === 'cheap' ? 'too cheap' : 'too dear'}${c.ability ? `, needs an ability change (${c.vN.ability})` : ''} | ${f1(c.N.meanRound)} |`);
    }
    L.push('');
    L.push(`### Needs an ability change, not a price (${ability.length})`);
    L.push(ability.length ? ability.map(c => `${c.name} (printed ${c.printed}; Normal ${f1(c.N.fair)}, ${H} ${f1(c.H.fair)}: ${c.vN.ability})`).join('; ') + '.' : 'None that both instruments agree on.');
    L.push('');
    L.push(`### Normal flags, ${H} confidently doesn't (likely a Normal-bot artifact) (${nOnly.length})`);
    L.push(nOnly.length ? nOnly.map(c => `${c.name} ${c.printed} (Normal ${f1(c.N.fair)} [${f1(c.N.lo)}–${f1(c.N.hi)}], ${H} ${f1(c.H.fair)} [${f1(c.H.lo)}–${f1(c.H.hi)}])`).join('; ') + '.' : 'None.');
    const unconf = R.cards.filter(c => (c.vN.state === 'cheap' || c.vN.state === 'dear') && !c.both && !c.normalOnly);
    if (unconf.length) { L.push(''); L.push(`Normal flags, ${H} too thin or unsure to say: ${unconf.map(c => `${c.name} ${c.printed}→${f1(c.N.fair)}${c.H ? ` (Hard-20 ${f1(c.H.fair)}, n ${c.H.n})` : ''}`).join('; ')}.`); }
    L.push('');
    L.push('<details><summary>Every card (Normal; Hard-20 where measured)</summary>');
    L.push('');
    L.push('| card | printed | Normal fair [90%] | n | detectable | net at printed by round I/II/III | Hard-20 fair [90%] | n |');
    L.push('|---|---|---|---|---|---|---|---|');
    for (const c of [...R.cards].sort((a, b) => (b.N.fair - b.printed) - (a.N.fair - a.printed))) L.push(`| ${c.name} (${c.id}) | ${c.printed} | ${f1(c.N.fair)} [${f1(c.N.lo)}–${f1(c.N.hi)}] | ${c.N.n} | ±${f1(c.N.mde)} | ${[1, 2, 3].map(r => f1(c.N.atPrintedByRound[r])).join(' / ')} | ${c.H ? `${f1(c.H.fair)} [${f1(c.H.lo)}–${f1(c.H.hi)}]` : '–'} | ${c.H?.n || ''} |`);
    L.push('');
    L.push('</details>');
    L.push('');
  }
  if (R.cards.length) {
    const un = R.cards.filter(c => !c.both && c.vN.state === 'in').map(c => c.N.mde).filter(Number.isFinite);
    if (un.length) L.push(`Power: for the ${un.length} cards Normal reads in band, the smallest gap this run could have caught (80% power, 90% interval) is ${f1(qtl(un, 0.5))} cost points at the median card, ${f1(qtl(un, 0.9))} at the 90th percentile (column "detectable" in the full table). More seeds narrow it as 1/√n.`);
    L.push('');
  }
  if (R.interactions?.cards?.length || R.interactions?.spaces?.length || R.interactions?.pairs?.cards) {
    L.push(`## 2b. Card × sphere and space × sphere outliers${mark}`);
    L.push(`Normal's residuals on the tables where the seat held the item, grouped by each other sphere at the table: a card fine overall but off beside one sphere. Listed at |deviation| ≥ 3 cost points (spaces: 3 scaled u) and |z| ≥ 3.5 among ${R.interactions.pairs.cards} card × sphere and ${R.interactions.pairs.spaces} space × sphere pairs with n ≥ 15 (about one false alarm expected). ${H} beside it where its targets covered the pair.`);
    L.push('');
    const ir = (x, unit, val, se) => `| ${x.name} | ${quadrant(x.sphere).name} (${x.sphere}) | ${x[val] >= 0 ? '+' : ''}${f1(x[val])} ±${f1(Z90 * x[se])} ${unit} | ${x.n} | ${x.hard ? `${x.hard[val] >= 0 ? '+' : ''}${f1(x.hard[val])} ±${f1(Z90 * x.hard[se])} (n ${x.hard.n})` : '–'} |`;
    if (R.interactions.cards.length) { L.push('| card | beside | deviation [90%] | n | Hard-20 |', '|---|---|---|---|---|'); R.interactions.cards.forEach(x => L.push(ir(x, 'pts', 'pts', 'ptsSe'))); L.push(''); } else L.push('Cards: none.', '');
    if (R.interactions.spaces.length) { L.push('| space | beside | deviation [90%] | n | Hard-20 |', '|---|---|---|---|---|'); R.interactions.spaces.forEach(x => L.push(ir(x, 'u', 'su', 'suSe'))); L.push(''); } else L.push('Spaces: none.', '');
  }
  // 3. spaces
  if (R.spaces.length) {
    const both = R.spaces.filter(s => s.both);
    const nOnly = R.spaces.filter(s => s.normalOnly);
    L.push(`## 3. Spaces${mark}`);
    L.push(`Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal ${iN.slopes.map(f2).join(' / ')}, ${H} ${iH.slopes.map(f2).join(' / ')} followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×${(R.spaceScale || []).map(f2).join(' / ')} for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.`);
    const nl = R.nulls.normal || [];
    if (nl.length) L.push(`Normal's own pick is worth ${nl.map(x => `${f1(-x.v)} followers in round ${x.round}`).join(', ')} over a null minion (${nl.map(x => `${f1(-x.v / iN.slopes[x.round - 1])}u`).join(' / ')}).`);
    L.push('');
    L.push(`### Both instruments agree (${both.length})`);
    if (!both.length) L.push('None.');
    else {
      L.push('| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |');
      L.push('|---|---|---|---|---|---|---|');
      for (const s of both) L.push(`| ${s.name} (${s.id.split('.')[0]}) | ${s.ring} | ${s.round} | ${f1(s.N.su)} [${f1(s.N.suLo)}–${f1(s.N.suHi)}] ${s.N.n} | ${f1(s.H.su)} [${f1(s.H.suLo)}–${f1(s.H.suHi)}] ${s.H.n} | ${BANDS[s.round][0]}–${BANDS[s.round][1]} | ${s.vN.state} |`);
    }
    L.push('');
    L.push(`### Normal flags, ${H} confidently doesn't (likely a Normal-bot artifact) (${nOnly.length})`);
    L.push(nOnly.length ? nOnly.map(s => `${s.name} r${s.round} (Normal ${f1(s.N.su)} [${f1(s.N.suLo)}–${f1(s.N.suHi)}], ${H} ${f1(s.H.su)} [${f1(s.H.suLo)}–${f1(s.H.suHi)}] scaled u)`).join('; ') + '.' : 'None.');
    const unconfS = R.spaces.filter(s => s.vN.state !== 'in' && s.vN.state !== 'thin' && !s.both && !s.normalOnly);
    if (unconfS.length) { L.push(''); L.push(`Normal flags, ${H} too thin or unsure to say: ${unconfS.map(s => `${s.name} r${s.round} ${s.vN.state} (${f1(s.N.su)}u${s.H ? `; Hard-20 ${f1(s.H.su)}u, n ${s.H.n}` : ''})`).join('; ')}.`); }
    L.push('');
    const unS = R.spaces.filter(x => !x.both && x.vN.state === 'in').map(x => x.N.mde).filter(Number.isFinite);
    if (unS.length) { L.push(`Power: for the ${unS.length} space-rounds Normal reads in band, the smallest miss this run could have caught is ${f1(qtl(unS, 0.5))} scaled u at the median, ${f1(qtl(unS, 0.9))} at the 90th percentile (column "detectable").`); L.push(''); }
    L.push('<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>');
    L.push('');
    L.push('| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | detectable | vs choice | blocked | n | Hard-20 scaled u [90%] |');
    L.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const s of [...R.spaces].sort((a, b) => a.round - b.round || b.N.u - a.N.u)) L.push(`| ${s.name} | ${s.id.split('.')[0]} | ${s.ring} | ${s.round} | ${f1(s.N.worth)} [${f1(s.N.lo)}–${f1(s.N.hi)}] | ${f1(s.N.u)} | ${f1(s.N.su)} [${f1(s.N.suLo)}–${f1(s.N.suHi)}] | ±${f1(s.N.mde)} | ${f1(s.N.vsChoice)} | ${pct(s.N.blocked)} | ${s.N.n} | ${s.H ? `${f1(s.H.su)} [${f1(s.H.suLo)}–${f1(s.H.suHi)}]` : '–'} |`);
    L.push('');
    L.push('</details>');
    L.push('');
  }
  // 4. archetypes
  if (R.archetypes.length) {
    L.push('## 4. Archetypes');
    L.push('One scripted seat (rotating) against 3 bots, Classic table. Target band 15–35% (parity 25%). Scripts are built on Normal\'s valuation: the buyer never recruits; a specialist adds +3 to its sphere\'s spaces and +2 to its members; the chaser adds twice the round-end contest standing a move leaves it; the hoarder recruits whenever any member is affordable.');
    L.push('');
    L.push('| archetype | vs | n | win [90%] | followers (rivals) | members (rivals) | |');
    L.push('|---|---|---|---|---|---|---|');
    for (const a of R.archetypes) L.push(`| ${a.name} | 3 ${a.inst === 'hard' ? H : 'Normal'} | ${a.n} | ${wl(a.win)} | ${f1(a.f)} (${f1(a.fRival)}) | ${f1(a.members)} (${f1(a.membersRival)}) | ${a.win[2] < 0.15 ? 'below band' : a.win[1] > 0.35 ? 'above band' : a.win[0] < 0.15 || a.win[0] > 0.35 ? 'edge' : ''} |`);
    L.push('');
  }
  // 5. fairness
  const fz = (F, who) => {
    if (!F || !F.games) return;
    L.push(`- ${who}, ${F.games} games. By seat: ${F.seat.map((w, k) => `P${k + 1} ${wl(w)}`).join(', ')}. By round-I pick order: ${F.r1.map((w, k) => `${k + 1}st ${wl(w)}`.replace('2st', '2nd').replace('3st', '3rd').replace('4st', '4th')).join(', ')}. Round-III first pick (fewest followers) wins ${wl(F.r3[0])}; last of the first pass ${wl(F.r3[F.r3.length - 1])}.`);
  };
  if (R.fairness.normal?.games || R.fairness.hard?.games) {
    L.push('## 5. Fairness');
    L.push('Base games (no probes), random tables. Parity is 25%.');
    fz(R.fairness.normal, 'Normal tables');
    fz(R.fairness.hard, `${H} tables`);
    L.push('');
  }
  // 6. health
  if (R.health.normal || R.health.hard) {
    L.push('## 6. Health');
    L.push(healthTable([['Normal', R.health.normal], [H, R.health.hard]]));
  }
  if (R.crashes.length) {
    L.push('## Engine crashes (games skipped)');
    const byErr = new Map();
    for (const c of R.crashes) { const k = c.error.split(' | ')[0]; byErr.set(k, [...(byErr.get(k) || []), c]); }
    for (const [k, cs] of byErr) L.push(`- ${cs.length}× ${k} (e.g. ${cs[0].type} ${cs[0].inst || ''} g=${cs[0].g}, table ${(cs[0].table || []).join(',')}): ${cs[0].error.split(' | ').slice(1, 3).join(' | ')}`);
    L.push('');
  }
  return L.join('\n') + '\n';
}

function healthTable(cols) {
  cols = cols.filter(([, h]) => h);
  const L = [];
  L.push(`| | ${cols.map(([n, h]) => `${n} (${h.games} games)`).join(' | ')} |`);
  L.push(`|---|${cols.map(() => '---').join('|')}|`);
  const row = (label, fn) => L.push(`| ${label} | ${cols.map(([, h]) => fn(h)).join(' | ')} |`);
  row('members per player (target 6–7)', h => `${f1(h.members)} ±${f1(h.membersSd)} sd (${pct(h.membersIn67)} land on 6–7; ${f1(h.cards)} cards)`);
  row('final followers', h => f1(h.followers));
  row('… self', h => `${f1(h.src.self)} (${pct(h.srcShare.self)})`);
  row("… members' worth", h => `${f1(h.src.members)} (${pct(h.srcShare.members)})`);
  row('… buys 2→1 / 4→3 / 8→6 / 10→10', h => `${f1(h.src.small)} / ${f1(h.src.mid)} / ${f1(h.src.big)} / ${f1(h.src.top)} (${pct((h.src.small + h.src.mid + h.src.big + h.src.top + h.src.other) / h.followers)})`);
  row('… contests round I / II / III', h => `${f1(h.src.c1)} / ${f1(h.src.c2)} / ${f1(h.src.c3)} (${pct((h.src.c1 + h.src.c2 + h.src.c3) / h.followers)})`);
  row('… effects (member triggers, actions, game end)', h => `${f1(h.src.effects)} (${pct(h.srcShare.effects)})`);
  row('resources left at the end', h => `${f1(h.left)} mean, ${f1(h.leftP90)} p90, ${h.leftMax} max (${pct(h.left30)} hold 30+)`);
  row('contests that paid 2+ / 3+ tied leaders', h => `${pct(h.ties.two)} / ${pct(h.ties.three)} of ${h.ties.paid}`);
  row('steal events per game (units taken)', h => `${f1(h.steals)} (${f1(h.stealUnits)})`);
  row('longest run of placements by one player (the snake alone makes 2)', h => `${f1(h.run)} mean, ${h.runMax} max (${pct(h.run3)} of games have 3+)`);
  row('decision richness: top two within 1 follower', h => (h.rich ? `${pct(h.rich.within1)} of ${h.rich.n} weighed decisions (median gap ${f2(h.rich.median)})` : 'n/a (needs Hard rollouts)'));
  return L.join('\n') + '\n';
}

// ======================= records mode =======================
async function recordsMode(dir, workers, sha) {
  const files = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f));
  if (!files.length) { console.error(`No .json records in ${dir}`); process.exit(2); }
  const res = await runPool(files.map(file => ({ type: 'record', file })), workers, 'records');
  const ok = res.filter(x => x.ok && x.r.metrics).map(x => x.r);
  const bad = res.filter(x => !x.ok).map(x => `${path.basename(x.job.file)}: ${x.error.split(' | ')[0]}`);
  const unfinished = res.filter(x => x.ok && x.r.unfinished).map(x => `${path.basename(x.r.file)} (round ${x.r.round})`);
  const human = healthOf(ok.map(r => r.metrics));
  let bots = null;
  try { bots = JSON.parse(readFileSync(path.join(OUT, 'latest.json'), 'utf8')); } catch { /* no bench yet */ }
  const L = [];
  L.push(`# People's games vs the bench`);
  L.push('');
  L.push(`${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · commit ${sha} · ${ok.length} finished records from ${dir}${ok.some(r => !r.sameContent) ? ` (${ok.filter(r => !r.sameContent).length} played on other rules content: read with care)` : ''}. Seats: ${ok.map(r => r.seats.map(k => (k === 'bot' ? 'b' : 'h')).join('')).join(', ')}.`);
  if (unfinished.length) L.push(`Unfinished, skipped: ${unfinished.join(', ')}.`);
  if (bad.length) L.push(`Did not replay: ${bad.join('; ')}.`);
  L.push('');
  if (human) L.push(healthTable([['People', human], ...(bots ? [[`Normal (bench ${bots.sha})`, bots.health?.normal], [`Hard-20 (bench ${bots.sha})`, bots.health?.hard]] : [])]));
  const F = fairnessOf(ok.map(r => r.metrics));
  if (F.games) L.push(`Fairness in these games: by seat ${F.seat.map((w, k) => `P${k + 1} ${wl(w)}`).join(', ')}; round-III first pick wins ${wl(F.r3[0])}.`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, 'records.md'), L.join('\n') + '\n');
  writeFileSync(path.join(OUT, 'records.json'), JSON.stringify({ sha, dir, health: human, fairness: F, records: ok.map(r => ({ file: path.basename(r.file), table: r.table, seats: r.seats })) }, null, 1));
  console.log(L.join('\n'));
}

if (isMainThread && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e); process.exit(1); });
