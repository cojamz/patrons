// @vitest-environment node
// Bot-vs-bot fuzz: 510 seeded games, invariants after every move, plus replay determinism.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { runGame, MOVE_CAP } from './fuzz-runner.js';
import { games } from './budget.js';

// No wall-clock timeouts: games are bounded by move caps, and the blocks by game counts (budget.js).
// per seat count. The verdict plays 85 (catches a bug in ≥3.5% of games at a seat count, ≥1.2% over all 255, with 95%
// confidence); the nightly full run (check:v4:full) all 170 (≥1.7%); the fast gate 12. budget.js has the levels.
const GAMES = games(170, 12);

describe('bot fuzz: invariants after every move', () => {
  for (const n of [2, 3, 4]) {
    it(`${n} players, ${GAMES} seeded games`, () => {
      const lengths = [];
      for (let seed = 1; seed <= GAMES; seed++) lengths.push(runGame({ n, seed, kind: 'bot' }).moves.length);
      expect(Math.max(...lengths)).toBeLessThan(MOVE_CAP.bot);
    });
  }
});

// Five and six players (Cory, 2026-10-22): Classic adds Purple, then Yellow; no other rule changes.
// 6 seats cost ~8 s of bot CPU a game (two extra spheres, twice the moves), so the verdict plays 8 per count, nightly 40.
const BIG = games(40, 2, 8);
describe('bot fuzz: five and six players', () => {
  for (const n of [5, 6]) {
    it(`${n} players, ${BIG} seeded games`, () => {
      const lengths = [];
      for (let seed = 1; seed <= BIG; seed++) {
        const { state, moves } = runGame({ n, seed, kind: 'bot' });
        expect(state.quadrants).toEqual(['gold', 'red', 'market', 'echo', 'purple', 'yellow'].slice(0, n));
        lengths.push(moves.length);
      }
      expect(Math.max(...lengths)).toBeLessThan(MOVE_CAP.bot);
    });
  }
  it('seven seats are refused', () => {
    expect(() => createGame({ seats: Array.from({ length: 7 }, () => ({ kind: 'bot' })) })).toThrow(/2 to 6 seats/);
  });
});

describe('determinism', () => {
  it('same seed and moves replay to an identical final state', () => {
    for (const [n, seed, kind] of [[2, 11, 'bot'], [3, 12, 'random'], [4, 13, 'bot'], [4, 14, 'random']]) {
      const { state, moves } = runGame({ n, seed, kind, full: false });
      let s = createGame({ seats: state.players.map(p => ({ name: p.name, kind: p.kind })), seed });
      for (const m of moves) s = applyMove(s, m);
      expect(s).toStrictEqual(state);
    }
  });

  it('a state sent over the wire (JSON round trip) plays on identically', () => {
    const { state, moves } = runGame({ n: 3, seed: 21, kind: 'bot', full: false });
    let s = createGame({ seats: state.players.map(p => ({ name: p.name, kind: p.kind })), seed: 21 });
    for (const m of moves) s = applyMove(JSON.parse(JSON.stringify(s)), m);
    expect(s).toStrictEqual(state);
  });

  it('the same seed and bot RNG gives the same game; different seeds differ', () => {
    const a = runGame({ n: 4, seed: 31, kind: 'bot', full: false });
    const b = runGame({ n: 4, seed: 31, kind: 'bot', full: false });
    const c = runGame({ n: 4, seed: 32, kind: 'bot', full: false });
    expect(b.moves).toEqual(a.moves);
    expect(b.state).toStrictEqual(a.state);
    expect(c.moves).not.toEqual(a.moves);
  });
});
