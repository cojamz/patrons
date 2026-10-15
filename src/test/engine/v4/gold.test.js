// @vitest-environment node
// Gold: every action and every member hook, with exact numbers.
import { describe, it, expect } from 'vitest';
import { resume } from '../../../engine/v4/core.js';
import { scene, take, play, move, uidOf, ids, hasOpt, fol, useTestCosts } from './helpers.js';

useTestCosts();

const R = s => s.players.map(p => p.res);

describe('Gold actions', () => {
  it('Kickback: +3 gold, then +1 gold to the chosen player', () => {
    let s = scene({ n: 3 });
    s = take(s, 'gold.jv');
    expect(R(s)[0].gold).toBe(3);
    expect(s.pending.kind).toBe('choose');
    expect(ids(s)).toEqual(['player:1', 'player:2']);
    s = move(s, 'player:2');
    expect(R(s).map(r => r.gold)).toEqual([3, 0, 1]);
  });

  it('Golden Years: +2 gold per round number', () => {
    for (const round of [1, 2, 3]) {
      const s = take(scene({ round }), 'gold.rush');
      expect(R(s)[0].gold).toBe(2 * round);
    }
  });

  it('Intro Offer: the next paid member costs 4 less, color part first, then it is used up', () => {
    // Midas: 3 gold + 2 wild. With Intro Offer: 0 gold + 1 wild.
    let s = scene({ res: [{ blue: 1 }], shop: ['gold.midas', 'gold.banker', 'red.intern', 'red.host', 'red.mob', 'red.sponsor'] });
    expect(hasOpt(s, `card:${uidOf(s, 'gold.midas', 'shop')}`)).toBe(false);
    s = take(s, 'gold.discount');
    expect(s.players[0].discount).toBe(4);
    const midas = uidOf(s, 'gold.midas', 'shop');
    s = move(s, `card:${midas}`);
    expect(R(s)[0]).toEqual({ gold: 0, red: 0, blue: 0, green: 0 });
    expect(s.players[0].discount).toBe(0);
  });

  it('Intro Offer spills onto the wild part when the color part is smaller', () => {
    // Midas: 3 gold + 2 wild, with 4 off becomes 0 gold + 1 wild.
    let s = scene({ res: [{ red: 1 }], shop: ['gold.banker', 'red.mentor', 'red.patriarch', 'red.bigfamily', 'gold.midas', 'gold.jackpot'] });
    s = take(s, 'gold.discount');
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`);
    expect(R(s)[0].red).toBe(0);
    expect(s.players[0].members.length).toBe(1);
  });

  it('Intro Offer is not used up by a free recruit', () => {
    let s = scene({ discount: [2], shop: ['red.volunteer', 'gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer'] });
    s = take(s, 'red.hire');
    expect(s.players[0].members.map(u => s.cards[u].def)).toEqual(['red.volunteer']);
    expect(s.players[0].discount).toBe(2);
  });

  it('Collect Debts: take 3 gold split however you like', () => {
    let s = scene({ n: 3, round: 2, res: [{}, { gold: 2 }, { gold: 5 }] });
    s = take(s, 'gold.steal');
    expect(ids(s)).toEqual(['player:1', 'player:2']);
    s = play(s, 'player:1', 'player:1');
    // P2 is out of gold, so only P3 is offered
    expect(ids(s)).toEqual(['player:2']);
    s = move(s, 'player:2');
    expect(R(s).map(r => r.gold)).toEqual([3, 0, 4]);
  });

  it('Collect Debts: takes only what rivals have', () => {
    let s = scene({ round: 2, res: [{}, { gold: 1 }] });
    s = take(s, 'gold.steal');
    s = move(s, 'player:1');
    expect(R(s).map(r => r.gold)).toEqual([1, 0]);
  });

  it('Collect Debts: nothing to take gains nothing and asks nothing', () => {
    const s = take(scene({ round: 2 }), 'gold.steal');
    expect(R(s)[0].gold).toBe(0);
    expect(s.pending?.kind).not.toBe('choose');
  });

  it('Collect Debts is closed in round I', () => {
    const s = scene({ round: 1 });
    expect(() => take(s, 'gold.steal')).toThrow(/not open/);
  });

  it('Tithe: +1 gold per member (Twins is one member)', () => {
    const s = take(scene({ round: 2, members: [['red.twins', 'red.intern', 'red.crowd']] }), 'gold.windfall');
    expect(R(s)[0].gold).toBe(3);
  });

  it('Double Down: doubles your gold (round III only)', () => {
    expect(() => take(scene({ round: 2 }), 'gold.strike')).toThrow();
    const s = take(scene({ round: 3, res: [{ gold: 7 }] }), 'gold.strike');
    expect(R(s)[0].gold).toBe(14);
  });
});

describe('Gold members', () => {
  it('Midas: action gains come as gold; other gains do not; can be switched off and on at the buy', () => {
    let s = scene({ members: [['gold.midas']], res: [{ red: 2 }], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }] });
    const uid = uidOf(s, 'gold.midas', 0);
    s = take(s, 'red.evenswap'); // +1 red (nothing to swap)
    expect(R(s)[0]).toMatchObject({ gold: 1, red: 2 });
    expect(s.pending.kind).toBe('buy');
    s = move(s, `toggle:${uid}`);
    expect(s.cards[uid].on).toBe(false);
    s = move(s, 'pass');
    s = take(s, 'blue.a1');
    expect(R(s)[0]).toMatchObject({ gold: 1, blue: 3 });
    s = move(s, `toggle:${uid}`);
    expect(s.cards[uid].on).toBe(true);
  });

  it('Midas set on when recruited', () => {
    let s = scene({ res: [{ gold: 3, red: 2 }], shop: ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'] });
    s = take(s, 'gold.jv');
    s = move(s, 'player:1');
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`);
    expect(s.cards[uidOf(s, 'gold.midas', 0)].on).toBe(true);
  });

  it('Banker: +3 gold at round start', () => {
    const s = scene({ members: [['gold.banker']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)[0].gold).toBe(3);
    expect(R(s)[1].gold).toBe(0);
  });

  it('Prospector: +1 when an action gains gold, not otherwise', () => {
    let s = take(scene({ members: [['gold.prospector']] }), 'gold.rush');
    expect(R(s)[0].gold).toBe(3);
    s = scene({ members: [['gold.prospector', 'gold.banker']], queue: [{ t: 'round', r: 2 }] });
    expect(R(s)[0].gold).toBe(3);
    s = take(scene({ members: [['gold.prospector']] }), 'blue.a1');
    expect(R(s)[0].gold).toBe(0);
  });

  it('Prospector: a Collect Debts counts once', () => {
    let s = scene({ round: 2, members: [['gold.prospector']], res: [{}, { gold: 3 }] });
    s = take(s, 'gold.steal');
    s = play(s, 'player:1', 'player:1', 'player:1');
    expect(R(s).map(r => r.gold)).toEqual([4, 0]);
  });

  it('Tax Collector: +1 gold when the rival with the most followers (two players: the rival) buys followers, not for its owner', () => {
    let s = scene({ members: [[], ['gold.taxman']], res: [{ blue: 2 }, { blue: 2 }], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = take(s, 'blue.a1');
    s = move(s, 'tier:small');
    expect(R(s)[1].gold).toBe(1);
    s = take(s, 'green.a1');
    s = move(s, 'tier:small');
    expect(R(s)[1].gold).toBe(1);
  });

  it('Merchant: +1 gold whenever anyone recruits a gold member', () => {
    const shop = ['gold.prospector', 'red.intern', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'];
    // (red: 2 so P0 can still pay Intern after the default spends red rather than blue, which P0 leads)
    let s = scene({ members: [[], ['gold.merchant']], res: [{ gold: 3, red: 2 }, { gold: 3 }], shop, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = take(s, 'blue.a1');
    s = move(s, `card:${uidOf(s, 'gold.prospector', 'shop')}`);
    expect(R(s)[1].gold).toBe(4);
    s = take(s, 'green.a1');
    s = move(s, `card:${uidOf(s, 'red.intern', 'shop')}`);
    expect(R(s)[1].gold).toBe(4);
    // its owner recruiting a gold member counts too
    s = take(s, 'gold.jv');
    s = move(s, 'player:0');
    expect(R(s)[1].gold).toBe(7);
  });

  it('Penny Pincher: gold spent on members counts double', () => {
    // Midas 3 gold + 2 wild: color part ceil(3/2)=2 gold, whose spare half pays 1 of the wild (gut call, 2026-10-15:
    // "counts double" loses nothing), so 1 more from non-gold first (1 red)
    let s = scene({ members: [['gold.thrift']], res: [{ gold: 2, red: 2 }], shop: ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'] });
    s = take(s, 'blue.a1');
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`);
    // the wild 1 paid from red: P0 leads blue (3 from Tide), and the default never spends a color whose contest you lead
    expect(R(s)[0]).toEqual({ gold: 0, red: 1, blue: 3, green: 0 });
  });

  it('Penny Pincher: gold also pays the wild part double when nothing else is left', () => {
    let s = scene({ members: [['gold.thrift']], res: [{ gold: 1 }], shop: ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'] });
    s = take(s, 'gold.jv'); // gold 4
    s = move(s, 'player:1');
    expect(R(s)[0].gold).toBe(4);
    s = move(s, `card:${uidOf(s, 'gold.midas', 'shop')}`); // 2 for the color part + 1 for 2 wild
    expect(R(s)[0].gold).toBe(1);
  });

  it('Middleman: +1 gold when you recruit a non-gold member', () => {
    const shop = ['red.intern', 'gold.prospector', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'];
    let s = scene({ members: [['gold.coinpurse']], res: [{ red: 1, gold: 3 }], shop, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }] });
    s = take(s, 'blue.a1');
    s = move(s, `card:${uidOf(s, 'red.intern', 'shop')}`);
    expect(R(s)[0]).toMatchObject({ red: 0, gold: 4 });
    s = take(s, 'green.a1');
    s = move(s, `card:${uidOf(s, 'gold.prospector', 'shop')}`); // 2 gold + 1 wild (blue)
    expect(R(s)[0]).toMatchObject({ gold: 2 });
  });

  it('Middleman: a rival recruiting does not count', () => {
    let s = scene({ members: [[], ['gold.coinpurse']], shop: ['red.volunteer', 'gold.banker', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'] });
    s = take(s, 'red.hire');
    expect(R(s)[1].gold).toBe(0);
  });

  it('Underdog: gold gains doubled while anyone has more gold than you (ties do not count)', () => {
    expect(R(take(scene({ members: [['gold.underdog']], res: [{}, { gold: 1 }] }), 'gold.rush'))[0].gold).toBe(4);
    expect(R(take(scene({ members: [['gold.underdog']], res: [{}, {}] }), 'gold.rush'))[0].gold).toBe(2);
    expect(R(take(scene({ members: [['gold.underdog']], res: [{ gold: 2 }, { gold: 1 }] }), 'gold.rush'))[0].gold).toBe(4);
    expect(R(take(scene({ n: 3, members: [['gold.underdog']], res: [{ gold: 2 }, { gold: 1 }, { gold: 5 }] }), 'gold.rush'))[0].gold).toBe(6);
    // two Underdogs don't stack: there is only one copy, but the guard still holds with a Doppelganger copy
    const s = scene({ members: [['gold.underdog', 'red.doppel']], res: [{}, { gold: 1 }] });
    s.cards[uidOf(s, 'red.doppel', 0)].copy = 'gold.underdog';
    expect(R(take(s, 'gold.rush'))[0].gold).toBe(4);
  });

  it('Underdog: doubles gold that Midas turned into gold, whatever the member order', () => {
    for (const order of [['gold.underdog', 'gold.midas'], ['gold.midas', 'gold.underdog']]) {
      const s = take(scene({ members: [order], res: [{}, { gold: 1 }] }), 'blue.a1');
      expect(R(s)[0]).toMatchObject({ gold: 6, blue: 0 });
    }
  });

  it('Tinker: an action gaining another resource also gains half as much gold, rounded up', () => {
    expect(R(take(scene({ members: [['gold.tinker']] }), 'blue.a1'))[0]).toMatchObject({ blue: 3, gold: 2 });
    expect(R(take(scene({ members: [['gold.tinker']] }), 'blue.a2'))[0]).toMatchObject({ blue: 2, red: 1, gold: 2 });
    expect(R(take(scene({ members: [['gold.tinker']] }), 'gold.rush'))[0]).toMatchObject({ gold: 2 });
    const s = scene({ members: [['gold.tinker']] });
    s.recruits = 1;
    expect(R(take(s, 'red.turnout'))[0]).toMatchObject({ red: 1, gold: 1 });
  });

  it('Investor: you choose how much gold to set aside at round start; it comes back doubled at round end', () => {
    let s = scene({ members: [['gold.investor']], res: [{ gold: 7 }], queue: [{ t: 'round', r: 2 }] });
    const uid = uidOf(s, 'gold.investor', 0);
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.map(o => o.id)).toEqual(['amount:0', 'amount:1', 'amount:3', 'amount:5', 'amount:7']);
    s = move(s, 'amount:3');
    expect(R(s)[0].gold).toBe(4);
    expect(s.cards[uid].invested).toBe(3);
    s = scene({ members: [['gold.investor'], ['red.intern']], res: [{ gold: 4 }, { gold: 9 }], queue: [] });
    s.cards[uidOf(s, 'gold.investor', 0)].invested = 3;
    s.queue = [{ t: 'endRound' }];
    s = resume(s);
    // 4 + 6 = 10 beats 9, so P1 takes the round-I gold contest (P2 wins the member tie on red)
    expect(R(s)[0].gold).toBe(10);
    expect(s.players[0].contest).toBe(2);
    expect(s.cards[uidOf(s, 'gold.investor', 0)].invested).toBe(0);
  });

  it('Lottery Winner: once per game, gain the richest rival\'s gold', () => {
    let s = scene({ n: 3, members: [['gold.jackpot']], res: [{}, { gold: 4 }, { gold: 6 }] });
    s = take(s, 'blue.a1');
    const uid = uidOf(s, 'gold.jackpot', 0);
    expect(hasOpt(s, `use:${uid}`)).toBe(true);
    s = move(s, `use:${uid}`);
    expect(R(s)[0].gold).toBe(6);
    expect(s.pending.kind).toBe('buy');
    expect(hasOpt(s, `use:${uid}`)).toBe(false);
  });

  it('Speculator: once per game, double your gold', () => {
    let s = scene({ members: [['gold.speculator']], res: [{ gold: 5 }] });
    s = take(s, 'blue.a1');
    const uid = uidOf(s, 'gold.speculator', 0);
    s = move(s, `use:${uid}`);
    expect(R(s)[0].gold).toBe(10);
    expect(hasOpt(s, `use:${uid}`)).toBe(false);
  });

  it('Tycoon: game end +1 follower per 3 gold', () => {
    const s = scene({ members: [['gold.tycoon']], res: [{ gold: 11 }], queue: [{ t: 'finish' }] });
    expect(s.over).toBe(true);
    // (final.cards: the member behind each bonus, for the results' end-game scoring, FinalScore.jsx)
    expect(s.players[0].final).toEqual({ total: 3, parts: ['Tycoon +3'], cards: [{ uid: s.players[0].members[0], name: 'Tycoon', n: 3 }] });
    expect(fol(s, 0)).toBe(1 + 1 + 3);
  });

  it('Treasurer: gain gold equal to your member count, itself included', () => {
    let s = scene({ members: [['red.twins', 'red.intern']], res: [{ gold: 2 }], shop: ['gold.seed', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'] });
    s = take(s, 'blue.a1');
    s = move(s, `card:${uidOf(s, 'gold.seed', 'shop')}`);
    expect(R(s)[0].gold).toBe(0 + 3);
  });

  it('Hustler: pick a color; your actions there give +1 gold', () => {
    let s = scene({ res: [{ gold: 2, red: 1 }], shop: ['gold.hustler', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = take(s, 'blue.a1');
    s = move(s, `card:${uidOf(s, 'gold.hustler', 'shop')}`);
    expect(s.pending.kind).toBe('choose');
    expect(ids(s)).toEqual(['color:gold', 'color:red', 'color:blue', 'color:green']);
    s = move(s, 'color:red');
    expect(s.cards[uidOf(s, 'gold.hustler', 0)].color).toBe('red');
    const before = R(s)[0].gold;
    s = take(s, 'red.evenswap');
    expect(R(s)[0].gold).toBe(before + 1);
    s = move(s, 'pass');
    // a rival on red gets nothing from it
    s = take(s, 'red.hire');
    expect(R(s)[0].gold).toBe(before + 1);
  });
});

describe('default payment protects contests you lead', () => {
  it('pays "any" from a color nobody contests rather than one you lead', () => {
    // P0 leads blue after Tide; Banker's 1 "any" should come from red, not blue
    let s = scene({ members: [[], []], res: [{ gold: 2, red: 1 }, { gold: 0 }], shop: ['gold.prospector', 'gold.jackpot', 'gold.tycoon', 'red.mentor', 'red.proselytizer', 'red.bigfamily'] });
    s = take(s, 'blue.a1');
    s = move(s, `card:${uidOf(s, 'gold.prospector', 'shop')}`);
    expect(R(s)[0]).toEqual({ gold: 0, red: 0, blue: 3, green: 0 });
  });
});
