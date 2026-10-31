// Runner for the cross-sphere fuzz (fuzz-tables.test.js): seeded random 4-sphere tables drawn from every registered quadrant, at 2–4 players,
// with greedy bots, random legal movers, and mixed seats. Every engine invariant after every move, plus
// sphere invariants (turn accounting, extra turns never squeeze a space, honest copy chips, clean cards
// in the pile, steals that move exactly what they report) and replay determinism.
import { createGame, applyMove, legalMoves, openSlots, followers, TIERS } from '../../../engine/v4/core.js';
import { allQuadrantIds, quadrant } from '../../../engine/v4/content/index.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { checkInvariants } from './fuzz-runner.js';

const MOVE_CAP = 6000;

// ---------- tables ----------
export const ALL = allQuadrantIds();
const compatible = (a, b) => a !== b && resOf(a) !== resOf(b);

/** Seeded random tables (4 quadrants, distinct resources) until every compatible pair has met at least twice. */
export const resOf = id => quadrant(id).resource;
export function makeTables(seed = 4242, minPairs = 2) {
  const rand = seededRandom(seed);
  const pairs = new Map();
  for (const a of ALL) for (const b of ALL) if (a < b && compatible(a, b)) pairs.set(`${a}|${b}`, 0);
  const tables = [];
  const seen = new Set();
  let guard = 0;
  while ([...pairs.values()].some(v => v < minPairs) && guard++ < 20000) {
    const pick = [];
    const pool = [...ALL].sort(() => rand() - 0.5);
    for (const q of pool) if (pick.length < 4 && pick.every(x => compatible(x, q))) pick.push(q);
    if (pick.length < 4) continue;
    const key = [...pick].sort().join(',');
    if (seen.has(key)) continue;
    const ps = [];
    for (const a of pick) for (const b of pick) if (a < b) ps.push(`${a}|${b}`);
    // keep a table only if it covers an under-covered pair
    if (!ps.some(k => pairs.get(k) < minPairs)) continue;
    seen.add(key);
    ps.forEach(k => pairs.set(k, pairs.get(k) + 1));
    tables.push(pick);
  }
  return { tables, pairs };
}

// ---------- invariants the shared checker doesn't know about ----------
const CLEAN_KEYS = new Set(['uid', 'def']);
const total = res => Object.values(res).reduce((a, b) => a + b, 0);

function failHard(msg, s, ctx) { throw new Error(`${ctx}: ${msg} (round ${s.round}, move ${s.moves})`); }
const fail = failHard;

function checkSphereInvariants(s, prev, ctx, verified, fail = failHard) {
  void failHard;
  // nobody holds a resource that isn't on the table (a member leaning to an absent sphere pays in table colors)
  for (const p of s.players) {
    const odd = Object.keys(p.res).filter(r => !s.resources.includes(r));
    if (odd.length) fail(`${p.name} holds ${odd.map(r => `${p.res[r]} ${r}`).join(', ')}, not on this table`, s, ctx);
  }
  // limited follower stock never negative
  for (const t of TIERS) if (t.limited && (s.stock?.[t.key] ?? 0) < 0) fail(`stock ${t.key} ${s.stock[t.key]}`, s, ctx);
  // per-card state never negative
  for (const c of Object.values(s.cards)) for (const k of ['invested', 'sown']) if ((c[k] || 0) < 0) fail(`card ${c.uid} ${k} ${c[k]}`, s, ctx);
  // a card in the pile or face up carries no state from an earlier owner (copies, used flags, invested gold…)
  for (const u of [...s.pile, ...s.shop]) {
    const extra = Object.keys(s.cards[u]).filter(k => !CLEAN_KEYS.has(k));
    if (extra.length) fail(`card ${u} (${s.cards[u].def}) in the pile/shop still has ${extra.map(k => `${k}=${JSON.stringify(s.cards[u][k])}`).join(', ')}`, s, ctx);
  }
  // turn accounting: workers left = turns still queued + placements still queued, for every player
  if (!s.over) {
    for (const p of s.players) {
      const queued = s.queue.filter(t => (t.t === 'turn' || t.t === 'place') && t.p === p.id).length;
      if (p.left !== queued) fail(`${p.name} has ${p.left} workers left but ${queued} turns queued`, s, ctx);
      if (p.left < 0) fail(`${p.name} left ${p.left}`, s, ctx);
    }
    // nobody's turn can be squeezed out of a space: turns still to come never outnumber open spaces
    if (s.round >= 1) {
      const coming = s.queue.filter(t => t.t === 'turn' || t.t === 'place').length;
      const open = openSlots(s).length;
      if (coming > open) fail(`${coming} turns to come but only ${open} open spaces`, s, ctx);
    }
  } else if (s.players.some(p => p.left !== 0)) fail('game over with workers left', s, ctx);
  // every slot owner placed it this round; a player's workers on the board never exceed their placements
  // honest copy chips (Green on the table): when a space's window closes (its taker reaches the buy), what the
  // chip promises a copier never exceeds what the taker actually got from it
  if (s.echo && s.pending?.kind === 'buy') {
    const L = s.echo;
    const e = L.open && L.now[L.open];
    if (e && e.p === s.pending.player && !e.echo && !e.redo && !verified.has(`${s.round}:${e.seq}`)) {
      verified.add(`${s.round}:${e.seq}`);
      const p = s.players[e.p];
      const got = total(p.res) - total(e.before.res[e.p]);
      const chip = total(e.res);
      if (got < chip) fail(`chip on ${e.name} promises ${chip} resources but its taker netted ${got} (${JSON.stringify(e.res)})`, s, ctx);
      const newMembers = p.members.filter(u => !e.before.members[e.p].includes(u)).length;
      if (newMembers < e.members.length) fail(`chip on ${e.name} promises ${e.members.length} free members, taker got ${newMembers}`, s, ctx);
    }
  }
  // steals (Magenta on the table records each one): a theft moves exactly what it reports, never more than existed
  if (s.thefts && prev) {
    const fresh = s.thefts.slice((prev.thefts || []).length);
    for (const t of fresh) {
      if (!(t.n >= 1)) fail(`theft of ${t.n}`, s, ctx);
      if (t.kind === 'res') {
        const before = total(prev.players[t.from].res);
        // the victim could have gained during this move before being robbed, so bound by before + all they had at most
        const bound = before + Math.max(0, total(s.players[t.from].res) - before) + fresh.filter(x => x.from === t.from && x.kind === 'res').reduce((a, x) => a + x.n, 0);
        if (t.n > bound) fail(`stole ${t.n} from a player who had ${before}`, s, ctx);
      }
    }
  }
}

// ---------- the follower ledger, kept by hand from the log ----------
// The log keeps its last 300 lines, so the runner diffs each move's new lines and keeps its own books:
// contest wins from the "Round … ends." lines, follower buys from "X bought N followers". At the end they must
// match each player's contest and bought totals, and every move that changes a player's followers names them.
export function newLines(prev, next) {
  const a = prev.log, b = next.log;
  for (let off = 0; off <= a.length; off++) {
    let ok = true;
    for (let k = 0; off + k < a.length; k++) if (a[off + k] !== b[k]) { ok = false; break; }
    if (ok) return b.slice(a.length - off);
  }
  return b;
}
function bookLines(books, s, lines) {
  for (const line of lines) {
    const m = line.match(/^Round [IV]+ ends\. (.*)$/);
    if (m) for (const part of m[1].split(' · ')) {
      const w = part.match(/: (.+) \+(\d+)$/);
      if (w) for (const name of w[1].split(' & ')) {
        const p = s.players.find(o => o.name === name);
        if (p) books[p.id].contest += Number(w[2]);
      }
    }
    for (const p of s.players) {
      const b = line.match(new RegExp(`^${p.name} bought (\\d+) followers?`));
      if (b) books[p.id].bought += Number(b[1]);
    }
  }
}
function checkLedger(books, s, prev, lines, ctx, fail) {
  bookLines(books, s, lines);
  for (const p of s.players) {
    const before = prev.players[p.id];
    if (p.bonus !== before.bonus && !lines.some(l => l.includes(p.name)))
      fail(`${p.name}'s followers went ${before.bonus} → ${p.bonus} with no log line naming them: ${JSON.stringify(lines)}`, s, ctx);
  }
  if (s.over) for (const p of s.players) {
    if (books[p.id].contest !== p.contest) fail(`${p.name} has ${p.contest} contest followers, the log adds up to ${books[p.id].contest}`, s, ctx);
    if (books[p.id].bought !== (p.bought || 0)) fail(`${p.name} bought ${p.bought} followers, the log adds up to ${books[p.id].bought}`, s, ctx);
    if (p.final && p.final.total !== p.final.parts.reduce((a, x) => { const m = x.match(/([+−-])(\d+)$/); return a + (m[1] === '+' ? 1 : -1) * Number(m[2]); }, 0)) fail(`${p.name}'s game-end parts don't add up`, s, ctx);
  }
  if (s.over) {
    const f = s.ranking.map(id => followers(s, s.players[id]));
    if (f.some((x, i) => i && x > f[i - 1])) fail(`ranking not by followers: ${f}`, s, ctx);
  }
}

// ---------- the runner ----------
export const pickers = {
  bot: rand => s => chooseBotMove(s, rand),
  random: rand => s => { const ms = legalMoves(s); return ms[Math.floor(rand() * ms.length)]; },
  // even seats play greedy, odd seats play random
  mixed: rand => s => (s.pending.player % 2 ? pickers.random(rand)(s) : chooseBotMove(s, rand)),
};

/** Play one game on a table, checking everything after every move. Returns { state, moves, stats }. */
// allOptions: at every decision, also apply every other legal option once and check the result.
export function runTable({ quadrants, n, seed, kind, deep = false, allOptions = false, soft = null }) {
  const ctx = `[${quadrants.join(',')}] ${kind} n=${n} seed=${seed}`;
  const rand = seededRandom(seed * 7919 + n * 31 + kind.length);
  const pick = pickers[kind](rand);
  let s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants });
  const moves = [];
  const verified = new Set();
  const stats = { kinds: new Set(), optionKinds: new Set(), extraTurns: 0, copies: 0, thefts: 0 };
  checkInvariants(s, ctx);
  checkSphereInvariants(s, null, ctx, verified, soft || failHard);
  if (s.players.length !== n) fail(`${s.players.length} seats, asked for ${n}`, s, ctx);
  const books = s.players.map(() => ({ contest: 0, bought: 0 }));
  bookLines(books, s, s.log);
  while (s.pending) {
    if (moves.length >= MOVE_CAP) fail(`no end after ${moves.length} moves`, s, ctx);
    const m = pick(s);
    stats.kinds.add(s.pending.kind);
    stats.optionKinds.add(s.pending.options.find(o => o.id === m.option)?.kind);
    let before;
    if (deep) {
      before = JSON.stringify(s);
      for (const bad of [{ player: (m.player + 1) % n, option: m.option }, { player: m.player, option: 'bogus:1' }]) {
        let threw = false;
        try { applyMove(s, bad); } catch { threw = true; }
        if (!threw) fail(`illegal move accepted: ${JSON.stringify(bad)}`, s, ctx);
      }
    }
    if (allOptions) for (const o of legalMoves(s)) {
      if (o.option === m.option) continue;
      let alt;
      try { alt = applyMove(s, o); } catch (err) { fail(`legal option ${o.option} threw: ${err.stack}`, s, ctx); }
      checkInvariants(alt, `${ctx} (option ${o.option})`);
      checkSphereInvariants(alt, s, `${ctx} (option ${o.option})`, new Set(verified), soft || failHard);
    }
    let next;
    try { next = applyMove(s, m); } catch (err) { fail(`applyMove threw on ${JSON.stringify(m)}: ${err.stack}`, s, ctx); }
    if (deep && JSON.stringify(s) !== before) fail(`applyMove mutated its input on ${JSON.stringify(m)}`, s, ctx);
    checkInvariants(next, ctx);
    checkSphereInvariants(next, s, ctx, verified, soft || failHard);
    checkLedger(books, next, s, newLines(s, next), ctx, soft || failHard);
    moves.push(m);
    s = next;
  }
  if (!s.over || !Array.isArray(s.ranking) || s.ranking.length !== n) fail('did not finish cleanly', s, ctx);
  stats.thefts = (s.thefts || []).length;
  return { state: s, moves, stats };
}

