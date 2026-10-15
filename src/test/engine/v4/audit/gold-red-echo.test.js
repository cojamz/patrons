// @vitest-environment node
// Audit scratch (2026-10-15): do the Gold, Red and Green (echo) cards do what they say?
import { describe, it, expect } from 'vitest';
import { createGame, resume, followers } from '../../../../engine/v4/core.js';
import { install } from '../../../../engine/v4/content/echo.js';
import { take, move, play, uidOf } from '../helpers.js';

install();
const QUADS = ['gold', 'red', 'blue', 'echo'];
const Z = { gold: 0, red: 0, blue: 0, green: 0 };

function scene({ n = 2, seed = 7, round = 1, res = [], members = [], shop = [], turns = [0, 1, 0, 1] } = {}) {
  const s = createGame({ seats: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, kind: 'bot' })), seed, quadrants: QUADS });
  Object.assign(s, { queue: [], pending: null, round, slots: {}, order: [], log: [] });
  delete s.echo;
  s.players.forEach((p, i) => { p.res = { ...Z, ...(res[i] || {}) }; p.bonus = 0; p.left = 5; p.discount = 0; });
  s.pile = [...s.shop, ...s.pile]; s.shop = [];
  const grab = def => { const k = s.pile.findIndex(u => s.cards[u].def === def); if (k < 0) throw new Error(def); return s.pile.splice(k, 1)[0]; };
  members.forEach((list, i) => { for (const d of list || []) s.players[i].members.push(grab(d)); });
  for (const d of shop) s.shop.push(grab(d));
  s.queue = turns.map(p => ({ t: 'turn', p }));
  return resume(s);
}
const pass = s => { while (s.pending?.kind === 'buy') s = move(s, 'pass'); return s; };
const buyCard = (s, def) => move(s, `card:${uidOf(s, def, 'shop')}`);
const entry = (s, name) => Object.values(s.echo.now).find(e => e.name === name);

describe('Green: a space’s chip is what the space gave, closed at the buy step', () => {
  it('a member recruited in the buy step (Understudy) does not add its copy to the space the buyer just took', () => {
    // P2 takes Golden Years (+2 gold). P1 takes Hum (+3 green), then buys Understudy and copies Golden Years.
    let s = scene({ turns: [1, 0, 1], res: [{ green: 10, gold: 4 }, {}], shop: ['echo.understudy', 'red.twins', 'red.bigfamily'] });
    s = pass(take(s, 'gold.rush'));
    s = take(s, 'echo.hum');
    s = buyCard(s, 'echo.understudy');
    expect(s.pending.prompt).toMatch(/^Understudy/);
    s = pass(move(s, s.pending.options[0].id));
    const hum = entry(s, 'Hum');
    // Hum gave its taker +3 green, nothing else
    expect(hum.res).toEqual({ green: 3 });
    expect(hum.redo).toBeFalsy();
    expect(hum.members).toEqual([]);
  });

  it('a Doppelganger bought in the buy step does not turn the space into "do it yourself"', () => {
    let s = scene({ turns: [0, 1], res: [{ red: 10, gold: 10, green: 10 }, {}], members: [['gold.banker'], []], shop: ['echo.doppel', 'red.twins'] });
    s = take(s, 'gold.jv');
    // Kickback: pick the rival for the gift
    s = move(s, s.pending.options[0].id);
    s = buyCard(s, 'echo.doppel');
    expect(s.pending.prompt).toMatch(/^Doppelganger/);
    s = pass(move(s, s.pending.options[0].id));
    const kb = entry(s, 'Kickback');
    expect(kb.res).toEqual({ gold: 3 });
    expect(kb.redo).toBeFalsy();
  });
});

describe('Gold', () => {
  // fixed 2026-10-15 (Cory): the steal's later victims are the same gain (core gain's again)
  it('Prospector: one action that gains you gold pays +1 more once (Collect Debts split over two rivals)', () => {
    let s = scene({ n: 3, round: 2, turns: [0], res: [{}, { gold: 2 }, { gold: 2 }], members: [['gold.prospector'], [], []] });
    s = take(s, 'gold.steal');
    s = move(s, 'player:1'); s = move(s, 'player:1'); s = move(s, 'player:2');
    // 3 stolen + Prospector's +1
    expect(s.players[0].res.gold).toBe(4);
  });

  it('Speculator: the log says what was gained (Underdog doubles it)', () => {
    let s = scene({ round: 3, turns: [0], res: [{ gold: 3 }, { gold: 9 }], members: [['gold.speculator', 'gold.underdog'], []] });
    const u = uidOf(s, 'gold.speculator', 0);
    s = move(s, `use:${u}`);
    expect(s.players[0].res.gold).toBe(9);
    const line = s.log.find(l => l.includes('Speculator'));
    expect(line).not.toMatch(/doubled to 9/);
  });
});

describe('Red', () => {
  it('Sponsor: the log never says it saved more than it did (Volunteer costs 0)', () => {
    let s = scene({ turns: [0], res: [{ red: 5 }, {}], members: [['red.sponsor'], []], shop: ['red.volunteer', 'red.twins'] });
    s = take(s, 'echo.hum');
    s = buyCard(s, 'red.volunteer');
    const line = s.log.find(l => l.includes('recruited Volunteer'));
    expect(line).not.toMatch(/Sponsor saves 2/);
  });

  it('Doppelganger copying Big Family is worth 3 followers (text says "the effect")', () => {
    let s = scene({ turns: [0], res: [{ red: 10, gold: 10, green: 10 }, {}], members: [['red.bigfamily'], []], shop: ['echo.doppel'] });
    s = take(s, 'echo.hum');
    s = buyCard(s, 'echo.doppel');
    s = pass(move(s, s.pending.options[0].id));
    expect(followers(s, s.players[0])).toBe(1 + 3 + 3);
  });
});

describe('Green members', () => {
  it('Tribute Band with nothing to copy keeps its once-per-game use (as Stunt Double does)', () => {
    let s = scene({ round: 2, turns: [0], members: [['echo.dejavu'], []] });
    const u = uidOf(s, 'echo.dejavu', 0);
    s = move(s, `use:${u}`);
    expect(s.log.some(l => l.includes('Tribute Band has nothing to copy'))).toBe(true);
    expect(s.cards[u].used).toBeFalsy();
  });

  it('a copy gives the printed gain, not what the taker’s members added (Underdog on Kickback)', () => {
    let s = scene({ turns: [1, 0], res: [{}, { gold: 0 }], members: [[], ['gold.underdog']] });
    // P1 holds more gold than P2, so P2's Underdog doubles: P2 gets 6 from Kickback
    s.players[0].res.gold = 5;
    s = take(s, 'gold.jv'); s = pass(move(s, s.pending.options[0].id));
    expect(s.players[1].res.gold).toBe(6);
    s = take(s, 'echo.echo');
    s = pass(move(s, s.pending.options[0].id));
    expect(s.players[0].res.gold).toBe(5 + 1 + 3); // +1 the gift, +3 the copy (not 6)
  });
});

describe('Green: a member’s copy inside a space’s own window', () => {
  // known mismatch, not fixed: Understudy recruited by a space (Open Door) copies inside that space's window, so its
  // copy lands on the space's chip (a member's bonus, which the copy rule says never lands there)
  it.fails('Open Door recruiting Understudy: the chip is the free member only', () => {
    let s = scene({ turns: [1, 0], shop: ['echo.understudy', 'red.mentor'] });
    s = pass(take(s, 'gold.rush'));
    s = take(s, 'red.hire');
    expect(s.pending.prompt).toMatch(/^Understudy/);
    s = pass(move(s, s.pending.options[0].id));
    const od = entry(s, 'Open Door');
    expect(od.res).toEqual({});
  });
});
