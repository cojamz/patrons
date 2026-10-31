// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { table, uidIn } from './cards-helpers-b.js';
import { take, move, ids } from './helpers.js';
const Q = ['gold', 'red', 'thieves', 'market'];
const shop = ['red.volunteer', 'red.intern'];
describe('Magenta corrections retained through the redesign', () => {
  it('Help Yourself can take from poorer and tied rivals', () => {
    let s = table(Q, { n: 3, res: [{ gold: 6 }, { gold: 1 }, { red: 6 }], shop });
    s = take(s, 'thieves.pickpocket');
    expect(ids(s)).toContain('take:1:gold');
    expect(ids(s)).toContain('take:2:red');
    s = move(move(move(s, 'take:1:gold'), 'take:2:red'), 'take:2:red'); // round I: steal 3
    expect(s.players[0].res).toMatchObject({ gold: 7, red: 2, magenta: 0 });
  });
  it('Lie Low prevents member and resource theft', () => {
    let s = table(Q, { round: 3, left: 5, res: [{ gold: 4 }, { red: 3 }], members: [['red.intern']], shop, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = take(s, 'thieves.hideout');
    while (s.pending?.kind === 'choose') s = move(s, 'take:1:red');
    s = move(s, 'pass');
    s = take(s, 'thieves.heist');
    expect(s.log).toContain('P2 found nothing worth a heist.');
    expect(s.players[0].members).toHaveLength(1);
  });
  it('doubles the base before Sticky Fingers once across a split theft', () => {
    let s = table(Q, { n: 3, res: [{}, { gold: 9 }, { red: 9 }], members: [['thieves.sticky', 'thieves.desperado']], bonus: [0, 5, 5], shop });
    s = take(s, 'thieves.pickpocket');
    expect(s.pending.count.left).toBe(7); // 3×2+1
    s = move(s, 'take:1:gold');
    expect(s.pending.count.left).toBe(6);
    for (let k = 0; k < 6; k++) s = move(s, 'take:2:red');
    expect(s.players[0].res).toMatchObject({ magenta: 0, gold: 1, red: 6 });
    expect(s.players[1].res.gold).toBe(8);
    expect(s.players[2].res.red).toBe(3);
  });
  it('Collect Debts still doubles a selected rival in one click', () => {
    let s = table(Q, { round: 2, left: 4, res: [{}, { gold: 9 }], members: [['thieves.desperado']], bonus: [0, 5], shop });
    s = move(take(s, 'gold.steal'), 'player:1');
    expect(s.pending.count.left).toBe(4);
    s = move(move(s, 'player:1'), 'player:1');
    expect(s.players[0].res.gold).toBe(6);
  });
  it('Grifter offers color choices and logs the colors actually transferred', () => {
    let s = table(Q, { res: [{ magenta: 10 }, { gold: 3, red: 3 }], members: [['red.intern']], shop: ['thieves.grifter', ...shop] });
    s = take(s, 'thieves.tipoff'); // Stash: +3 magenta, no steal
    s = move(s, `card:${uidIn(s, 'thieves.grifter', 'shop')}`);
    expect(s.pending.prompt).toMatch(/Grifter/);
    expect(ids(s)).toEqual(['take:1:gold', 'take:1:red']);
    s = move(s, 'take:1:red');
    expect(s.log).toContain("P1's Grifter stole 1 (1 red from P2).");
    expect(s.players[0].res.red).toBe(1);
  });
});
