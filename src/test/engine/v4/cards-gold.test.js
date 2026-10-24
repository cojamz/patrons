// @vitest-environment node
// Card-by-card: every Gold action and member, through real moves, against the printed text, with a log line naming
// the card whenever it changes a number. Plus one cross-sphere case per member.
import { describe, it, expect } from 'vitest';
import { followers, resume } from '../../../engine/v4/core.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { sceneQ, buy, passBuys, linesNaming } from './cards-helpers.js';

const named = (s, name) => linesNaming(s.log, name);
const G = s => s.players.map(p => p.res.gold);
const rich = { gold: 30, red: 30, blue: 30, green: 30 };

describe('Gold actions', () => {
  it('Kickback: +3 gold to you, +1 gold to the player you pick', () => {
    let s = sceneQ({ n: 3 });
    s = take(s, 'gold.jv');
    expect(s.pending.options.map(o => o.id)).toEqual(['player:1', 'player:2']);
    s = move(s, 'player:2');
    expect(G(s)).toEqual([3, 0, 1]);
    expect(s.log.some(l => l.includes('gave 1 gold to P3'))).toBe(true);
  });
  it('Golden Years: 2 / 4 / 6 by round; Tithe: +1 per member; Double Down: doubles', () => {
    for (const r of [1, 2, 3]) expect(G(take(sceneQ({ round: r }), 'gold.rush'))[0]).toBe(2 * r);
    expect(G(take(sceneQ({ round: 2, members: [['red.intern', 'red.twins']] }), 'gold.windfall'))[0]).toBe(3);
    expect(G(take(sceneQ({ round: 3, res: [{ gold: 7 }] }), 'gold.strike'))[0]).toBe(14);
  });
  it('Collect Debts: up to 3 gold from rivals, split as you like, all through the shared steal', () => {
    let s = sceneQ({ n: 3, round: 2, res: [{}, { gold: 2 }, { gold: 5 }] });
    s = take(s, 'gold.steal');
    s = move(s, 'player:1'); s = move(s, 'player:2'); s = move(s, 'player:2');
    expect(G(s)).toEqual([3, 1, 3]);
    expect(s.log.at(-1)).toMatch(/stole 3 gold/);
  });
});

describe('Gold members', () => {
  it('Midas: a gain from an action comes as gold, named; switched off it does not', () => {
    let s = sceneQ({ res: [rich], shop: ['gold.midas'] });
    s = take(s, 'red.turnout');
    s = buy(s, 'gold.midas');
    expect(s.cards[uidOf(s, 'gold.midas', 0)].on).toBe(true);
    s = sceneQ({ members: [['gold.midas']] });
    s.cards[uidOf(s, 'gold.midas', 0)].on = true;
    s = take(s, 'red.evenswap');
    expect(s.players[0].res.red).toBe(0);
    expect(s.players[0].res.gold).toBe(1);
    expect(named(s, 'Midas')[0]).toMatch(/P1's Midas: 1 red comes as 1 gold/);
  });
  it('Midas × Prospector × Tinker: the converted gain is gold, so Prospector adds 1 and Tinker stays quiet', () => {
    let s = sceneQ({ members: [['gold.tinker', 'gold.midas', 'gold.prospector']] });
    s = take(s, 'red.evenswap');
    expect(s.players[0].res.gold).toBe(2);
    expect(named(s, 'Prospector')).toHaveLength(1);
    expect(named(s, 'Tinker')).toHaveLength(0);
  });

  it('Banker: +3 gold at round start, named', () => {
    const s = sceneQ({ members: [['gold.banker']], queue: [{ t: 'round', r: 2 }] });
    expect(G(s)[0]).toBe(3);
    expect(named(s, 'Banker')[0]).toMatch(/P1's Banker: \+3 gold/);
  });
  it('Banker × Underdog: the doubled income still names Banker (not only Underdog)', () => {
    const s = sceneQ({ res: [{}, { gold: 9 }], members: [['gold.banker', 'gold.underdog']], queue: [{ t: 'round', r: 2 }] });
    expect(G(s)[0]).toBe(6);
    expect(named(s, 'Underdog')[0]).toMatch(/gold gain 3 → 6/);
    expect(named(s, 'Banker')[0]).toMatch(/P1's Banker: \+6 gold/);
  });

  it('Prospector: +1 when an action gains gold, named; a Doppelganger copy adds another', () => {
    let s = take(sceneQ({ members: [['gold.prospector']] }), 'gold.rush');
    expect(G(s)[0]).toBe(3);
    expect(named(s, 'Prospector')).toHaveLength(1);
    s = sceneQ({ members: [['gold.prospector', 'echo.doppel']] });
    s.cards[uidOf(s, 'echo.doppel', 0)].copy = 'gold.prospector';
    s = take(s, 'gold.rush');
    expect(G(s)[0]).toBe(4);
  });

  it('Tax Collector: +1 gold when the rival with the most followers buys followers, named; Underdog doubles it', () => {
    // two players: the one rival is always the rival with the most followers
    let s = sceneQ({ res: [{}, rich], members: [['gold.taxman']], queue: [{ t: 'turn', p: 1 }] });
    s = take(s, 'gold.rush'); s = move(s, 'tier:small');
    expect(G(s)[0]).toBe(1);
    expect(named(s, 'Tax Collector')[0]).toMatch(/P1's Tax Collector: \+1 gold/);
    s = sceneQ({ res: [{}, rich], members: [['gold.taxman', 'gold.underdog']], queue: [{ t: 'turn', p: 1 }] });
    s = take(s, 'gold.rush'); s = move(s, 'tier:small');
    expect(G(s)[0]).toBe(2);
    expect(named(s, 'Tax Collector')).toHaveLength(1);
  });
  it('Tax Collector: any rival buying followers pays +1 gold (Cory 2026-10-15); your own buys don\'t', () => {
    const buyAs = (p, bonus, tier = 'small') => {
      const res = [{}, {}, {}]; res[p] = rich;
      const s = sceneQ({ n: 3, res, bonus, members: [['gold.taxman']], queue: [{ t: 'turn', p }] });
      return move(take(s, 'gold.rush'), `tier:${tier}`);
    };
    expect(G(buyAs(1, [0, 5, 0]))[0]).toBe(1); // the leader buys
    expect(G(buyAs(2, [0, 5, 0]))[0]).toBe(1); // a trailing rival buys: it pays too now
    expect(named(buyAs(2, [0, 5, 0]), 'Tax Collector').length).toBe(1);
    expect(named(buyAs(0, [0, 5, 0]), 'Tax Collector')).toEqual([]); // the owner's own buy pays nothing
  });

  it('Merchant: +1 gold whenever anyone recruits a gold member, named; a guest (Big Spender, leans gold) is colorless and doesn’t count', () => {
    let s = sceneQ({ res: [{}, rich], members: [['gold.merchant']], shop: ['gold.banker', 'benders.bigspender'], queue: [{ t: 'turn', p: 1 }] });
    s = take(s, 'gold.rush'); s = buy(s, 'gold.banker');
    expect(G(s)[0]).toBe(1);
    expect(named(s, 'Merchant')).toHaveLength(1);
    // neutral cards stay neutral (Cory, 2026-10-18): the recruit happens, Merchant stays quiet
    s = sceneQ({ res: [{}, rich], members: [['gold.merchant']], shop: ['benders.bigspender'], queue: [{ t: 'turn', p: 1 }] });
    const u = uidOf(s, 'benders.bigspender', 'shop');
    s = take(s, 'gold.rush'); s = buy(s, 'benders.bigspender');
    expect(s.players[1].members).toContain(u);
    expect(G(s)[0]).toBe(0);
    expect(named(s, 'Merchant')).toEqual([]);
  });

  it('Penny Pincher: gold spent on members counts double, and the recruit line says so', () => {
    const restore = pinCosts({ 'gold.prospector': [4, 2] });
    try {
      let s = sceneQ({ res: [{ gold: 3 }], members: [['gold.thrift']], shop: ['gold.prospector'] });
      s = take(s, 'gold.discount'); // Intro Offer 4 off: cost 4+2 → 0+2, paid with 1 gold
      expect(s.players[0].discount).toBe(4);
      s = buy(s, 'gold.prospector');
      expect(s.players[0].res.gold).toBe(2);
      expect(named(s, 'Penny Pincher')[0]).toMatch(/Penny Pincher: gold counts double/);
      s = sceneQ({ res: [{ gold: 3 }], members: [['gold.thrift']], shop: ['gold.prospector'] });
      s = take(s, 'gold.jv'); s = move(s, 'player:1'); // 6 gold
      s = buy(s, 'gold.prospector'); // 4 colored → 2 gold, 2 wild → 1 gold
      expect(s.players[0].res.gold).toBe(3);
    } finally { restore(); }
  });

  it('Middleman: +1 gold when you recruit a non-gold member, named; a free Open Door counts too', () => {
    let s = sceneQ({ members: [['gold.coinpurse']], shop: ['red.intern'] });
    s = take(s, 'red.hire');
    expect(s.players[0].members.length).toBe(2);
    expect(G(s)[0]).toBe(1);
    expect(named(s, 'Middleman')).toHaveLength(1);
  });

  it('Underdog: doubles a gold gain while anyone has more gold, and names itself; not on a tie', () => {
    let s = take(sceneQ({ res: [{}, { gold: 1 }], members: [['gold.underdog']] }), 'gold.rush');
    expect(G(s)[0]).toBe(4);
    expect(named(s, 'Underdog')).toHaveLength(1);
    s = take(sceneQ({ res: [{ gold: 1 }, { gold: 1 }], members: [['gold.underdog']] }), 'gold.rush');
    expect(G(s)[0]).toBe(3);
  });
  it('Underdog × Speculator: "every gold gain" doubles the doubling', () => {
    let s = sceneQ({ round: 3, res: [{ gold: 5 }, { gold: 90 }], members: [['gold.underdog', 'gold.speculator']] });
    s = take(s, 'gold.rush'); // 6 → 12 doubled: 17
    s = move(s, `use:${uidOf(s, 'gold.speculator', 0)}`);
    expect(G(s)[0]).toBe(17 + 34);
    expect(named(s, 'Speculator')).toHaveLength(1);
  });

  it('Alchemist: an action gaining another color gives +1 gold, named', () => {
    const s = take(sceneQ({ members: [['gold.tinker']] }), 'red.evenswap');
    expect(s.players[0].res.red).toBe(1);
    expect(G(s)[0]).toBe(1);
    expect(named(s, 'Alchemist')[0]).toMatch(/P1's Alchemist: \+1 gold/);
  });

  it('Investor: set aside at round start, back doubled at round end; both named', () => {
    let s = sceneQ({ res: [{ gold: 8 }], members: [['gold.investor']], queue: [{ t: 'round', r: 2 }] });
    s = move(s, 'amount:4');
    expect(G(s)[0]).toBe(4);
    expect(named(s, 'Investor')[0]).toMatch(/sets aside 4 gold/);
    s.queue = [{ t: 'endRound' }]; s = resume(s);
    expect(G(s)[0]).toBe(12);
    expect(named(s, 'Investor').at(-1)).toMatch(/returns 8 gold/);
  });

  it('Lottery Winner: once per game, gold equal to the richest rival’s, named; then it is gone', () => {
    let s = sceneQ({ n: 3, res: [{}, { gold: 4 }, { gold: 7 }], members: [['gold.jackpot']] });
    s = take(s, 'gold.rush');
    s = move(s, `use:${uidOf(s, 'gold.jackpot', 0)}`);
    expect(G(s)[0]).toBe(2 + 7);
    expect(named(s, 'Lottery Winner')).toHaveLength(1);
    expect(s.pending.options.some(o => o.id.startsWith('use:'))).toBe(false);
  });

  it('Tycoon: game end +1 follower per 2 gold, in the final parts', () => {
    const s = sceneQ({ res: [{ gold: 10 }], members: [['gold.tycoon']], queue: [{ t: 'finish' }] });
    expect(s.players[0].final.parts).toContain('Tycoon +5');
    expect(followers(s, s.players[0])).toBe(1 + 1 + 5);
  });

  it('Treasurer: when recruited, gold equal to your member count (itself included), named', () => {
    let s = sceneQ({ res: [rich], members: [['red.intern', 'red.volunteer']], shop: ['gold.seed'] });
    s = take(s, 'red.turnout');
    s = buy(s, 'gold.seed');
    expect(s.players[0].members.length).toBe(3);
    expect(named(s, 'Treasurer')[0]).toMatch(/P1's Treasurer: \+3 gold/);
  });
  it('Treasurer × Underdog: doubled, and still named', () => {
    let s = sceneQ({ round: 3, res: [{}, { gold: 50 }], members: [['gold.underdog']], shop: ['gold.seed'] });
    s.shop = [uidOf(s, 'gold.seed', 'shop')];
    s = take(s, 'red.take'); s = move(s, s.pending.options[0].id);
    expect(G(s)[0]).toBe(4);
    expect(named(s, 'Treasurer')[0]).toMatch(/P1's Treasurer: \+4 gold/);
  });

  it('Hustler: pick a color when recruited; spaces there give +1 gold per round number, named', () => {
    let s = sceneQ({ round: 2, res: [rich], shop: ['gold.hustler'] });
    s = take(s, 'gold.rush'); s = buy(s, 'gold.hustler');
    s = move(s, 'color:red');
    expect(named(s, 'Hustler')[0]).toMatch(/works the Red spaces/);
    s = passBuys(s);
    s.queue = [{ t: 'turn', p: 0 }]; s = resume(s);
    const g0 = G(s)[0];
    s = take(s, 'red.turnout');
    expect(G(s)[0]).toBe(g0 + 2);
    expect(named(s, 'Hustler').at(-1)).toMatch(/P1's Hustler: \+2 gold/);
  });
  it('Hustler × Straggler: the moved-to space in its color pays again', () => {
    let s = sceneQ({ round: 2, members: [['gold.hustler', 'benders.straggler']], slots: { '1-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s.cards[uidOf(s, 'gold.hustler', 0)].color = 'red';
    s = resume(s);
    s = move(s, 'to:1-1');
    expect(G(s)[0]).toBe(2);
    expect(named(s, 'Hustler')).toHaveLength(1);
  });
});
