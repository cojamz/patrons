// @vitest-environment node
// Random-move fuzz: legal but unwise moves, to explore branches bots avoid.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove } from '../../../engine/v4/core.js';
import { runGame, checkInvariants } from './fuzz-runner.js';

const T = 300000; // generous: the box is often busy running sims and agents

describe('random-move fuzz (explores branches bots avoid)', () => {
  for (const n of [2, 3, 4]) {
    it(`${n} players, 60 seeded games`, { timeout: T }, () => {
      for (let seed = 1001; seed <= 1060; seed++) runGame({ n, seed, kind: 'random' });
    });
  }

  it('random movers reach every kind of decision', { timeout: T }, () => {
    const kinds = new Set(), optionKinds = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      const { state, moves } = runGame({ n: 3, seed, kind: 'random', full: false });
      let s = createGame({ seats: state.players.map(p => ({ name: p.name, kind: p.kind })), seed });
      for (const m of moves) {
        kinds.add(s.pending.kind);
        optionKinds.add(s.pending.options.find(o => o.id === m.option).kind);
        s = applyMove(s, m);
      }
    }
    expect([...kinds].sort()).toEqual(['buy', 'choose', 'pay', 'place', 'setup']);
    for (const k of ['card', 'tier', 'pass', 'slot', 'player', 'color', 'trade', 'use', 'toggle', 'member', 'pay', 'back', 'amount'])
      expect(optionKinds.has(k), k).toBe(true);
  });
});


describe('the invariant checker itself', () => {
  it('flags corrupted states', () => {
    const fresh = () => createGame({ seats: [{ name: 'A' }, { name: 'B' }], seed: 3 });
    expect(() => checkInvariants(fresh(), 'ok')).not.toThrow();
    const corrupt = [
      s => { s.players[0].res.gold = -1; },
      s => { s.players[0].members.push(s.shop[0]); },
      s => { s.pile.pop(); },
      s => { s.shop.pop(); },
      s => { s.pending = null; },
      s => { s.pending.options.push({ ...s.pending.options[0] }); },
      s => { s.players[0].x = undefined; },
      s => { s.players[0].res.red = NaN; },
      s => { s.cards[0].when = new Date(0); },
    ];
    for (const f of corrupt) { const s = fresh(); f(s); expect(() => checkInvariants(s, 'bad')).toThrow(); }
  });
});
