// Independent balance cross-check runner (separate from v4-balance.mjs: own seeds, own tables, own policies, own logging).
// Usage: node scripts/xcheck/xc-run.mjs <firstGame> <count> <out.jsonl>
//   SEATS=2|3|4  POLICY=normal|hard|hardplus|cold|mixhard|mixplus  PRICE="key=s/w,..." (prices only)  SALT=<n> (seed family)
// Policies: normal / hard are the game's bots. hardplus = Hard with 5 candidates and 3x the lookahead budget (stronger).
// cold = Normal with no member bias and full spite (values members only at measured worth). mixhard / mixplus = one
// Hard (or Hard+) seat, rotating, against Normal seats. Every 5th game one seat only buys followers (the 25% check).
import { appendFileSync } from 'node:fs';
import { createGame, applyMove, followers, memberCount, allQuadrantIds, quadrant } from '../../src/engine/v4/index.js';
import { defById, guestMembers } from '../../src/engine/v4/content/index.js';
import { chooseBotMove, chooseFollowerBuyerMove } from '../../src/engine/v4/bots.js';
import { seededRandom } from '../../src/engine/v4/rng.js';
import { sphereVersion } from '../../src/v4/tables.js';

const [first, count, out] = [Number(process.argv[2] || 1), Number(process.argv[3] || 1), process.argv[4] || 'xc.jsonl'];
const seats = Number(process.env.SEATS || 4), policy = process.env.POLICY || 'normal', salt = Number(process.env.SALT || 0);
const pool0 = allQuadrantIds().filter(q => sphereVersion(q) === '2.0');
const defs = [...allQuadrantIds().flatMap(q => quadrant(q).members), ...guestMembers()];
const prices = {};
for (const pair of (process.env.PRICE || '').split(',').filter(Boolean)) {
  const [k, v] = pair.split('='), [s, w] = v.split('/').map(Number);
  const d = defs.find(x => x.id === k || x.key === k || x.name.toLowerCase() === k.toLowerCase());
  if (!d) throw new Error(`No member ${k}`);
  prices[d.id] = { from: `${d.s}/${d.w}`, to: v };
  d.s = s; d.w = w;
}
const OPTS = {
  normal: { level: 'normal' },
  hard: { level: 'hard', maxMs: Infinity },
  hardplus: { level: 'hard', maxMs: Infinity, candidates: 5, budget: 300 },
  cold: { level: 'normal', memberBias: 0, biasFloor: 0, spite: 1 },
};
const seatPolicy = (g, i) => {
  if (policy === 'mixhard' || policy === 'mixplus') return i === g % seats ? (policy === 'mixhard' ? 'hard' : 'hardplus') : 'normal';
  return policy;
};
const nm = d => { try { return defById(d).name; } catch { return d; } };
const resSum = p => Object.values(p.res).reduce((a, b) => a + b, 0);

for (let g = first; g < first + count; g++) {
  const seed = 500000 + salt * 100000 + g * 31 + seats; // disjoint from v4-balance.mjs's g * 7717 + 3 + seats * 101
  const rand = seededRandom(seed * 2654435761 % 2147483647 || 1);
  const pool = [...pool0], quads = [];
  while (quads.length < seats) quads.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  let s = createGame({ seats: Array.from({ length: seats }, () => ({ kind: 'bot' })), seed, quadrants: quads });
  const buyer = g % 5 === 0 ? (g + 1) % seats : -1;
  const pol = s.players.map((_, i) => (i === buyer ? 'buyer' : seatPolicy(g, i)));
  const offered = {}, got = s.players.map(() => ({}));
  const cw = s.players.map(() => [0, 0, 0, 0]);
  const placements = [], skips = s.players.map(() => [0, 0, 0, 0]), skipBy = {};
  let lastSpace = null, open = null, logLen = s.log.length, logTotal = 0;
  const closeOpen = () => {
    if (!open) return;
    const p = s.players[open.p];
    placements.push({ ...open, df: followers(s, p) - open.f0, dr: resSum(p) - open.r0, f0: undefined, r0: undefined });
    open = null;
  };
  while (!s.over) {
    for (const uid of s.shop) { const d = s.cards[uid].def; offered[d] ??= s.round; }
    const pend = s.pending, pl = pend.player;
    if (open && (pend.kind === 'buy' || pend.kind === 'place' || pl !== open.p || s.round !== open.round)) closeOpen();
    const before = s.players.map(p => new Set(p.members));
    const m = pol[pl] === 'buyer' ? chooseFollowerBuyerMove(s, rand) : chooseBotMove(s, rand, OPTS[pol[pl]]);
    if (pend.kind === 'place' && /^(slot|squat):/.test(m.option)) {
      const [q, i] = m.option.split(':')[1].split('-').map(Number);
      const a = quadrant(s.quadrants[q]).actions[i];
      const p = s.players[pl];
      open = { p: pl, round: s.round, space: a.name, color: s.quadrants[q], left: p.left, prev: a.echo ? lastSpace : undefined, f0: followers(s, p), r0: resSum(p) };
      lastSpace = a.name;
    }
    const round = s.round, c0 = s.players.map(p => p.contest || 0);
    s = applyMove(s, m);
    s.players.forEach((p, i) => { const d = (p.contest || 0) - c0[i]; if (d) cw[i][round] += d; });
    // log lines added by this move (the log is capped at 300, so count from the tail)
    const L = s.log.length, fresh = L >= logLen ? s.log.slice(logLen) : s.log.slice(-1);
    logLen = L;
    for (const line of fresh) {
      const k = line.match(/^(.+?)'s (.+?): (.+?) skips their next turn\.$/);
      if (k) {
        const v = s.players.findIndex(p => p.name === k[3]);
        if (v >= 0) skips[v][round]++;
        skipBy[k[2]] = (skipBy[k[2]] || 0) + 1;
      }
    }
    s.players.forEach((p, i) => { for (const u of p.members) if (!before[i].has(u)) got[i][s.cards[u].def] ??= round; });
  }
  closeOpen();
  const fs = s.players.map(p => followers(s, p)), top = Math.max(...fs), nTop = fs.filter(f => f === top).length;
  const row = {
    g, seed, seats, policy, pol, table: quads, buyer, prices, offered,
    players: s.players.map((p, i) => ({
      i, pol: pol[i], f: fs[i], win: fs[i] === top ? 1 / nTop : 0, mc: memberCount(s, p),
      members: p.members.map(u => s.cards[u].def), got: got[i],
      art: p.artifact !== undefined ? s.cards[p.artifact].def : null,
      ledger: (s.ledger && s.ledger[p.id]) || {}, skipped: skips[i], cw: cw[i], contest: p.contest || 0,
    })),
    placements, skipBy,
  };
  appendFileSync(out, JSON.stringify(row) + '\n');
}
