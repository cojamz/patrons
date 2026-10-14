// @vitest-environment node
// Card-by-card verifier, Blue (market): every action and member against its printed text, at the doubled
// member costs (badge cutoff 8), through real legal moves, plus one cross-sphere case each. Every number a
// card changes must show up in a log line that names the card.
import { describe, it, expect } from 'vitest';
import { applyMove, followers, SHOP_SIZE } from '../../../engine/v4/core.js';
import { BADGE } from '../../../engine/v4/content/market.js';
import { take, move, play, ids } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'market', 'thieves'];
const QE = ['gold', 'red', 'market', 'echo'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.jackpot': [6, 5], 'gold.midas': [4, 4], 'gold.taxman': [2, 2], 'gold.banker': [2, 2],
  'red.bigfamily': [4, 4], 'red.twins': [2, 2], 'red.intern': [2, 0], 'red.volunteer': [0, 0], 'red.doppel': [4, 2], 'red.mentor': [6, 4],
  'market.stylist': [2, 2], 'market.onlooker': [6, 4], 'market.connoisseur': [2, 2], 'market.reseller': [8, 4],
  'market.curator': [2, 2], 'market.planner': [2, 2], 'market.underbidder': [2, 0], 'market.minimalist': [2, 0],
  'market.climber': [2, 0], 'market.auctioneer': [4, 2], 'market.sommelier': [2, 2], 'market.patroness': [4, 4],
  'market.blackmarket': [2, 2], 'market.snob': [6, 4], 'market.recluse': [2, 2],
  'thieves.watchdog': [4, 2], 'thieves.crew': [2, 2], 'benders.bigspender': [2, 2], 'benders.insider': [4, 2],
});
const ROW = ['gold.tycoon', 'red.bigfamily', 'red.twins', 'red.intern', 'gold.taxman', 'red.volunteer'];
const R = (s, i = 0) => s.players[i].res;
const card = (s, def) => `card:${uidIn(s, def, 'shop')}`;
const first = s => move(s, s.pending.options[0].id);
// a Blue payment choice: the way that pays with `color` only, else the suggested way
const pickPay = (s, color = 'red') => (s.pending?.kind === 'choose' && s.pending.options[0].kind === 'pay'
  ? move(s, (s.pending.options.find(o => Object.entries(o.value).every(([c, n]) => !n || c === color)) || s.pending.options[0]).id) : s);

it('the badge cutoff is 8 at the doubled costs', () => expect(BADGE).toBe(8));

describe('Blue actions', () => {
  it('Bargain: +2 blue, then recruit a face-up member now in any colors; the normal buy is still there', () => {
    let s = table(Q, { res: [{ red: 4 }], shop: ROW });
    s = take(s, 'Bargain');
    expect(R(s).blue).toBe(2);
    expect(s.pending.prompt).toMatch(/Bargain: recruit/);
    s = pickPay(move(s, card(s, 'red.twins')));
    expect(owns(s, 0, 'red.twins')).toBe(true);
    expect(R(s).red + R(s).blue).toBe(2); // paid 4 of the 6 held
    expect(s.log.some(l => /^Bargain: P1 pays .* for Twins/.test(l))).toBe(true);
    expect(s.pending.kind).toBe('buy');
  });
  it('× Echo: copying a Bargain (a paid recruit) does Bargain again for the copier', () => {
    let s = table(QE, { res: [{ red: 4 }, { gold: 2 }], shop: ROW, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }] });
    s = move(pickPay(move(take(s, 'Bargain'), card(s, 'red.twins'))), 'pass');
    s = take(s, 'Echo');
    s = move(s, s.pending.options.find(o => o.label.startsWith('Bargain')).id);
    expect(R(s, 1).blue).toBe(2);
    expect(s.pending.prompt).toMatch(/Bargain: recruit/);
    expect(s.log.some(l => /P2 copies Bargain \(P1's\): doing it again/.test(l))).toBe(true);
  });

  it('Restock: +2 blue and a whole fresh row (SHOP_SIZE cards, none of the old ones)', () => {
    let s = table(Q, { shop: ROW });
    const old = [...s.shop];
    s = take(s, 'Restock');
    expect(R(s).blue).toBe(2);
    expect(s.shop).toHaveLength(SHOP_SIZE);
    expect(s.shop.filter(u => old.includes(u))).toEqual([]);
    expect(s.log).toContain('P1 restocked the row.');
  });
  it('× Midas: Restock\'s blue comes as gold, and the log names Midas', () => {
    let s = table(Q, { shop: ROW, members: [['gold.midas']] });
    s = take(s, 'Restock');
    expect([R(s).blue, R(s).gold]).toEqual([0, 2]);
    expect(named(s, 'Midas').length).toBe(1);
  });

  it('Showroom: +1 blue per badged face-up member', () => {
    // Tycoon 12, Big Family 8 are badged; Twins 4, Intern 2, Taxman 4, Volunteer 0 are not
    const s = take(table(Q, { shop: ROW }), 'Showroom');
    expect(R(s).blue).toBe(2);
  });
  it('× Encore: a copy of Showroom gives the printed 2, whatever the row holds by then', () => {
    let s = table(QE, { shop: ROW, queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }], round: 2 });
    s = move(take(s, 'Showroom'), 'pass');
    s = take(s, 'Encore');
    s = move(s, s.pending.options.find(o => o.label.startsWith('Showroom')).id);
    expect(R(s, 1).blue).toBe(2);
  });

  it('Clearance: as your buy, a face-up member for half its cost rounded down, any colors', () => {
    // Jackpot costs 11: half is 5
    let s = table(Q, { round: 2, res: [{ red: 5 }], shop: ['gold.jackpot', ...ROW.slice(1)] });
    s = take(s, 'Clearance');
    expect(s.pending.options.find(o => o.id === card(s, 'gold.jackpot')).label).toMatch(/pay 5/);
    s = pickPay(move(s, card(s, 'gold.jackpot')));
    expect(owns(s, 0, 'gold.jackpot')).toBe(true);
    expect(R(s).red).toBe(0);
    // it used the buy: the turn is over
    expect(s.pending?.kind).not.toBe('buy');
  });
  it('× Big Spender: Clearance counts as your first buy, so Big Spender still gives a second', () => {
    let s = table(Q, { round: 2, res: [{ red: 5, gold: 2 }], shop: ['gold.jackpot', ...ROW.slice(1)], members: [['benders.bigspender']] });
    s = take(s, 'Clearance');
    s = pickPay(move(s, card(s, 'gold.jackpot')));
    expect(owns(s, 0, 'gold.jackpot')).toBe(true);
    expect(s.pending?.kind).toBe('buy');
    expect(s.pending.extra).toBe(true);
    s = move(s, 'tier:small');
    expect(s.players[0].bonus).toBe(1);
    expect(s.log).toContain('P1 uses Big Spender.');
  });

  it('Price Check: blue equal to half the cost of your priciest member (rounded down)', () => {
    const s = take(table(Q, { round: 2, members: [['gold.jackpot', 'red.twins']], shop: ROW }), 'Price Check');
    expect(R(s).blue).toBe(5); // Jackpot 11
  });
  it('× Doppelganger: a copy of a pricier member doesn\'t count its copy\'s price (printed cost of the card)', () => {
    // Doppelganger (6) copying Tycoon (12): Price Check reads the Doppelganger's own printed cost
    const s0 = table(Q, { round: 2, members: [['red.doppel', 'red.twins']], shop: ROW });
    s0.cards[uidIn(s0, 'red.doppel', 0)].copy = 'gold.tycoon';
    expect(R(take(s0, 'Price Check')).blue).toBe(3);
  });

  it('Spree: you buy 3 times this turn', () => {
    let s = table(Q, { round: 3, res: [{ gold: 2, red: 2, blue: 2 }], shop: ROW, left: 5 });
    s = take(s, 'Spree');
    expect(s.log).toContain('P1 goes on a spree: 3 buys this turn.');
    for (let k = 0; k < 3; k++) { expect(s.pending.kind).toBe('buy'); s = move(s, 'tier:small'); }
    expect(s.players[0].bonus).toBe(3);
    expect(s.pending?.kind).not.toBe('buy');
  });
  it('× Big Spender: Spree plus Big Spender is 4 buys', () => {
    let s = table(Q, { round: 3, res: [{ gold: 4, red: 4 }], shop: ROW, left: 5, members: [['benders.bigspender']] });
    s = take(s, 'Spree');
    for (let k = 0; k < 4; k++) { expect(s.pending.kind).toBe('buy'); s = move(s, 'tier:small'); }
    expect(s.players[0].bonus).toBe(4);
    expect(s.pending?.kind).not.toBe('buy');
  });
});

describe('Blue members', () => {
  const buyTurn = (members, res, def, opts = {}) => {
    let s = table(Q, { members, res, shop: ROW, ...opts });
    s = take(s, 'Tip-off'); // nobody holds more: Tip-off does nothing, so the buy is all that changes
    return move(s, card(s, def));
  };
  it('Stylist: whenever anyone recruits a blue member, +1 blue (named)', () => {
    let s = table(Q, { members: [[], ['market.stylist']], res: [{ blue: 4 }], shop: ['market.curator', ...ROW.slice(1)] });
    s = move(take(s, 'Restock'), 'pass');
    s = table(Q, { members: [[], ['market.stylist']], res: [{ blue: 4 }], shop: ['market.curator', ...ROW.slice(1)] });
    s = move(take(s, 'Showroom'), card(s, 'market.curator'));
    expect(R(s, 1).blue).toBe(1);
    expect(named(s, 'Stylist').length).toBe(1);
  });
  it('× Doppelganger copying Stylist: +2 for one blue recruit', () => {
    let s = table(Q, { members: [['red.doppel', 'market.stylist']], res: [{ blue: 4 }], shop: ['market.curator', ...ROW.slice(1)] });
    s.cards[uidIn(s, 'red.doppel', 0)].copy = 'market.stylist';
    s = move(take(s, 'Showroom'), card(s, 'market.curator'));
    expect(R(s).blue).toBe(1 + 2); // Showroom 1 (Big Family? no: Curator row) + 2
  });

  it('Onlooker: whenever a rival recruits a badged member, +1 blue; not for unbadged or own', () => {
    let s = buyTurn([[], ['market.onlooker']], [{ red: 8 }], 'red.bigfamily');
    expect(R(s, 1).blue).toBe(1);
    expect(named(s, 'Onlooker').length).toBe(1);
    s = buyTurn([[], ['market.onlooker']], [{ red: 4 }], 'red.twins');
    expect(R(s, 1).blue).toBe(0);
  });
  it('× Heist: the victim\'s free recruit of a badged member is a rival recruit for Onlooker', () => {
    let s = table(Q, { round: 3, left: 5, n: 3, members: [[], ['gold.tycoon'], ['market.onlooker']], shop: ROW });
    s = take(s, 'Heist');
    s = move(s, `card:${uidIn(s, 'gold.tycoon', 1)}`);
    s = move(s, card(s, 'red.bigfamily')); // P2 recruits free, costing ≤12
    expect(owns(s, 1, 'red.bigfamily')).toBe(true);
    expect(R(s, 2).blue).toBe(1);
  });

  it('Connoisseur: whenever you recruit a badged member, +2 blue', () => {
    const s = buyTurn([['market.connoisseur']], [{ red: 8 }], 'red.bigfamily');
    expect(R(s).blue).toBe(2);
    expect(named(s, 'Connoisseur').length).toBe(1);
  });
  it('× Bargain: a badged member recruited through Bargain still pays Connoisseur', () => {
    let s = table(Q, { members: [['market.connoisseur']], res: [{ red: 8 }], shop: ROW });
    s = pickPay(move(take(s, 'Bargain'), card(s, 'red.bigfamily')));
    expect(R(s).blue).toBe(2 + 2);
  });

  it('Reseller: whenever you recruit, +1 of that member\'s color', () => {
    const s = buyTurn([['market.reseller']], [{ red: 4 }], 'red.twins');
    expect(R(s).red).toBe(1);
    expect(named(s, 'Reseller').length).toBe(1);
  });
  it('× guest leaning to an absent sphere: Reseller gives nothing (no color on this table)', () => {
    // Front-runner leans purple; purple isn't on this table
    let s = table(Q, { members: [['market.reseller']], res: [{ red: 2 }], shop: ['benders.frontrunner', ...ROW.slice(1)] });
    s = move(take(s, 'Showroom'), card(s, 'benders.frontrunner'));
    expect(owns(s, 0, 'benders.frontrunner')).toBe(true);
    expect(Object.values(R(s)).reduce((a, b) => a + b, 0)).toBe(1); // only Showroom's 1 blue
    expect(named(s, 'Reseller')).toEqual([]);
  });

  const roundStart = (members, opts = {}) => table(Q, { members, shop: ROW, queue: [{ t: 'round', r: opts.r || 2 }], ...opts });
  it('Curator: at round start, +1 blue per badged member you have', () => {
    const s = roundStart([['market.curator', 'gold.tycoon', 'red.bigfamily', 'red.twins']]);
    expect(R(s).blue).toBe(2);
    expect(named(s, 'Curator').length).toBe(1);
  });
  it('Planner: at round start, next member costs 2 less per round number (named in the log)', () => {
    const s0 = roundStart([['market.planner'], []]);
    expect(s0.players[0].discount).toBe(4);
    expect(named(s0, 'Planner')).toEqual(["P1's Planner: next member costs 4 less."]);
    // at the doubled costs: Tycoon (8 gold + 4) for 8 gold, the 4 off the gold part first
    let s = table(Q, { round: 2, members: [['market.planner']], res: [{ gold: 8 }], shop: ROW, discount: [4] });
    s = move(take(s, 'Tip-off'), card(s, 'gold.tycoon'));
    expect(owns(s, 0, 'gold.tycoon')).toBe(true);
    expect(R(s).gold).toBe(0);
    expect(s.players[0].discount).toBe(0);
  });
  it('× Doppelganger copying Planner: both discounts stack (round III: 6 + 6)', () => {
    const s0 = table(Q, { members: [['market.planner', 'red.doppel']], shop: ROW, queue: [{ t: 'round', r: 3 }] });
    expect(s0.players[0].discount).toBe(6);
    const s = table(Q, { members: [['market.planner', 'red.doppel']], shop: ROW, queue: [] });
    s.cards[uidIn(s, 'red.doppel', 0)].copy = 'market.planner';
    s.queue = [{ t: 'round', r: 3 }];
    const t = applyMove({ ...s, pending: { player: 0, options: [{ id: 'x' }] }, queue: [{ t: 'choose', p: 0, options: [{ id: 'x', value: null }], h: 'market.pickRow', data: { why: 'test' } }, ...s.queue] }, { player: 0, option: 'x' });
    expect(t.players[0].discount).toBe(12);
  });
  it('Underbidder: at round start, next member costs 2 less per rival with more members', () => {
    const s = roundStart([['market.underbidder'], ['red.twins', 'red.intern'], ['red.volunteer']], { n: 3 });
    expect(s.players[0].discount).toBe(2);
    expect(named(s, 'Underbidder')).toEqual(["P1's Underbidder: next member costs 2 less."]);
  });
  it('Minimalist: at round start, +1 blue per rival with more members', () => {
    const s = roundStart([['market.minimalist'], ['red.twins', 'red.intern'], ['red.volunteer', 'red.bigfamily']], { n: 3 });
    expect(R(s).blue).toBe(2);
    expect(named(s, 'Minimalist').length).toBe(1);
  });

  it('Social Climber: once per game at a round start, send a member to the pile; next member costs that much less', () => {
    let s = roundStart([['market.climber', 'red.bigfamily']]);
    expect(s.pending.prompt).toMatch(/Social Climber/);
    s = move(s, `card:${uidIn(s, 'red.bigfamily', 0)}`);
    expect(s.players[0].discount).toBe(8);
    expect(s.pile[s.pile.length - 1]).toBe(uidIn(s, 'red.bigfamily', 'pile'));
    expect(named(s, 'Social Climber').length).toBe(1);
    // spent: the next round start doesn't ask again
    s.queue = [{ t: 'round', r: 3 }]; s.pending = null;
    const t = table(Q, { members: [['market.climber', 'red.twins']], shop: ROW });
    t.cards[uidIn(t, 'market.climber', 0)].used = true;
    t.queue = [{ t: 'round', r: 3 }];
    let u = applyMove({ ...t, pending: { player: 0, options: [{ id: 'x' }] }, queue: [{ t: 'choose', p: 0, options: [{ id: 'x', value: null }], h: 'market.pickRow', data: { why: 'test' } }, ...t.queue] }, { player: 0, option: 'x' });
    expect(u.pending.prompt).not.toMatch(/Social Climber/);
  });
  it('× Heist: a stolen Social Climber that was used stays used for its new owner', () => {
    let s = table(Q, { round: 3, left: 5, members: [['red.twins'], ['market.climber', 'red.bigfamily']], shop: ROW });
    s.cards[uidIn(s, 'market.climber', 1)].used = true;
    s = take(s, 'Heist');
    s = move(s, `card:${uidIn(s, 'market.climber', 1)}`);
    expect(owns(s, 0, 'market.climber')).toBe(true);
    expect(s.cards[uidIn(s, 'market.climber', 0)].used).toBe(true);
  });

  it('Auctioneer: whenever a rival recruits an unbadged member, +1 blue', () => {
    let s = buyTurn([[], ['market.auctioneer']], [{ red: 4 }], 'red.twins');
    expect(R(s, 1).blue).toBe(1);
    expect(named(s, 'Auctioneer').length).toBe(1);
    s = buyTurn([[], ['market.auctioneer']], [{ red: 8 }], 'red.bigfamily');
    expect(R(s, 1).blue).toBe(0);
  });
  it('Sommelier: whenever you recruit a badged member, your next member costs 2 less (named)', () => {
    const s = buyTurn([['market.sommelier']], [{ red: 8 }], 'red.bigfamily');
    expect(s.players[0].discount).toBe(2);
    expect(named(s, 'Sommelier')).toEqual(["P1's Sommelier: next member costs 2 less."]);
  });
  it('× Clearance: a badged member bought at half price still counts for Sommelier', () => {
    let s = table(Q, { round: 2, members: [['market.sommelier']], res: [{ red: 4 }], shop: ROW });
    s = pickPay(move(take(s, 'Clearance'), card(s, 'red.bigfamily')));
    expect(owns(s, 0, 'red.bigfamily')).toBe(true);
    expect(s.players[0].discount).toBe(2);
  });
  it('Patroness: whenever you recruit a badged member, +1 follower', () => {
    const s = buyTurn([['market.patroness']], [{ red: 8 }], 'red.bigfamily');
    expect(s.players[0].bonus).toBe(1);
    expect(named(s, 'Patroness').length).toBe(1);
  });
  it('× Echo free member: a badged member taken free through a copy still pays Patroness', () => {
    // Mentor (10, badged) takes the cheapest face-up member free: that free recruit is unbadged, Mentor itself is badged
    let s = table(QE, { members: [['market.patroness']], res: [{ red: 10 }], shop: ['red.mentor', ...ROW.slice(1)] });
    s = move(take(s, 'Showroom'), card(s, 'red.mentor'));
    expect(owns(s, 0, 'red.mentor')).toBe(true);
    expect(s.players[0].bonus).toBe(1);
  });

  it('Black Market: once per game, recruit one of the top 5 of the pile at its cost', () => {
    // Jackpot (6 gold + 5) waits under the top of the pile
    let s = table(Q, { members: [['market.blackmarket']], res: [{ gold: 6, red: 5 }], shop: ROW, pileFirst: ['red.mentor', 'gold.jackpot'] });
    s = take(s, 'Tip-off');
    s = move(s, `use:${uidIn(s, 'market.blackmarket', 0)}`);
    // the buy step comes back first (used, so no second use); its question follows ("also")
    expect(s.pending.kind).toBe('buy');
    expect(ids(s)).not.toContain(`use:${uidIn(s, 'market.blackmarket', 0)}`);
    s = move(s, 'pass');
    expect(s.pending.prompt).toMatch(/top 5/);
    s = move(s, `card:${uidIn(s, 'gold.jackpot', 'pile')}`);
    expect(owns(s, 0, 'gold.jackpot')).toBe(true);
    expect([R(s).gold, R(s).red]).toEqual([0, 0]);
    expect(named(s, 'Black Market').length).toBe(1);
  });
  it('× Doppelganger copying Black Market: a second once-per-game use', () => {
    let s = table(Q, { members: [['market.blackmarket', 'red.doppel']], res: [{ red: 8 }], shop: ROW });
    s.cards[uidIn(s, 'red.doppel', 0)].copy = 'market.blackmarket';
    s = take(s, 'Showroom');
    expect(ids(s)).toContain(`use:${uidIn(s, 'red.doppel', 0)}`);
    expect(ids(s)).toContain(`use:${uidIn(s, 'market.blackmarket', 0)}`);
  });

  const finish = members => table(Q, { members, shop: ROW, n: members.length, queue: [{ t: 'finish' }] });
  it('Snob: game end, +1 follower per badged member', () => {
    const s = finish([['market.snob', 'gold.tycoon', 'red.twins'], []]);
    expect(s.players[0].final.parts).toContain('Snob +2'); // Snob (10) and Tycoon (12)
  });
  it('Recluse: game end, +2 followers per rival with more members', () => {
    const s = finish([['market.recluse'], ['red.twins', 'red.intern'], ['red.volunteer', 'red.bigfamily'], ['red.doppel']]);
    expect(s.players[0].final.parts).toContain('Recluse +4');
    expect(followers(s, s.players[0])).toBe(1 + 1 + 4);
  });
});
