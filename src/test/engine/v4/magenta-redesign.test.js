// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { resume } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { table, uidIn, useCosts, owns } from './cards-helpers-b.js';
import { take, move, ids, actionName } from './helpers.js';

const Q = ['gold', 'red', 'thieves', 'echo'];
const shop = ['red.volunteer', 'red.twins'];
const turns = (...ps) => ps.map(p => ({ t: 'turn', p }));
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const restored = s => resume(JSON.parse(JSON.stringify(s)));
const magentaSlot = key => `2-${quadrant('thieves').actions.findIndex(a => a.key === key)}`;
useCosts({ 'red.twins': [2, 0], 'red.mentor': [3, 2], 'red.panel': [3, 3] });

// These are isolated rule checks, deliberately without seeded full-game simulations.
describe('Magenta redesign edge cases', () => {
  it.each(['pickpocket', 'tipoff', 'hideout', 'rob', 'ransom', 'heist'])('%s always grants one Magenta even when its effect has no target', key => {
    const s = take(table(Q, { round: 3, shop }), `thieves.${key}`);
    expect(s.players[0].res.magenta).toBe(1);
    expect(s.pending.kind).toBe('buy');
    expect(s.players[0].bonus).toBe(key === 'pickpocket' ? 3 : 0);
  });
  it('empty theft still grants the full round follower effect', () => {
    const s = take(table(Q, { round: 2, shop }), 'thieves.pickpocket');
    expect(s.players[0].bonus).toBe(2);
    expect(s.players[0].res.magenta).toBe(1);
  });
  it('occupied actions are counted once, irrespective of minion count or whose they are', () => {
    let s = table(Q, { round: 3, res: [{}, { gold: 20 }], shop });
    s.slots[magentaSlot('pickpocket')] = 0;
    s.squats[magentaSlot('pickpocket')] = [1, 1];
    s.slots[magentaSlot('hideout')] = 1;
    s.slots['0-0'] = 1; // occupied Gold never counts
    s = take(s, 'thieves.tipoff');
    expect(s.pending.count).toEqual({ of: 2, left: 2 });
    s = move(move(s, 'take:1:gold'), 'take:1:gold');
    expect(s.players[0].res).toMatchObject({ magenta: 1, gold: 2 });
  });
  it('copying occupied-action theft excludes no older Magenta placement', () => {
    let s = table(Q, { res: [{}, { gold: 8 }, { red: 8 }], n: 3, shop, queue: turns(1, 0) });
    s = pass(take(s, 'thieves.tipoff')); // no previous occupied Magenta action
    expect(s.players[1].res.magenta).toBe(1);
    s = take(s, 'echo.echo');
    s = move(s, s.pending.options.find(o => o.kind === 'space' && o.label.startsWith(actionName('thieves.tipoff'))).id);
    expect(s.pending.count).toEqual({ of: 1, left: 1 });
    s = move(s, 'take:2:red');
    expect(s.players[0].res).toMatchObject({ green: 1, magenta: 1, red: 1 });
  });
  it('copying Help Yourself grants its resource and followers once, with fresh rival choices', () => {
    let s = table(Q, { round: 2, n: 3, res: [{}, {}, { gold: 9, red: 9 }], shop, queue: turns(1, 0) });
    s = pass(move(move(take(s, 'thieves.pickpocket'), 'take:2:gold'), 'take:2:gold'));
    s = take(s, 'echo.echo');
    s = move(s, s.pending.options.find(o => o.kind === 'space' && o.label.startsWith(actionName('thieves.pickpocket'))).id);
    s = move(move(restored(s), 'take:2:red'), 'take:2:red');
    expect(s.players[0].res).toMatchObject({ green: 1, magenta: 1, red: 2, gold: 0 });
    expect(s.players[0].bonus).toBe(2);
    expect(s.players[1].res).toMatchObject({ magenta: 1, gold: 2 });
    expect(s.players[1].bonus).toBe(2);
  });
  it('JSON resume in a split theft neither repeats base grants nor loses the chosen colors', () => {
    let s = table(Q, { round: 3, n: 3, res: [{}, { gold: 7 }, { red: 7 }], shop });
    s = move(take(s, 'thieves.pickpocket'), 'take:1:gold');
    const before = JSON.stringify(s);
    const finish = x => move(move(x, 'take:2:red'), 'take:1:gold');
    const direct = finish(s), loaded = finish(restored(s));
    expect(JSON.stringify(s)).toBe(before);
    expect(loaded.players.map(p => p.res)).toEqual(direct.players.map(p => p.res));
    expect(loaded.players[0].res).toMatchObject({ magenta: 1, gold: 2, red: 1 });
    expect(loaded.players[0].bonus).toBe(3);
  });
  it('half-stack theft allows a smaller chosen color and excludes singletons and protected rivals', () => {
    let s = table(Q, { round: 2, n: 3, res: [{}, { gold: 9, red: 5 }, { gold: 12, red: 1 }], members: [[], [], ['thieves.watchdog']], shop });
    s = take(s, 'thieves.rob');
    expect(ids(s).sort()).toEqual(['take:1:gold', 'take:1:red']);
    s = move(restored(s), 'take:1:red');
    expect(s.players[0].res).toMatchObject({ magenta: 1, red: 2, gold: 0 });
    expect(s.players[1].res).toMatchObject({ red: 3, gold: 9 });
    expect(s.players[2].res).toMatchObject({ red: 1, gold: 12 });
  });
  it('half-stack theft modifiers apply after rounding but never take more than the selected pile', () => {
    let s = table(Q, { round: 2, res: [{}, { gold: 5 }], members: [['thieves.sticky', 'thieves.desperado']], bonus: [0, 20], shop });
    s = move(take(s, 'thieves.rob'), 'take:1:gold');
    expect(s.players[0].res).toMatchObject({ magenta: 1, gold: 5 });
    expect(s.players[1].res.gold).toBe(0);
  });
  it('Bodyguard blocks resource theft as well as member taking and ransom', () => {
    for (const key of ['pickpocket', 'hideout', 'rob', 'ransom', 'heist']) {
      const s = take(table(Q, { round: 3, res: [{}, { gold: 10 }], members: [[], ['thieves.watchdog', 'red.twins']], shop }), `thieves.${key}`);
      expect(s.pending.kind).toBe('buy');
      expect(s.players[1].res.gold).toBe(10);
      expect(owns(s, 1, 'red.twins')).toBe(true);
      expect(s.players[0].res.magenta).toBe(1);
    }
  });
  it('ransom includes total cost five, excludes six, and resumes for the victim without repeating the grant', () => {
    let s = table(Q, { round: 2, res: [{}, { gold: 3, red: 2 }], members: [[], ['red.mentor', 'red.panel']], shop });
    s = take(s, 'thieves.ransom');
    expect(ids(s)).toEqual([`card:${uidIn(s, 'red.mentor', 1)}`]);
    s = move(s, ids(s)[0]);
    expect(s.pending.player).toBe(1);
    s = move(restored(s), 'pay');
    expect(owns(s, 1, 'red.mentor')).toBe(true);
    expect(s.players[0].res).toMatchObject({ magenta: 1, gold: 3, red: 2 });
    expect(s.players[1].res).toMatchObject({ gold: 0, red: 0 });
  });
  it('Lie Low expires when the round changes', () => {
    let s = table(Q, { res: [{ gold: 4 }, {}], shop, queue: turns(0, 1) });
    s = pass(take(s, 'thieves.hideout'));
    s.round = 2;
    s = move(take(s, 'thieves.pickpocket'), 'take:0:gold');
    s = move(s, 'take:0:gold');
    expect(s.players[1].res).toMatchObject({ magenta: 1, gold: 2 });
  });
});
