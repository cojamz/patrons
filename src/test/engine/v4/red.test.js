// @vitest-environment node
// Red and the stand-ins: every action and every member hook, with exact numbers.
import { describe, it, expect } from 'vitest';
import { memberCount } from '../../../engine/v4/core.js';
import { scene, take, move, uidOf, ids, hasOpt, fol, useTestCosts } from './helpers.js';
import { SHOP_SIZE } from '../../../engine/v4/core.js';

useTestCosts();

const R = s => s.players.map(p => p.res);
const defs = (s, i) => s.players[i].members.map(u => s.cards[u].def);
const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'];

describe('Red actions', () => {
  // Even Swap (ring I, replaced Scout): src/test/engine/v4/even-swap.test.js

  it('Bandwagon: +1 red per member recruited this round, by anyone', () => {
    let s = scene({ shop: ['red.volunteer', ...SHOP.slice(1)], queue: [{ t: 'turn', p: 1 }, { t: 'turn', p: 0 }] });
    s = take(s, 'red.hire');
    expect(s.recruits).toBe(1);
    s = take(s, 'red.turnout');
    expect(R(s)[0].red).toBe(1);
    const z = scene({});
    expect(R(take(z, 'red.turnout'))[0].red).toBe(0);
  });

  it('Open Door: recruits the single cheapest face-up member for free', () => {
    let s = scene({ res: [{ gold: 9 }], shop: ['red.volunteer', ...SHOP.slice(1)] });
    s = take(s, 'red.hire');
    expect(defs(s, 0)).toEqual(['red.volunteer']);
    expect(R(s)[0].gold).toBe(9);
    expect(s.shop).toHaveLength(SHOP_SIZE);
  });

  it('Open Door: a tie for cheapest asks which', () => {
    let s = scene({ shop: ['red.intern', 'red.crowd', 'gold.midas', 'gold.jackpot', 'red.mentor', 'red.bigfamily'] });
    s = take(s, 'red.hire');
    expect(s.pending.kind).toBe('choose');
    const crowd = uidOf(s, 'red.crowd', 'shop');
    expect(ids(s).sort()).toEqual([`card:${uidOf(s, 'red.intern', 'shop')}`, `card:${crowd}`].sort());
    s = move(s, `card:${crowd}`);
    expect(defs(s, 0)).toEqual(['red.crowd']);
  });

  it('Open House: recruit a face-up member costing 4 or less, free (round II), your pick; no red', () => {
    expect(() => take(scene({ round: 1 }), 'red.hireup')).toThrow();
    let s = take(scene({ round: 2, shop: ['red.volunteer', ...SHOP.slice(1)] }), 'red.hireup');
    // Volunteer 0, Tycoon 4 and Big Family 4; not Midas or Mentor (5), Lottery Winner or Proselytizer (6)
    const ok = ['red.volunteer', 'gold.tycoon', 'red.bigfamily'].map(d => `card:${uidOf(s, d, 'shop')}`);
    expect(ids(s).sort()).toEqual(ok.sort());
    s = move(s, `card:${uidOf(s, 'gold.tycoon', 'shop')}`);
    expect(defs(s, 0)).toEqual(['gold.tycoon']);
    expect(R(s)[0]).toEqual({ gold: 0, red: 0, blue: 0, green: 0 }); // free, and no +2 red any more
    // nothing that cheap face up: nothing, said in the log
    const t = take(scene({ round: 2, shop: ['gold.midas', 'gold.jackpot', 'red.mentor', 'red.proselytizer', 'gold.speculator', 'blue.pillar'] }), 'red.hireup');
    expect(defs(t, 0)).toEqual([]);
    expect(t.log).toContain('Open House: no face-up member costs 4 or less, so P1 recruits nothing.');
  });

  it('Swap Sides: swap for another player\'s member costing no more than yours +2', () => {
    let s = scene({ round: 2, members: [['red.intern'], ['gold.banker', 'red.twins', 'red.volunteer', 'gold.midas']] });
    s = take(s, 'red.trade');
    const intern = uidOf(s, 'red.intern', 0), twins = uidOf(s, 'red.twins', 1), vol = uidOf(s, 'red.volunteer', 1), banker = uidOf(s, 'gold.banker', 1);
    // Intern costs 1: Banker (3) is in reach, Midas (5) is not
    expect(ids(s).sort()).toEqual([`trade:${intern}:${twins}`, `trade:${intern}:${vol}`, `trade:${intern}:${banker}`].sort());
    s = move(s, `trade:${intern}:${twins}`);
    expect(defs(s, 0)).toEqual(['red.twins']);
    expect(defs(s, 1).sort()).toEqual(['gold.banker', 'gold.midas', 'red.intern', 'red.volunteer']);
    expect(fol(s, 0)).toBe(3);
  });

  it('Swap Sides with nothing to trade does nothing', () => {
    const s = take(scene({ round: 2, members: [['red.intern'], ['gold.midas']] }), 'red.trade');
    expect(defs(s, 0)).toEqual(['red.intern']);
    expect(s.pending?.kind).not.toBe('choose');
  });

  it('Hand-pick: any face-up member free (round III)', () => {
    let s = scene({ round: 3, shop: SHOP });
    s = take(s, 'red.take');
    expect(ids(s)).toHaveLength(6); // the hand-made scene has 6 face up
    s = move(s, `card:${uidOf(s, 'gold.jackpot', 'shop')}`);
    expect(defs(s, 0)).toEqual(['gold.jackpot']);
    expect(R(s)[0]).toEqual({ gold: 0, red: 0, blue: 0, green: 0 });
  });
});

describe('Stand-in actions are plain gains', () => {
  const cases = [
    ['Tide', 1, { blue: 3 }], ['Current', 1, { blue: 2, red: 1 }], ['Shoal', 1, { blue: 2, green: 1 }],
    ['Swell', 2, { blue: 5 }], ['Harbor', 2, { blue: 4, gold: 1 }], ['Flood', 3, { blue: 8 }],
    ['Sprout', 1, { green: 3 }], ['Graft', 1, { green: 2, gold: 1 }], ['Root', 1, { green: 2, blue: 1 }],
    ['Grove', 2, { green: 5 }], ['Orchard', 2, { green: 4, red: 1 }], ['Bloom', 3, { green: 8 }],
  ];
  for (const [name, round, want] of cases) it(name, () => {
    const s = take(scene({ round }), name);
    expect(R(s)[0]).toEqual({ gold: 0, red: 0, blue: 0, green: 0, ...want });
  });
});

describe('Red members', () => {
  it('Twins is worth 2 followers, Big Family 3, and each is one member', () => {
    const s = scene({ members: [['red.twins', 'red.bigfamily', 'red.intern']] });
    expect(memberCount(s, s.players[0])).toBe(3);
    expect(fol(s, 0)).toBe(1 + 2 + 3 + 1);
  });

  it('Volunteer is free to recruit', () => {
    let s = scene({ shop: ['red.volunteer', ...SHOP.slice(1)] });
    s = take(s, 'red.turnout');
    const vol = uidOf(s, 'red.volunteer', 'shop');
    expect(ids(s)).toEqual([`card:${vol}`, 'pass']);
    s = move(s, `card:${vol}`);
    expect(fol(s, 0)).toBe(2);
  });

  it('Mentor & Protégé: also take the cheapest face-up member free', () => {
    let s = scene({ res: [{ red: 3, gold: 2 }], shop: ['red.mentor', 'red.intern', 'gold.midas', 'gold.jackpot', 'red.bigfamily', 'gold.tycoon'], pileFirst: ['red.volunteer'] });
    s = take(s, 'red.turnout');
    s = move(s, `card:${uidOf(s, 'red.mentor', 'shop')}`);
    // the Volunteer refilled into the shop and is now the cheapest
    expect(defs(s, 0)).toEqual(['red.mentor', 'red.volunteer']);
    expect(R(s)[0]).toEqual({ gold: 0, red: 0, blue: 0, green: 0 });
    expect(s.shop).toHaveLength(SHOP_SIZE);
  });

  it('Proselytizer: +1 follower whenever you recruit (not for itself)', () => {
    let s = scene({ res: [{ red: 3, gold: 3 }], shop: ['red.proselytizer', 'red.volunteer', 'gold.midas', 'gold.jackpot', 'red.bigfamily', 'gold.tycoon'], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }] });
    s = take(s, 'red.turnout');
    s = move(s, `card:${uidOf(s, 'red.proselytizer', 'shop')}`);
    expect(s.players[0].bonus).toBe(0);
    s = take(s, 'red.hire');
    expect(s.players[0].bonus).toBe(1);
    expect(fol(s, 0)).toBe(1 + 1 + 2);
  });

  it('Mob: game end +1 follower per red member', () => {
    const s = scene({ members: [['red.mob', 'red.twins', 'red.intern', 'gold.banker']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(3);
  });

  it('Recruiter: +1 red whenever you recruit (not for itself)', () => {
    let s = scene({ members: [['red.recruiter']], shop: ['red.volunteer', ...SHOP.slice(1)] });
    s = take(s, 'red.hire');
    expect(R(s)[0].red).toBe(1);
    const t = scene({ members: [[], ['red.recruiter']], shop: ['red.volunteer', ...SHOP.slice(1)] });
    expect(R(take(t, 'red.hire'))[1].red).toBe(0);
  });

  it('Pied Piper: 2+ recruits in one turn gives +2 red at turn end', () => {
    let s = scene({ members: [['red.drive']], res: [{ red: 1 }], shop: ['red.volunteer', 'red.intern', ...SHOP.slice(2)] });
    s = take(s, 'red.hire');
    expect(R(s)[0].red).toBe(1);
    s = move(s, `card:${uidOf(s, 'red.intern', 'shop')}`);
    expect(s.pending).toBe(null);
    expect(R(s)[0].red).toBe(2);
    let t = scene({ members: [['red.drive']], shop: ['red.volunteer', ...SHOP.slice(1)] });
    t = take(t, 'red.hire'); // nothing affordable after: only Release (a base rule) or pass
    expect(t.pending.options.every(o => o.kind === 'release' || o.kind === 'pass')).toBe(true);
    expect(R(t)[0].red).toBe(0);
  });

  it('Host: at round start +1 red per 2 members', () => {
    const s = scene({ members: [['red.host', 'red.twins', 'red.intern', 'red.crowd', 'gold.banker']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)[0].red).toBe(2);
  });

  it('Sponsor: members cost 2 less, and stacks with Intro Offer', () => {
    let s = scene({ members: [['red.sponsor']], res: [{ blue: 1 }], shop: ['gold.prospector', ...SHOP.slice(1)] });
    s = take(s, 'red.turnout');
    s = move(s, `card:${uidOf(s, 'gold.prospector', 'shop')}`);
    expect(R(s)[0]).toEqual({ gold: 0, red: 0, blue: 0, green: 0 });
    let t = scene({ members: [['red.sponsor']], shop: ['gold.prospector', ...SHOP.slice(1)] });
    t = take(t, 'gold.discount');
    expect(hasOpt(t, `card:${uidOf(t, 'gold.prospector', 'shop')}`)).toBe(true);
  });

  it('Crowd-Pleaser: +1 red whenever you buy followers', () => {
    let s = scene({ members: [['red.crowd']], res: [{ blue: 2 }] });
    s = take(s, 'red.turnout');
    s = move(s, 'tier:small');
    expect(R(s)[0]).toMatchObject({ red: 1, blue: 0 });
    expect(fol(s, 0)).toBe(4);
  });

  it('Doppelganger: copies one of your members (Banker pays twice; the copy\'s "now" +3 comes at once)', () => {
    let s = scene({ members: [['gold.banker']], res: [{ green: 2, gold: 2 }], shop: ['echo.doppel', ...SHOP.slice(1)], queue: [{ t: 'turn', p: 0 }, { t: 'round', r: 2 }] });
    s = take(s, 'red.turnout');
    s = move(s, `card:${uidOf(s, 'echo.doppel', 'shop')}`);
    expect(s.pending.kind).toBe('choose');
    const banker = uidOf(s, 'gold.banker', 0);
    expect(ids(s)).toEqual([`card:${banker}`]);
    s = move(s, `card:${banker}`);
    expect(s.cards[uidOf(s, 'echo.doppel', 0)].copy).toBe('gold.banker');
    expect(R(s)[0].gold).toBe(9); // the copy's now part +3, then round II start: Banker +3, the copy +3
  });

  it('Doppelganger copying Hustler: Hustler\'s when-recruited fires for the copy, so it picks its own color', () => {
    let s = scene({ members: [['gold.hustler']], res: [{ green: 2, gold: 2 }], shop: ['echo.doppel', ...SHOP.slice(1)], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }] });
    s.cards[uidOf(s, 'gold.hustler', 0)].color = 'blue';
    s = take(s, 'red.turnout');
    s = move(s, `card:${uidOf(s, 'echo.doppel', 'shop')}`);
    s = move(s, `card:${uidOf(s, 'gold.hustler', 0)}`);
    expect(s.pending.kind).toBe('choose');
    expect(ids(s).every(id => id.startsWith('color:'))).toBe(true);
    s = move(s, 'color:blue');
    expect(s.cards[uidOf(s, 'echo.doppel', 0)].color).toBe('blue');
    expect(R(s)[0].gold).toBe(0);
    s = take(s, 'blue.a1');
    expect(R(s)[0]).toMatchObject({ blue: 3, gold: 2 });
  });

  it('Doppelganger with no one to copy asks nothing', () => {
    let s = scene({ res: [{ green: 2, gold: 2 }], shop: ['echo.doppel', ...SHOP.slice(1)] });
    s = take(s, 'red.turnout');
    s = move(s, `card:${uidOf(s, 'echo.doppel', 'shop')}`);
    expect(s.pending).toBe(null);
    expect(s.cards[uidOf(s, 'echo.doppel', 0)].copy).toBeUndefined();
  });

  it('Doppelganger copying Lottery Winner can use it once, separately from the original', () => {
    let s = scene({ members: [['gold.jackpot', 'echo.doppel']], res: [{}, { gold: 4 }] });
    const dop = uidOf(s, 'echo.doppel', 0), jack = uidOf(s, 'gold.jackpot', 0);
    s.cards[dop].copy = 'gold.jackpot';
    s = take(s, 'red.turnout');
    expect(hasOpt(s, `use:${dop}`)).toBe(true);
    s = move(s, `use:${dop}`);
    expect(R(s)[0].gold).toBe(4);
    expect(hasOpt(s, `use:${dop}`)).toBe(false);
    s = move(s, `use:${jack}`);
    expect(R(s)[0].gold).toBe(8);
  });

  it('Doppelganger copying Midas can be switched off', () => {
    let s = scene({ members: [['echo.doppel']], res: [{ blue: 2 }], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }] });
    const dop = uidOf(s, 'echo.doppel', 0);
    s.cards[dop].copy = 'gold.midas';
    s = take(s, 'blue.a1');
    expect(R(s)[0]).toMatchObject({ gold: 3, blue: 2 });
    s = move(s, `toggle:${dop}`);
    s = move(s, 'pass');
    s = take(s, 'green.a1');
    expect(R(s)[0]).toMatchObject({ gold: 3, green: 3 });
  });

  it('Patriarch: game end +1 follower per 2 members', () => {
    const s = scene({ members: [['red.patriarch', 'red.bigfamily', 'red.intern', 'red.crowd', 'gold.banker']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.total).toBe(2);
    expect(fol(s, 0)).toBe(1 + (1 + 3 + 1 + 1 + 1) + 2);
  });
});
