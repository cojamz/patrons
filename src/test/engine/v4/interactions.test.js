// @vitest-environment node
// Cross-sphere interactions: the risky pairs, one exact scene each. Copies (Green), extra turns and moved
// workers (Purple), steals (Magenta and Gold), gifts (Silver), follower sales (White), shop bending (Blue),
// Doppelganger copies, Midas/Underdog gain changes and discounts.
// Tests named "DESIGN QUESTION" pin today's behavior on a rule Cory hasn't decided yet.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGame, resume, followers } from '../../../engine/v4/core.js';
import { quadrant } from '../../../engine/v4/content/index.js';
import { take, move, play, uidOf, ids, pinCosts } from './helpers.js';
import { STRAYS, stray } from './stray.js';
import { useRetiredOvertime } from './retired-overtime.js';

useRetiredOvertime();

// Costs these scenes are written against (the real cards get repriced; these don't move).
const PINNED = {
  'red.intern': [1, 1], 'red.twins': [1, 1], 'red.volunteer': [0, 0], 'red.mob': [2, 2], 'red.patriarch': [3, 1],
  'red.bigfamily': [2, 2], 'echo.doppel': [2, 2], 'red.drive': [1, 1], 'red.proselytizer': [3, 3],
  'gold.midas': [3, 2], 'gold.jackpot': [3, 3], 'gold.tycoon': [3, 1], 'gold.speculator': [3, 2], 'gold.investor': [2, 2],
  'thieves.crew': [1, 1], 'market.climber': [1, 0],
};
let restore;
beforeEach(() => { restore = pinCosts(PINNED); });
afterEach(() => restore());

const SHOP = ['gold.midas', 'gold.jackpot', 'gold.tycoon', 'red.intern', 'red.patriarch', 'red.bigfamily'];

/**
 * A hand-made position on any table. `turns` is the turn order to queue (default P1, P2, P1, P2…),
 * `slots` presets workers on the board ({ 'q-i': player }), `copies` sets Doppelganger copies ({ player: { def: copiedDef } }).
 */
function scene({ quads, n = 2, seed = 7, round = 1, res = [], members = [], shop = SHOP, bonus = [], turns = null, queue = null, slots = {}, left = 5, copies = {}, pileFirst = [], rules = {} }) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: quads, rules });
  Object.assign(s, { queue: [], pending: null, round, slots: { ...slots }, order: [], log: [] });
  delete s.echo;
  s.players.forEach((p, i) => {
    p.res = Object.fromEntries(s.resources.map(r => [r, 0]));
    Object.assign(p.res, res[i] || {});
    p.bonus = bonus[i] || 0; p.discount = 0; p.left = left;
  });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) { if (!STRAYS.has(def)) throw new Error(`no free ${def}`); return stray(s, def); } return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  for (const d of shop) if (s.pile.some(u => s.cards[u].def === d)) s.shop.push(grab(d)); // skip a card a player already holds
  if (pileFirst.length) s.pile.unshift(...pileFirst.map(grab));
  for (const [i, map] of Object.entries(copies)) for (const [def, copy] of Object.entries(map)) s.cards[uidOf(s, def, Number(i))].copy = copy;
  s.queue = queue || (turns || [0, 1, 0, 1, 0, 1]).map(p => ({ t: 'turn', p }));
  return resume(s);
}
const R = (s, i) => s.players[i].res;
const pass = s => (s.pending?.kind === 'buy' ? move(s, 'pass') : s);
const go = (s, name, ...then) => pass(play(take(s, name), ...then));
// Blue's own pay prompt (several ways to pay): take the suggested one
const payUp = s => (s.pending?.kind === 'choose' && s.pending.options[0].kind === 'pay' ? move(s, s.pending.options[0].id) : s);
const labels = s => s.pending.options.map(o => o.label);
const opt = prefix => o => o.label.startsWith(prefix);
const defs = (s, i) => s.players[i].members.map(u => s.cards[u].def);
const slotOf = (s, name) => {
  for (const [q, qid] of s.quadrants.entries()) { const i = quadrant(qid).actions.findIndex(a => a.name === name); if (i >= 0) return `${q}-${i}`; }
  throw new Error(name);
};

// ---------------------------------------------------------------------------------------------------------
describe('Green copies the risky spaces', () => {
  const Q = ['gold', 'red', 'thieves', 'echo'];

  it('copying a Magenta steal means stealing yourself, and never takes more than the victim holds', () => {
    let s = scene({ quads: Q, n: 3, turns: [1, 0], res: [{}, {}, { gold: 3 }] });
    s = go(s, 'thieves.pickpocket', 'take:2:gold', 'take:2:gold');
    expect(R(s, 1).magenta).toBe(2);
    s = take(s, 'echo.echo');
    expect(labels(s)).toEqual(['Help Yourself (P2): do Help Yourself yourself']);
    s = move(s, s.pending.options[0].id);
    // P1 now steals 2: P2's 2 magenta and P3's last gold are on offer
    expect(ids(s).sort()).toEqual(['take:1:magenta', 'take:2:gold']);
    s = play(s, 'take:2:gold');
    expect(ids(s)).toEqual(['take:1:magenta']); // P3 is empty now
    s = pass(play(s, 'take:1:magenta'));
    expect(R(s, 0).magenta).toBe(2);
    expect(R(s, 1).magenta).toBe(1);
    expect(R(s, 2).gold).toBe(0);
  });

  it('copying a steal can’t reach a player in the Lie Low', () => {
    let s = scene({ quads: Q, n: 3, turns: [2, 1, 0], res: [{ red: 3 }, { gold: 5 }, { red: 4 }] });
    s = go(s, 'thieves.hideout', 'take:1:gold'); // P3 hides and lifts 1 gold from P2
    s = go(s, 'thieves.pickpocket', 'take:0:red', 'take:0:red'); // P2 can only rob P1
    s = take(s, 'echo.echo');
    s = move(s, s.pending.options.find(opt('Help Yourself')).id);
    expect(ids(s).every(id => id.startsWith('take:1:'))).toBe(true); // never P3
  });

  it('copying a White sale means selling followers yourself, not free white', () => {
    const W = ['gold', 'red', 'trading', 'echo'];
    let s = scene({ quads: W, round: 2, turns: [1, 0], bonus: [0, 3] });
    s = go(s, 'trading.sellhigh', 'amount:1'); // sells 1 follower for white
    expect(s.players[1].bonus).toBe(2);
    s = take(s, 'echo.encore');
    expect(labels(s)).toEqual(['Sell High (P2): do Sell High yourself']);
  });
  it('copying a Your Call taken as white gives that white (Your Call sells nothing since the 2026-10-14 rework)', () => {
    const W = ['gold', 'red', 'trading', 'echo'];
    let s = scene({ quads: W, turns: [1, 0], bonus: [0, 3] });
    s = go(s, 'trading.pawn', 'amount:1'); // round I: 2 white instead of its 1 follower
    expect([R(s, 1).white, s.players[1].bonus]).toEqual([2, 3]);
    s = take(s, 'echo.echo');
    expect(labels(s)).toEqual(['Your Call (P2): +2 white']);
  });

  it('copying Blue’s Snap Up doesn’t hand out the member its taker paid for', () => {
    const B = ['gold', 'red', 'market', 'echo'];
    let s = scene({ quads: B, turns: [1, 0] });
    s = take(s, 'market.bargain');
    // +2 blue, then pays those 2 blue for the Intern (its one way gives up P2's blue lead, so the sheet asks first)
    s = play(s, opt('Intern'));
    if (s.pending?.kind === 'choose' && s.pending.options.some(o => o.kind === 'pay')) s = move(s, s.pending.options.find(o => o.kind === 'pay').id);
    s = pass(s);
    expect(defs(s, 1)).toEqual(['red.intern']);
    expect(R(s, 1).blue).toBe(0);
    s = take(s, 'echo.echo');
    expect(labels(s)).toEqual(['Snap Up (P2): do Snap Up yourself']);
  });

  it('a Silver space’s chip shows its own gain, not the host’s Caterer or Grand Host', () => {
    const S = ['gold', 'red', 'silver', 'echo'];
    let s = scene({ quads: S, turns: [1, 0], members: [[], ['silver.caterer']] });
    s = go(s, 'silver.toast');
    expect(R(s, 1).silver).toBe(4); // 3 + Caterer's 1
    expect(R(s, 0).silver).toBe(1); // the toast's spill
    s = take(s, 'echo.echo');
    expect(labels(s)).toEqual(['Toast (P2): +3 silver']);
    s = pass(move(s, s.pending.options[0].id));
    expect(R(s, 0).silver).toBe(4);

    let t = scene({ quads: S, turns: [1, 0], members: [[], ['silver.grandhost']] });
    t = go(t, 'silver.toast');
    expect(R(t, 1).silver).toBe(6);
    t = take(t, 'echo.echo');
    expect(labels(t)).toEqual(['Toast (P2): +3 silver']);
  });

  it('copying Plan Ahead gives what it gave its taker (their workers left), not your own count', () => {
    const P = ['gold', 'red', 'purple', 'echo'];
    let s = scene({ quads: P, round: 2, turns: [1, 0] }); // 5 workers each
    s = go(s, 'purple.planahead'); // P2: 4 left → +4 purple
    expect(R(s, 1).purple).toBe(4);
    s = take(s, 'echo.encore');
    expect(labels(s)).toContain('Plan Ahead (P2): +4 purple');
    s = pass(move(s, s.pending.options.find(opt('Plan Ahead')).id));
    expect(R(s, 0).purple).toBe(4);
  });

  it('Midas turns a copied gain into gold; a Midas taker’s chip still shows the printed color', () => {
    const S = ['gold', 'red', 'silver', 'echo'];
    let s = scene({ quads: S, turns: [1, 0], members: [['gold.midas'], []] });
    s = go(s, 'silver.toast');
    s = pass(move(take(s, 'echo.echo'), 'space:now:2-0'));
    expect(R(s, 0)).toMatchObject({ gold: 4, silver: 1 }); // Echo's inherent green also turns gold; the gift stays silver.

    let t = scene({ quads: S, turns: [1, 0], members: [[], ['gold.midas']] });
    t = go(t, 'echo.hum');
    expect(R(t, 1)).toMatchObject({ gold: 1, green: 0 });
    t = take(t, 'echo.echo');
    expect(labels(t)).toEqual(['Chorus (P2): +1 green']);
    t = pass(move(t, t.pending.options[0].id));
    expect(R(t, 0).green).toBe(2);
  });

  it('Underdog doubles a copied gold gain (the copy is the copier’s own action)', () => {
    let s = scene({ quads: ['gold', 'red', 'silver', 'echo'], turns: [1, 0], res: [{}, { gold: 5 }], members: [['gold.underdog'], []] });
    s = go(s, 'gold.rush');
    s = pass(move(take(s, 'echo.echo'), 'space:now:0-1'));
    expect(R(s, 0).gold).toBe(4);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('Doppelganger copying Purple, Green and Silver members', () => {
  it('copying Grand Host doubles again (×4)', () => {
    const s = go(scene({ quads: ['gold', 'red', 'silver', 'echo'], members: [['silver.grandhost', 'echo.doppel']], copies: { 0: { 'echo.doppel': 'silver.grandhost' } } }), 'silver.toast');
    expect(R(s, 0).silver).toBe(12);
  });
  it('copying Guest adds 1 more to every gift', () => {
    let s = scene({ quads: ['gold', 'red', 'silver', 'echo'], turns: [1, 0], members: [['silver.guest', 'echo.doppel']], copies: { 0: { 'echo.doppel': 'silver.guest' } } });
    s = go(s, 'silver.toast');
    expect(R(s, 0).silver).toBe(3);
  });
  it('copying Foreman pays on every extra turn twice', () => {
    let s = scene({ quads: ['gold', 'red', 'purple', 'echo'], round: 2, slots: { '0-0': 0 }, members: [['purple.foreman', 'echo.doppel']], copies: { 0: { 'echo.doppel': 'purple.foreman' } } });
    s = take(s, 'purple.overtime');
    expect(R(s, 0).purple).toBe(4); // 2 workers on the board, two Foremen, Overtime's 1 turn (Crunch Time's turns aren't extra)
  });
  it('copying Choir pays on every copy twice', () => {
    let s = scene({ quads: ['gold', 'red', 'silver', 'echo'], turns: [1, 0], members: [['echo.choir', 'echo.doppel']], copies: { 0: { 'echo.doppel': 'echo.choir' } } });
    s = go(s, 'gold.rush');
    s = pass(move(take(s, 'echo.echo'), 'space:now:0-1'));
    expect(R(s, 0)).toMatchObject({ gold: 2, green: 3 }); // Two Choirs plus Echo's inherent green.
  });
  it('copying Go-Getter gives a usable once-per-game extra turn of its own', () => {
    let s = scene({ quads: ['gold', 'red', 'purple', 'echo'], round: 3, turns: [0, 1], members: [['purple.secondwind', 'echo.doppel']], copies: { 0: { 'echo.doppel': 'purple.secondwind' } } });
    s = take(s, 'gold.rush');
    const d = uidOf(s, 'echo.doppel', 0);
    expect(ids(s)).toContain(`use:${d}`);
    s = pass(move(s, `use:${d}`));
    expect(s.pending.player).toBe(0);
    expect(s.cards[d].used).toBe(true);
  });
  it('copying Wallflower doesn’t double twice', () => {
    let s = scene({ quads: ['gold', 'red', 'silver', 'echo'], turns: [1, 0], bonus: [0, 2], members: [['echo.wallflower', 'echo.doppel']], copies: { 0: { 'echo.doppel': 'echo.wallflower' } } });
    s = go(s, 'gold.rush');
    s = pass(move(take(s, 'echo.echo'), 'space:now:0-1'));
    expect(R(s, 0).gold).toBe(4);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('Silver gifts with Guest and Kickback', () => {
  const Q = ['gold', 'red', 'silver', 'yellow'];
  it('Goody Bags: the Guest gets 1 more of the color', () => {
    const s = go(scene({ quads: Q, members: [[], ['silver.guest']] }), 'silver.gift', 'color:red');
    expect(R(s, 1).red).toBe(2);
    expect(R(s, 0)).toMatchObject({ silver: 2, red: 2 });
  });
  it('Good Deed: the Guest gets 3', () => {
    const s = go(scene({ quads: Q, members: [[], ['silver.guest']] }), 'silver.alms', 'give:1:gold');
    expect(R(s, 1).gold).toBe(3);
  });
  it('Rising Tide counts what the Guest just got', () => {
    const s = go(scene({ quads: Q, round: 2, res: [{}, { silver: 5 }], members: [[], ['silver.guest']] }), 'silver.tide');
    expect(R(s, 1).silver).toBe(8); // 5 held + 2 given + Guest’s 1
    expect(R(s, 0).silver).toBe(4);
  });
  it('Kickback’s gold is a gift: the Guest gets 1 more', () => {
    const s = go(scene({ quads: Q, members: [[], ['silver.guest']] }), 'gold.jv', 'player:1');
    expect(R(s, 1).gold).toBe(2);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('Blue’s out-of-buy recruits with Pied Piper and Proselytizer', () => {
  const Q = ['gold', 'red', 'market', 'green'];
  const rich = { gold: 9, red: 9, blue: 9, green: 9 };
  it('Snap Up’s recruit and the normal buy make 2: Drive pays, Proselytizer pays twice', () => {
    // P2 leads blue (Blue's ring counts blue), so P1's default payment may spend blue, as it did before that ring
    let s = scene({ quads: Q, res: [rich, { blue: 30 }], members: [['red.drive', 'red.proselytizer']] });
    s = payUp(play(take(s, 'market.bargain'), opt('Intern')));
    expect(R(s, 0).red).toBeLessThanOrEqual(9);
    const red = R(s, 0).red;
    s = move(s, `card:${uidOf(s, 'red.patriarch', 'shop')}`);
    expect(R(s, 0).red).toBe(red + 2 - 3); // Drive's +2, Patriarch's 3 red
    expect(s.players[0].bonus).toBe(2);
  });
  it('Half Price is the buy: one recruit, no buy step after it', () => {
    let s = scene({ quads: Q, round: 2, res: [rich], members: [['red.drive', 'red.proselytizer']] });
    s = payUp(play(take(s, 'market.clearance'), opt('Patriarch')));
    expect(s.pending?.kind).not.toBe('buy');
    expect(s.players[0].bonus).toBe(1);
    expect(s.players[0].turnRecruits).toBe(1);
  });
  it('Spree: 3 buys, Drive pays once', () => {
    let s = scene({ quads: Q, round: 3, res: [{ gold: 20, red: 20, blue: 20, green: 20 }, { blue: 30 }], members: [['red.drive']] });
    s = take(s, 'market.spree');
    for (const d of ['red.intern', 'red.patriarch', 'gold.tycoon']) s = move(s, `card:${uidOf(s, d, 'shop')}`);
    expect(R(s, 0).red).toBe(20 + 2 - 1 - 3);
    expect(s.pending?.kind).not.toBe('buy');
  });
  it('Poach does not grant a replacement or complete the victim’s Drive', () => {
    let s = scene({ quads: ['gold', 'red', 'thieves', 'market'], round: 3, members: [[], ['red.drive', 'red.twins']] });
    s.players[1].turnRecruits = 1; // P2 recruited once on their own last turn
    s = take(s, 'thieves.heist');
    s = move(s, `card:${uidOf(s, 'red.twins', 1)}`);
    expect(defs(s, 1)).toEqual(['red.drive']);
    expect(s.pending?.prompt || '').not.toContain('Poach: recruit');
    expect(R(s, 1).red).toBe(0);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('Magenta takes members that carry state', () => {
  const Q = ['gold', 'red', 'thieves', 'market'];
  it('Poach on a used Speculator: it stays used (once per game is the card’s)', () => {
    let s = scene({ quads: Q, round: 3, members: [[], ['gold.speculator']] });
    s.cards[uidOf(s, 'gold.speculator', 1)].used = true;
    s = move(take(s, 'thieves.heist'), `card:${uidOf(s, 'gold.speculator', 1)}`);
    expect(defs(s, 0)).toEqual(['gold.speculator']);
    expect(ids(s)).not.toContain(`use:${uidOf(s, 'gold.speculator', 0)}`);
  });
  it('Poach actively recruits Midas: its Recruit hook switches it on for the new owner', () => {
    let s = scene({ quads: Q, round: 3, res: [{ gold: 2 }, {}], members: [[], ['gold.midas']] });
    s.cards[uidOf(s, 'gold.midas', 1)].on = false;
    s = move(take(s, 'thieves.heist'), `card:${uidOf(s, 'gold.midas', 1)}`);
    expect(s.cards[uidOf(s, 'gold.midas', 0)].on).toBe(true);
    expect(s.pending.options.find(o => o.kind === 'toggle').label).toContain('switch off');
  });
  it('Poach on an Investor takes the card; the gold set aside goes back to the victim, not doubled', () => {
    let s = scene({ quads: Q, round: 3, members: [[], ['gold.investor']] });
    s.cards[uidOf(s, 'gold.investor', 1)].invested = 4;
    s = move(take(s, 'thieves.heist'), `card:${uidOf(s, 'gold.investor', 1)}`);
    s = resume(Object.assign(s, { queue: [{ t: 'endRound' }] }));
    expect(defs(s, 0)).toContain('gold.investor');
    expect(R(s, 0).gold).toBe(0);
    expect(R(s, 1).gold).toBe(4);
  });
  it('Double Agent swaps for a Lottery Winner that still works for its new owner', () => {
    let s = scene({ quads: Q, round: 3, res: [{ gold: 9, red: 9, magenta: 9, blue: 9 }, { gold: 7 }], members: [[], ['gold.jackpot']], shop: ['thieves.doubleagent', ...SHOP.slice(1)] });
    s = take(s, 'gold.rush');
    s = play(s, `card:${uidOf(s, 'thieves.doubleagent', 'shop')}`, `card:${uidOf(s, 'gold.jackpot', 1)}`);
    expect(defs(s, 0)).toEqual(['gold.jackpot']);
    expect(defs(s, 1)).toEqual(['thieves.doubleagent']);
    expect(s.cards[uidOf(s, 'gold.jackpot', 0)].used).toBeFalsy(); // usable on P1's next buy
  });
  // Social Climber now pays on Release (dead-window audit, 2026-10-14); these were its round-start trade-in
  it('a member released with Social Climber held goes back to the pile clean (no Doppelganger copy, used flag), and Climber pays +2', () => {
    // a Green table: Doppelganger is green since 2026-10-15, so its release pays green
    let s = scene({ rules: { release: true }, quads: ['gold', 'red', 'market', 'echo'], round: 2, queue: [{ t: 'buy', p: 0 }], members: [['market.climber', 'echo.doppel']], copies: { 0: { 'echo.doppel': 'gold.midas' } } });
    const d = uidOf(s, 'echo.doppel', 0);
    s.cards[d].used = true;
    s = move(s, `release:${d}`);
    expect(s.pile).toContain(d);
    expect(s.cards[d]).toEqual({ uid: d, def: 'echo.doppel' });
    expect(s.pending.prompt).toContain('Social Climber');
    s = move(s, 'color:red');
    expect(R(s, 0).red).toBe(2);
  });
  it('releasing an Investor with Social Climber gives back the gold set aside, not doubled, plus Climber’s +2', () => {
    let s = scene({ rules: { release: true }, quads: Q, round: 2, queue: [{ t: 'buy', p: 0 }], members: [['market.climber', 'gold.investor']] });
    const u = uidOf(s, 'gold.investor', 0);
    s.cards[u].invested = 3;
    s = move(s, `release:${u}`);
    s = move(s, 'color:gold');
    expect(s.cards[u]).toEqual({ uid: u, def: 'gold.investor' });
    expect(R(s, 0).gold).toBe(3 + 2 + 2); // set aside 3, Investor's colored part 2 (pinned), Climber 2
  });
  it('Double Agent swapping for an Investor: the gold set aside stays with its old owner', () => {
    let s = scene({ quads: Q, round: 2, res: [{ magenta: 8, gold: 8 }], members: [[], ['gold.investor']], shop: ['thieves.doubleagent', ...SHOP.slice(1)] });
    s.cards[uidOf(s, 'gold.investor', 1)].invested = 2;
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'thieves.doubleagent', 'shop')}`);
    s = move(s, s.pending.options.find(o => o.id === `card:${uidOf(s, 'gold.investor', 1)}`).id);
    expect(defs(s, 0)).toContain('gold.investor');
    expect(R(s, 1).gold).toBe(2);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('White sells followers that contests and bonuses counted', () => {
  const Q = ['gold', 'red', 'trading', 'green'];
  it('you can sell contest followers, never yourself or your members', () => {
    let s = scene({ quads: Q, round: 2, bonus: [2], members: [['red.twins']] });
    s.players[0].contest = 2;
    s = take(s, 'trading.sellhigh');
    expect(ids(s)).toEqual(['amount:0', 'amount:1', 'amount:2']);
    s = pass(move(s, 'amount:2'));
    expect(followers(s, s.players[0])).toBe(1 + 2);
    expect(R(s, 0).white).toBe(6);
  });
  it('Bulk Buyer pays on a big buy even when a rival’s Tax Collector reacts first', () => {
    let s = scene({ quads: Q, turns: [1, 0], res: [{}, { gold: 2, red: 2 }], members: [['gold.taxman'], ['trading.bulkbuyer']] });
    s = take(s, 'gold.rush');
    s = move(s, 'tier:mid');
    expect(R(s, 0).gold).toBe(1); // the Tax Collector paid
    expect(s.players[1].bonus).toBe(6); // 5 bought + Bulk Buyer's 1
  });
  it('Lender at game end can’t take you below what you’ve won or bought', () => {
    const s = scene({ quads: Q, bonus: [1], members: [['trading.lender']], queue: [{ t: 'finish' }] });
    expect(s.players[0].bonus).toBe(0);
  });
  it('Weaver and Extortionist fire on the 10-follower buy too (5 or more)', () => {
    const Y = ['gold', 'red', 'thieves', 'yellow'];
    let s = scene({ quads: Y, turns: [1, 0], res: [{}, { gold: 4, red: 2, magenta: 2, yellow: 2 }], members: [['thieves.extortionist'], ['yellow.weaver']] });
    s = take(s, 'gold.rush');
    s = move(s, 'tier:top');
    expect(s.players[1].bonus).toBe(10);
    expect(R(s, 0).magenta).toBe(2); // Extortionist took 2
    // 10 held after Golden Years's +2, 10 spent, Extortionist takes the 2 left, then Weaver's +1 of each color
    expect(R(s, 1)).toMatchObject({ gold: 1, red: 1, magenta: 1, yellow: 1 });
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('Lie Low against Gold’s Collect Debts and Shake Down', () => {
  const Q = ['gold', 'red', 'thieves', 'market'];
  it('Collect Debts can’t take from the player in the Lie Low this round, and can next round', () => {
    let s = scene({ quads: Q, n: 3, round: 2, turns: [1, 0], res: [{}, { gold: 4 }, { gold: 4 }] });
    s = go(s, 'thieves.hideout', 'take:2:gold'); // P2 hides (and lifts 1 gold from P3)
    s = take(s, 'gold.steal');
    expect(ids(s)).toEqual(['player:2']);
    s.players[1].hideout = 1; // a Lie Low from an earlier round protects nothing
    expect(quadrant('thieves').guardSteal({ state: s }, s.players[0], s.players[1])).toBe(false);
  });
  it('Shake Down cannot pick a member protected by Lie Low', () => {
    let s = scene({ quads: Q, n: 3, round: 2, turns: [1, 0], res: [{}, { gold: 4 }, { gold: 4 }], members: [[], ['red.twins'], ['red.bigfamily']] });
    s = go(s, 'thieves.hideout', 'take:2:gold');
    s = take(s, 'thieves.ransom');
    expect(ids(s)).toEqual([`card:${uidOf(s, 'red.bigfamily', 2)}`]);
    expect(defs(s, 1)).toEqual(['red.twins']);
  });
  it('Gold’s Collect Debts sets off Magenta’s reactions (Lookout)', () => {
    let s = scene({ quads: Q, n: 3, round: 2, res: [{ gold: 1 }, { gold: 4 }, {}], members: [[], [], ['thieves.lookout']] });
    s = play(take(s, 'gold.steal'), 'player:1', 'player:1', 'player:1');
    expect(R(s, 1).gold).toBe(1);
    expect(R(s, 0).gold).toBe(3); // stole 3, Lookout took 1 back
    expect(R(s, 2).magenta).toBe(1);
  });
  it('Bodyguard and Lie Low both stop Red’s Swap Sides', () => {
    const T = ['gold', 'red', 'thieves', 'green'];
    let s = scene({ quads: T, n: 3, round: 2, members: [['red.intern'], ['thieves.watchdog', 'red.twins'], ['red.volunteer']] });
    s.players[2].hideout = 2; // P3 is lying low this round
    s = take(s, 'red.trade');
    expect(ids(s)).not.toContain(`trade:${uidOf(s, 'red.intern', 0)}:${uidOf(s, 'red.twins', 1)}`);
    expect(ids(s)).not.toContain(`trade:${uidOf(s, 'red.intern', 0)}:${uidOf(s, 'red.volunteer', 2)}`);
    expect(s.pending?.kind).not.toBe('choose');
    expect(defs(s, 0)).toEqual(['red.intern']);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('gain changers on stolen goods', () => {
  const Q = ['gold', 'red', 'thieves', 'green'];
  it('a member’s steal isn’t a gain from an action: Midas leaves it magenta', () => {
    let s = scene({ quads: Q, round: 1, queue: [{ t: 'round', r: 2 }], res: [{}, { red: 3 }], members: [['thieves.cutpurse', 'gold.midas', 'gold.prospector'], []] });
    s = play(s, 'take:1:red');
    s = pass(s);
    expect(R(s, 0)).toMatchObject({ magenta: 1, gold: 0 });
  });
  it('DESIGN QUESTION: an action’s steal is: Midas turns the loot to gold, and Underdog doubles it', () => {
    let s = scene({ quads: Q, res: [{}, { red: 3, gold: 5 }], members: [['gold.midas', 'gold.underdog'], []] });
    s = pass(play(take(s, 'thieves.pickpocket'), 'take:1:red', 'take:1:red'));
    expect(R(s, 1).red).toBe(1); // lost 2
    expect(R(s, 0).gold).toBe(4); // gained 4
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('member colors across spheres', () => {
  it('Yellow’s Potluck counts Green members', () => {
    const s = go(scene({ quads: ['gold', 'red', 'yellow', 'echo'], round: 2, members: [['echo.evergreen', 'echo.choir', 'red.twins']] }), 'yellow.gather');
    expect(R(s, 0)).toMatchObject({ green: 2, red: 2 }); // Twins counts as two red members
  });
  it('Green members pay their colored part in green', () => {
    let s = scene({ quads: ['gold', 'red', 'yellow', 'echo'], res: [{ green: 1, gold: 1 }], shop: ['echo.evergreen', ...SHOP.slice(1)] });
    restore(); restore = pinCosts({ ...PINNED, 'echo.evergreen': [1, 1] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'echo.evergreen', 'shop')}`);
    expect(defs(s, 0)).toEqual(['echo.evergreen']);
    // Paid its 1 green, then Busker's recruit income pays +2 green.
    expect(R(s, 0).green).toBe(2);
  });
});

// ---------------------------------------------------------------------------------------------------------
describe('Release on members that carry state', () => {
  const Q = ['gold', 'red', 'thieves', 'market'];
  const buyStep = p => [{ t: 'buy', p }, { t: 'endRound' }];
  it('releasing an Investor gives back the gold set aside, not doubled', () => {
    let s = scene({ rules: { release: true }, quads: Q, round: 2, queue: buyStep(0), members: [['gold.investor']] });
    const u = uidOf(s, 'gold.investor', 0);
    s.cards[u].invested = 4;
    s = move(s, `release:${u}`);
    s = pass(s);
    expect(s.cards[u]).toEqual({ uid: u, def: 'gold.investor' }); // clean in the pile
    expect(R(s, 0).gold).toBe(4 + 2); // the 4 set aside, plus Investor's colored part (2 gold, pinned): Release gives back only that (Cory, 2026-10-14)
  });
  it('a released Doppelganger goes back clean and stops copying', () => {
    let s = scene({ rules: { release: true }, quads: Q, round: 2, queue: buyStep(0), members: [['echo.doppel', 'gold.midas']], copies: { 0: { 'echo.doppel': 'gold.midas' } } });
    const u = uidOf(s, 'echo.doppel', 0);
    s = move(s, `release:${u}`);
    expect(s.cards[u]).toEqual({ uid: u, def: 'echo.doppel' });
    expect(s.pile.at(-1)).toBe(u);
  });
  it('one release per round: no second release after the first', () => {
    let s = scene({ rules: { release: true }, quads: Q, round: 2, queue: buyStep(0), members: [['red.twins', 'red.intern']] });
    s = move(s, `release:${uidOf(s, 'red.twins', 0)}`);
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[0].id);
    expect(ids(s).some(id => id.startsWith('release:'))).toBe(false);
  });
});
