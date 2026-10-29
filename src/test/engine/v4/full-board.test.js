// @vitest-environment node
// A full board never squeezes anyone out (Cory, 2026-10-15: "somebody taking ALL the extra turn members will have
// enough places to play"). Extra turns only come while a space is spare, counting the minion still to land this turn:
// Go-Getter used beside the spaces, before placing, at 4 players in round I (12 spaces, 12 minions) took a rival's
// last space, and that rival's minion sat out without a word. Through real moves.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, openSlots } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

const placements = (log, name) => log.filter(l => l.startsWith(`${name} took `) || l.startsWith(`${name} joined `)).length;
const roundOne = log => log.slice(log.findIndex(l => /^Round I begins/.test(l)), log.findIndex(l => /^Round I ends/.test(l)));

describe('a full board', () => {
  it('Go-Getter before placing at a full round I gives no extra turn, and every minion lands', () => {
    const rand = seededRandom(5);
    let s = createGame({ seats: Array.from({ length: 4 }, () => ({ kind: 'bot' })), seed: 3, quadrants: ['purple', 'red', 'gold', 'yellow'] });
    const uid = Object.values(s.cards).find(c => c.def === 'purple.secondwind').uid;
    s.pile = s.pile.filter(u => u !== uid); s.shop = s.shop.filter(u => u !== uid);
    s.players[0].members.push(uid);
    let used = false;
    while (!s.over && s.round <= 1) {
      const pend = s.pending;
      if (!used && pend.kind === 'place' && pend.options.some(o => o.id === `use:${uid}`)) {
        expect(openSlots(s).length).toBe(s.queue.filter(t => t.t === 'turn').length + 1); // the board is exactly full
        s = applyMove(s, { player: pend.player, option: `use:${uid}` });
        used = true;
        expect(s.log.at(-1)).toBe('No extra minions in round I: P1 gets no extra turn from Go-Getter.');
        expect(s.cards[uid].used).toBe(false); // kept for later
        continue;
      }
      s = applyMove(s, chooseBotMove(s, rand));
    }
    expect(used).toBe(true);
    const r1 = roundOne(s.log);
    for (const p of s.players) expect(placements(r1, p.name)).toBe(3);
    expect(r1.some(l => /sits out/.test(l))).toBe(false);
  });
});

describe('Late Riser on a full board', () => {
  it('2 players, 2 spheres, round III: Extra Hand twice fills all 12 spaces, so Late Riser gives no turn', () => {
    // seed 2 since the Oct 28 round I and Demote changes: on seed 7 P1 Demoted its own Late Riser away in round II
    let s = createGame({ seats: [{ kind: 'bot' }, { kind: 'bot' }], seed: 2, quadrants: ['purple', 'red'], rules: { release: false } });
    const give = id => {
      const uid = Object.values(s.cards).find(c => c.def === id).uid;
      s.pile = s.pile.filter(u => u !== uid); s.shop = s.shop.filter(u => u !== uid);
      s.players[0].members.push(uid);
    };
    give('purple.lateriser');
    give('red.loyalists'); // Red's swaps (v0.8.0) would otherwise let a bot trade Late Riser away before round III
    s.players[1].bonus += 50; // P1 keeps the fewest followers
    const rand = seededRandom(1);
    let dealt = false;
    while (!s.over && s.round < 3) {
      // Extra Hand and a Doppelganger copying it, handed over after round II's last minion (so no bot releases them)
      if (!dealt && s.round === 2 && !s.queue.some(t => t.t === 'turn' || t.t === 'place')) {
        s.cards[998] = { uid: 998, def: 'benders.extrahand3' }; s.players[0].members.push(998); // the retired one, never dealt
        s.cards[999] = { uid: 999, def: 'echo.doppel', copy: 'benders.extrahand3' }; s.players[0].members.push(999);
        dealt = true;
      }
      s = applyMove(s, chooseBotMove(s, rand));
    }
    expect(s.players[0].left).toBe(7); // 5 + Extra Hand twice, and no Late Riser turn: 7 + 5 fill all 12 spaces
    expect(s.round).toBe(3);
    expect(s.log.some(l => l === 'No space to spare: P1 gets no extra turn from Late Riser.')).toBe(true);
    while (!s.over) s = applyMove(s, chooseBotMove(s, rand));
    expect(s.log.some(l => /sits out/.test(l))).toBe(false);
  });
});
