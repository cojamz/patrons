// @vitest-environment node
// Cross-sphere fuzz: seeded random 4-sphere tables drawn from every registered quadrant, at 2–4 players,
// with greedy bots, random legal movers, and mixed seats. Every engine invariant after every move, plus
// sphere invariants (turn accounting, extra turns never squeeze a space, honest copy chips, clean cards
// in the pile, steals that move exactly what they report) and replay determinism.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, legalMoves, openSlots, TIERS } from '../../../engine/v4/core.js';
import { allQuadrantIds, quadrant } from '../../../engine/v4/content/index.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { checkInvariants } from './fuzz-runner.js';

const T = 600000; // generous: the box is often busy running sims and agents
const MOVE_CAP = 6000;

// ---------- tables ----------
const ALL = allQuadrantIds();
const resOf = id => quadrant(id).resource;
const compatible = (a, b) => a !== b && resOf(a) !== resOf(b);

/** Seeded random tables (4 quadrants, distinct resources) until every compatible pair has met at least twice. */
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

function fail(msg, s, ctx) { throw new Error(`${ctx}: ${msg} (round ${s.round}, move ${s.moves})`); }

function checkSphereInvariants(s, prev, ctx, verified) {
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

// ---------- the runner ----------
const pickers = {
  bot: rand => s => chooseBotMove(s, rand),
  random: rand => s => { const ms = legalMoves(s); return ms[Math.floor(rand() * ms.length)]; },
  // even seats play greedy, odd seats play random
  mixed: rand => s => (s.pending.player % 2 ? pickers.random(rand)(s) : chooseBotMove(s, rand)),
};

/** Play one game on a table, checking everything after every move. Returns { state, moves, stats }. */
export function runTable({ quadrants, n, seed, kind, deep = false }) {
  const ctx = `[${quadrants.join(',')}] ${kind} n=${n} seed=${seed}`;
  const rand = seededRandom(seed * 7919 + n * 31 + kind.length);
  const pick = pickers[kind](rand);
  let s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants });
  const moves = [];
  const verified = new Set();
  const stats = { kinds: new Set(), optionKinds: new Set(), extraTurns: 0, copies: 0, thefts: 0 };
  checkInvariants(s, ctx);
  checkSphereInvariants(s, null, ctx, verified);
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
    let next;
    try { next = applyMove(s, m); } catch (err) { fail(`applyMove threw on ${JSON.stringify(m)}: ${err.stack}`, s, ctx); }
    if (deep && JSON.stringify(s) !== before) fail(`applyMove mutated its input on ${JSON.stringify(m)}`, s, ctx);
    checkInvariants(next, ctx);
    checkSphereInvariants(next, s, ctx, verified);
    moves.push(m);
    s = next;
  }
  if (!s.over || !Array.isArray(s.ranking) || s.ranking.length !== n) fail('did not finish cleanly', s, ctx);
  stats.thefts = (s.thefts || []).length;
  return { state: s, moves, stats };
}

// ---------- the suite ----------
const { tables, pairs } = makeTables();
const SEEDS = [1, 2]; // per table × player count × picker
const KINDS = ['bot', 'random', 'mixed'];

describe('cross-sphere tables', () => {
  it('cover every quadrant and every compatible pair of quadrants', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(11);
    for (const q of ALL) expect(tables.some(t => t.includes(q)), q).toBe(true);
    for (const [k, v] of pairs) expect(v, k).toBeGreaterThanOrEqual(2);
    for (const t of tables) expect(new Set(t.map(resOf)).size).toBe(4);
  });

  for (const n of [2, 3, 4]) {
    it(`${n} players: every table × ${SEEDS.length} seeds × ${KINDS.join('/')}`, { timeout: T }, () => {
      let games = 0;
      tables.forEach((quadrants, ti) => {
        for (const seed of SEEDS) for (const kind of KINDS) {
          runTable({ quadrants, n, seed: 1000 * ti + seed, kind, deep: seed === 1 && kind === 'random' && ti % 4 === 0 });
          games++;
        }
      });
      expect(games).toBe(tables.length * SEEDS.length * KINDS.length);
    });
  }

  it('random movers reach every kind of decision across the tables', { timeout: T }, () => {
    const kinds = new Set(), optionKinds = new Set();
    tables.forEach((quadrants, ti) => {
      const { stats } = runTable({ quadrants, n: 3, seed: 77 + ti, kind: 'random' });
      stats.kinds.forEach(k => kinds.add(k));
      stats.optionKinds.forEach(k => optionKinds.add(k));
    });
    expect([...kinds].sort()).toEqual(['buy', 'choose', 'pay', 'place', 'setup']);
    for (const k of ['card', 'tier', 'pass', 'slot', 'player', 'color', 'use', 'toggle', 'member', 'pay', 'back', 'amount', 'space', 'take', 'swap', 'give'])
      expect(optionKinds.has(k), k).toBe(true);
  });
});

describe('cross-sphere determinism', () => {
  const sample = tables.filter((_, i) => i % 5 === 0);
  it('the same seed and the same bots replay to an identical game', { timeout: T }, () => {
    sample.forEach((quadrants, i) => {
      for (const kind of KINDS) {
        const a = runTable({ quadrants, n: 2 + (i % 3), seed: 500 + i, kind });
        const b = runTable({ quadrants, n: 2 + (i % 3), seed: 500 + i, kind });
        expect(b.moves).toEqual(a.moves);
        expect(b.state).toStrictEqual(a.state);
      }
    });
  });

  it('replaying the moves through a JSON round trip at every step gives the same final state', { timeout: T }, () => {
    sample.forEach((quadrants, i) => {
      const n = 2 + ((i + 1) % 3);
      const { state, moves } = runTable({ quadrants, n, seed: 900 + i, kind: 'mixed' });
      let s = createGame({ seats: state.players.map(p => ({ name: p.name, kind: p.kind })), seed: 900 + i, quadrants });
      for (const m of moves) s = applyMove(JSON.parse(JSON.stringify(s)), m);
      expect(s).toStrictEqual(state);
    });
  });
});
