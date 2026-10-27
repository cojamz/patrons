// @vitest-environment node
// Blue concept cards on claude/members-blue-v2 (Cory's Oct 21 calls plus Claude's fill-in counters), not shipped.
import { describe, it, expect } from 'vitest';
import { quadrant } from '../../../engine/v4/content/index.js';
import { take, move } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'market', 'thieves'];
useCosts({ 'gold.tycoon': [8, 4], 'red.bigfamily': [4, 4], 'red.twins': [2, 2], 'red.intern': [2, 0], 'gold.taxman': [2, 2], 'red.volunteer': [0, 0] });
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const def = id => quadrant('market').members.find(d => d.id === id);
const card = (s, d) => `card:${uidIn(s, d, 'shop')}`;

describe('Blue concepts', () => {
  it('texts read as Cory said them', () => {
    expect(def('market.makeover').text).toBe('On Recruit: send the whole shop to the bottom of the pile, then refill.');
    expect(def('market.regular').text).toBe('Whenever you buy followers, +1 blue.');
    expect(def('market.critic').text).toBe('Whenever a rival recruits a blue member, +1 follower.');
    expect(def('market.patroness').text).toBe('Whenever a shop member goes to the bottom of the pile, +1 follower.');
    expect(def('market.connoisseur').text).toBe('Whenever you recruit a blue member, +1 blue.');
    expect(def('market.plusone').f).toBe(2);
  });
  it('Makeover: the whole old shop goes to the bottom, the row refills, Patroness pays once', () => {
    let s = table(Q, { members: [[], ['market.patroness']], res: [{ blue: 9, gold: 9 }], shop: ['market.makeover', ...ROW.slice(1)] });
    const old = [...s.shop].filter(u => s.cards[u].def !== 'market.makeover');
    s = move(take(s, 'thieves.tipoff'), card(s, 'market.makeover'));
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(owns(s, 0, 'market.makeover')).toBe(true);
    expect(s.shop.some(u => old.includes(u))).toBe(false);
    expect(s.players[1].bonus).toBe(1);
  });
  it('Critic: a rival recruits blue, +1 follower, named', () => {
    let s = table(Q, { members: [[], ['market.critic']], res: [{ blue: 9, gold: 9 }], shop: ['market.makeover', ...ROW.slice(1)] });
    s = move(take(s, 'thieves.tipoff'), card(s, 'market.makeover'));
    expect(s.players[1].bonus).toBe(1);
    expect(named(s, 'Critic').length).toBe(1);
  });
  // the fire audit deals members straight into hands, so these recruit-only cards are checked here (2026-10-22)
  it('Plus-One and Window Dresser: recruited, they act and the log names them', () => {
    let s = table(Q, { res: [{ blue: 9, gold: 9 }], shop: ['market.plusone', ...ROW.slice(1)] });
    s = move(take(s, 'thieves.tipoff'), card(s, 'market.plusone'));
    expect(owns(s, 0, 'market.plusone')).toBe(true);
    expect(named(s, 'Plus-One').length).toBeGreaterThan(0);
    let t = table(Q, { res: [{ blue: 9, gold: 9 }], shop: ['market.windowdresser', ...ROW.slice(1)] });
    t = move(take(t, 'thieves.tipoff'), card(t, 'market.windowdresser'));
    while (t.pending?.kind === 'choose') t = move(t, t.pending.options[0].id);
    expect(owns(t, 0, 'market.windowdresser')).toBe(true);
    expect(named(t, 'Window Dresser').length).toBeGreaterThan(0);
  });
});
