// @vitest-environment node
// Wave-2 blind tester B (design/eval/wave2/tester-b/report.md): steal limits that match their cards (#6, #7), steal
// reasons that give the true limit (#38), a results breakdown that adds up (#18), and a member Use that would do
// nothing says so (#19). Each reproduced on a seeded scene first.
import { describe, it, expect } from 'vitest';
import { applyMove, followers, createGame, resume } from '../../../engine/v4/core.js';
import { chooseBotMove } from '../../../engine/v4/bots.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { sceneQ, spaceOf } from './cards-helpers.js';
import { take, move, uidOf } from './helpers.js';
import { breakdown } from '../../../v4/format.js';

const MAG = ['gold', 'thieves', 'market', 'echo'];
const takeFrom = (s, pid) => move(s, s.pending.options.find(o => o.value[0] === pid).id);

// Magenta redesign (design/spheres/magenta-redesign-2026-10-19.md): Redistribute steals 1 per Magenta action that
// has a minion (its own space too, Cory Oct 22), Crime Wave halves one rival's one-color stack, and general steals split freely among rivals.
describe('#6 Help Yourself: a rival lying low is never offered', () => {
  it('round I: 3 to take, all may come from P2, never from P3', () => {
    let s = sceneQ({ quadrants: MAG, n: 4, res: [{ gold: 1 }, { gold: 3, red: 2 }, { gold: 4 }, { gold: 3 }] });
    s.players[2].hideout = s.round; // P3 lies low
    s = take(s, 'thieves.pickpocket');
    expect(s.pending.count).toEqual({ of: 3, left: 3 });
    expect(s.pending.options.some(o => o.value[0] === 2)).toBe(false);
    expect(s.pending.blocked[2]).toMatch(/P3 can’t be stolen from now/);
    s = takeFrom(s, 1);
    expect(s.pending.options.some(o => o.value[0] === 1)).toBe(true); // a free split: P2 again is fine
    expect(s.pending.options.some(o => o.value[0] === 2)).toBe(false);
    s = takeFrom(takeFrom(s, 1), 1);
    expect(s.pending?.kind).not.toBe('choose');
    expect(s.players[0].res).toMatchObject({ gold: 4, magenta: 0 });
    expect(s.players[1].res.gold).toBe(0);
    expect(s.players[2].res.gold).toBe(4);
  });
});

describe('#7 Crime Wave: half of one rival\'s one-color stack, and the choice says so', () => {
  it('offers each rival stack of 2 or more at half, rounded down; a singleton or a rival lying low is not offered', () => {
    let s = sceneQ({ quadrants: MAG, n: 4, round: 2, res: [{}, { gold: 5 }, { gold: 5, red: 1 }, { gold: 4 }] });
    s.players[3].hideout = s.round; // P4 lies low
    s = take(s, 'thieves.rob');
    expect(s.pending.prompt).toMatch(/Crime Wave: choose a pile to halve\./);
    expect(s.pending.options.map(o => [o.id, o.take]).sort()).toEqual([['take:1:gold', 2], ['take:2:gold', 2]]);
    s = move(s, 'take:2:gold');
    expect(s.players[0].res).toMatchObject({ gold: 2, magenta: 1 });
    expect(s.players[2].res).toMatchObject({ gold: 3, red: 1 });
    expect(s.players[1].res.gold).toBe(5);
  });
});

describe('#38 a dim rival says the true reason', () => {
  it('Help Yourself: a rival you already emptied says they have nothing left, not that they are protected', () => {
    let s = sceneQ({ quadrants: MAG, n: 3, round: 2, res: [{}, { gold: 1 }, { gold: 2 }] });
    s = take(s, 'thieves.pickpocket');
    s = takeFrom(s, 1);
    expect(s.pending.options.every(o => o.value[0] === 2)).toBe(true);
    expect(s.pending.blocked[1]).toMatch(/P2 has nothing left to take/);
  });
  it('Help Yourself: a rival holding no more than you is still available, and may give both', () => {
    let s = sceneQ({ quadrants: MAG, n: 3, round: 2, res: [{ gold: 2 }, { gold: 5 }, { gold: 2 }] });
    s = take(s, 'thieves.pickpocket');
    expect(s.pending.options.some(o => o.value[0] === 2)).toBe(true);
    s = takeFrom(s, 2);
    expect(s.players[2].res.gold).toBe(2); // chosen piles move together once all picks are complete
    expect(s.pending.options.some(o => o.value[0] === 2)).toBe(true);
    expect(s.pending.options.some(o => o.value[0] === 1)).toBe(true);
    s = takeFrom(takeFrom(takeFrom(s, 2), 1), 1); // round II: steal 4
    expect(s.players[2].res.gold).toBe(0);
    expect(s.players[1].res.gold).toBe(3);
    expect(s.players[0].res).toMatchObject({ gold: 6, magenta: 0 });
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

// Wave-2 tester A (design/eval/wave2/tester-a/report.md #4, #5)
import { followerChoices, TIERS } from '../../../engine/v4/core.js';
describe('tester A #4: Extra Hand recruited during round III gives its minion this round', () => {
  it('a round-III recruit adds a turn after the others, and the minion count says so', () => {
    let s = sceneQ({ quadrants: ['gold', 'red', 'market', 'echo'], n: 2, round: 3, left: 5, res: [{ gold: 20, red: 20, blue: 20, green: 20 }],
      shop: ['benders.extrahand3'], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'allPlaced' }, { t: 'endRound' }, { t: 'afterRound' }] });
    s = take(s, 'gold.rush');
    const left0 = s.players[0].left;
    s = move(s, `card:${uidOf(s, 'benders.extrahand3', 'shop')}`);
    expect(s.players[0].left).toBe(left0 + 1);
    // P2's turn is under way; P1's extra one waits after it, before the round closes
    expect(s.pending.player).toBe(1);
    expect(s.queue.filter(t => t.t === 'turn' || t.t === 'allPlaced').map(t => t.t === 'turn' ? t.p : 'end')).toEqual([0, 'end']);
    expect(s.log.some(l => /Extra Hand: \+1 minion this round/.test(l))).toBe(true);
  });
  it('a round-II recruit still waits for round III', () => {
    let s = sceneQ({ quadrants: ['gold', 'red', 'market', 'echo'], n: 2, round: 2, res: [{ gold: 20, red: 20, blue: 20, green: 20 }],
      shop: ['benders.extrahand3'], queue: [{ t: 'turn', p: 0 }, { t: 'turn', p: 1 }, { t: 'allPlaced' }, { t: 'endRound' }] });
    s = take(s, 'gold.rush');
    s = move(s, `card:${uidOf(s, 'benders.extrahand3', 'shop')}`);
    expect(s.pending.player).toBe(1);
    expect(s.queue.filter(t => t.t === 'turn').length).toBe(0);
  });
});

describe('tester A #5: the suggested payment keeps the rims you lead or tie', () => {
  // Red scores held red too since v0.8.1 (decisions 2026-10-18), so the scene holds enough red to spend without losing it
  it('10-for-10 preserves the Gold, Silver and Red resource leads when a legal payment can', () => {
    const s = sceneQ({ quadrants: ['gold', 'red', 'silver', 'yellow'], n: 2, round: 3, res: [{ gold: 8, silver: 5, red: 6 }, { gold: 2, silver: 4 }] });
    const ways = followerChoices(s, s.players[0], TIERS.find(t => t.key === 'top'));
    const d = ways[0];
    expect(s.players[0].res.silver - (d.silver || 0)).toBeGreaterThanOrEqual(4);
    expect(s.players[0].res.gold - (d.gold || 0)).toBeGreaterThanOrEqual(2);
    expect(s.players[0].res.red - (d.red || 0)).toBeGreaterThanOrEqual(1);
  });
  it('when every way loses a lead, it loses as few as it can', () => {
    const s = sceneQ({ quadrants: ['gold', 'red', 'silver', 'yellow'], n: 2, round: 3, res: [{ gold: 4, silver: 5, yellow: 3, red: 2 }, { gold: 3, silver: 4, yellow: 2, red: 1 }] });
    const d = followerChoices(s, s.players[0], TIERS.find(t => t.key === 'top'))[0];
    const keeps = ['gold', 'silver'].filter(c => s.players[0].res[c] - (d[c] || 0) >= s.players[1].res[c]).length;
    expect(keeps).toBeGreaterThanOrEqual(1);
  });
});
