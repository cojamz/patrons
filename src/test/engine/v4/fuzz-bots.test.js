// @vitest-environment node
// Bot-vs-bot fuzz: 510 seeded games, invariants after every move, plus replay determinism.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { runGame, MOVE_CAP } from './fuzz-runner.js';

const T = 300000; // generous: the box is often busy running sims and agents

describe('bot fuzz: invariants after every move', () => {
  for (const n of [2, 3, 4]) {
    it(`${n} players, 170 seeded games`, { timeout: T }, () => {
      const lengths = [];
      for (let seed = 1; seed <= 170; seed++) lengths.push(runGame({ n, seed, kind: 'bot' }).moves.length);
      expect(Math.max(...lengths)).toBeLessThan(MOVE_CAP.bot);
    });
  }
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
