// Players choose how to pay: which colors cover "any", and which part a discount comes off.
import { describe, it, expect } from 'vitest';
import { scene, move, uidOf, play } from './helpers.js';
import { memberCount } from '../../../engine/v4/core.js';

const buyPhase = opts => scene({ ...opts, queue: [{ t: 'buy', p: 0 }] });

describe('choosing how to pay', () => {
  it('offers every no-waste way to pay "any", default first, and charges exactly that', () => {
    // Banker: 2 gold + 1 any. Holding 3 gold, 1 red, 1 blue: any can be gold, red or blue.
    let s = buyPhase({ res: [{ gold: 3, red: 1, blue: 1 }], shop: ['gold.banker'] });
    const uid = uidOf(s, 'gold.banker', 'shop');
    s = move(s, `card:${uid}`, { manualPay: true });
    expect(s.pending.kind).toBe('pay');
    const pays = s.pending.options.filter(o => o.kind === 'pay').map(o => o.id).sort();
    expect(pays).toEqual(['pay:2-0-1-0', 'pay:2-1-0-0', 'pay:3-0-0-0']);
    expect(s.pending.options.find(o => o.default).id).not.toBe('pay:3-0-0-0'); // gold is spent last by default
    s = move(s, 'pay:3-0-0-0');
    expect(s.players[0].res).toMatchObject({ gold: 0, red: 1, blue: 1 });
    expect(s.players[0].members).toContain(uid);
  });

  it('a discount can come off the "any" part instead of the color part', () => {
    // Midas: 3 gold + 2 any, Discount 2. Keep gold by letting the discount cover "any".
    let s = buyPhase({ res: [{ gold: 3, red: 2 }], shop: ['gold.midas'], discount: [2] });
    const uid = uidOf(s, 'gold.midas', 'shop');
    s = move(s, `card:${uid}`, { manualPay: true });
    const pays = s.pending.options.filter(o => o.kind === 'pay').map(o => o.id);
    expect(pays).toContain('pay:3-0-0-0'); // discount took the whole "any" part
    expect(pays).toContain('pay:1-2-0-0'); // discount took 2 off the gold part
    s = move(s, 'pay:3-0-0-0');
    expect(s.players[0].res).toMatchObject({ gold: 0, red: 2 });
    expect(s.players[0].discount).toBe(0);
  });

  it('Back returns to the buy choice without spending anything', () => {
    let s = buyPhase({ res: [{ gold: 3, red: 1, blue: 1 }], shop: ['gold.banker'] });
    const before = structuredClone(s.players[0].res);
    s = move(s, `card:${uidOf(s, 'gold.banker', 'shop')}`, { manualPay: true });
    s = move(s, 'back');
    expect(s.pending.kind).toBe('buy');
    expect(s.players[0].res).toEqual(before);
  });

  it('only one way to pay: no payment question', () => {
    let s = buyPhase({ res: [{ gold: 2, red: 1 }], shop: ['gold.banker'] });
    s = move(s, `card:${uidOf(s, 'gold.banker', 'shop')}`, { manualPay: true });
    expect(s.pending?.kind).not.toBe('pay');
    expect(s.players[0].res).toMatchObject({ gold: 0, red: 0 });
  });

  it('follower buys let you pick the colors', () => {
    let s = buyPhase({ res: [{ gold: 2, red: 2, blue: 2 }] });
    s = move(s, 'tier:mid', { manualPay: true });
    const pays = s.pending.options.filter(o => o.kind === 'pay').map(o => o.id);
    expect(pays).toContain('pay:2-2-0-0');
    expect(pays).toContain('pay:0-2-2-0');
    s = move(s, 'pay:0-2-2-0');
    expect(s.players[0].res).toMatchObject({ gold: 2, red: 0, blue: 0 });
  });
});

describe('Doppelganger copies member count', () => {
  it('copying Twins makes it count as 2 members', () => {
    let s = buyPhase({ res: [{ red: 2, blue: 2 }], members: [['red.twins']], shop: ['red.doppel'] });
    const before = memberCount(s, s.players[0]);
    s = move(s, `card:${uidOf(s, 'red.doppel', 'shop')}`);
    if (s.pending?.kind === 'choose') s = play(s, o => o.label === 'Twins');
    expect(memberCount(s, s.players[0])).toBe(before + 2);
  });
});

describe('Doppelganger becomes a copy of the card', () => {
  it('copying Twins is worth 2 followers as well as 2 members', async () => {
    const { followers } = await import('../../../engine/v4/core.js');
    let s = buyPhase({ res: [{ red: 2, blue: 2 }], members: [['red.twins']], shop: ['red.doppel'] });
    const before = followers(s, s.players[0]);
    s = move(s, `card:${uidOf(s, 'red.doppel', 'shop')}`);
    if (s.pending?.kind === 'choose') s = play(s, o => o.label === 'Twins');
    expect(followers(s, s.players[0])).toBe(before + 2);
  });
});
