// @vitest-environment node
// Equal-cost swaps are deliberately general: any cults or shop, including two rivals.
import { describe, it, expect } from 'vitest';
import { followers } from '../../../engine/v4/core.js';
import { defById, quadrant } from '../../../engine/v4/content/index.js';
import { take, move, uidOf, ids } from './helpers.js';
import { sceneQ } from './cards-helpers.js';
import { useCosts } from './cards-helpers-b.js';
useCosts({ 'red.twins': [1, 1], 'red.bigfamily': [1, 1], 'gold.banker': [2, 0], 'red.intern': [1, 0], 'red.volunteer': [0, 0], 'thieves.watchdog': [1, 1] });
const T = ['gold', 'red', 'thieves', 'echo'];
const cost = (s, uid) => { const d = defById(s.cards[uid].def); return d.s + d.w; };
const choosePair = (s, a, b) => {
  const o = s.pending.options.find(o => Array.isArray(o.value) && o.value.includes(a) && o.value.includes(b));
  if (!o) throw new Error(`Missing pair ${a}/${b}: ${ids(s)}`);
  return move(s, o.id);
};
const owner = (s, uid) => s.players.find(p => p.members.includes(uid))?.id ?? (s.shop.includes(uid) ? 'shop' : null);

describe('Even Swap — any equal-cost pair', () => {
  it('stays in round I and says any 2 members, plus inherent red', () => {
    const a = quadrant('red').actions.find(a => a.key === 'evenswap');
    expect(a.ring).toBe(1); expect(a.text).toMatch(/any 2 members.*equal cost/i);
    expect(a.text).toMatch(/1 red/);
  });
  it('offers only equal printed total costs, including shop targets', () => {
    const s = take(sceneQ({ quadrants: T, n: 3, members: [['red.twins'], ['gold.banker'], ['red.bigfamily']], shop: ['red.intern', 'red.volunteer'] }), 'red.evenswap');
    expect(s.players[0].res.red).toBe(1);
    for (const o of s.pending.options.filter(o => o.kind === 'trade')) expect(cost(s, o.value[0])).toBe(cost(s, o.value[1]));
  });
  it('the swap can be skipped: "Don’t swap" keeps everyone’s members and the +1 red (Cory, 2026-10-22)', () => {
    let s = take(sceneQ({ quadrants: T, n: 3, members: [['red.twins'], ['gold.banker'], ['red.bigfamily']], shop: ['red.intern', 'red.volunteer'] }), 'red.evenswap');
    const before = s.players.map(p => [...p.members]);
    expect(s.pending.options.map(o => o.label)).toContain('Don’t swap');
    s = move(s, 'none');
    expect(s.players.map(p => [...p.members])).toEqual(before);
    expect(s.players[0].res.red).toBe(1);
  });
  it('swaps two rivals even when the actor has no members', () => {
    let s = take(sceneQ({ quadrants: T, n: 3, members: [[], ['red.twins'], ['red.bigfamily']] }), 'red.evenswap');
    const a = uidOf(s, 'red.twins', 1), b = uidOf(s, 'red.bigfamily', 2);
    const before = s.players.map(p => followers(s, p));
    s = choosePair(s, a, b);
    expect(owner(s, a)).toBe(2); expect(owner(s, b)).toBe(1);
    expect(s.players[0].members).toEqual([]);
    expect(followers(s, s.players[1])).toBe(before[1] + 1);
    expect(followers(s, s.players[2])).toBe(before[2] - 1);
  });
  it('swaps an owned member with an equal-cost shop member, without refilling', () => {
    let s = take(sceneQ({ quadrants: T, members: [['red.twins']], shop: ['red.bigfamily'] }), 'red.evenswap');
    const a = uidOf(s, 'red.twins', 0), b = uidOf(s, 'red.bigfamily', 'shop');
    const size = s.shop.length, pile = [...s.pile];
    s = choosePair(s, a, b);
    expect(owner(s, a)).toBe('shop'); expect(owner(s, b)).toBe(0);
    expect(s.shop.length).toBe(size); expect(s.pile).toEqual(pile);
  });
  it('respects Bodyguard and Lie Low when moving a protected rival member away', () => {
    let s = sceneQ({ quadrants: T, n: 3, members: [['red.twins'], ['thieves.watchdog', 'red.bigfamily'], ['gold.banker']], shop: [] });
    s.players[2].hideout = s.round;
    s = take(s, 'red.evenswap');
    for (const o of s.pending?.kind === 'choose' ? s.pending.options.filter(o => o.kind === 'trade') : []) {
      const [a, b] = o.value;
      if (owner(s, a) !== owner(s, b)) expect([owner(s, a), owner(s, b)]).not.toEqual(expect.arrayContaining([1]));
    }
  });
  it('with no equal-cost pair, keeps the inherent resource and finishes', () => {
    let s = sceneQ({ quadrants: T, members: [['red.intern'], ['gold.banker']] });
    s.shop = []; s.pile = [];
    s = take(s, 'red.evenswap');
    expect(s.players[0].res.red).toBe(1);
    expect(s.pending?.kind).not.toBe('choose');
  });
});
