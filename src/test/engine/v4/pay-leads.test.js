// One pay rule everywhere (decisions.md 2026-10-15 17:55; panel tester C): a payment with one way pays at once unless
// it gives up a contest lead or tie you hold; then it asks, saying so. More than one way, the player picks. This covers
// the recruits outside the buy step (Snap Up, Half Price, Talent Scout) and the spaces that spend your coins (Cheap Seats).
import { describe, it, expect, afterEach } from 'vitest';
import { sceneQ } from './cards-helpers.js';
import { take, pinCosts } from './helpers.js';
import { applyMove } from '../../../engine/v4/core.js';
import { payChoice } from '../../../v4/game/PayPicker.jsx';
import { leadWarning, leadsLost } from '../../../v4/game/boardPick.js';

const Q = ['market', 'silver', 'trading', 'gold'];
let restore = null;
afterEach(() => { restore?.(); restore = null; });

function snapUpTo(res, rivalRes) {
  restore = pinCosts({ 'market.stylist': [2, 3] }); // 5 in any colors
  let s = sceneQ({ quadrants: Q, res: [res, rivalRes], shop: ['market.stylist'] });
  s = take(s, 'market.bargain'); // +2 blue, then recruit a face-up member in any colors
  const o = s.pending.options.find(x => x.kind === 'card' && s.cards[x.value].def === 'market.stylist');
  return applyMove(s, { player: 0, option: o.id });
}

describe('one way to pay that gives up a lead asks first', () => {
  it('Snap Up: the only way spends the silver P1 leads with, so the pay sheet asks (with Cancel)', () => {
    const s = snapUpTo({ silver: 3 }, { silver: 2, blue: 4 });
    expect(s.pending.kind).toBe('choose');
    const pays = s.pending.options.filter(o => o.kind === 'pay');
    expect(pays).toHaveLength(1);
    expect(pays[0].breaks).toContain('silver');
    expect(s.pending.options.some(o => o.kind === 'back')).toBe(true);
    expect(payChoice(s.pending)).toBe(true);
    expect(s.players[0].members).toHaveLength(0);
    // Cancel recruits nothing and keeps the coins
    const c = applyMove(s, { player: 0, option: 'back' });
    expect(c.players[0].res.silver).toBe(3);
    expect(c.log.some(l => /recruits nothing/.test(l))).toBe(true);
  });
  it('Snap Up: the only way gives up no lead, so it pays at once', () => {
    const s = snapUpTo({ silver: 3 }, { silver: 5, blue: 5 });
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[0].members).toHaveLength(1);
    expect(s.players[0].res.silver).toBe(0);
  });
  it('Snap Up: several ways, the player picks', () => {
    const s = snapUpTo({ silver: 3, gold: 3 }, { silver: 5, blue: 5, gold: 5 });
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.filter(o => o.kind === 'pay').length).toBeGreaterThan(1);
    expect(payChoice(s.pending)).toBe(true);
  });
});

describe('a space that spends your coins marks the answers that give up a lead', () => {
  it('Cheap Seats: paying silver while tied for silver is marked; gold (no lead) is not', () => {
    let s = sceneQ({ quadrants: Q, res: [{ silver: 3, gold: 2 }, { silver: 3, gold: 4 }] });
    s = take(s, 'trading.buylow');
    expect(s.pending.kind).toBe('choose');
    const by = id => s.pending.options.find(o => o.id === id);
    expect(by('color:silver').breaks).toEqual(['silver']);
    expect(by('color:gold').breaks).toBeUndefined();
    // a tie is called a tie, never a lead (blind tester B), and the picker's caption says it before the click
    expect(by('color:silver').ties).toEqual(['silver']);
    expect(leadWarning(s.pending.options)).toBe('Spending silver gives up your tie for most silver.');
  });
});

describe('the warning words', () => {
  it('say lead for a lead and tie for a tie', () => {
    expect(leadsLost(['gold'])).toBe('your lead in gold');
    expect(leadsLost(['gold', 'silver'], ['silver'])).toBe('your lead in gold and your tie for most silver');
  });
});
