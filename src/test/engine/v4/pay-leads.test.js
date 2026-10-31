// One pay rule everywhere (decisions.md 2026-10-15 17:55; panel tester C): a payment with one way pays at once unless
// it gives up a contest lead or tie you hold; then it asks, saying so. More than one way, the player picks. This covers
// the recruits outside the buy step (Talent Scout) and follower purchases. Cheap Seats grants followers for held white and no longer spends coins.
import { describe, it, expect, afterEach } from 'vitest';
import { sceneQ } from './cards-helpers.js';
import { take, pinCosts } from './helpers.js';
import { applyMove } from '../../../engine/v4/core.js';
import { payChoice } from '../../../v4/game/PayPicker.jsx';
import { leadWarning, leadsLost } from '../../../v4/game/boardPick.js';

const Q = ['market', 'silver', 'trading', 'gold'];
let restore = null;
afterEach(() => { restore?.(); restore = null; });

// Talent Scout recruits off the top of the pile, outside the buy step, through the same pay rule
function scoutTo(res, rivalRes) {
  restore = pinCosts({ 'market.stylist': [0, 5] }); // 5 in any colors
  let s = sceneQ({ quadrants: Q, res: [res, rivalRes], members: [['market.blackmarket']] });
  const st = Number(Object.keys(s.cards).find(u => s.cards[u].def === 'market.stylist'));
  s.shop = s.shop.filter(u => u !== st); s.pile = [st, ...s.pile.filter(u => u !== st)];
  const scout = s.players[0].members[0];
  s = applyMove(s, { player: 0, option: `use:${scout}` });
  return applyMove(s, { player: 0, option: `card:${st}` });
}

describe('one way to pay that gives up a lead asks first', () => {
  it('Talent Scout: the only way spends the silver P1 leads with, so the pay sheet asks (with Cancel)', () => {
    const s = scoutTo({ silver: 3, blue: 2 }, { silver: 2, blue: 4 });
    expect(s.pending.kind).toBe('choose');
    const pays = s.pending.options.filter(o => o.kind === 'pay');
    expect(pays).toHaveLength(1);
    expect(pays[0].breaks).toContain('silver');
    expect(s.pending.options.some(o => o.kind === 'back')).toBe(true);
    expect(payChoice(s.pending)).toBe(true);
    expect(s.players[0].members).toHaveLength(1);
    // Cancel recruits nothing and keeps the coins
    const c = applyMove(s, { player: 0, option: 'back' });
    expect(c.players[0].res.silver).toBe(3);
    expect(c.log.some(l => /recruits nothing/.test(l))).toBe(true);
  });
  it('Talent Scout: the only way gives up no lead, so it pays at once', () => {
    const s = scoutTo({ silver: 3, blue: 2 }, { silver: 5, blue: 5 });
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[0].members).toHaveLength(2);
    expect(s.players[0].res.silver).toBe(0);
  });
  it('Talent Scout: several ways, the player picks', () => {
    const s = scoutTo({ silver: 3, gold: 3, blue: 2 }, { silver: 5, blue: 5, gold: 5 });
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.filter(o => o.kind === 'pay').length).toBeGreaterThan(1);
    expect(payChoice(s.pending)).toBe(true);
  });
});

describe('follower payments mark the answers that give up a lead', () => {
  it('buying followers: paying silver while tied for silver is marked; gold (no lead) is not', () => {
    let s = sceneQ({ quadrants: Q, res: [{ silver: 3, gold: 2 }, { silver: 3, gold: 4 }], queue: [{ t: 'buy', p: 0 }] });
    s = applyMove(s, { player: 0, option: 'tier:small' });
    expect(s.pending.kind).toBe('pay');
    const by = color => s.pending.options.find(o => o.spend?.[color] === 1 && o.spend?.gold === (color === 'gold' ? 1 : 0));
    expect(by('silver').breaks).toEqual(['silver']);
    expect(by('gold').breaks).toBeUndefined();
    // a tie is called a tie, never a lead (blind tester B), and the picker's caption says it before the click
    expect(by('silver').ties).toEqual(['silver']);
    expect(leadWarning(s.pending.options)).toBe('Spending silver gives up your tie for most silver.');
  });
});

// The full-set contest left with Yellow 2.0 (Oct 31: most yellow, as every 2.0 color); the lead cases above cover it.
describe('a payment that cuts a member’s game-end bonus is marked (tester A: Kingpin paid +0 unwarned)', () => {
  // Kingpin counted held magenta until Oct 21 (now: per magenta member), so Tycoon carries the case
  it('buying followers: paying gold cuts Tycoon (+1 per 2 gold); paying magenta does not', () => {
    let s = sceneQ({ quadrants: ['gold', 'silver', 'trading', 'thieves'], res: [{ gold: 2, magenta: 3 }, { magenta: 9, gold: 9 }], members: [['gold.tycoon'], []], queue: [{ t: 'buy', p: 0 }] });
    s = applyMove(s, { player: 0, option: 'tier:small' });
    expect(s.pending.kind).toBe('pay');
    const by = color => s.pending.options.find(o => o.spend?.[color] === 1 && Object.values(o.spend).reduce((x, y) => x + y, 0) === 1);
    expect(by('gold').cuts).toEqual([{ member: 'Tycoon', from: 1, to: 0 }]);
    expect(by('magenta').cuts).toBeUndefined();
  });
});

describe('the warning words', () => {
  it('say lead for a lead and tie for a tie', () => {
    expect(leadsLost(['gold'])).toBe('your lead in gold');
    expect(leadsLost(['gold', 'silver'], ['silver'])).toBe('your lead in gold and your tie for most silver');
  });
});
