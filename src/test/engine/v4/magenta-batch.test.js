// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { table, uidIn } from './cards-helpers-b.js';
import { take, move, ids } from './helpers.js';
const Q = ['gold', 'red', 'thieves', 'market'];
const shop = ['red.volunteer', 'red.intern'];
describe('October 17 Magenta corrections', () => {
  it('Redistribute takes from poorer and tied rivals too', () => {
    let s = table(Q, { n: 3, res: [{ gold: 6 }, { gold: 1 }, { red: 6 }], shop });
    s = take(s, 'thieves.tipoff');
    expect(ids(s)).toContain('take:1:gold');
    s = move(move(s, 'take:1:gold'), 'take:2:red');
    expect(s.players[0].res.magenta).toBe(2);
  });
  it('Lie Low prevents member and resource theft', () => {
    let s = table(Q, { round: 3, left: 5, res: [{ gold: 4 }, { red: 1 }], members: [['red.intern']], shop, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = move(take(s, 'thieves.hideout'), 'take:1:red');
    s = move(s, 'pass');
    s = take(s, 'thieves.heist');
    expect(s.log).toContain('P2 found nothing worth a heist.');
    expect(s.players[0].members).toHaveLength(1);
  });
  it('doubles the base before Sticky Fingers and takes two from one selected rival', () => {
    let s = table(Q, { res: [{}, { gold: 9 }], members: [['thieves.sticky', 'thieves.desperado']], bonus: [0, 5], shop });
    s = take(s, 'thieves.pickpocket');
    expect(s.pending.count.left).toBe(5);
    s = move(s, 'take:1:gold');
    expect(s.pending.count.left).toBe(3);
    s = move(move(s, 'take:1:gold'), 'take:1:gold');
    expect(s.players[0].res.magenta).toBe(5);
    expect(s.players[1].res.gold).toBe(4);
  });
  it('Collect Debts doubles a chosen rival in one click too', () => {
    let s = table(Q, { round: 2, left: 4, res: [{}, { gold: 9 }], members: [['thieves.desperado']], bonus: [0, 5], shop });
    s = move(take(s, 'gold.steal'), 'player:1');
    expect(s.pending.count.left).toBe(4);
    s = move(move(s, 'player:1'), 'player:1');
    expect(s.players[0].res.gold).toBe(6);
  });
  it('Grifter offers resource choices and logs exactly what was taken', () => {
    let s = table(Q, { res: [{ magenta: 10 }, { gold: 3, red: 3 }], members: [['red.intern']], shop: ['thieves.grifter', ...shop] });
    s = take(s, 'thieves.tipoff');
    s = move(s, 'take:1:gold');
    s = move(s, `card:${uidIn(s, 'thieves.grifter', 'shop')}`);
    expect(s.pending.prompt).toMatch(/Grifter/);
    expect(ids(s)).toEqual(['take:1:gold', 'take:1:red']);
    s = move(s, 'take:1:red');
    expect(s.log).toContain("P1's Grifter stole 1 (1 red from P2), now magenta.");
  });
});
