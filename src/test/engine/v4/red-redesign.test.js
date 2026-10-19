// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { contextFor, liveOptions, resume, SHOP_SIZE } from '../../../engine/v4/core.js';
import { ledger } from '../../../engine/v4/content/echo.js';
import { table, uidIn, useCosts } from './cards-helpers-b.js';
import { actionName, move, take } from './helpers.js';

const Q = ['gold', 'red', 'trading', 'echo'];
const ROW = ['gold.banker', 'red.twins', 'red.intern', 'red.volunteer', 'gold.tycoon', 'echo.evergreen', 'echo.muse', 'echo.chronicler'];
useCosts({
  'red.intern': [1, 0], 'red.twins': [1, 1], 'red.volunteer': [2, 2], 'gold.banker': [2, 2],
  'gold.tycoon': [4, 2], 'echo.evergreen': [1, 3], 'echo.muse': [2, 2], 'echo.chronicler': [2, 3],
});
const defs = (s, pid) => s.players[pid].members.map(u => s.cards[u].def);
const swapId = (a, b) => `trade:${a}:${b}`;
const pass = s => s.pending?.kind === 'buy' ? move(s, 'pass') : s;
const remaining = s => [...s.shop, ...s.pile, ...s.players.flatMap(p => p.members)];

describe('locked Red action progression', () => {
  it.each([1, 2, 3])('Gather gives round +1 red in round %i', round => {
    const s = take(table(Q, { round, shop: ROW }), 'red.turnout');
    expect(s.players[0].res.red).toBe(round + 1);
  });

  it('cheapest recruitment is free, gives inherent red and refills only the removed member', () => {
    let s = table(Q, { shop: ROW });
    const pile = s.pile.length;
    s = take(s, 'red.hire');
    expect(defs(s, 0)).toEqual(['red.intern']);
    expect(s.players[0].res.red).toBe(1);
    expect(s.shop).toHaveLength(SHOP_SIZE);
    expect(s.pile).toHaveLength(pile - 1);
  });

  it('round III recruits any shop member free and adds inherent red', () => {
    let s = take(table(Q, { round: 3, shop: ROW }), 'red.take');
    s = move(s, `card:${uidIn(s, 'gold.tycoon', 'shop')}`);
    expect(defs(s, 0)).toEqual(['gold.tycoon']);
    expect(s.players[0].res.red).toBe(1);
  });

  it('Promote uses total printed cost, includes cheaper members, and excludes cost +3', () => {
    const s = take(table(Q, { round: 2, members: [['red.twins']], shop: ROW }), 'red.hireup');
    const a = uidIn(s, 'red.twins', 0);
    const incoming = s.pending.options.filter(o => o.value[0] === a).map(o => s.cards[o.value[1]].def);
    expect(incoming).toContain('gold.banker'); // 2 -> 4, exact boundary
    expect(incoming).toContain('red.intern');
    expect(incoming).not.toContain('echo.chronicler'); // 5
    expect(s.players[0].res.red).toBe(1);
  });

  it('Demote permits a rival member and anything at least 2 cheaper', () => {
    let s = take(table(Q, { round: 2, members: [[], ['gold.tycoon']], shop: ROW }), 'red.trade');
    const a = uidIn(s, 'gold.tycoon', 1), b = uidIn(s, 'gold.banker', 'shop');
    const incoming = s.pending.options.filter(o => o.value[0] === a).map(o => s.cards[o.value[1]].def);
    expect(incoming).toContain('gold.banker'); // 6 -> 4
    expect(incoming).toContain('red.intern'); // 6 -> 1, not a narrow -2 limit
    expect(incoming).not.toContain('echo.chronicler'); // 6 -> 5
    const row = s.shop.length, pile = s.pile.length;
    s = move(s, swapId(a, b));
    expect(defs(s, 1)).toEqual(['gold.banker']);
    expect(s.shop).toContain(a);
    expect(s.shop).toHaveLength(row); expect(s.pile).toHaveLength(pile);
    expect(s.players[1].res.gold).toBe(0); // recipient did not Recruit
    expect(s.recruits).toBe(0);
  });

  it('Even Swap supports two rivals, either orientation and same-container positions without Recruit', () => {
    let s = take(table(Q, { n: 3, members: [[], ['red.volunteer'], ['echo.evergreen']], shop: ROW }), 'red.evenswap');
    const a = uidIn(s, 'red.volunteer', 1), b = uidIn(s, 'echo.evergreen', 2);
    expect(s.pending.options.map(o => o.id)).toContain(swapId(a, b));
    expect(s.pending.options.map(o => o.id)).toContain(swapId(b, a));
    s = move(s, swapId(a, b));
    expect(s.players[1].members).toEqual([b]); expect(s.players[2].members).toEqual([a]);
    expect(s.recruits).toBe(0);
  });

  it('two equal-cost shop cards can swap positions without hooks or extra refills', () => {
    let s = take(table(Q, { shop: ROW }), 'red.evenswap');
    const a = uidIn(s, 'gold.banker', 'shop'), b = uidIn(s, 'echo.evergreen', 'shop');
    const ai = s.shop.indexOf(a), bi = s.shop.indexOf(b), pile = [...s.pile];
    s = move(s, swapId(a, b));
    expect(s.shop[ai]).toBe(b); expect(s.shop[bi]).toBe(a);
    expect(s.pile).toEqual(pile); expect(s.recruits).toBe(0);
  });

  it('two cards in the same cult can swap positions without Recruit', () => {
    let s = take(table(Q, { members: [['gold.banker', 'echo.evergreen']], shop: ROW }), 'red.evenswap');
    const [a, b] = s.players[0].members;
    s = move(s, swapId(a, b));
    expect(s.players[0].members).toEqual([b, a]);
    expect([s.players[0].res.gold, s.players[0].res.green, s.recruits]).toEqual([0, 0, 0]);
  });

  it('shop/cult swaps are atomic, retain eight cards and count only the actor acquisition', () => {
    let s = take(table(Q, { members: [['red.volunteer', 'red.recruiter', 'red.proselytizer']], shop: ROW.map(d => d === 'red.volunteer' ? 'red.bigfamily' : d) }), 'red.evenswap');
    const a = uidIn(s, 'red.volunteer', 0), b = uidIn(s, 'echo.evergreen', 'shop');
    const before = remaining(s).sort((x, y) => x - y), pile = [...s.pile];
    s = move(s, swapId(a, b));
    expect(s.shop).toHaveLength(SHOP_SIZE);
    expect(s.pile).toEqual(pile);
    expect(remaining(s).sort((x, y) => x - y)).toEqual(before);
    expect(defs(s, 0)).toContain('echo.evergreen'); expect(s.shop).toContain(a);
    expect(s.recruits).toBe(1); expect(s.players[0].turnRecruits).toBe(1);
    expect(s.players[0].res.green).toBe(2);
    expect(s.players[0].res.red).toBe(2); // action + Recruiter
    expect(s.players[0].bonus).toBe(1);
  });

  it('Promote can alter any rival cult without giving that recipient recruit passives or income', () => {
    let s = take(table(Q, { round: 2, members: [[], ['red.twins', 'red.recruiter', 'red.proselytizer']], shop: ROW }), 'red.hireup');
    const a = uidIn(s, 'red.twins', 1), b = uidIn(s, 'echo.evergreen', 'shop');
    s = move(s, swapId(a, b));
    expect(defs(s, 1)).toContain('echo.evergreen');
    expect([s.players[1].res.green, s.players[1].res.red, s.players[1].bonus, s.recruits]).toEqual([0, 0, 0, 0]);
  });

  it('swapping into your own cult fires Now exactly once and excludes the outgoing member from hook counts', () => {
    let s = take(table(Q, { members: [['echo.evergreen']], shop: ROW }), 'red.evenswap');
    const a = uidIn(s, 'echo.evergreen', 0), b = uidIn(s, 'gold.banker', 'shop');
    s = move(s, swapId(a, b));
    expect(s.players[0].res.gold).toBe(3);
    expect(s.players[0].res.green).toBe(0);
  });

  it('Bodyguard/Lie Low protect rival cults while the actor may exchange their own protected member', () => {
    const s = take(table(['gold', 'red', 'thieves', 'echo'], { n: 3, round: 2, members: [['thieves.watchdog'], ['red.twins', 'thieves.crew'], ['red.intern']], shop: ROW }), 'red.hireup');
    const own = uidIn(s, 'thieves.watchdog', 0);
    expect(s.pending.options.some(o => o.value[0] === own)).toBe(true);
    const ctx = contextFor(s); s.players[1].hideout = s.round;
    const a = uidIn(s, 'red.twins', 1), b = uidIn(s, 'gold.banker', 'shop');
    expect(ctx.swapMembers(s.players[0], a, b)).toBe(false);
    expect(s.players[1].members).toContain(a);
  });

  it('stale trade options disappear if either member changes location', () => {
    const s = take(table(Q, { members: [['red.volunteer']], shop: ROW }), 'red.evenswap');
    const a = uidIn(s, 'red.volunteer', 0), b = uidIn(s, 'gold.banker', 'shop');
    const task = s.queue.find(t => t.t === 'choose');
    s.shop.splice(s.shop.indexOf(b), 1); s.pile.push(b);
    expect(liveOptions(s, task).some(o => o.id === swapId(a, b))).toBe(false);
  });

  it('Green copies redo a swap and reselect targets rather than repeating its old proceeds', () => {
    let s = table(Q, { round: 2, members: [['red.twins'], ['red.volunteer']], shop: ROW,
      queue: [0, 1].map(p => ({ t: 'turn', p })) });
    const a = uidIn(s, 'red.twins', 0), b = uidIn(s, 'echo.evergreen', 'shop');
    s = pass(move(take(s, 'red.hireup'), swapId(a, b)));
    expect(Object.values(ledger(s).now).find(e => e.name === actionName('red.hireup')).redo).toBe(true);
    s = take(s, 'echo.echo');
    s = move(s, s.pending.options.find(o => o.label.startsWith(`${actionName('red.hireup')} (`)).id);
    expect(s.pending.kind).toBe('choose');
    expect(s.pending.options.every(o => o.kind === 'trade')).toBe(true);
    const actorMember = uidIn(s, 'red.volunteer', 1), target = uidIn(s, 'gold.banker', 'shop');
    s = move(s, swapId(actorMember, target));
    expect(defs(s, 1)).toContain('gold.banker');
    expect([s.players[1].res.green, s.players[1].res.red, s.players[1].res.gold]).toEqual([1, 1, 3]);
  });
});

describe('active acquisition versus gifts', () => {
  it('taking a rival member triggers its Recruit and recruitment observers; giving it does not', () => {
    const s = table(Q, { members: [['red.recruiter'], ['echo.evergreen']], queue: [] });
    const uid = uidIn(s, 'echo.evergreen', 1), ctx = contextFor(s);
    ctx.moveMember(uid, s.players[1], s.players[0]);
    expect([s.recruits, s.players[0].res.green, s.players[0].res.red]).toEqual([0, 0, 0]);
    ctx.moveMember(uid, s.players[0], s.players[1]);
    expect(ctx.steal(s.players[0], s.players[1], { uid })).toBe(1);
    expect([s.recruits, s.players[0].res.green, s.players[0].res.red]).toEqual([1, 2, 1]);
  });

  it('a return-to-shop removes only an Extra Hand’s unplaced minion and reacquisition restores it once', () => {
    let s = table(Q, { members: [['benders.extrahand']], shop: ROW, queue: [{ t: 'round', r: 3 }] });
    const hand = uidIn(s, 'benders.extrahand', 0), replacement = s.shop[0];
    const ctx = contextFor(s), before = s.players[0].left;
    expect(s.queue.filter(t => t.workerSource === hand && t.t === 'turn')).toHaveLength(1);
    ctx.swapMembers(s.players[0], hand, replacement);
    expect(s.players[0].left).toBe(before - 1);
    expect(s.queue.some(t => t.workerSource === hand)).toBe(false);
    ctx.swapMembers(s.players[0], replacement, hand);
    expect(s.players[0].left).toBe(before);
    expect(s.queue.filter(t => t.workerSource === hand && t.t === 'turn')).toHaveLength(1);
    expect(new Set(remaining(s)).size).toBe(remaining(s).length);
  });

  it('an acquired Doppelganger chooses and fires its copied Recruit once after an atomic swap', () => {
    let s = take(table(Q, { round: 2, members: [['red.volunteer', 'echo.evergreen']], shop: ['echo.doppel', ...ROW] }), 'red.hireup');
    const a = uidIn(s, 'red.volunteer', 0), copy = uidIn(s, 'echo.doppel', 'shop'), target = uidIn(s, 'echo.evergreen', 0);
    s = move(s, swapId(a, copy));
    s = move(s, `card:${target}`);
    expect(s.cards[copy].copy).toBe('echo.evergreen');
    expect(s.players[0].res.green).toBe(2);
    expect(s.recruits).toBe(1);
  });
});
