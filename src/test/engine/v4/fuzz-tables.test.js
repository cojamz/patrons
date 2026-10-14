// @vitest-environment node
// Cross-sphere fuzz: seeded random 4-sphere tables drawn from every registered quadrant, at 2–4 players,
// with greedy bots, random legal movers, and mixed seats. Every engine invariant after every move, plus
// sphere invariants (turn accounting, extra turns never squeeze a space, honest copy chips, clean cards
// in the pile, steals that move exactly what they report) and replay determinism. Runner: fuzz-tables-runner.js.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { ALL, resOf, makeTables, runTable } from './fuzz-tables-runner.js';

const T = 600000; // generous: the box is often busy running sims and agents

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
