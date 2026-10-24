// @vitest-environment node
// Cross-sphere fuzz: seeded random 4-sphere tables drawn from every registered quadrant, at 2–4 players,
// with greedy bots, random legal movers, and mixed seats. Every engine invariant after every move, plus
// sphere invariants (turn accounting, extra turns never squeeze a space, honest copy chips, clean cards
// in the pile, steals that move exactly what they report), a follower ledger kept from the log, every legal option
// executing, and replay determinism. Runner: fuzz-tables-runner.js. V4_FUZZ=heavy for the full matrix.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { ALL, resOf, makeTables, runTable } from './fuzz-tables-runner.js';

// No wall-clock timeouts: games are bounded by move caps, and the blocks by game counts (budget.js).

// Default: every compatible pair of quadrants meets at least once, one game per table (seat count and mover
// cycle through 2–4 and bot/random/mixed), a few games trying every legal option at every decision.
// V4_FUZZ=heavy: every pair meets twice, every table × 2–4 seats × 2 seeds × every mover, more option sweeps.
const HEAVY = process.env.V4_FUZZ === 'heavy';
const { tables, pairs } = makeTables(4242, HEAVY ? 2 : 1);
const SEEDS = HEAVY ? [1, 2] : [1]; // per table × player count × picker
const KINDS = ['bot', 'random', 'mixed'];
const MIN_PAIRS = HEAVY ? 2 : 1;

describe('cross-sphere tables', () => {
  it('cover every quadrant and every compatible pair of quadrants', () => {
    expect(ALL.length).toBeGreaterThanOrEqual(11);
    for (const q of ALL) expect(tables.some(t => t.includes(q)), q).toBe(true);
    for (const [k, v] of pairs) expect(v, k).toBeGreaterThanOrEqual(MIN_PAIRS);
    for (const t of tables) expect(new Set(t.map(resOf)).size).toBe(4);
  });

  it('a table seats 2 to 6', () => {
    const seats = k => Array.from({ length: k }, (_, i) => ({ name: `P${i + 1}` }));
    for (const k of [0, 1, 7]) expect(() => createGame({ seats: seats(k), quadrants: tables[0] }), String(k)).toThrow();
    for (const k of [2, 3, 4, 5, 6]) expect(createGame({ seats: seats(k), quadrants: tables[0] }).players).toHaveLength(k);
  });

  if (HEAVY) for (const n of [2, 3, 4]) {
    it(`${n} players: every table × ${SEEDS.length} seeds × ${KINDS.join('/')}`, () => {
      let games = 0;
      tables.forEach((quadrants, ti) => {
        for (const seed of SEEDS) for (const kind of KINDS) {
          runTable({ quadrants, n, seed: 1000 * ti + seed, kind, deep: seed === 1 && kind === 'random' && ti % 4 === 0 });
          games++;
        }
      });
      expect(games).toBe(tables.length * SEEDS.length * KINDS.length);
    });
  } else {
    it('every table once, cycling 2–4 seats and bot/random/mixed movers', () => {
      const seen = new Set();
      tables.forEach((quadrants, ti) => {
        const n = 2 + (ti % 3), kind = KINDS[Math.floor(ti / 3) % 3];
        runTable({ quadrants, n, seed: 1000 * ti + 1, kind, deep: ti % 6 === 0 });
        seen.add(`${n}${kind}`);
      });
      expect(seen.size).toBe(9);
    });
  }

  it('every legal option at every decision executes cleanly', () => {
    const picks = HEAVY ? tables.filter((_, i) => i % 3 === 0) : tables.filter((_, i) => i % 8 === 0);
    picks.forEach((quadrants, i) => runTable({ quadrants, n: 2 + (i % 3), seed: 300 + i, kind: i % 2 ? 'bot' : 'random', allOptions: true }));
  });

  it('random movers reach every kind of decision across the tables', () => {
    const kinds = new Set(), optionKinds = new Set();
    // two random games per table: a rare decision (a Translator's toggle) hung on one game's path, and any engine
    // change that shifts the random walk lost it (aminus r1 f1: the one-pay-rule's extra question did)
    for (const seed0 of [77, 377]) tables.forEach((quadrants, ti) => {
      const { stats } = runTable({ quadrants, n: 3, seed: seed0 + ti, kind: 'random' });
      stats.kinds.forEach(k => kinds.add(k));
      stats.optionKinds.forEach(k => optionKinds.add(k));
    });
    expect([...kinds].sort()).toEqual(['buy', 'choose', 'pay', 'place', 'setup']);
    for (const k of ['card', 'tier', 'pass', 'slot', 'player', 'color', 'use', 'toggle', 'member', 'pay', 'back', 'amount', 'space', 'take', 'swap', 'give'])
      expect(optionKinds.has(k), k).toBe(true);
    expect(optionKinds.has('release')).toBe(false);
  });
});

describe('cross-sphere determinism', () => {
  const sample = tables.filter((_, i) => i % (HEAVY ? 5 : 8) === 0);
  it('the same seed and the same bots replay to an identical game', () => {
    sample.forEach((quadrants, i) => {
      for (const kind of HEAVY ? KINDS : [KINDS[i % 3]]) {
        const a = runTable({ quadrants, n: 2 + (i % 3), seed: 500 + i, kind });
        const b = runTable({ quadrants, n: 2 + (i % 3), seed: 500 + i, kind });
        expect(b.moves).toEqual(a.moves);
        expect(b.state).toStrictEqual(a.state);
      }
    });
  });

  it('replaying the moves through a JSON round trip at every step gives the same final state', () => {
    sample.forEach((quadrants, i) => {
      const n = 2 + ((i + 1) % 3);
      const { state, moves } = runTable({ quadrants, n, seed: 900 + i, kind: 'mixed' });
      let s = createGame({ seats: state.players.map(p => ({ name: p.name, kind: p.kind })), seed: 900 + i, quadrants });
      for (const m of moves) s = applyMove(JSON.parse(JSON.stringify(s)), m);
      expect(s).toStrictEqual(state);
    });
  });
});
