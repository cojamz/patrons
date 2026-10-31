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
  it.each(['pickpocket', 'hideout', 'rob', 'ransom', 'heist'])('%s always grants one Magenta even when its effect has no target (Help Yourself none, Oct 29)', key => {
    const s = take(table(Q, { round: 3, shop }), `thieves.${key}`);
    // Help Yourself gives no magenta (Cory, 2026-10-29), so with nothing to take its taker has nothing to buy with
    expect(s.players[0].res.magenta).toBe(key === 'pickpocket' ? 0 : 1);
    if (key !== 'pickpocket') expect(s.pending.kind).toBe('buy');
    expect(s.players[0].bonus).toBe(0);
  });
  it('empty theft takes no followers: there is no one to take them from (Cory, Oct 22)', () => {
    const s = take(table(Q, { round: 2, shop }), 'thieves.pickpocket');
    expect(s.players[0].bonus).toBe(0);
    expect(s.players[0].res.magenta).toBe(0);
  });
  it('Stash: +5 magenta in round III, its own +1 included, with no target needed', () => {
    const s = take(table(Q, { round: 3, shop }), 'thieves.tipoff');
    expect(s.players[0].res.magenta).toBe(5);
    expect(s.pending.kind).toBe('buy');
  });
  it('copying Stash gives its magenta for the current round', () => {
    let s = table(Q, { res: [{}, { gold: 8 }, { red: 8 }], n: 3, shop, queue: turns(1, 0) });
    s = pass(take(s, 'thieves.tipoff'));
    expect(s.players[1].res.magenta).toBe(3);
    s = take(s, 'echo.echo');
    s = move(s, s.pending.options.find(o => o.kind === 'space' && o.label.startsWith(actionName('thieves.tipoff'))).id);
    expect(s.players[0].res).toMatchObject({ green: 1, magenta: 3 });
  });
  it('copying Help Yourself grants its resource once, with fresh rival choices and no followers', () => {
    let s = table(Q, { round: 2, n: 3, res: [{}, {}, { gold: 9, red: 9 }], bonus: [0, 0, 5], shop, queue: turns(1, 0) });
    s = take(s, 'thieves.pickpocket');
    for (let k = 0; k < 4; k++) s = move(s, 'take:2:gold');
    s = pass(s);
    s = take(s, 'echo.echo');
    s = move(s, s.pending.options.find(o => o.kind === 'space' && o.label.startsWith(actionName('thieves.pickpocket'))).id);
    s = restored(s);
    for (let k = 0; k < 4; k++) s = move(s, 'take:2:red');
    expect(s.players[0].res).toMatchObject({ green: 1, magenta: 0, red: 4, gold: 0 });
    expect(s.players[1].res).toMatchObject({ magenta: 0, gold: 4 });
    expect(s.players.map(p => p.bonus)).toEqual([0, 0, 5]);
  });
  it('JSON resume in a split theft neither repeats base grants nor loses the chosen colors', () => {
    let s = table(Q, { round: 3, n: 3, res: [{}, { gold: 7 }, { red: 7 }], bonus: [0, 5, 5], shop });
    s = move(take(s, 'thieves.pickpocket'), 'take:1:gold');
    const before = JSON.stringify(s);
    const finish = x => ['take:2:red', 'take:1:gold', 'take:2:red', 'take:1:gold'].reduce(move, x);
    const direct = finish(s), loaded = finish(restored(s));
    expect(JSON.stringify(s)).toBe(before);
    expect(loaded.players.map(p => p.res)).toEqual(direct.players.map(p => p.res));
    expect(loaded.players[0].res).toMatchObject({ magenta: 0, gold: 3, red: 2 });
    expect(loaded.players[0].bonus).toBe(0);
  });
  it('Desperado doubles Help Yourself\'s 3 while tied for fewest followers', () => {
    let s = table(Q, { round: 1, res: [{}, { gold: 8 }], members: [['thieves.desperado']], bonus: [0, 1], shop });
    s = take(s, 'thieves.pickpocket');
    expect(s.pending.count.left).toBe(6);
    for (let k = 0; k < 6; k++) s = move(s, 'take:1:gold');
    expect(s.players[0].bonus).toBe(0);
    expect(s.players[0].res).toMatchObject({ gold: 6, magenta: 0 });
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
      if (key !== 'pickpocket') expect(s.pending.kind).toBe('buy'); // Help Yourself gives no magenta: nothing to buy with
      expect(s.players[1].res.gold).toBe(10);
      expect(owns(s, 1, 'red.twins')).toBe(true);
      expect(s.players[0].res.magenta).toBe(key === 'pickpocket' ? 0 : 1);
    }
  });
  it('ransom includes total cost five, excludes six, and resumes for the victim without repeating the grant', () => {
    let s = table(Q, { round: 2, res: [{}, { gold: 3, red: 2 }], members: [[], ['red.mentor', 'red.panel']], shop });
    s = take(s, 'thieves.ransom');
    // one rival, one member at 5 or less: no picks, straight to the holder's answer
    expect(s.pending.player).toBe(1);
    expect(ids(s)).toEqual(['pay', 'let']);
    s = move(restored(s), 'pay');
    expect(owns(s, 1, 'red.mentor')).toBe(true);
    expect(s.players[0].res).toMatchObject({ magenta: 1, gold: 3, red: 2 });
    expect(s.players[1].res).toMatchObject({ gold: 0, red: 0 });
  });
  it('Lie Low expires when the round changes', () => {
    let s = table(Q, { res: [{ gold: 4 }, {}], shop, queue: turns(0, 1) });
    s = pass(take(s, 'thieves.hideout'));
    s.round = 2;
    s = take(s, 'thieves.pickpocket');
    for (let k = 0; k < 4; k++) s = move(s, 'take:0:gold');
    expect(s.players[1].res).toMatchObject({ magenta: 0, gold: 4 });
  });
});
