// @vitest-environment node
// Wave-2 blind tester B (design/eval/wave2/tester-b/report.md): steal limits that match their cards (#6, #7), steal
// reasons that give the true limit (#38), a results breakdown that adds up (#18), and a member Use that would do
// nothing says so (#19). Each reproduced on a seeded scene first.
import { describe, it, expect } from 'vitest';
import { applyMove, followers, createGame, resume } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { sceneQ } from './cards-helpers.js';
import { take, move, uidOf } from './helpers.js';
import { breakdown } from '../../../v4/format.js';

const MAG = ['gold', 'thieves', 'market', 'echo'];
const takeFrom = (s, pid) => move(s, s.pending.options.find(o => o.value[0] === pid).id);

describe('#6 Redistribute: exactly 1 from each richer rival it can take from', () => {
  it('a richer rival lying low is not counted: 2 to take, 1 each, never a second from P2', () => {
    let s = sceneQ({ quadrants: MAG, n: 4, res: [{ gold: 1 }, { gold: 3, red: 2 }, { gold: 4 }, { gold: 3 }] });
    s.players[2].hideout = s.round; // P3 lies low
    s = take(s, 'thieves.tipoff');
    expect(s.pending.count).toEqual({ of: 2, left: 2 });
    s = takeFrom(s, 1);
    expect(s.pending.options.every(o => o.value[0] === 3)).toBe(true);
    s = takeFrom(s, 3);
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[0].res.magenta).toBe(2);
  });
});

describe('#7 Crime Wave: 3 from rivals, at least 1 from each, and the choice says so', () => {
  it('with 3 rivals it is 1 from each; with 2 rivals 1 each and 1 from either; the caption names the limit', () => {
    let s = sceneQ({ quadrants: MAG, n: 4, round: 2, res: [{}, { gold: 5 }, { gold: 5 }, { gold: 5 }] });
    s = take(s, 'thieves.rob');
    expect(s.pending.prompt).toMatch(/1 each from P2, P3, P4/);
    s = takeFrom(s, 1);
    expect(s.pending.options.some(o => o.value[0] === 1)).toBe(false);
    expect(s.pending.blocked[1]).toMatch(/1 each from P3, P4/);
    let t = sceneQ({ quadrants: MAG, n: 3, round: 2, res: [{}, { gold: 5 }, { gold: 5 }] });
    t = take(t, 'thieves.rob');
    expect(t.pending.prompt).toMatch(/at least 1 from each of P2, P3/);
  });
});

describe('#38 a dim rival says the true reason', () => {
  it('Redistribute: a rival who already gave their 1 says so, not "you picked all their magenta"', () => {
    let s = sceneQ({ quadrants: MAG, n: 3, res: [{}, { magenta: 2, gold: 1 }, { gold: 2 }] });
    s = take(s, 'thieves.tipoff');
    s = takeFrom(s, 1);
    expect(s.pending.blocked[1]).toMatch(/1 from each richer rival/);
  });
  it('Redistribute: a rival holding no more than you says so', () => {
    let s = sceneQ({ quadrants: MAG, n: 3, res: [{ gold: 2 }, { gold: 5 }, { gold: 2 }] });
    s = take(s, 'thieves.tipoff');
    expect(s.pending.blocked[2]).toMatch(/P3 holds no more resources than you/);
  });
});

describe('#18 the results breakdown adds up', () => {
  it('over whole bot games on every table, yourself + members + bought + prizes + during play + end-game = total', () => {
    const tables = [['gold', 'red', 'market', 'echo'], ['yellow', 'market', 'trading', 'thieves'], ['silver', 'purple', 'thieves', 'trading'], ['gold', 'thieves', 'trading', 'echo']];
    let rows = 0, lines = 0;
    for (let g = 0; g < 8; g++) {
      const rand = seededRandom(70 + g);
      let s = createGame({ seats: [0, 1, 2, 3].map(i => ({ name: `P${i + 1}`, kind: 'bot' })), seed: 900 + g, quadrants: tables[g % tables.length] });
      let n = 0;
      while (s.pending && n++ < 3000) s = applyMove(s, chooseBotMove(s, rand, { level: 'normal' }));
      expect(s.over).toBe(true);
      for (const p of s.players) {
        const b = breakdown(s, p);
        expect(b.self + b.members + b.bought + b.contests + b.effects + b.endGame, `${p.name} game ${g}`).toBe(followers(s, p));
        expect(b.play.reduce((t, l) => t + l.n, 0), `${p.name} game ${g} lines`).toBe(b.effects);
        // every follower change during play has a named cause in the engine's ledger (no catch-all line)
        expect(b.play.filter(l => l.label === 'other' || l.label === 'during play'), `${p.name} game ${g}: ${JSON.stringify(b.play)}`).toEqual([]);
        rows++; lines += b.play.length;
      }
    }
    expect(rows).toBe(32);
    expect(lines).toBeGreaterThan(0);
  });
  it('a rival’s Raider shows as a loss on the leader and a gain on the raider', () => {
    let s = sceneQ({ quadrants: ['gold', 'red', 'trading', 'echo'], n: 2, res: [{ white: 5 }], bonus: [0, 6], members: [['trading.raider']] });
    s = move(s, `use:${uidOf(s, 'trading.raider', 0)}`);
    while (s.pending?.kind === 'choose') s = move(s, s.pending.options[s.pending.options.length - 1].id);
    const me = breakdown(s, s.players[0]), them = breakdown(s, s.players[1]);
    expect(me.play.find(l => /Raider/.test(l.label)).n).toBeGreaterThan(0);
    expect(them.play.find(l => /Raider/.test(l.label)).n).toBeLessThan(0);
    for (const p of s.players) {
      const b = breakdown(s, p);
      expect(b.self + b.members + b.bought + b.contests + b.effects + b.endGame).toBe(followers(s, p));
    }
  });
});

describe('#19 a member Use that would change nothing is marked idle', () => {
  // a person's seat (bots don't read it, so their seats skip the dry run)
  const human = s => { s.players[0].kind = 'human'; return resume(s); };
  it('Safecracker with a rival holding 1 magenta: half of 1 is 0, so its use option is idle', () => {
    const s = human(sceneQ({ quadrants: MAG, n: 2, round: 3, res: [{ gold: 2 }, { magenta: 1 }], members: [['thieves.bigscore']] }));
    const o = s.pending.options.find(x => x.kind === 'use');
    expect(o).toBeTruthy();
    expect(o.idle).toBe(true);
  });
  it('Safecracker with a rival holding 4 magenta is not idle', () => {
    const s = human(sceneQ({ quadrants: MAG, n: 2, round: 3, res: [{ gold: 2 }, { magenta: 4 }], members: [['thieves.bigscore']] }));
    const o = s.pending.options.find(x => x.kind === 'use');
    expect(o.idle).toBeFalsy();
    // the dry run left the real table alone
    expect(s.players[1].res.magenta).toBe(4);
    expect(s.cards[o.uid].used).toBeFalsy();
  });
});
