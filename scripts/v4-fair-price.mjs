// Fair price of a member card. Two modes, one funnel (design/eval/fair-price.md):
//
//  screen  Cheap, every card at once. Every game jitters EVERY member's price independently (×U[1−j, 1+j], colored/any
//          split kept proportional, rounded) on a random 4-sphere table (makeTables), 4 normal bots. Logs every
//          offered-and-affordable buy option (price, bought or not) and every member each player ends with (round got,
//          price paid). Fits per card a demand curve (logistic: buy ~ price) and a value (one regression of a player's
//          final follower margin vs the table mean on the cards they own, with a shared price-paid slope and round-got
//          offsets). Indifference price = value ÷ price slope. Prints a ranked outlier list.
//  sweep   Paired and priced, for a few cards. Same seed, forked at the start of round II (or I): (B) the game as is;
//          (A) the same game with one private copy of the card offered to the test seat at price P at every buy step
//          (rivals never see it). Arms: forced (the test seat buys it the first time it can afford it; all normal play)
//          and free (the test seat decides by playing the game to the end both ways, k rollouts each). P runs over
//          printed + deltas. Per P: buy rate, A−B follower margin (paired, 95% CI), win rate A−B, members/player.
//          Fair price = where the forced A−B margin crosses 0 (interpolated, bootstrap CI over seeds).
//
// Usage:
//   node scripts/v4-fair-price.mjs screen [--games=3000] [--jitter=0.4] [--workers=2] [--out=file.json]
//   node scripts/v4-fair-price.mjs sweep banker,volunteer,bigfamily [--games=200] [--free=60] [--rollouts=2]
//        [--deltas=-6,-4,-2,0,2,4] [--round=2] [--workers=2] [--out=file.json]
//   Card names: key or name (case-insensitive), or the groups "anchors" and "benders".
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { writeFileSync, readFileSync } from 'node:fs';
import { createGame, applyMove, followers, memberCount, paymentChoices } from '../src/engine/v4/core.js';
import { chooseNormalMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { allQuadrantIds, quadrant, guestMembers, registerQuadrant, DEFAULT_QUADRANTS } from '../src/engine/v4/content/index.js';

const SEATS = 4;
const ROLLOUT = { noise: 0.6, payWays: 2, payOptions: 2 };
const ALL_Q = allQuadrantIds();
const allDefs = () => [...ALL_Q.flatMap(q => quadrant(q).members), ...guestMembers()];
const priceOf = d => d.s + d.w;
const split = (d, P) => { const T = priceOf(d); const s = T > 0 ? Math.round((P * d.s) / T) : 0; return { s, w: P - s }; };
const bots = () => Array.from({ length: SEATS }, () => ({ kind: 'bot' }));
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };

function findDefs(names) {
  const out = [];
  for (const n of names) {
    if (n === 'anchors') { out.push(...findDefs(['banker', 'volunteer', 'bigfamily'])); continue; }
    if (n === 'benders') { out.push(...guestMembers().filter(d => d.guest === 'benders')); continue; }
    const k = n.toLowerCase().replace(/[^a-z]/g, '');
    const d = allDefs().find(x => x.id === n || x.key === k || x.name.toLowerCase().replace(/[^a-z]/g, '') === k);
    if (!d) throw new Error(`No member called ${n}`);
    if (!out.includes(d)) out.push(d);
  }
  return out;
}

// ======================= screen =======================
function screenGame(g, { jitter, tables }) {
  const defs = allDefs();
  const orig = defs.map(d => [d.s, d.w]);
  const jr = seededRandom(g * 104729 + 3);
  for (const d of defs) {
    const T = priceOf(d);
    if (!T) continue;
    const P = Math.max(0, Math.round(T * (1 - jitter + 2 * jitter * jr())));
    Object.assign(d, split(d, P));
  }
  try {
    const quadrants = tables[g % tables.length];
    const rand = seededRandom(g * 7919 + 17);
    let s = createGame({ seats: bots(), seed: 50000 + g, quadrants });
    const events = []; // [defId, price, round, bought]
    const got = s.players.map(() => new Map()); // uid -> [defId, round, paid]
    let buying = null; // uid being bought this turn
    while (!s.over) {
      const pend = s.pending;
      const mv = chooseNormalMove(s, rand);
      if (pend.kind === 'buy') {
        for (const o of pend.options) if (o.kind === 'card') {
          const d = s.cards[o.uid] && defs.find(x => x.id === s.cards[o.uid].def);
          events.push([d.id, priceOf(d), s.round, o.id === mv.option ? 1 : 0]);
        }
        buying = mv.option.startsWith('card:') ? Number(mv.option.slice(5)) : null;
      }
      const before = s.players.map(p => new Set(p.members));
      const round = s.round;
      s = applyMove(s, mv);
      s.players.forEach((p, i) => {
        for (const u of p.members) if (!before[i].has(u) && !got[i].has(u)) {
          const d = defs.find(x => x.id === s.cards[u].def);
          got[i].set(u, [d.id, round, u === buying && i === pend.player ? priceOf(d) : 0]);
        }
      });
    }
    const fs = s.players.map(p => followers(s, p)), avg = mean(fs);
    const players = s.players.map((p, i) => ({
      y: fs[i] - avg,
      own: p.members.map(u => got[i].get(u) || [s.cards[u].def, 1, 0]),
      members: memberCount(s, p),
    }));
    return { g, table: quadrants, events, players };
  } finally {
    defs.forEach((d, i) => { d.s = orig[i][0]; d.w = orig[i][1]; });
  }
}

function solve(A, b) { // Gaussian elimination with partial pivoting
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const v = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / v; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / (r[i] || 1e-12));
}

function logistic(xs, ys) { // y ~ sigmoid(a + b x), Newton with a tiny ridge
  let a = 0, b = 0;
  for (let it = 0; it < 30; it++) {
    let g0 = 0, g1 = 0, h00 = 1e-3, h01 = 0, h11 = 1e-3;
    for (let i = 0; i < xs.length; i++) {
      const p = 1 / (1 + Math.exp(-(a + b * xs[i]))), w = p * (1 - p);
      g0 += ys[i] - p; g1 += (ys[i] - p) * xs[i]; h00 += w; h01 += w * xs[i]; h11 += w * xs[i] * xs[i];
    }
    const det = h00 * h11 - h01 * h01;
    a += (h11 * g0 - h01 * g1) / det; b += (h00 * g1 - h01 * g0) / det;
  }
  return { a, b };
}

function analyseScreen(games, { boot = 100, printed = {} } = {}) {
  const defs = allDefs(), ids = defs.map(d => d.id), col = Object.fromEntries(ids.map((id, i) => [id, i]));
  // y = margin vs the table mean. Columns: one per card (its net worth at its printed price), const,
  // surcharge (price paid − printed, summed over owned cards; the jitter makes it exogenous), got in round I / III.
  const C = ids.length, K = C + 4;
  const printedOf = Object.fromEntries(defs.map(d => [d.id, printed[d.id] ?? priceOf(d)]));
  const rows = [];
  games.forEach((G, gi) => G.players.forEach(p => {
    const x = new Map();
    const add = (j, v) => x.set(j, (x.get(j) || 0) + v);
    add(C, 1);
    for (const [id, r, paid] of p.own) { if (col[id] === undefined) continue; add(col[id], 1); add(C + 1, paid - printedOf[id]); if (r === 1) add(C + 2, 1); if (r === 3) add(C + 3, 1); }
    rows.push({ gi, y: p.y, x: [...x] });
  }));
  const fit = w => {
    const A = Array.from({ length: K }, () => new Float64Array(K)), b = new Float64Array(K);
    for (const r of rows) {
      const wt = w ? w[r.gi] : 1; if (!wt) continue;
      for (const [i, vi] of r.x) { b[i] += wt * vi * r.y; for (const [j, vj] of r.x) A[i][j] += wt * vi * vj; }
    }
    for (let j = 0; j < C; j++) A[j][j] += 2; // ridge: rare cards shrink to 0
    return solve(A.map(r => [...r]), [...b]);
  };
  const beta = fit(null);
  const rng = seededRandom(99);
  const pois = () => { let k = 0, p = 1; const L = Math.exp(-1); do { k++; p *= rng(); } while (p > L); return k - 1; };
  const bootV = ids.map(() => []), bootSlope = [];
  for (let k = 0; k < boot; k++) {
    const w = games.map(pois), bb = fit(w);
    bootSlope.push(-bb[C + 1]);
    ids.forEach((_, j) => bootV[j].push(bb[j]));
  }
  const slopeFit = -beta[C + 1];
  const owners = new Array(C).fill(0);
  rows.forEach(r => r.x.forEach(([j]) => { if (j < C) owners[j]++; }));
  const ev = Object.fromEntries(ids.map(id => [id, []]));
  games.forEach(G => G.events.forEach(e => ev[e[0]]?.push(e)));
  const offeredIn = Object.fromEntries(ids.map(id => [id, 0]));
  games.forEach(G => { for (const q of G.table) for (const d of quadrant(q).members) offeredIn[d.id]++; for (const d of guestMembers()) offeredIn[d.id]++; });
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  const slopeCI = [q(bootSlope, 0.05), q(bootSlope, 0.95)];
  // followers per resource: the fitted surcharge slope when it's clearly positive, else the 4→3 follower buy (0.75)
  const slope = slopeCI[0] > 0.1 ? slopeFit : 0.75;
  // the well-sampled median card is taken as fairly priced (a common bias, e.g. luckier players owning more, cancels)
  const well = ids.map((_, j) => beta[j]).filter((_, j) => owners[j] >= 40);
  const vMed = q(well.length ? well : ids.map((_, j) => beta[j]).filter((_, j) => owners[j] > 0), 0.5) ?? 0;
  const cards = defs.map((d, j) => {
    const E = ev[d.id], T = printedOf[d.id];
    const xs = E.map(e => (T ? e[1] / T - 1 : e[1])), ys = E.map(e => e[3]);
    const lg = E.length >= 20 && new Set(xs).size > 1 ? logistic(xs, ys) : null;
    const fairs = bootV[j].map(v => T + (v - vMed) / slope);
    return {
      id: d.id, name: d.name, printed: T, games: offeredIn[d.id], offers: E.length, buys: ys.reduce((a, b) => a + b, 0),
      buyRate: E.length ? mean(ys) : NaN, owners: owners[j],
      demandSlope: lg ? lg.b : NaN, // log-odds per +100% of printed price; ≥ 0 means the bots don't see the price
      demandP50: lg && lg.b < 0 ? T * (1 - lg.a / lg.b) : NaN,
      value: beta[j], vSE: sd(bootV[j]), fair: T + (beta[j] - vMed) / slope, lo: q(fairs, 0.05), hi: q(fairs, 0.95), se: sd(fairs),
      low: owners[j] < 40,
    };
  });
  for (const c of cards) c.gap = c.fair - c.printed;
  return { slope, slopeFit, slopeCI, vMed, r1: beta[C + 2], r3: beta[C + 3], cards };
}

// ======================= sweep =======================
let CLONE = null;
function cloneFor(def) {
  if (!CLONE || CLONE.src !== def.id) {
    const c = { ...def, key: `fp_${def.key}`, copies: 1 };
    registerQuadrant({ id: `fp${def.key}`, name: 'fair-price probe', resource: null, actions: [], members: [c] });
    c.quadrant = def.quadrant; // pays and counts as its own color
    c.src = def.id;
    CLONE = c;
  }
  return CLONE;
}
const margin = (s, me) => followers(s, s.players[me]) - Math.max(...s.players.filter(p => p.id !== me).map(p => followers(s, p)));

function forkAt(seed, quadrants, round) {
  const rand = seededRandom(seed * 7919 + 13);
  let s = createGame({ seats: bots(), seed, quadrants });
  while (!s.over && !(s.round === round && s.pending?.kind === 'place')) s = applyMove(s, chooseNormalMove(s, rand));
  return s;
}

// Offer the private card in a buy step: put it in the shop for the move (recruit looks there) and in the options.
function withOffer(s, uid) {
  return { ...s, shop: [uid, ...s.shop], pending: { ...s.pending, options: [...s.pending.options, { id: `card:${uid}`, label: 'probe', kind: 'card', uid }] } };
}
function buyProbe(s, uid, rand, opts) {
  const seat = s.pending.player;
  s = applyMove(withOffer(s, uid), { player: seat, option: `card:${uid}` });
  // the pay step (the probe stays in the shop until it's recruited)
  if (s.pending?.kind === 'pay' && s.pending.uid === uid) s = applyMove(s, chooseNormalMove(s, rand, opts));
  if (s.shop.includes(uid) && !s.players[seat].members.includes(uid)) s = { ...s, shop: s.shop.filter(u => u !== uid) };
  return s;
}
function rollout(s, rand, me) {
  let n = 0;
  while (!s.over && n++ < 2000) s = applyMove(s, chooseNormalMove(s, rand, ROLLOUT));
  return margin(s, me);
}

/** Play a forked game to the end. arm: 'none' | 'forced' | 'free'. */
function playOut(fork, seed, seat, arm, uid, rollouts, think = 3) {
  const rands = Array.from({ length: SEATS }, (_, i) => seededRandom(seed * 31 + i * 1009 + 7));
  let s = fork, bought = false, affordable = false, decisions = 0, boughtRound = 0;
  while (!s.over) {
    const pend = s.pending, pl = pend.player;
    if (arm !== 'none' && !bought && pl === seat && pend.kind === 'buy' && paymentChoices(s, s.players[seat], uid).length) {
      affordable = true;
      const base = chooseNormalMove(s, rands[pl]);
      let take = arm === 'forced';
      if (arm === 'free' && decisions < think) {
        decisions++;
        let vc = 0, vb = 0;
        for (let k = 0; k < rollouts; k++) {
          const rs = seed * 7777 + decisions * 131 + k;
          vc += rollout(buyProbe(s, uid, seededRandom(rs + 1), ROLLOUT), seededRandom(rs), seat);
          vb += rollout(applyMove(s, base), seededRandom(rs), seat);
        }
        take = vc > vb;
      }
      if (take) { boughtRound = s.round; s = buyProbe(s, uid, rands[pl]); bought = s.players[seat].members.includes(uid) || bought; continue; }
      s = applyMove(s, base);
      continue;
    }
    s = applyMove(s, chooseNormalMove(s, rands[pl]));
  }
  return {
    mx: margin(s, seat), m: followers(s, s.players[seat]) - mean(s.players.filter(p => p.id !== seat).map(p => followers(s, p))), own: followers(s, s.players[seat]), win: s.ranking[0] === seat ? 1 : 0, bought: bought ? 1 : 0, affordable: affordable ? 1 : 0, boughtRound,
    mpp: mean(s.players.map(p => memberCount(s, p))),
  };
}

function tableFor(def) {
  if (DEFAULT_QUADRANTS.includes(def.quadrant) || def.guest) return DEFAULT_QUADRANTS;
  const r = quadrant(def.quadrant).resource;
  const keep = DEFAULT_QUADRANTS.filter(q => quadrant(q).resource !== r);
  return [...keep.slice(0, 3), def.quadrant];
}

function gridFor(def, deltas, printed) {
  const T = printed?.[def.id] ?? priceOf(def);
  const g = [...new Set(deltas.map(d => Math.max(0, T + d)))].sort((a, b) => a - b);
  while (g.length < deltas.length) g.push(g[g.length - 1] + 2);
  return g;
}

// the free-choice arm (expensive: it plays the game out both ways) runs at three prices: printed −4, printed, +4
const freePs = (d, deltas, printed) => { const g = gridFor(d, deltas, printed), T = printed?.[d.id] ?? priceOf(d); return [...new Set([T - 4, T, T + 4].map(x => g.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a))))]; };
function sweepSeed(g, { cards, round, freeN, rollouts, deltas, think, printed }) {
  const seed = 1000 + g, seat = g % SEATS;
  const out = { g, seat, base: {}, A: {} };
  const byTable = new Map();
  for (const id of cards) { const d = allDefs().find(x => x.id === id); const t = tableFor(d).join(','); if (!byTable.has(t)) byTable.set(t, []); byTable.get(t).push(d); }
  for (const [t, defs] of byTable) {
    const fork = forkAt(seed, t.split(','), round);
    out.base[t] = playOut(fork, seed, seat, 'none');
    for (const d of defs) {
      const c = cloneFor(d);
      for (const P of gridFor(d, deltas, printed)) {
        Object.assign(c, split(d, P));
        const f = { ...fork, cards: { ...fork.cards, 9999: { uid: 9999, def: c.id } } };
        out.A[`${d.id}|${P}|forced`] = playOut(f, seed, seat, 'forced', 9999, rollouts);
        if (g < freeN && freePs(d, deltas, printed).includes(P)) out.A[`${d.id}|${P}|free`] = playOut(f, seed, seat, 'free', 9999, rollouts, think);
      }
    }
  }
  return out;
}

function ci(a) { const m = mean(a); return [m, 1.96 * sd(a) / Math.sqrt(a.length)]; }
function crossing(ps, ms) { // first P where the mean A−B margin falls to ≤ 0, interpolated
  if (ms[0] <= 0) return { x: ps[0], cens: '≤' };
  for (let i = 1; i < ps.length; i++) if (ms[i] <= 0) return { x: ps[i - 1] + (ps[i] - ps[i - 1]) * ms[i - 1] / (ms[i - 1] - ms[i]) };
  return { x: ps[ps.length - 1], cens: '≥' };
}
// fair price: fit A−B margin = a + b·P over every paired game at every P, and solve a + b·P = 0
function linCross(ps, ds) {
  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  ps.forEach((P, i) => ds[i].forEach(y => { n++; sx += P; sy += y; sxx += P * P; sxy += P * y; }));
  const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
  return { a, b, x: b < 0 ? -a / b : Infinity };
}
function analyseSweep(results, { cards, deltas, printed }) {
  const rows = [];
  for (const id of cards) {
    const d = allDefs().find(x => x.id === id), t = tableFor(d).join(','), grid = gridFor(d, deltas, printed);
    const per = grid.map(P => {
      const arm = a => results.filter(r => r.A[`${id}|${P}|${a}`]).map(r => ({ a: r.A[`${id}|${P}|${a}`], b: r.base[t] }));
      const F = arm('forced'), R = arm('free');
      const fd = F.map(x => x.a.m - x.b.m);
      const aff = R.filter(x => x.a.affordable);
      return {
        P, n: F.length, forced: ci(fd), forcedBuy: mean(F.map(x => x.a.bought)), forcedWin: mean(F.map(x => x.a.win - x.b.win)),
        nFree: R.length, free: R.length ? ci(R.map(x => x.a.m - x.b.m)) : [NaN, NaN], freeWin: mean(R.map(x => x.a.win - x.b.win)),
        buyRate: aff.length ? mean(aff.map(x => x.a.bought)) : NaN, nAff: aff.length,
        mpp: mean(F.map(x => x.a.mpp)), mppB: mean(F.map(x => x.b.mpp)),
        boughtRound: mean(F.filter(x => x.a.bought).map(x => x.a.boughtRound)),
        fd,
      };
    });
    const ps = per.map(p => p.P);
    const est = linCross(ps, per.map(p => p.fd)), interp = crossing(ps, per.map(p => p.forced[0]));
    // bootstrap over seeds (the same resample for every P keeps the pairing)
    const n = per[0].fd.length, rng = seededRandom(7), xs = [];
    for (let k = 0; k < 400; k++) {
      const idx = Array.from({ length: n }, () => Math.floor(rng() * n));
      xs.push(linCross(ps, per.map(p => idx.map(i => p.fd[i]))).x);
    }
    xs.sort((a, b) => a - b);
    per.forEach(p => delete p.fd);
    rows.push({ id, name: d.name, printed: printed?.[id] ?? priceOf(d), table: t, fair: est.x, slope: est.b, at0: est.a, interp: interp.x, interpCens: interp.cens || '', cens: '', lo: xs[Math.floor(0.05 * xs.length)], hi: xs[Math.floor(0.95 * xs.length)], per });
  }
  return rows;
}

// ======================= driver =======================
function runPool(kind, n, params, workers, raw) {
  const save = results => raw && writeFileSync(raw, JSON.stringify({ kind, n, params: { ...params, tables: undefined }, results }));
  return new Promise((resolve, reject) => {
    const results = [];
    let next = 0, done = 0;
    const t0 = Date.now();
    const pool = Array.from({ length: Math.min(workers, n) }, () => new Worker(fileURLToPath(import.meta.url), { workerData: { kind, params } }));
    const feed = w => { if (next < n) w.postMessage(next++); else w.postMessage(-1); };
    pool.forEach(w => {
      w.on('message', r => {
        results.push(r); done++;
        if (done % Math.max(1, Math.floor(n / 20)) === 0) { process.stderr.write(`  ${done}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`); save(results); }
        if (done === n) { pool.forEach(x => x.postMessage(-1)); save(results); resolve(results.sort((a, b) => a.g - b.g)); } else feed(w);
      });
      w.on('error', reject);
      feed(w);
    });
  });
}

if (!isMainThread) {
  const { kind, params } = workerData;
  if (kind === 'screen') { const { makeTables } = await import('../src/test/engine/v4/fuzz-tables-runner.js'); params.tables = makeTables(4242, 2).tables; }
  parentPort.on('message', g => {
    if (g < 0) { process.exit(0); }
    parentPort.postMessage(kind === 'screen' ? screenGame(g, params) : sweepSeed(g, params));
  });
} else {
  const argv = process.argv.slice(2);
  const flags = Object.fromEntries(argv.filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
  const [mode, names] = argv.filter(a => !a.startsWith('--'));
  const workers = Number(flags.workers || 2);
  const t0 = Date.now();
  const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '–');
  if (mode === 'screen') {
    const games = Number(flags.games || 3000), jitter = Number(flags.jitter || 0.4);
    let res, printed = Object.fromEntries(allDefs().map(d => [d.id, priceOf(d)]));
    if (flags.from) { const R = JSON.parse(readFileSync(flags.from, 'utf8')); res = R.results; printed = R.params.printed || printed; }
    else res = await runPool('screen', games, { jitter, printed }, workers, flags.raw);
    const A = analyseScreen(res, { printed });
    const out = { mode, games, jitter, secs: (Date.now() - t0) / 1000, ...A };
    if (flags.out) writeFileSync(flags.out, JSON.stringify(out, null, 1));
    console.log(`screen: ${res.length} games, random 4-sphere tables, 4 normal bots, every price ×U[${1 - jitter},${1 + jitter}]. ${out.secs.toFixed(0)}s on ${workers} workers.`);
    console.log(`price slope: each resource over printed costs ${A.slopeFit.toFixed(2)} followers of margin (90% ${A.slopeCI.map(x => x.toFixed(2)).join('–')}); used ${A.slope.toFixed(2)}. Median card nets ${A.vMed.toFixed(2)} at printed. Got in round I ${A.r1.toFixed(2)}, round III ${A.r3.toFixed(2)} vs round II.`);
    // outliers: well-sampled cards first, by how far the fitted price sits from printed (in bootstrap SEs)
    const ranked = A.cards.filter(c => c.printed > 0 || c.owners > 0).sort((a, b) => (a.low ? 1 : 0) - (b.low ? 1 : 0) || Math.abs(b.gap) / (b.se || 1) - Math.abs(a.gap) / (a.se || 1));
    for (const q of ['gold', 'red']) console.log(`most bought ${q}:`, A.cards.filter(c => c.id.startsWith(q + '.')).sort((a, b) => b.buys - a.buys).slice(0, 5).map(c => `${c.name} ${c.buys}`).join(', '));
    console.log('card'.padEnd(22), 'print', ' fair', '  90% CI     ', 'owners', 'offers', 'buy%', 'demand', ' net@printed');
    for (const c of ranked) console.log(c.name.padEnd(22), String(c.printed).padStart(5), f1(c.fair).padStart(5), `${f1(c.lo)}–${f1(c.hi)}`.padEnd(13), String(c.owners).padStart(6), String(c.offers).padStart(6), (c.buyRate * 100).toFixed(0).padStart(4), f1(c.demandSlope).padStart(6), `${c.value.toFixed(2)}±${c.vSE.toFixed(2)}`.padStart(11), c.low ? 'LOW SAMPLE' : '');
  } else if (mode === 'sweep') {
    const cards = findDefs((names || 'anchors').split(',')).map(d => d.id);
    const params = {
      cards, round: Number(flags.round || 2), freeN: Number(flags.free ?? 40), rollouts: Number(flags.rollouts || 2), think: Number(flags.think || 3),
      deltas: (flags.deltas || '-6,-4,-2,0,2,4').split(',').map(Number),
    };
    // prices as printed when the run starts (content files change under parallel agents)
    params.printed = Object.fromEntries(cards.map(id => [id, priceOf(allDefs().find(x => x.id === id))]));
    const games = Number(flags.games || 200);
    let res;
    if (flags.from) { const R = JSON.parse(readFileSync(flags.from, 'utf8')); res = R.results; Object.assign(params, R.params); } else res = await runPool('sweep', games, params, workers, flags.raw);
    const rows = analyseSweep(res, params);
    const out = { mode, games, ...params, secs: (Date.now() - t0) / 1000, rows };
    if (flags.out) writeFileSync(flags.out, JSON.stringify(out, null, 1));
    console.log(`sweep: ${res.length} paired seeds (free-choice arm on the first ${params.freeN}, ${params.rollouts} rollouts a side), forked at round ${params.round}. ${out.secs.toFixed(0)}s on ${workers} workers.`);
    for (const r of rows) {
      console.log(`\n${r.name}: printed ${r.printed}, fair ~${f1(r.fair)} (90% ${f1(r.lo)}–${f1(r.hi)}; line ${r.at0.toFixed(2)} ${r.slope.toFixed(2)}·P; interpolated ${r.interpCens}${f1(r.interp)})  [${r.table}]`);
      console.log('   P  forced A−B margin   buy  win±   | free A−B   buy%(aff)  win±  | members/player A (B)  round bought');
      for (const p of r.per) console.log(String(p.P).padStart(4), `${p.forced[0].toFixed(2)} ±${p.forced[1].toFixed(2)}`.padStart(16), (p.forcedBuy * 100).toFixed(0).padStart(5), (p.forcedWin * 100).toFixed(0).padStart(5),
        '  |', p.nFree ? `${p.free[0].toFixed(2)} ±${p.free[1].toFixed(2)}`.padStart(13) : '            –', p.nAff ? `${(p.buyRate * 100).toFixed(0)}% (${p.nAff})`.padStart(10) : '         –', p.nFree ? (p.freeWin * 100).toFixed(0).padStart(5) : '    –',
        '  |', `${p.mpp.toFixed(2)} (${p.mppB.toFixed(2)})`.padStart(14), f1(p.boughtRound).padStart(8));
    }
  } else {
    console.log('mode: screen | sweep (see the header of this file)');
  }
}
