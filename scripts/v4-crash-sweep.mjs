// Release crash sweep: many seeded games to the end on the game's real rules (artifacts, round decks, the cull), with
// every engine and sphere invariant checked after every move (the fuzz runners). Two modes:
//   plain  random tables of the redesigned colors (and some of every color), 2-4 players, bot/random/mixed movers
//   copy   copy-of-copy stress: Green, Red and Magenta always on the table, Squatter and Tribute Band dealt to seats,
//          Doppelganger, Impostor and Stunt Double face up in the shop, and movers that favour Greatest Hits, Tryout,
//          copy spaces, copy members and every "Use" they're offered.
// Usage: node scripts/v4-crash-sweep.mjs <plain|copy> <games> [lanes=3] [out=design/eval/release-qa/sweep]
// Each failure is kept (soft) with its table, seats, mover and seed, so `node scripts/v4-crash-sweep.mjs one <ctx-json>`
// replays it alone.
import { fork } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createGame, applyMove, legalMoves } from '../src/engine/v4/core.js';
import { allQuadrantIds, quadrant } from '../src/engine/v4/content/index.js';
import { chooseBotMove } from '../src/engine/v4/bots.js';
import { seededRandom } from '../src/engine/v4/rng.js';
import { runTable, pickers } from '../src/test/engine/v4/fuzz-tables-runner.js';

const REDONE = ['red', 'echo', 'thieves', 'purple', 'market', 'trading']; // the 2.0 colors (src/v4/tables.js)
const ALL = allQuadrantIds().filter(id => !quadrant(id).standIn);
const COPY_NAMES = /Loyalists|↔|Swap|swap|Promote|Demote|Greatest Hits|Tryout|Stunt Double|Tribute Band|Doppelganger|Impostor|Squatter|copy|Copy|Reprise|Encore/;

function table(rand, mode, n) {
  const want = n;
  const pool = mode === 'copy' ? ['echo', 'red', 'thieves'] : [];
  const rest = (mode === 'plain' && rand() < 0.25 ? ALL : REDONE).filter(q => !pool.includes(q)).sort(() => rand() - 0.5);
  const res = new Set(pool.map(q => quadrant(q).resource));
  for (const q of rest) if (pool.length < want && !res.has(quadrant(q).resource)) { pool.push(q); res.add(quadrant(q).resource); }
  return pool.slice(0, n);
}

// copy mode: deal copy members around before the first move
function rig(s, rand) {
  const take = def => {
    for (const list of [s.pile, s.shop, ...Object.values(s.waiting || {})]) {
      const k = list.findIndex(u => s.cards[u].def === def);
      if (k >= 0) { const u = list.splice(k, 1)[0]; if (list === s.shop && s.pile.length) s.shop.splice(k, 0, s.pile.shift()); return u; }
    }
    return undefined;
  };
  s.players.forEach((p, i) => {
    for (const d of [i % 2 ? 'echo.dejavu' : 'benders.squatter', ...(i === 1 || i === 2 ? ['red.loyalists'] : []), ...(i === 3 || i === 0 ? ['echo.agents'] : [])]) {
      const u = take(d);
      if (u !== undefined) p.members.push(u);
    }
  });
  for (const d of ['echo.doppel', 'echo.impostor', 'echo.hourglass', 'echo.dejavu']) {
    const u = take(d);
    if (u !== undefined) s.pile.unshift(u);
  }
  void rand;
  return s;
}

const copyPicker = rand => s => {
  const ms = legalMoves(s);
  const opts = s.pending.options;
  const label = m => opts.find(o => o.id === m.option)?.label || '';
  const kind = m => opts.find(o => o.id === m.option)?.kind;
  if (rand() < 0.7) {
    const use = ms.filter(m => kind(m) === 'use');
    if (use.length) return use[Math.floor(rand() * use.length)];
    const hot = ms.filter(m => COPY_NAMES.test(label(m)));
    if (hot.length) return hot[Math.floor(rand() * hot.length)];
  }
  return rand() < 0.5 ? chooseBotMove(s, rand) : ms[Math.floor(rand() * ms.length)];
};
pickers.copy = copyPicker;

/** One game; returns { ok, ctx, error, moves }. */
export function one(c) {
  const errors = [];
  const soft = (msg, s) => { if (errors.length < 5) errors.push(`${msg} (round ${s.round}, move ${s.moves})`); };
  try {
    if (c.mode === 'tryout') {
      const r = runTryout(c, soft);
      return { ok: !errors.length, ctx: c, error: errors.join(' | ') || null, moves: r.moves, hits: r.hits };
    }
    if (c.mode === 'copy') {
      // runTable builds its own game, so the rig rides on a createGame wrapper for this run
      const r = runRigged(c, soft);
      return { ok: !errors.length, ctx: c, error: errors.join(' | ') || null, moves: r.moves, hits: r.hits };
    }
    const r = runTable({ quadrants: c.quadrants, n: c.n, seed: c.seed, kind: c.kind, soft });
    return { ok: !errors.length, ctx: c, error: errors.join(' | ') || null, moves: r.moves.length };
  } catch (err) {
    return { ok: false, ctx: c, error: String(err.stack || err).split('\n').slice(0, 6).join(' / '), moves: null };
  }
}

// copy mode: the same checks as runTable, on a rigged start
import { checkInvariants } from '../src/test/engine/v4/fuzz-runner.js';
function runRigged(c, soft) {
  const rand = seededRandom(c.seed * 7919 + c.n * 31 + 4);
  const pick = copyPicker(rand);
  let s = createGame({ seats: Array.from({ length: c.n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: c.seed, quadrants: c.quadrants });
  s = rig(s, rand);
  let moves = 0;
  const seen = new Set();
  while (s.pending) {
    if (moves++ > 6000) throw new Error('no end after 6000 moves');
    const m = pick(s);
    const prev = s;
    try { s = applyMove(s, m); } catch (err) { throw new Error(`applyMove threw on ${JSON.stringify(m)} (${prev.pending.kind}, round ${prev.round}): ${err.stack}`); }
    checkInvariants(s, `copy seed=${c.seed}`);
    // Loyalists: "Your other members can't be swapped." A holder's other member never leaves on a move that swapped
    const fresh = s.log.slice(-Math.max(1, s.log.length - prev.log.length + 1)).filter(l => / swapped /.test(l));
    if (fresh.length) for (const p of prev.players) {
      const loyal = p.members.filter(u => prev.cards[u].def === 'red.loyalists' || prev.cards[u].copy === 'red.loyalists');
      if (!loyal.length) continue;
      const gone = p.members.filter(u => !loyal.includes(u) && !s.players[p.id].members.includes(u) && (s.shop.includes(u) || s.players.some(o => o.id !== p.id && o.members.includes(u))));
      if (gone.length) soft(`${p.name} holds Loyalists but lost ${gone.map(u => prev.cards[u].def).join(', ')} on a swap: ${fresh.join(' / ')}`, s);
    }
    // clean cards in the pile and shop (a member that went back keeps nothing from its owner)
    for (const u of [...s.pile, ...s.shop]) {
      const extra = Object.keys(s.cards[u]).filter(k => k !== 'uid' && k !== 'def');
      const key = `${u}:${extra.join(',')}`;
      if (extra.length && !seen.has(key)) { seen.add(key); soft(`card ${s.cards[u].def} in the pile/shop keeps ${extra.map(k => `${k}=${JSON.stringify(s.cards[u][k])}`).join(', ')}`, s); }
    }
  }
  if (!s.over) throw new Error('did not finish');
  return { moves, hits: hitsOf(s) };
}

// what the copy cards actually did in a game, read off its log (counts lines)
const HITS = { doppel: /Doppelganger becomes a copy/, impostor: /Impostor becomes a copy/, copyOfCopy: /(Doppelganger|Impostor) becomes a copy of (Doppelganger|Impostor|Tribute Band|Stunt Double|Squatter)/, tribute: /Tribute Band/, squatter: /Squatter/, greatestHits: /Greatest Hits/, stunt: /Stunt Double/, tryout: /Tryout/, swapNearLoyalists: /swapped/ };
function hitsOf(s) { const h = {}; for (const [k, re] of Object.entries(HITS)) h[k] = s.log.filter(l => re.test(l)).length; return h; }

// tryout mode: every member, put face up, used with Tryout, then recruited later (a member back in the shop keeps
// nothing from the Tryout). One game per member, Red on the table with its own color.
import { defById } from '../src/engine/v4/content/index.js';
function runTryout(c, soft) {
  const rand = seededRandom(c.seed);
  let s = createGame({ seats: Array.from({ length: 4 }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed: c.seed, quadrants: c.quadrants });
  let uid;
  for (const list of [s.pile, ...Object.values(s.waiting || {})]) { const k = list.findIndex(u => s.cards[u].def === c.def); if (k >= 0) { uid = list.splice(k, 1)[0]; break; } }
  if (uid === undefined) return { moves: 0, hits: { tried: 0, recruited: 0, missing: 1 } };
  s.pile.unshift(s.shop.pop()); s.shop.unshift(uid);
  let tried = 0, recruited = 0, moves = 0;
  while (s.pending) {
    if (moves++ > 6000) throw new Error('no end after 6000 moves');
    const opts = s.pending.options;
    const want = o => o.kind !== 'use' && ((o.kind === 'slot' && o.label === 'Tryout') || o.uid === uid || o.value === uid || o.target?.uid === uid);
    const hot = tried < 3 ? opts.filter(want) : opts.filter(o => o.kind === 'card' && o.uid === uid);
    const o = hot.length ? hot[0] : null;
    const m = o ? { player: s.pending.player, option: o.id } : chooseBotMove(s, rand);
    const prev = s;
    try { s = applyMove(s, m); } catch (err) { throw new Error(`applyMove threw on ${JSON.stringify(m)} (${prev.pending.kind}, round ${prev.round}): ${err.stack}`); }
    if (s.log.slice(prev.log.length - s.log.length || -1).some(l => / uses .*On Recruit; it stays in the shop/.test(l)) || (s.log.length && / uses .*On Recruit; it stays in the shop/.test(s.log.at(-1)) && prev.log.at(-1) !== s.log.at(-1))) tried++;
    if (s.players.some(p => p.members.includes(uid)) && !prev.players.some(p => p.members.includes(uid))) recruited++;
    checkInvariants(s, `tryout ${c.def}`);
    for (const u of [...s.pile, ...s.shop]) {
      const extra = Object.keys(s.cards[u]).filter(k => k !== 'uid' && k !== 'def');
      if (extra.length) { soft(`card ${s.cards[u].def} in the pile/shop keeps ${extra.map(k => `${k}=${JSON.stringify(s.cards[u][k])}`).join(', ')}`, s); break; }
    }
  }
  if (!s.over) throw new Error('did not finish');
  return { moves, hits: { tried: tried ? 1 : 0, recruited: recruited ? 1 : 0 } };
}

function plan(mode, games) {
  if (mode === 'tryout') {
    const defs = [];
    for (const q of [...ALL]) for (const d of quadrant(q).members) defs.push({ def: d.id, q });
    const list = [];
    defs.forEach(({ def, q }, k) => {
      const others = ['red', q].filter((x, i, a) => a.indexOf(x) === i);
      const res = new Set(others.map(x => quadrant(x).resource));
      for (const x of REDONE) if (others.length < 4 && !res.has(quadrant(x).resource)) { others.push(x); res.add(quadrant(x).resource); }
      for (let g = 0; g < Math.max(1, Math.round(games / defs.length)); g++) list.push({ mode, def, seed: 20000 + k * 10 + g, quadrants: others });
    });
    return list;
  }
  const rand = seededRandom(mode === 'copy' ? 9091 : 5150);
  const list = [];
  for (let g = 0; g < games; g++) {
    const n = mode === 'copy' ? (g % 5 === 4 ? 3 : 4) : [4, 4, 4, 3, 2][g % 5];
    const kind = mode === 'copy' ? 'copy' : ['bot', 'mixed', 'random'][g % 3];
    list.push({ mode, n, kind, seed: 10000 + g, quadrants: table(rand, mode, n) });
  }
  return list;
}

const self = fileURLToPath(import.meta.url);
const [cmd, a1, a2, a3] = process.argv.slice(2);
if (cmd === 'lane') {
  const jobs = JSON.parse(readFileSync(a1, 'utf8'));
  const out = [];
  for (const c of jobs) { const r = one(c); out.push(r); if (!r.ok) process.stderr.write(`FAIL ${JSON.stringify(c)}: ${r.error}\n`); }
  writeFileSync(a2, JSON.stringify(out));
} else if (cmd === 'one') {
  const r = one(JSON.parse(a1));
  console.log(JSON.stringify(r, null, 1));
} else if (cmd === 'plain' || cmd === 'copy' || cmd === 'tryout') {
  const games = Number(a1 || 200), lanes = Number(a2 || 3), dir = a3 || 'design/eval/release-qa/sweep';
  mkdirSync(dir, { recursive: true });
  const jobs = plan(cmd, games);
  const t0 = Date.now();
  const parts = await Promise.all(Array.from({ length: lanes }, (_, l) => new Promise((res, rej) => {
    const mine = jobs.filter((_, i) => i % lanes === l);
    const jf = `${dir}/.${cmd}-jobs-${l}.json`, of = `${dir}/.${cmd}-out-${l}.json`;
    writeFileSync(jf, JSON.stringify(mine));
    const ch = fork(self, ['lane', jf, of], { stdio: 'inherit' });
    ch.on('exit', code => (code === 0 && existsSync(of) ? res(JSON.parse(readFileSync(of, 'utf8'))) : rej(new Error(`lane ${l} exit ${code}`))));
  })));
  const all = parts.flat();
  const bad = all.filter(r => !r.ok);
  const moves = all.filter(r => r.moves).map(r => r.moves);
  const hits = {};
  for (const r of all) for (const [k, v] of Object.entries(r.hits || {})) { hits[k] ||= { games: 0, lines: 0 }; if (v) hits[k].games++; hits[k].lines += v; }
  const summary = { hits, mode: cmd, games: all.length, failed: bad.length, seconds: Math.round((Date.now() - t0) / 1000), avgMoves: Math.round(moves.reduce((a, b) => a + b, 0) / (moves.length || 1)), failures: bad };
  writeFileSync(`${dir}/${cmd}.json`, JSON.stringify(summary, null, 1));
  if (Object.keys(hits).length) console.log('copy coverage (games with it):', Object.entries(hits).map(([k, v]) => `${k} ${v.games}`).join(', '));
  console.log(`${cmd}: ${all.length} games, ${bad.length} failed, ${summary.seconds}s, ${summary.avgMoves} moves avg`);
  const kinds = new Map();
  for (const b of bad) { const k = (b.error || '').replace(/\d+/g, '#').slice(0, 140); kinds.set(k, (kinds.get(k) || 0) + 1); }
  for (const [k, v] of [...kinds].sort((x, y) => y[1] - x[1])) console.log(`  ${v}x ${k}`);
} else {
  console.log('usage: node scripts/v4-crash-sweep.mjs <plain|copy> <games> [lanes] [dir] | one <ctx-json>');
}
