// Four thinking (Hard) bots per table, on random 4-sphere tables. The baseline instrument from now on: a lone
// thinker beats greedy bots ~78%, so all-thinker tables are what we quote.
// Usage: node scripts/v4-thinker-tables.mjs [games=40] [--workers=4] [--budget=100] [--buyer] [--first=1] [--table=a,b,c,d]
//   --buyer: seat (g % 4) plays the pure big-followers buyer (never recruits) against 3 Hard bots.
//   --budget: Hard's rollout budget in moves (the UI plays 100 with a wall-clock cap; 40 is ~2.5× cheaper).
// Reports seat and round-III pick-position win rates, each sphere's share of winners' followers, members, follower-buy
// share, leftover resources, placements beyond the base 12 a player (extra workers and extra turns), and the longest
// run of placements by one player with nobody else placing in between.
// Tables come from makeTables (fuzz-tables-runner.js): pair-covering random tables, game g plays table g % count.
// Hard runs without its wall-clock cap here, so every game is deterministic for its seed.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createGame, applyMove, followers, memberCount, quadrant, defById } from '../src/engine/v4/index.js';
import { chooseBotMove, chooseFollowerBuyerMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { makeTables, newLines } from '../src/test/engine/v4/fuzz-tables-runner.js';

const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

function playGame({ g, quadrants, budget, buyer }) {
  const rand = seededRandom(g * 7717 + 3);
  let s = createGame({ seats: [0, 1, 2, 3].map(() => ({ kind: 'bot' })), seed: g, quadrants });
  const buyerSeat = buyer ? g % 4 : -1;
  const labels = Object.fromEntries(quadrants.map(q => [quadrant(q).scoring.label, q]));
  // followers by source, per player: sphere id, 'buys', 'start'
  const src = s.players.map(() => ({ start: 1 }));
  const add = (i, k, v) => { if (v) src[i][k] = (src[i][k] || 0) + v; };
  let actionQ = null; // the sphere of the action whose follow-ups are resolving
  const t0 = process.cpuUsage();
  let moves = 0, hardMs = 0, hardMoves = 0, maxMs = 0;
  const places = [0, 0, 0, 0];
  let runP = -1, run = 0, longest = 0, longestBy = -1;
  let r3order = null;
  while (!s.over) {
    const p = s.pending.player, kind = s.pending.kind;
    if (s.round === 3 && !r3order) r3order = [...new Set(s.order)];
    if (kind === 'place') {
      places[p]++;
      run = p === runP ? run + 1 : 1; runP = p;
      if (run > longest) { longest = run; longestBy = p; }
    }
    const t = performance.now();
    const m = p === buyerSeat ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, { level: 'hard', budget, maxMs: Infinity });
    const dt = performance.now() - t;
    if (p !== buyerSeat && (kind === 'place' || kind === 'buy')) { hardMs += dt; hardMoves++; maxMs = Math.max(maxMs, dt); }
    if (kind === 'place') { const o = s.pending.options.find(x => x.id === m.option); actionQ = quadrants[o.q]; }
    if (kind === 'buy') actionQ = null;
    const before = s.players.map(x => ({ bonus: x.bonus, contest: x.contest, bought: x.bought || 0 }));
    const next = applyMove(s, m);
    next.players.forEach((x, i) => {
      add(i, 'buys', (x.bought || 0) - before[i].bought);
      // other bonus (actions, member abilities, steals) goes to the action's sphere, or 'other' between actions
      add(i, actionQ || 'other', (x.bonus - before[i].bonus) - (x.contest - before[i].contest) - ((x.bought || 0) - before[i].bought));
    });
    // ring contests: "Round II ends. Most gold: P1 & P3 +4 · ..."
    for (const line of newLines(s, next)) {
      const mt = /^Round \w+ ends\. (.*)$/.exec(line);
      if (!mt) continue;
      for (const part of mt[1].split(' · ')) {
        const k = part.lastIndexOf(': ');
        const q = labels[part.slice(0, k)];
        const w = /^(.*) \+(\d+)$/.exec(part.slice(k + 2));
        if (!q || !w) continue;
        for (const name of w[1].split(' & ')) {
          const i = next.players.findIndex(x => x.name === name);
          if (i >= 0) add(i, q, Number(w[2])); // the contest delta was already kept out of the action's bucket
        }
      }
    }
    s = next; moves++;
  }
  // members' printed followers go to their sphere; so do game-end pays ("Tycoon +3"), booked as bonus on the last move
  s.players.forEach((x, i) => {
    for (const u of x.members) { const c = s.cards[u]; add(i, defById(c.def).quadrant, Math.max(defById(c.def).f, c.copy ? defById(c.copy).f : 0)); }
    for (const part of x.final?.parts || []) {
      const w = /^(.*) ([+−])(\d+)$/.exec(part);
      const c = w && x.members.map(u => s.cards[u]).find(c => defById(c.def).name === w[1]);
      if (!c) continue;
      const v = (w[2] === '+' ? 1 : -1) * Number(w[3]);
      add(i, defById(c.def).quadrant, v); add(i, actionQ || 'other', -v);
    }
  });
  const top = Math.max(...s.players.map(x => followers(s, x)));
  const cpu = process.cpuUsage(t0);
  return {
    g, quadrants, buyerSeat, order: s.players.map(x => x.id),
    players: s.players.map((x, i) => ({
      id: i, f: followers(s, x), win: followers(s, x) === top ? 1 / s.players.filter(y => followers(s, y) === top).length : 0,
      members: memberCount(s, x), left: sum(x.res), bought: x.bought || 0, src: src[i],
    })),
    cpuS: (cpu.user + cpu.system) / 1e6, moves, hardMs, hardMoves, maxMs,
    places, longest, longestBy, r3order, endedEarly: !!s.endEarly && s.round < 3,
  };
}

if (!isMainThread) {
  for (const job of workerData.jobs) parentPort.postMessage(playGame(job));
} else {
  const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
  const games = Number(process.argv.slice(2).find(a => !a.startsWith('--')) || 40);
  const workers = Math.max(1, Number(args.workers || 4));
  const budget = Number(args.budget || 100);
  const first = Number(args.first || 1);
  const buyer = !!args.buyer;
  const tables = args.table ? [String(args.table).split(',')] : makeTables().tables;
  const jobs = Array.from({ length: games }, (_, k) => { const g = first + k; return { g, quadrants: tables[g % tables.length], budget, buyer }; });
  const results = [];
  const t0 = performance.now();
  await Promise.all(Array.from({ length: workers }, (_, w) => new Promise((res, rej) => {
    const mine = jobs.filter((_, k) => k % workers === w);
    if (!mine.length) return res();
    const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: mine } });
    wk.on('message', r => { results.push(r); process.stderr.write(`${results.length}/${games} (game ${r.g}: ${r.cpuS.toFixed(1)}s cpu)\n`); });
    wk.on('error', rej);
    wk.on('exit', res);
  })));
  results.sort((a, b) => a.g - b.g);
  const n = results.length;
  const ci = (w, k) => 1.96 * Math.sqrt(Math.max(w * (1 - w), 1e-9) / k);
  const pct = x => `${(100 * x).toFixed(1)}%`;
  console.log(`${n} games, 4 seats, ${buyer ? 'big-followers buyer vs 3 Hard' : '4 Hard'} (budget ${budget}), ${tables.length} table(s), ${workers} worker(s), ${((performance.now() - t0) / 1000).toFixed(0)}s wall`);
  const cpu = results.map(r => r.cpuS).sort((a, b) => a - b);
  const hm = results.reduce((a, r) => a + r.hardMs, 0) / Math.max(1, results.reduce((a, r) => a + r.hardMoves, 0));
  console.log(`time: cpu/game median ${cpu[Math.floor(n / 2)].toFixed(1)}s, max ${cpu[n - 1].toFixed(1)}s · Hard place/buy ${hm.toFixed(0)}ms avg, max ${Math.max(...results.map(r => r.maxMs)).toFixed(0)}ms`);
  // seat = turn position in round I (createGame seats play in seat order; later rounds re-sort)
  const seat = [0, 1, 2, 3].map(i => results.reduce((a, r) => a + r.players[i].win, 0) / n);
  console.log(`seat win rate (n=${n} each, ±95%): ${seat.map((w, i) => `seat ${i + 1} ${pct(w)} ±${(100 * ci(w, n)).toFixed(1)}`).join(' · ')}`);
  // round-III pick position (the order re-sorts each round; whoever is last in followers picks first)
  const withR3 = results.filter(r => r.r3order?.length === 4);
  const pos = [0, 1, 2, 3].map(k => withR3.reduce((a, r) => a + r.players[r.r3order[k]].win, 0) / Math.max(1, withR3.length));
  console.log(`round-III pick position win rate (n=${withR3.length}): ${pos.map((w, k) => `${k + 1}st ${pct(w)} ±${(100 * ci(w, withR3.length)).toFixed(1)}`).join(' · ').replace('2st', '2nd').replace('3st', '3rd').replace('4st', '4th')}`);
  const early = results.filter(r => r.endedEarly).length;
  console.log(`games ended after round II (clock sold out): ${early}/${n} (${pct(early / n)})`);
  const extra = results.map(r => r.places.reduce((a, b) => a + b, 0) - 12 * 4);
  const runs = results.map(r => r.longest);
  const hist = {};
  for (const x of runs) hist[x] = (hist[x] || 0) + 1;
  const ge4 = runs.filter(x => x >= 4).length;
  console.log(`placements beyond the base 12 a player, per game: mean ${(extra.reduce((a, b) => a + b, 0) / n).toFixed(1)} (max ${Math.max(...extra)}; games with any ${pct(extra.filter(x => x > 0).length / n)})`);
  console.log(`longest run of one player's placements in a row: ${Object.entries(hist).map(([k, v]) => `${k}: ${pct(v / n)}`).join(' · ')} · 4+ in ${pct(ge4 / n)} ±${(100 * ci(ge4 / n, n)).toFixed(1)}`);
  const all = results.flatMap(r => r.players.filter(p => p.id !== r.buyerSeat));
  const per = k => (all.reduce((a, p) => a + p[k], 0) / all.length).toFixed(1);
  const boughtShare = all.reduce((a, p) => a + p.bought, 0) / all.reduce((a, p) => a + p.f, 0);
  console.log(`Hard players: members ${per('members')} · followers ${per('f')} · follower-buy share ${pct(boughtShare)} · resources left ${per('left')} (max ${Math.max(...all.map(p => p.left))})`);
  // each sphere's share of winners' followers (ties count each winner by its share)
  const share = {};
  let tot = 0;
  for (const r of results) for (const p of r.players) if (p.win) for (const [k, v] of Object.entries(p.src)) { share[k] = (share[k] || 0) + v * p.win; tot += v * p.win; }
  const appear = {};
  for (const r of results) for (const q of r.quadrants) appear[q] = (appear[q] || 0) + 1;
  console.log(`winners' followers by source (sphere share; games it was on the table):`);
  console.log('  ' + Object.entries(share).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v / tot)}${appear[k] ? ` (${appear[k]})` : ''}`).join(' · '));
  if (buyer) {
    const bw = results.reduce((a, r) => a + r.players[r.buyerSeat].win, 0) / n;
    const bp = results.map(r => r.players[r.buyerSeat]);
    console.log(`buyer: win ${pct(bw)} ±${(100 * ci(bw, n)).toFixed(1)} (n=${n}, parity 25%) · followers ${(bp.reduce((a, p) => a + p.f, 0) / n).toFixed(1)} · left ${(bp.reduce((a, p) => a + p.left, 0) / n).toFixed(1)}`);
  }
  // per-sphere win rate of the player who scored most from it isn't meaningful at small n; list tables instead
  if (args.verbose) for (const r of results) console.log(`g${r.g} [${r.quadrants.join(',')}] ${r.players.map(p => `${p.f}${p.win ? '*' : ''}`).join(' ')}`);
}
