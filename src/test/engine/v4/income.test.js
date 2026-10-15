// roundStartIncome (preview.js): what each player's members hand them at a round's start, read by running the
// engine's own round start on a copy. A seat's "each round" line (CultSeat) shows it.
import { describe, it, expect } from 'vitest';
import { createGame, applyMove, chooseBotMove, roundStartIncome } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';

const seats = [{ name: 'Ana', kind: 'bot' }, { name: 'Bo', kind: 'bot' }, { name: 'Cy', kind: 'bot' }];
const until = (s, ok, rand) => { for (let k = 0; k < 800 && !ok(s); k++) s = applyMove(s, chooseBotMove(s, rand)); return s; };

describe('v4 roundStartIncome', () => {
  it('counts a round-start member (Banker: +3 gold) for its owner, nothing for a cult without one, and never touches the state', () => {
    const s = until(createGame({ seats, seed: 61 }), t => t.round === 1 && t.pending && t.pending.kind === 'place', seededRandom(61));
    const banker = Object.keys(s.cards).map(Number).find(u => s.cards[u].def === 'gold.banker');
    expect(banker).toBeDefined();
    const t = structuredClone(s);
    for (const p of t.players) p.members = [];
    t.shop = t.shop.filter(u => u !== banker);
    t.pile = t.pile.filter(u => u !== banker);
    t.players[1].members = [banker];
    const frozen = JSON.stringify(t);
    const inc = roundStartIncome(t);
    expect(JSON.stringify(t)).toBe(frozen);
    expect(Object.keys(inc).map(Number).sort()).toEqual(t.players.map(p => p.id));
    expect(inc[1].res.gold).toBe(3);
    expect(inc[0].res).toEqual({});
    expect(inc[2].res).toEqual({});
    expect(inc[1].followers).toBe(0);
  });

  it('runs on every placement of played games without touching them, one entry per player', () => {
    let checked = 0;
    for (const seed of [71, 72]) {
      const rand = seededRandom(seed);
      let s = createGame({ seats, seed });
      for (let k = 0; k < 400 && !s.over; k++) {
        if (s.pending && s.pending.kind === 'place' && k % 7 === 0) {
          const frozen = JSON.stringify(s);
          const inc = roundStartIncome(s);
          expect(JSON.stringify(s)).toBe(frozen);
          expect(Object.keys(inc).length).toBe(s.players.length);
          for (const p of s.players) for (const v of Object.values(inc[p.id].res)) expect(Number.isInteger(v) && v !== 0).toBe(true);
          checked++;
        }
        s = applyMove(s, chooseBotMove(s, rand));
      }
    }
    expect(checked).toBeGreaterThan(4);
  });
});
