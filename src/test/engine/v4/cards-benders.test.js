// @vitest-environment node
// Card-by-card: the guest members (rule-benders), through real moves, against the printed text, with a log line
// naming the card whenever it bends a number (a worker, a buy, a cost, the turn order). Plus a cross-sphere case each.
import { describe, it, expect } from 'vitest';
import { resume, contextFor } from '../../../engine/v4/core.js';
import { take, move, uidOf, pinCosts } from './helpers.js';
import { sceneQ, buy, linesNaming } from './cards-helpers.js';

const named = (s, name) => linesNaming(s.log, name);
const rich = { gold: 30, red: 30, blue: 30, green: 30 };

describe('Guest members (rule-benders)', () => {
  it('Party Crasher: One Time Use, the next minion joins a rival’s taken space and does it; named', () => {
    let s = sceneQ({ members: [['benders.squatter']], slots: { '0-1': 1 } });
    expect(s.pending.options.map(o => o.id)).not.toContain('squat:0-1');
    s = move(s, `use:${uidOf(s, 'benders.squatter', 0)}`);
    expect(s.pending.options.map(o => o.id)).toContain('squat:0-1');
    s = move(s, 'squat:0-1');
    expect(s.players[0].res.gold).toBe(2);
    expect(s.players[0].crashNext).toBeUndefined();
    expect(named(s, 'Party Crasher')).toHaveLength(1);
  });
  it('Party Crasher × Hustler: a joined space of the Hustler’s color pays Hustler too', () => {
    let s = sceneQ({ round: 2, members: [['benders.squatter', 'gold.hustler']], slots: { '0-1': 1 } });
    s.cards[uidOf(s, 'gold.hustler', 0)].color = 'gold';
    s = move(move(s, `use:${uidOf(s, 'benders.squatter', 0)}`), 'squat:0-1');
    expect(s.players[0].res.gold).toBe(4 + 2);
    expect(named(s, 'Hustler')).toHaveLength(1);
  });

  it('Saboteur: −3 followers to whoever it joins, recruited or swapped in; named', () => {
    let s = sceneQ({ res: [rich], bonus: [5, 5], members: [[], ['gold.prospector']], shop: ['benders.saboteur'] });
    s = buy(take(s, 'gold.rush'), 'benders.saboteur');
    expect(s.players[0].bonus).toBe(2);
    expect(named(s, 'Saboteur')).toHaveLength(1);
    const u = uidOf(s, 'benders.saboteur', 0);
    expect(contextFor(s).swapMembers(s.players[0], u, uidOf(s, 'gold.prospector', 1))).toBe(true);
    expect(s.players[1].members).toContain(u);
    expect(s.players[1].bonus).toBe(2);
  });
  it('Big Spender: a second buy after a real first one, once per round; named', () => {
    let s = sceneQ({ res: [rich], members: [['benders.bigspender']] });
    s = take(s, 'gold.rush');
    s = move(s, 'tier:small');
    expect(s.pending.extra).toBe(true);
    s = move(s, 'tier:small');
    expect(s.players[0].bonus).toBe(2);
    expect(named(s, 'Big Spender')).toHaveLength(1);
  });
  it('Big Spender × Crowd-Pleaser: two follower buys, two payouts', () => {
    let s = sceneQ({ res: [rich], members: [['benders.bigspender', 'red.crowd']] });
    s = move(move(take(s, 'gold.rush'), 'tier:small'), 'tier:small');
    expect(named(s, 'Crowd-Pleaser')).toHaveLength(2);
  });

  it('Freelancer: a member’s colored part paid in other colors, and the recruit line names Freelancer', () => {
    const restore = pinCosts({ 'gold.banker': [2, 0] });
    try {
      let s = sceneQ({ res: [{ red: 4 }], members: [['benders.freelancer']], shop: ['gold.banker'] });
      s = take(s, 'red.turnout'); // current Gather adds2 red in roundI
      s = buy(s, 'gold.banker');
      expect(s.players[0].res.red).toBe(5);
      expect(named(s, 'Freelancer')).toHaveLength(1);
    } finally { restore(); }
  });
  it('Freelancer is not named when the colored part was paid in its own color', () => {
    const restore = pinCosts({ 'gold.prospector': [2, 0] });
    try {
      let s = sceneQ({ res: [{ gold: 2 }], members: [['benders.freelancer']], shop: ['gold.prospector'] });
      s = buy(move(take(s, 'gold.jv'), 'player:1'), 'gold.prospector');
      expect(s.players[0].res.gold).toBe(3);
      expect(named(s, 'Freelancer')).toHaveLength(0);
    } finally { restore(); }
  });

  it('Insider: recruit from the top 3 of the pile; the recruit line names Insider', () => {
    let s = sceneQ({ res: [rich], members: [['benders.insider']] });
    const top = s.pile[0];
    s = take(s, 'gold.rush');
    s = move(s, `card:${top}`);
    expect(s.players[0].members).toContain(top);
    expect(named(s, 'Insider')[0]).toMatch(/from the pile with P1's Insider/);
  });

  it('Extra Hand: One Time Use, +1 minion this round from round II, named; in round I it stays unused', () => {
    let s = sceneQ({ round: 3, members: [['benders.extrahand']] });
    const u = uidOf(s, 'benders.extrahand', 0), left = s.players[0].left;
    s = move(s, `use:${u}`);
    expect(s.players[0].left).toBe(left + 1);
    expect(s.cards[u].used).toBe(true);
    expect(named(s, 'Extra Hand')[0]).toMatch(/P1's Extra Hand: P1 gets 1 more minion/);
    expect(s.pending.options.map(o => o.id)).not.toContain(`use:${u}`);
    let t = sceneQ({ round: 1, members: [['benders.extrahand']] });
    const v = uidOf(t, 'benders.extrahand', 0);
    t = move(t, `use:${v}`);
    expect(t.cards[v].used).toBe(false);
  });

  it('Front-runner: picks first even when ahead; the round’s opening line names it', () => {
    const s = sceneQ({ bonus: [9, 0], members: [['benders.frontrunner']], queue: [{ t: 'round', r: 2 }] });
    expect(s.pending.player).toBe(0);
    expect(named(s, 'Front-runner')[0]).toMatch(/P1's Front-runner: always picks first/);
  });

  it('Straggler: after the last placement, your last minion moves to an unused space and does it; named', () => {
    let s = sceneQ({ round: 2, members: [['benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(s, 'to:0-1');
    expect(s.players[0].res.gold).toBe(4);
    expect(s.slots['0-0']).toBeUndefined();
    expect(named(s, 'Straggler')).toHaveLength(1);
  });

  it('Straggler asks only where to go: the minion is the last one you placed (Cory, 2026-10-15)', () => {
    let s = sceneQ({ round: 2, members: [['benders.straggler']], slots: { '0-0': 0, '1-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s.queue = [{ t: 'allPlaced' }]; s.pending = null; s.players[0].lastSlot = { key: '0-0', joined: false };
    s = resume(s);
    expect(s.pending.options.every(o => o.id.startsWith('to:') || o.id === 'no')).toBe(true);
    expect(s.pending.prompt).toMatch(/your last minion/);
    s = move(s, 'to:0-1');
    expect(s.slots['0-0']).toBeUndefined(); // the last-placed minion moved (not just the last in board order)
    expect(s.slots['1-0']).toBe(0); // the other one stayed
    expect(s.slots['0-1']).toBe(0);
    expect(s.players[0].lastSlot).toEqual({ key: '0-1', joined: false });
  });

  it('Straggler: Stay put leaves the board as it was', () => {
    let s = sceneQ({ round: 2, members: [['benders.straggler']], slots: { '0-0': 0 }, queue: [{ t: 'allPlaced' }] });
    s = move(s, 'no');
    expect(s.slots['0-0']).toBe(0);
    expect(Object.values(s.slots).filter(o => o === 0)).toHaveLength(1);
  });
});
