// @vitest-environment node
// The members from Cory's member structure (2026-10-24): Red, Magenta and Blue's once per game, Blue's round start,
// and the go-deep game end for Purple and White. Each against its printed text, through real legal moves.
import { describe, it, expect } from 'vitest';
import { defById, quadrant } from '../../../engine/v4/content/index.js';
import { contextFor } from '../../../engine/v4/core.js';
import { move, ids } from './helpers.js';
import { table, named, uidIn, owns } from './cards-helpers-b.js';

const buy = { queue: [{ t: 'buy', p: 0 }] };
const use = (s, def) => move(s, `use:${uidIn(s, def, 0)}`);
const cost = id => { const d = defById(id); return d.s + d.w; };

describe('member structure: the new members', () => {
  it('Headhunter: swaps a rival’s member with a shop member of equal or greater cost, never a cheaper one', () => {
    const Q = ['gold', 'red', 'market', 'thieves'];
    let s = use(table(Q, { members: [['red.headhunter'], ['red.twins']], shop: ['gold.tycoon', 'red.volunteer'], ...buy }), 'red.headhunter');
    const twins = uidIn(s, 'red.twins', 1), tycoon = uidIn(s, 'gold.tycoon', 'shop'), volunteer = uidIn(s, 'red.volunteer', 'shop');
    expect(ids(s)).toContain(`trade:${twins}:${tycoon}`);
    expect(ids(s)).not.toContain(`trade:${twins}:${volunteer}`);
    expect(ids(s).some(id => id.startsWith(`trade:${uidIn(s, 'red.headhunter', 0)}:`))).toBe(false); // not your own
    s = move(s, `trade:${twins}:${tycoon}`);
    expect([owns(s, 1, 'gold.tycoon'), owns(s, 1, 'red.twins'), s.shop.includes(twins)]).toEqual([true, false, true]);
  });

  it('Fixer: spends magenta equal to the member’s cost to steal it, only members it can pay for', () => {
    const Q = ['gold', 'red', 'market', 'thieves'];
    const m = cost('red.twins');
    let s = use(table(Q, { res: [{ magenta: m + 1 }], members: [['thieves.fixer'], ['red.twins', 'gold.tycoon']], ...buy }), 'thieves.fixer');
    expect(ids(s)).toEqual([`card:${uidIn(s, 'red.twins', 1)}`]);
    s = move(s, ids(s)[0]);
    expect([owns(s, 0, 'red.twins'), owns(s, 1, 'red.twins'), s.players[0].res.magenta]).toEqual([true, false, 1]);
    expect(named(s, 'Fixer')).toHaveLength(1);
  });

  it('Restocker: once per game, the whole row goes to the bottom of the pile and refills', () => {
    const Q = ['gold', 'red', 'market', 'thieves'];
    let s = table(Q, { members: [['market.restocker']], shop: ['gold.tycoon', 'red.volunteer', 'red.twins'], ...buy });
    const old = [...s.shop];
    s = use(s, 'market.restocker');
    expect(s.shop.some(u => old.includes(u))).toBe(false);
    expect(s.pile.slice(-old.length).sort()).toEqual([...old].sort());
    expect(named(s, 'Restocker')).toHaveLength(1);
  });

  it('Window Shopper: at round start, one shop member goes to the bottom of the pile, +1 of its color', () => {
    const Q = ['gold', 'red', 'market', 'thieves'];
    let s = table(Q, { round: 1, members: [['market.windowshopper']], queue: [{ t: 'round', r: 2 }] });
    expect(s.pending?.player).toBe(0);
    const uid = Number(s.pending.options[0].id.split(':')[1]);
    const color = quadrant(s.cards[uid].def.split('.')[0]).resource;
    const before = s.players[0].res[color] || 0;
    s = move(s, s.pending.options[0].id);
    expect(s.pile[s.pile.length - 1]).toBe(uid);
    expect(s.shop.includes(uid)).toBe(false);
    if (s.resources.includes(color)) expect(s.players[0].res[color]).toBe(before + 1);
    expect(named(s, 'Window Shopper')).toHaveLength(1);
  });

  it('Timekeepers and Old Money: game end, +1 follower per member of their color', () => {
    const s = table(['purple', 'trading', 'red', 'gold'], { members: [['purple.timekeepers', 'purple.closer', 'trading.oldmoney', 'trading.shopkeeper', 'red.twins']] });
    const ctx = contextFor(s), p = s.players[0];
    expect(defById('purple.timekeepers').onGameEnd(ctx, p)).toBe(2);
    expect(defById('trading.oldmoney').onGameEnd(ctx, p)).toBe(2);
  });
});
