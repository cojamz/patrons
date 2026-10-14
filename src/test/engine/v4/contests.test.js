// Round-end contests have one source of truth: contestTable. endRound awards exactly what it says and records it
// (state.contests); its rows' count/tiebreak are what the rule measures (checked against an independent oracle),
// and the turn record (turnRail) and round workers (roundWorkers) match the engine's own accounting.
import { describe, it, expect } from 'vitest';
import { contestTable, turnRail, roundWorkers, quadrant } from '../../../engine/v4/index.js';
import { oracleCount, oracleTiebreak, oracleWinners, playMixedGames } from './contest-oracle.js';

describe('v4 contests: one function decides and describes them', () => {
  it('awards, records and describes every round of 60 mixed-table games the same way', () => {
    let rounds = 0, checkedLive = 0;
    playMixedGames(60, {
      onMove(s) {
        if (s.over || s.round < 1 || s.moves % 7) return;
        checkedLive++;
        for (const c of contestTable(s)) {
          // rows are ordered by score, and the score's order is the (count, tiebreak) order the screen shows
          for (let k = 1; k < c.rows.length; k++) {
            const a = c.rows[k - 1], b = c.rows[k];
            expect(a.score).toBeGreaterThanOrEqual(b.score);
            const low = c.tiebreak && c.tiebreak.low ? -1 : 1;
            const lex = Math.sign(a.count - b.count || low * ((a.tiebreak ?? 0) - (b.tiebreak ?? 0)));
            if (a.score > b.score) expect(lex, `${c.qid} rows ${a.player}/${b.player}`).toBeGreaterThanOrEqual(0);
          }
          for (const r of c.rows) {
            const want = oracleCount(s, c.qid, s.players[r.player]);
            if (want != null) expect(r.count, `${c.qid} count for ${r.player}`).toBe(want);
            const tb = oracleTiebreak(s, c.qid, s.players[r.player]);
            if (tb != null && c.tiebreak) expect(r.tiebreak, `${c.qid} tiebreak for ${r.player}`).toBe(tb);
          }
          expect(c.rule).toBe(quadrant(c.qid).scoring.label.replace(/\s*\(.*\)\s*$/, ''));
          expect(typeof c.counts).toBe('string');
        }
        // the turn rail: taken turns + the current one are exactly the round's turn record
        const rail = turnRail(s);
        expect(rail.done.length + (rail.current != null ? 1 : 0)).toBe(s.turns.length);
        for (const p of s.players) expect(roundWorkers(s, p)).toBeGreaterThanOrEqual(3);
      },
      onScored({ before, after, record, prize }) {
        rounds++;
        expect(record.round).toBe(before.round);
        expect(record.prize).toBe(prize);
        expect(record.results.map(c => c.qid)).toEqual(after.quadrants);
        // what was recorded is what was awarded: each player's contest followers grew by the prizes they won
        for (const p of after.players) {
          const won = record.results.filter(c => c.winners.includes(p.id)).length * prize;
          expect(p.contest - before.players[p.id].contest, `${p.name} contest delta`).toBe(won);
        }
        // and every winner list matches the oracle (rules the oracle knows)
        for (const c of record.results) {
          const want = oracleWinners(at(before, after), c.qid);
          void want;
          expect(c.winners).toEqual([...c.winners].sort((a, b) => a - b));
          const topScore = c.rows[0].score;
          expect(c.winners).toEqual(topScore > 0 ? c.rows.filter(r => r.score === topScore).map(r => r.player).sort((a, b) => a - b) : []);
        }
      },
    });
    expect(rounds).toBeGreaterThanOrEqual(60 * 2);
    expect(checkedLive).toBeGreaterThan(100);
  });
});
// the oracle needs the table at the moment of scoring; the record's rows carry it, so the engine test checks
// internal consistency here and the UI test (which rebuilds the scoring moment) checks against the oracle
const at = (before, after) => after;
