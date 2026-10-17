// @vitest-environment node
// Night Owl (Purple, Relay's slot): "From round II, after your last minion each round, take an extra turn: place one more and buy again."
// No extra minions in round I (Cory, 2026-10-15).
// In the engine this is one extra turn (glossary: "you place one more minion and may buy again", only while the board
// has a space to spare), queued right after the turn of your last minion. Through real moves: only after the last
// minion, one more minion with its own buy, before the next player; once per round; nothing when no space is spare.
// Price: design/eval/purple-members.md (member-value sim, 8+2).
import { describe, it, expect } from 'vitest';
import { defById } from '../../../engine/v4/content/index.js';
import { take, move, uidOf } from './helpers.js';
import { sceneQ, linesNaming, spaceOf } from './cards-helpers.js';

const Q = ['gold', 'red', 'purple', 'green'];
const sc = o => sceneQ({ quadrants: Q, ...o });
const owl = s => linesNaming(s.log, 'Night Owl');
const turns = (...ps) => ps.map(p => ({ t: 'turn', p }));
/** Pass every buy step; who places next (undefined when nobody does). */
function nextPlacer(s) {
  while (s.pending && s.pending.kind !== 'place') s = move(s, 'pass');
  return { s, who: s.pending?.player };
}
const queuedTurns = (s, id) => s.queue.filter(t => t.t === 'turn' && t.p === id).length;

describe('Night Owl', () => {
  it('is printed as decided: 8 purple + 2 any, worth 1 follower, in plain words', () => {
    const d = defById('purple.nightowl');
    expect([d.s, d.w, d.f]).toEqual([8, 2, 1]);
    expect(d.text).toBe('Rounds II–III: after placing your last minion, take 1 extra turn if there’s room. Once per round.');
  });

  it('does nothing on a minion that is not your last', () => {
    const s = take(sc({ round: 2, left: 3, members: [['purple.nightowl']], queue: turns(0, 1) }), 'purple.hourly');
    expect(s.players[0].left).toBe(2);
    expect(owl(s)).toEqual([]);
  });

  it('after your last minion (and that turn’s buy), you place one more before the next player does, named', () => {
    let s = take(sc({ round: 2, left: 1, members: [['purple.nightowl']], queue: turns(0, 1) }), 'purple.hourly');
    expect(s.players[0].left).toBe(1);
    expect(owl(s)).toEqual(["P1's Night Owl: P1 takes an extra turn."]);
    expect(queuedTurns(s, 0)).toBe(1);
    const next = nextPlacer(s);
    expect(next.who).toBe(0);
  });

  it('and buy again; one more, not two: that minion is a last minion too, and nothing more comes of it', () => {
    let s = take(sc({ round: 2, left: 1, members: [['purple.nightowl']], queue: turns(0, 1) }), 'purple.hourly');
    ({ s } = nextPlacer(s));
    s = take(s, 'purple.windup'); // the one more minion: the last again
    expect(s.pending).toMatchObject({ kind: 'buy', player: 0 }); // buy again
    expect(s.players[0].left).toBe(0);
    expect(owl(s)).toHaveLength(1);
    expect(queuedTurns(s, 0)).toBe(0);
    expect(nextPlacer(s).who).toBe(1);
  });

  it('each round: it works again in the next round', () => {
    let s = sc({ round: 3, left: 1, members: [['purple.nightowl']], queue: turns(0, 1) });
    s.cards[uidOf(s, 'purple.nightowl', 0)].owlRound = 2; // it fired last round
    s = take(s, 'purple.hourly');
    expect(owl(s)).toEqual(["P1's Night Owl: P1 takes an extra turn."]);
    expect(s.players[0].left).toBe(1);
  });

  it('round I, no minion more: it says so, and does not try again that round', () => {
    // round I, two players: every space taken but two, and P2 still has a turn to come
    const probe = sc({});
    const free = [spaceOf(probe, 'purple.hourly'), spaceOf(probe, 'gold.rush')];
    const slots = Object.fromEntries([0, 1, 2, 3].flatMap(q => [0, 1, 2].map(i => `${q}-${i}`)).filter(k => !free.includes(k)).map(k => [k, 1]));
    let s = take(sc({ round: 1, left: 1, slots, members: [['purple.nightowl']], queue: turns(0, 1) }), 'purple.hourly');
    expect(s.players[0].left).toBe(0);
    expect(queuedTurns(s, 0)).toBe(0);
    expect(s.log).toContain('No extra minions in round I: P1 gets no extra turn from Night Owl.');
    expect(nextPlacer(s).who).toBe(1);
  });

  it('× Foreman: the one more minion counts as an extra turn, so Foreman pays, named', () => {
    const s = take(sc({ round: 2, left: 1, slots: { '0-0': 0, '0-1': 0 }, members: [['purple.nightowl', 'purple.foreman']], queue: turns(0, 1) }), 'purple.hourly');
    // Clock In +5 in round II, then Foreman: +1 per minion on the board (3)
    expect(s.players[0].res.purple).toBe(5 + 3);
    expect(linesNaming(s.log, 'Foreman')).toHaveLength(1);
  });
});

// Cory, 2026-10-15: "I bought Night Owl in round 1 and it didn't seem to give me an extra." With 4 players round I
// has no free space, and a Night Owl recruited after your last minion waits a round: either way the log says why.
describe('Night Owl says why it gave no extra turn', () => {
  it('4 players, round I: no extra minions even on the final free space', () => {
    const probe = sceneQ({ quadrants: Q, n: 4 });
    const free = spaceOf(probe, 'purple.hourly');
    const slots = Object.fromEntries([0, 1, 2, 3].flatMap(q => [0, 1, 2].map(i => `${q}-${i}`)).filter(k => k !== free).map(k => [k, 1]));
    const s = take(sceneQ({ quadrants: Q, n: 4, round: 1, left: 1, slots, members: [['purple.nightowl']], queue: turns(0) }), 'purple.hourly');
    expect(queuedTurns(s, 0)).toBe(0);
    expect(owl(s)).toEqual([]);
    expect(s.log).toContain('No extra minions in round I: P1 gets no extra turn from Night Owl.');
  });
  it('recruited in the buy step after your last minion: it says the extra turn starts next round', () => {
    const cost = defById('purple.nightowl');
    const s0 = sceneQ({ quadrants: Q, round: 1, left: 0, res: [{ purple: cost.s + cost.w }], shop: ['purple.nightowl'], queue: [{ t: 'buy', p: 0 }] });
    let s = move(s0, s0.pending.options.find(o => o.kind === 'card' && s0.cards[o.uid].def === 'purple.nightowl').id);
    if (s.pending?.kind === 'choose' && s.pending.options.some(o => o.kind === 'pay')) s = move(s, s.pending.options.find(o => o.default).id);
    expect(s.players[0].members.map(u => s.cards[u].def)).toContain('purple.nightowl');
    expect(owl(s)).toEqual(["P1's Night Owl: P1's last minion this round is already placed, so its extra turn starts next round."]);
  });
});
