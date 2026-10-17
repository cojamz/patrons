// Round-end contests have one source of truth: contestTable. endRound awards exactly what it records
// (state.contests); each row's count/tiebreak is what the rule measures (an independent oracle counts it off the
// state), and the turn record (turnRail) and round workers (roundWorkers) match the engine's own accounting.
import { describe, it, expect } from 'vitest';
import { contestTable, turnRail, roundWorkers, quadrant } from '../../../engine/v4/index.js';
import { sceneQ } from './cards-helpers.js';
import { oracleCount, oracleTiebreak, oracleWinners, playMixedGames } from './contest-oracle.js';

function checkTable(s, table, where) {
  for (const c of table) {
    for (let k = 1; k < c.rows.length; k++) {
      const a = c.rows[k - 1], b = c.rows[k];
      expect(a.score, where).toBeGreaterThanOrEqual(b.score);
    }
    for (const r of c.rows) {
      const want = oracleCount(s, c.qid, s.players[r.player]);
      if (want != null) expect(r.count, `${where}: ${c.qid} count for seat ${r.player}`).toBe(want);
      const tb = oracleTiebreak(s, c.qid, s.players[r.player]);
      if (tb != null && c.tiebreak) expect(r.tiebreak, `${where}: ${c.qid} tiebreak for seat ${r.player}`).toBe(tb);
    }
    const w = oracleWinners(s, c.qid);
    if (w) expect(c.winners, `${where}: ${c.qid} winners`).toEqual(w);
    expect(c.rule).toBe(quadrant(c.qid).scoring.label.replace(/\s*\(.*\)\s*$/, ''));
    expect(typeof c.counts).toBe('string');
  }
}

describe('v4 contests: one function decides and describes them', () => {
  it('Red and Yellow ties each earn half the prize, regardless of former tiebreak counts', () => {
    const s = sceneQ({
      quadrants: ['gold', 'red', 'yellow'], n: 3,
      members: [['red.volunteer'], ['gold.tycoon'], []],
      res: [{ gold: 1, red: 1, yellow: 7 }, { gold: 1, red: 1, yellow: 1 }, {}],
      queue: [{ t: 'endRound' }],
    });
    const scored = s.contests.at(-1).results;
    for (const qid of ['red', 'yellow']) {
      const contest = scored.find(c => c.qid === qid);
      expect(contest.winners).toEqual([0, 1]);
      expect(contest.tiebreak).toBeNull();
      expect(contest.rows.every(r => r.tiebreak === undefined)).toBe(true);
    }
    // Gold, Red and Yellow all tie; each winner gets three half prizes of 1 follower each.
    expect(s.players.map(p => p.contest)).toEqual([3, 3, 0]);
  });
  it('Red and Yellow still award no prize when nobody has a member or a full set', () => {
    const s = sceneQ({ quadrants: ['gold', 'red', 'yellow'], n: 3, res: [{ yellow: 9 }, {}, {}] });
    for (const c of contestTable(s).filter(c => ['red', 'yellow'].includes(c.qid))) expect(c.winners).toEqual([]);
  });
  it('awards, records and describes every round of 24 mixed-table games the same way', () => {
    let rounds = 0, live = 0;
    playMixedGames(24, {
      onMove(s) {
        if (s.over || s.round < 1 || s.moves % 9) return;
        live++;
        checkTable(s, contestTable(s), `live move ${s.moves}`);
        const rail = turnRail(s);
        expect(rail.done.length + (rail.current != null ? 1 : 0)).toBe(s.turns.length);
        for (const p of s.players) expect(roundWorkers(s, p)).toBe(p.workers);
      },
      onScored({ before, after, moment, record, prize, game }) {
        rounds++;
        expect(record.round).toBe(before.round);
        expect(record.prize).toBe(prize);
        // what was recorded is what was awarded: each player's contest followers grew by the prizes they won
        for (const p of after.players) {
          const won = record.results.filter(c => c.winners.includes(p.id)).reduce((total, c) => total + prize / (c.winners.length > 1 ? 2 : 1), 0);
          for (const c of record.results) expect(c.prize).toBe(prize / (c.winners.length > 1 ? 2 : 1));
          expect(p.contest - before.players[p.id].contest, `game ${game}: ${p.name} contest delta`).toBe(won);
        }
        // and the record describes the table it was scored on (the oracle counts that table itself)
        checkTable(moment, record.results, `game ${game} round ${record.round}`);
      },
    });
    expect(rounds).toBeGreaterThanOrEqual(24 * 2);
    expect(live).toBeGreaterThan(100);
  });
});
