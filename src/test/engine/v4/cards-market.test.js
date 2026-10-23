// @vitest-environment node
// Card-by-card verifier, Blue (market): every action and member against its printed text, at the doubled
// member costs, through real legal moves, plus one cross-sphere case each. Every number a
// card changes must show up in a log line that names the card.
import { describe, it, expect } from 'vitest';
import { applyMove, followers, pileOf, pileKeyOf, shopSize } from '../../../engine/v4/core.js';
import { take, move, play, ids, actionName } from './helpers.js';
import { table, useCosts, named, uidIn, owns } from './cards-helpers-b.js';

const Q = ['gold', 'red', 'market', 'thieves'];
const QE = ['gold', 'red', 'market', 'echo'];
useCosts({
  'gold.tycoon': [8, 4], 'gold.jackpot': [6, 5], 'gold.midas': [4, 4], 'gold.taxman': [2, 2], 'gold.banker': [2, 2],
  'red.bigfamily': [4, 4], 'red.twins': [2, 2], 'red.intern': [2, 0], 'red.volunteer': [0, 0], 'echo.doppel': [4, 2], 'red.mentor': [6, 4],
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

describe('Blue actions', () => {
  const ROW5 = ROW.slice(0, 5);
  it('Churn: +1 blue × round, +1 blue; send exactly 3 chosen members to the bottom, then the row refills once', () => {
    let s = table(Q, { round: 2, shop: [...ROW5, 'red.volunteer', 'gold.seed'] });
    s = take(s, 'market.bargain');
    expect(R(s).blue).toBe(3);
    const sent = [];
    for (let k = 3; k > 0; k--) {
      expect(s.pending.prompt).toBe(`Churn: send which member to the bottom? (${k} to go)`);
      const o = s.pending.options[0]; sent.push(o.value);
      s = move(s, o.id);
      // no refill until the last pick: a refilled card can't be churned
      if (k > 1) expect(s.shop).toHaveLength(7 - (4 - k));
    }
    expect(s.pending?.kind).toBe('buy');
    // two shops: both rows fill from their own piles, 5 each in round II
    expect(s.shop).toHaveLength(shopSize(s));
    for (const k of ['cheap', 'pricey']) expect(s.shop.filter(u => pileKeyOf(s, u) === k)).toHaveLength(5);
    expect(s.pile.slice(-3)).toEqual(sent);
    expect(s.log.filter(l => /^Churn: P1 sends .* to the bottom of the pile\.$/.test(l))).toHaveLength(3);
  });
  it('× Midas: Churn\'s blue comes as gold, and the log names Midas', () => {
    let s = table(Q, { shop: ROW5, members: [['gold.midas']] });
    s = take(s, 'market.bargain');
    expect([R(s).blue, R(s).gold]).toEqual([0, 2]);
    expect(named(s, 'Midas').length).toBe(1);
  });

  it('Out of Style: one color to the bottom, refill, +1 blue per member sent, plus the inherent +1', () => {
    // ROW5: Tycoon, Big Family, Twins, Intern, Tax Man: 3 red, 2 gold
    let s = table(Q, { shop: ROW5 });
    s = take(s, 'market.restock');
    expect(R(s).blue).toBe(1);
    expect(s.pending.options.map(o => o.id).sort()).toEqual(['color:gold', 'color:red']);
    const reds = s.shop.filter(u => s.cards[u].def.startsWith('red.'));
    s = move(s, 'color:red');
    expect(R(s).blue).toBe(1 + 3);
    expect(s.shop.filter(u => pileKeyOf(s, u) === 'cheap')).toHaveLength(5); // round I deals 5 from the cheap pile
    expect(s.shop.filter(u => reds.includes(u))).toEqual([]);
    expect(s.pile.slice(-3)).toEqual(reds);
    expect(s.log).toContain('Out of Style: P1 sends 3 red members to the bottom.');
    expect(s.log).toContain("P1's Out of Style: +3 blue.");
  });

  it('Peek: reorder the top 4 of the pile; this turn\'s buy may recruit one of them, and only one', () => {
    let s = table(Q, { res: [{ gold: 9, red: 9, blue: 9 }], shop: ROW5, pileFirst: ['market.stylist', 'gold.banker', 'market.curator', 'red.mentor', 'market.planner'] });
    // round I: Peek looks at the cheap pile (two shops; the pricey one isn't dealt yet)
    const cheap = () => pileOf(s, 'cheap');
    const top = cheap().slice(0, 4), fifth = cheap()[4];
    s = take(s, 'market.showroom');
    expect(R(s).blue).toBe(11); // 9, +2 in round I (Peek scales, Cory 2026-10-22)
    // put them back bottom-to-top reversed: the 4th on top
    for (const u of [top[3], top[2], top[1]]) { expect(s.pending.prompt).toMatch(/^Peek: which goes/); s = move(s, `card:${u}`); }
    expect(cheap().slice(0, 5)).toEqual([top[3], top[2], top[1], top[0], fifth]);
    expect(s.pending.kind).toBe('buy');
    for (const u of top) expect(ids(s)).toContain(`card:${u}`);
    expect(ids(s)).not.toContain(`card:${fifth}`);
    s = move(s, `card:${top[1]}`);
    expect(s.players[0].members).toContain(top[1]);
    expect(s.log.some(l => /^P1 recruited .* from the pile with Peek/.test(l))).toBe(true);
    // the reach is spent: no more pile cards on a later buy
    expect(s.players[0].peekReach).toBeUndefined();
  });
  it('Peek: the reach ends with the turn', () => {
    let s = table(Q, { res: [{ gold: 20, red: 20, blue: 20 }], shop: ROW5, pileFirst: ['market.stylist', 'gold.banker', 'market.curator', 'red.mentor'], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'turn', p: 0 }] });
    s = take(s, 'market.showroom');
    while (s.pending.kind === 'choose') s = first(s);
    const top = pileOf(s, 'cheap').slice(0, 4);
    for (const u of top) expect(ids(s)).toContain(`card:${u}`);
    s = move(s, 'pass');
    s = move(take(s, 'gold.rush'), 'pass');
    expect(s.pending.player).toBe(0);
    s = take(s, 'red.turnout');
    for (const u of top) expect(ids(s)).not.toContain(`card:${u}`);
  });

  it('Recruit Twice: +1 blue and two buys this turn', () => {
    let s = table(Q, { round: 2, res: [{ gold: 2, red: 2 }], shop: ROW5 });
    s = take(s, 'market.clearance');
    expect(R(s).blue).toBe(1);
    expect(s.log).toContain('P1 recruits twice this turn.');
    for (let k = 0; k < 2; k++) { expect(s.pending.kind).toBe('buy'); s = move(s, 'tier:small'); }
    expect(s.players[0].bonus).toBe(2);
    expect(s.pending?.kind).not.toBe('buy');
  });

  it('Bury: one shop member to the bottom, refill, gain half its cost rounded down, plus the inherent +1', () => {
    let s = table(Q, { round: 2, shop: ROW5 });
    const top = pileOf(s, 'pricey')[0], tycoon = uidIn(s, 'gold.tycoon', 'shop');
    s = take(s, 'market.pricecheck');
    expect(R(s).blue).toBe(1);
    s = move(s, `card:${tycoon}`);
    expect(R(s).blue).toBe(1 + 6); // Tycoon costs 12
    expect(s.pile[s.pile.length - 1]).toBe(tycoon);
    expect(s.shop).toContain(top);
    expect(s.shop).toHaveLength(shopSize(s)); // round II shows 5 cheap and 5 pricey
    expect(s.log).toContain("P1's Bury: +6 blue.");
  });
  it('Bury: an odd cost rounds down (Lottery Winner 11 gives 5)', () => {
    let s = table(Q, { round: 2, shop: ['gold.jackpot', ...ROW5.slice(1)] });
    s = move(take(s, 'market.pricecheck'), card(s, 'gold.jackpot'));
    expect(R(s).blue).toBe(1 + 5);
  });

  it('Spree: +3 blue and you buy 3 times this turn', () => {
    let s = table(Q, { round: 3, res: [{ gold: 2, red: 2 }], shop: ROW, left: 5 });
    s = take(s, 'market.spree');
    expect(R(s).blue).toBe(3);
    expect(s.log).toContain('P1 goes on a spree: 3 recruits this turn.');
    for (let k = 0; k < 3; k++) { expect(s.pending.kind).toBe('buy'); s = move(s, 'tier:small'); }
    expect(s.players[0].bonus).toBe(3);
    expect(s.pending?.kind).not.toBe('buy');
  });
  it('× Big Spender: Spree plus Big Spender is 4 buys', () => {
    let s = table(Q, { round: 3, res: [{ gold: 4, red: 4 }], shop: ROW, left: 5, members: [['benders.bigspender']] });
    s = take(s, 'market.spree');
    for (let k = 0; k < 4; k++) { expect(s.pending.kind).toBe('buy'); s = move(s, 'tier:small'); }
    expect(s.players[0].bonus).toBe(4);
    expect(s.pending?.kind).not.toBe('buy');
  });
});

describe('Blue members', () => {
  const buyTurn = (members, res, def, opts = {}) => {
    let s = table(Q, { members, res, shop: ROW, ...opts });
    s = take(s, 'thieves.tipoff'); // nobody holds more: Redistribute does nothing, so the buy is all that changes
    return move(s, card(s, def));
  };
  it('Stylist: whenever anyone recruits a blue member, +1 blue (named)', () => {
    let s = table(Q, { members: [[], ['market.stylist']], res: [{ blue: 4 }], shop: ['market.curator', ...ROW.slice(1)] });
    s = move(take(s, 'thieves.tipoff'), card(s, 'market.curator'));
    expect(R(s, 1).blue).toBe(1);
    expect(named(s, 'Stylist').length).toBe(1);
  });
  it('× Doppelganger copying Stylist: +2 for one blue recruit', () => {
    let s = table(Q, { round: 2, members: [['echo.doppel', 'market.stylist']], res: [{ blue: 4 }], shop: ['market.curator', ...ROW.slice(1)] });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'market.stylist';
    s = move(take(s, 'market.clearance'), card(s, 'market.curator'));
    expect(R(s).blue).toBe(4 + 1 - 4 + 2 + 1); // Recruit Twice's 1, Curator paid 4 blue, the two Stylists 2, Curator's own 1 (Stylist)
  });

  it('Onlooker: whenever a rival recruits a blue member, +2 blue; not for other colors or its owner\'s own', () => {
    let s = buyTurn([[], ['market.onlooker']], [{ blue: 4 }], 'market.recluse', { shop: ['market.recluse', ...ROW] });
    expect(R(s, 1).blue).toBe(2);
    expect(named(s, 'Onlooker').length).toBe(1);
    s = buyTurn([[], ['market.onlooker']], [{ red: 8 }], 'red.bigfamily');
    expect(R(s, 1).blue).toBe(0);
    s = buyTurn([['market.onlooker']], [{ blue: 4 }], 'market.recluse', { shop: ['market.recluse', ...ROW] });
    expect(R(s).blue).toBe(0);
  });
  it('× Poach: no replacement means Onlooker sees no rival recruit', () => {
    let s = table(Q, { round: 3, left: 5, n: 3, members: [[], ['gold.tycoon'], ['market.onlooker']], shop: ['market.recluse', ...ROW] });
    s = take(s, 'thieves.heist');
    s = move(s, `card:${uidIn(s, 'gold.tycoon', 1)}`);
    expect(owns(s, 0, 'gold.tycoon')).toBe(true);
    expect(owns(s, 1, 'market.recluse')).toBe(false);
    expect(s.shop).toContain(uidIn(s, 'market.recluse', 'shop'));
    expect(R(s, 2).blue).toBe(0);
  });

  it('Connoisseur: whenever you recruit a blue member, +1 blue; not for other colors', () => {
    let s = buyTurn([['market.connoisseur']], [{ blue: 4 }], 'market.recluse', { shop: ['market.recluse', ...ROW] });
    expect(R(s).blue).toBe(1);
    expect(named(s, 'Connoisseur').length).toBe(1);
    s = buyTurn([['market.connoisseur']], [{ red: 8 }], 'red.bigfamily');
    expect(R(s).blue).toBe(0);
  });
  it('× Recruit Twice: both blue recruits pay Connoisseur', () => {
    let s = table(Q, { round: 2, members: [['market.connoisseur']], res: [{ blue: 8 }], shop: ['market.recluse', 'market.curator', ...ROW] });
    s = move(take(s, 'market.clearance'), card(s, 'market.recluse'));
    s = move(s, card(s, 'market.curator'));
    expect(owns(s, 0, 'market.recluse') && owns(s, 0, 'market.curator')).toBe(true);
    // 8, Recruit Twice's 1, two members at 4 blue each, Connoisseur's 1 twice, Curator's own 2 (Connoisseur, Recluse)
    expect(R(s).blue).toBe(8 + 1 - 8 + 2 + 2);
    expect(named(s, 'Connoisseur').length).toBe(2);
  });

  it('Reseller: whenever you recruit, +1 of that member\'s color', () => {
    const s = buyTurn([['market.reseller']], [{ red: 4 }], 'red.twins');
    expect(R(s).red).toBe(1);
    expect(named(s, 'Reseller').length).toBe(1);
  });
  it('× guest leaning to an absent sphere: Reseller gives nothing (no color on this table)', () => {
    // Front-runner leans purple; purple isn't on this table
    let s = table(Q, { round: 2, members: [['market.reseller']], res: [{ red: 5 }], shop: ['benders.frontrunner', ...ROW.slice(1)] });
    s = move(take(s, 'market.clearance'), card(s, 'benders.frontrunner'));
    expect(owns(s, 0, 'benders.frontrunner')).toBe(true);
    expect(Object.values(R(s)).reduce((a, b) => a + b, 0)).toBe(1); // only Recruit Twice's 1 blue
    expect(named(s, 'Reseller')).toEqual([]);
  });

  const roundStart = (members, opts = {}) => table(Q, { members, shop: ROW, queue: [{ t: 'round', r: opts.r || 2 }], ...opts });
  it('Curator: at round start, +1 blue per other blue member you have', () => {
    const s = roundStart([['market.curator', 'market.stylist', 'market.planner', 'gold.tycoon', 'red.bigfamily']]);
    expect(R(s).blue).toBe(2); // Stylist and Planner; not Curator itself, not the gold or red ones
    expect(named(s, 'Curator').length).toBe(1);
  });
  it('Planner: at round start, next member costs 2 less per round number (named in the log)', () => {
    const s0 = roundStart([['market.planner'], []]);
    expect(s0.players[0].discount).toBe(4);
    expect(named(s0, 'Planner')).toEqual(["P1's Planner: next member costs 4 less."]);
    // at the doubled costs: Tycoon (8 gold + 4) for 8 gold, the 4 off the gold part first
    let s = table(Q, { round: 2, members: [['market.planner']], res: [{ gold: 8 }], shop: ROW, discount: [4] });
    s = move(take(s, 'thieves.tipoff'), card(s, 'gold.tycoon'));
    expect(owns(s, 0, 'gold.tycoon')).toBe(true);
    // 12 − 4 = 8 paid from 8 gold and Redistribute's +1 magenta (v0.8.8): either way gives up one lead, so the
    // default spends the magenta and keeps 1 gold (less gold first)
    expect(R(s).gold + R(s).magenta).toBe(1);
    expect(s.players[0].discount).toBe(0);
  });
  it('× Doppelganger copying Planner: both discounts stack (round III: 6 + 6)', () => {
    const s0 = table(Q, { members: [['market.planner', 'echo.doppel']], shop: ROW, queue: [{ t: 'round', r: 3 }] });
    expect(s0.players[0].discount).toBe(6);
    const s = table(Q, { members: [['market.planner', 'echo.doppel']], shop: ROW, queue: [] });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'market.planner';
    s.queue = [{ t: 'round', r: 3 }];
    const t = applyMove({ ...s, pending: { player: 0, options: [{ id: 'x' }] }, queue: [{ t: 'choose', p: 0, options: [{ id: 'x', value: null }], h: 'market.pickRow', data: { why: 'test' } }, ...s.queue] }, { player: 0, option: 'x' });
    expect(t.players[0].discount).toBe(12);
  });
  it('Underbidder: at round start, next member costs 2 less per rival with more members', () => {
    const s = roundStart([['market.underbidder'], ['red.twins', 'red.intern'], ['red.volunteer']], { n: 3 });
    expect(s.players[0].discount).toBe(2);
    expect(named(s, 'Underbidder')).toEqual(["P1's Underbidder: next member costs 2 less."]);
  });
  // "now" (dead-window audit, 2026-10-14): recruited in round III, Planner and Underbidder used to give nothing
  it('Planner recruited in round III: 6 less right away, named', () => {
    let s = table(Q, { round: 3, res: [{ blue: 4 }], shop: ['market.planner', ...ROW.slice(1)] });
    s = move(take(s, 'thieves.tipoff'), card(s, 'market.planner'));
    expect(s.players[0].discount).toBe(6);
    expect(named(s, 'Planner')).toEqual(["P1's Planner: next member costs 6 less."]);
  });
  it('Underbidder recruited: 2 less per rival with more members, right away, named', () => {
    let s = table(Q, { n: 3, round: 3, res: [{ blue: 2 }], members: [[], ['red.twins', 'red.intern'], ['red.volunteer', 'red.bigfamily']], shop: ['market.underbidder', ...ROW.slice(1)] });
    s = move(take(s, 'thieves.tipoff'), card(s, 'market.underbidder'));
    expect(s.players[0].discount).toBe(4);
    expect(named(s, 'Underbidder')).toEqual(["P1's Underbidder: next member costs 4 less."]);
  });
  it('Minimalist: at round start, +1 blue per rival with more members', () => {
    const s = roundStart([['market.minimalist'], ['red.twins', 'red.intern'], ['red.volunteer', 'red.bigfamily']], { n: 3 });
    expect(R(s).blue).toBe(2);
    expect(named(s, 'Minimalist').length).toBe(1);
  });

  // replaced (dead-window audit, 2026-10-14): the old once-per-game round-start trade-in never fired in bot play
  it('Social Climber: whenever you release another member, +2 of a color you choose, named; bots take their least-held', () => {
    let s = table(Q, { rules: { release: true }, round: 2, members: [['market.climber', 'red.bigfamily']], res: [{ gold: 1 }], shop: ROW, queue: [{ t: 'buy', p: 0 }] });
    s = move(s, `release:${uidIn(s, 'red.bigfamily', 0)}`);
    expect(R(s).red).toBe(4); // Big Family's colored part
    expect(s.pending.prompt).toMatch(/Social Climber/);
    const top = s.pending.options.reduce((a, b) => (b.hint > a.hint ? b : a));
    expect(R(s)[top.value]).toBe(0);
    s = move(s, 'color:gold');
    expect(R(s).gold).toBe(3);
    expect(named(s, 'Social Climber')).toEqual(["P1's Social Climber: +2 gold."]);
    expect(s.pending.kind).toBe('buy');
    // releasing the Climber itself gives only its colored part
    let t = table(Q, { rules: { release: true }, round: 2, members: [['market.climber']], shop: ROW, queue: [{ t: 'buy', p: 0 }] });
    t = move(t, `release:${uidIn(t, 'market.climber', 0)}`);
    expect(R(t).blue).toBe(2);
    expect(named(t, 'Social Climber')).toHaveLength(0);
  });
  it('× Doppelganger copying Social Climber: one release pays +2 twice', () => {
    let s = table(Q, { rules: { release: true }, round: 2, members: [['market.climber', 'echo.doppel', 'red.twins']], shop: ROW, queue: [{ t: 'buy', p: 0 }] });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'market.climber';
    s = move(s, `release:${uidIn(s, 'red.twins', 0)}`);
    s = move(move(s, 'color:magenta'), 'color:magenta');
    expect(R(s).magenta).toBe(4);
    expect(named(s, 'Social Climber')).toHaveLength(2);
  });

  it('Auctioneer: whenever a rival recruits a non-blue member, +1 blue', () => {
    let s = buyTurn([[], ['market.auctioneer']], [{ red: 8 }], 'red.bigfamily');
    expect(R(s, 1).blue).toBe(1);
    expect(named(s, 'Auctioneer').length).toBe(1);
    s = buyTurn([[], ['market.auctioneer']], [{ blue: 4 }], 'market.recluse', { shop: ['market.recluse', ...ROW] });
    expect(R(s, 1).blue).toBe(0);
  });
  it('Sommelier: whenever you recruit a blue member, your next member costs 2 less (named)', () => {
    let s = buyTurn([['market.sommelier']], [{ blue: 4 }], 'market.recluse', { shop: ['market.recluse', ...ROW] });
    expect(s.players[0].discount).toBe(2);
    expect(named(s, 'Sommelier')).toEqual(["P1's Sommelier: next member costs 2 less."]);
    s = buyTurn([['market.sommelier']], [{ red: 8 }], 'red.bigfamily');
    expect(s.players[0].discount).toBe(0);
  });
  it('× Peek: a blue member recruited from the pile still counts for Sommelier', () => {
    let s = table(Q, { members: [['market.sommelier']], res: [{ blue: 4 }], shop: ROW, pileFirst: ['market.recluse'] });
    const recluse = s.pile[0];
    s = take(s, 'market.showroom');
    while (s.pending.kind === 'choose') s = first(s);
    s = move(s, `card:${recluse}`);
    expect(owns(s, 0, 'market.recluse')).toBe(true);
    expect(s.players[0].discount).toBe(2);
  });
  it('Patroness: +1 follower each time shop members go to the bottom (once per Churn, not per card); not the round refresh', () => {
    let s = table(Q, { round: 2, members: [[], ['market.patroness']], shop: ROW });
    s = take(s, 'market.bargain');
    for (let k = 3; k > 0; k--) s = move(s, s.pending.options[0].id);
    expect(s.players[1].bonus).toBe(1);
    expect(named(s, 'Patroness').length).toBe(1);
    s = table(Q, { round: 2, members: [['market.patroness']], shop: ROW });
    s = take(s, 'market.pricecheck');
    s = move(s, s.pending.options[0].id);
    expect(s.players[0].bonus).toBe(1);
  });

  it('Talent Scout: once per game, recruit one of the top 5 of the pile at its cost', () => {
    // Lottery Winner (6 gold + 5) waits under the top of the pile
    let s = table(Q, { members: [['market.blackmarket']], res: [{ gold: 6, red: 5 }], shop: ROW, pileFirst: ['red.mentor', 'gold.jackpot'] });
    s = take(s, 'thieves.tipoff');
    const use = `use:${uidIn(s, 'market.blackmarket', 0)}`;
    s = move(s, use);
    // its question comes at once (gut call, 2026-10-15: a member used in the buy step resolves first), then the buy
    // step comes back ("also"), used, so no second use
    expect(s.pending.prompt).toMatch(/top 5/);
    s = move(s, `card:${uidIn(s, 'gold.jackpot', 'pile')}`);
    // both ways to pay spend all the gold P1 leads with, and either the red or Redistribute's magenta (held-resource
    // contests since v0.8.1/v0.8.7): the pay sheet asks first (one pay rule, aminus r1 #1)
    expect(s.pending.options.filter(o => o.kind === 'pay').map(o => o.breaks)).toEqual([['gold', 'red'], ['gold', 'magenta']]);
    s = move(s, s.pending.options.find(o => o.kind === 'pay').id);
    expect(owns(s, 0, 'gold.jackpot')).toBe(true);
    expect([R(s).gold, R(s).red, R(s).magenta]).toEqual([0, 0, 1]);
    expect(named(s, 'Talent Scout').length).toBe(1);
    if (s.pending?.kind === 'buy') expect(ids(s)).not.toContain(use);
  });
  it('× Doppelganger copying Talent Scout: a second once-per-game use', () => {
    let s = table(Q, { round: 2, members: [['market.blackmarket', 'echo.doppel']], res: [{ red: 8 }], shop: ROW });
    s.cards[uidIn(s, 'echo.doppel', 0)].copy = 'market.blackmarket';
    s = take(s, 'market.clearance');
    expect(ids(s)).toContain(`use:${uidIn(s, 'echo.doppel', 0)}`);
    expect(ids(s)).toContain(`use:${uidIn(s, 'market.blackmarket', 0)}`);
  });

  const finish = members => table(Q, { members, shop: ROW, n: members.length, queue: [{ t: 'finish' }] });
  it('Snob: game end, +1 follower per blue member', () => {
    const s = finish([['market.snob', 'market.stylist', 'gold.tycoon', 'red.twins'], []]);
    expect(s.players[0].final.parts).toContain('Snob +2'); // Snob itself and Stylist; not Tycoon or Twins
  });
  it('Recluse: game end, +2 followers per rival with more members', () => {
    const s = finish([['market.recluse'], ['red.twins', 'red.intern'], ['red.volunteer', 'red.bigfamily'], ['echo.doppel']]);
    expect(s.players[0].final.parts).toContain('Recluse +4');
    expect(followers(s, s.players[0])).toBe(1 + 1 + 4);
  });
});
