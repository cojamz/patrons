// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { contextFor, resume, WORKERS } from '../../../engine/v4/core.js';
import { sceneQ } from './cards-helpers.js';
import { uidOf, take, move as contextMove } from './helpers.js';
const Q = ['gold', 'red', 'purple', 'echo'];
const start = (members = [['benders.extrahand']]) => sceneQ({ quadrants: Q, members, queue: [{ t: 'round', r: 3 }] });
const extras = (s, uid) => s.queue.filter(t => t.workerSource === uid && (t.t === 'turn' || t.t === 'place'));
const give = (s, uid, from, to) => contextFor(s).moveMember(uid, s.players[from], s.players[to]);
function activeExtra() {
  const s = start(), uid = uidOf(s, 'benders.extrahand', 0), t = extras(s, uid)[0];
  s.queue = [{ ...t }, { t: 'allPlaced' }];
  s.players[0].left = 1; s.players[1].left = 0;
  resume(s);
  return { s, uid };
}
describe('Extra Hand transfers only its unplaced minion', () => {
  it('moves the source grant, remaining count and order once, without moving any base minion', () => {
    const s = start(), uid = uidOf(s, 'benders.extrahand', 0);
    const before = s.players.map(p => ({ left: p.left, workers: p.workers }));
    const base = s.queue.filter(t => t.workerSource === undefined).map(t => ({ ...t }));
    const at = extras(s, uid)[0].workerOrder;
    give(s, uid, 0, 1);
    expect(extras(s, uid)).toHaveLength(1);
    expect(extras(s, uid)[0].p).toBe(1);
    expect(s.order[at]).toBe(1);
    expect(s.players.map(p => p.left)).toEqual([before[0].left - 1, before[1].left + 1]);
    expect(s.players.map(p => p.workers)).toEqual([before[0].workers - 1, before[1].workers + 1]);
    expect(s.queue.filter(t => t.workerSource === undefined)).toEqual(base);
    give(s, uid, 1, 0);
    expect(extras(s, uid)).toHaveLength(1);
    expect(s.players.map(p => ({ left: p.left, workers: p.workers }))).toEqual(before);
    give(s, uid, 0, 1);
    expect(extras(s, uid)).toHaveLength(1);
  });
  it('keeps copied grants separate by physical card and survives a JSON save', () => {
    let s = sceneQ({ quadrants: Q, members: [['benders.extrahand', 'echo.doppel']] });
    const uid = uidOf(s, 'benders.extrahand', 0), copy = uidOf(s, 'echo.doppel', 0);
    s.cards[copy].copy = 'benders.extrahand';
    s.queue = [{ t: 'round', r: 3 }]; resume(s);
    s = JSON.parse(JSON.stringify(s));
    give(s, copy, 0, 1);
    expect(extras(s, copy).map(t => t.p)).toEqual([1]);
    expect(extras(s, uid).map(t => t.p)).toEqual([0]);
    expect(s.players.map(p => p.workers)).toEqual([WORKERS[2] + 1, WORKERS[2] + 1]);
  });
  it('moves an active but unplaced extra turn, including its buy and end-turn tasks', () => {
    const { s, uid } = activeExtra();
    expect(s.pending.kind).toBe('place');
    give(s, uid, 0, 1); resume(s);
    expect(s.pending.player).toBe(1);
    expect(s.current).toBe(1);
    expect(s.turns.at(-1)).toBe(1);
    expect(s.queue.filter(t => t.workerSource === uid).every(t => t.p === 1)).toBe(true);
    expect(s.players.map(p => p.left)).toEqual([0, 1]);
  });
  it('never transfers a minion already placed, even while its buy is still open', () => {
    let { s, uid } = activeExtra();
    s = take(s, 'gold.rush');
    expect(s.pending.kind).toBe('buy');
    const before = s.players.map(p => ({ left: p.left, workers: p.workers }));
    const order = [...s.order];
    give(s, uid, 0, 1);
    expect(extras(s, uid)).toHaveLength(0);
    expect(s.players.map(p => ({ left: p.left, workers: p.workers }))).toEqual(before);
    expect(s.order).toEqual(order);
    expect(s.queue.find(t => t.t === 'buy').p).toBe(0);
  });
  it('a real Poach transfers the queued entitlement with the card, not a fresh minion', () => {
    let s = sceneQ({ quadrants: ['gold', 'red', 'thieves', 'purple'],
      members: [['benders.extrahand']], queue: [{ t: 'round', r: 3 }] });
    const uid = uidOf(s, 'benders.extrahand', 0);
    expect(s.pending.player).toBe(1);
    s = take(s, 'thieves.heist');
    const before = s.players.map(p => p.left);
    const total = s.players.reduce((n, p) => n + p.workers, 0);
    s = contextMove(s, `card:${uid}`);
    expect(extras(s, uid).map(t => t.p)).toEqual([1]);
    expect(s.players.map(p => p.left)).toEqual([before[0] - 1, before[1] + 1]);
    expect(s.players.reduce((n, p) => n + p.workers, 0)).toBe(total);
  });
});
