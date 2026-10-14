// An independent oracle for the round-end contests, used by the engine test (contests.test.js) and the UI
// test (src/test/v4/ui/contest-truth.test.jsx). It never calls a quadrant's scoring or show: it counts what each
// rule says it counts, straight off the state, so a screen and the engine can both be checked against it.
import { createGame, applyMove, memberCount, countMembersOfColor, cardDef, chooseBotMove, quadrant, RING_VALUE } from '../../../engine/v4/index.js';
import { workersOnBoard } from '../../../engine/v4/core.js';
import { BADGE } from '../../../engine/v4/content/market.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { makeTables } from './fuzz-tables-runner.js';

/** The number a quadrant's rule measures for player p (its count), or null when the oracle doesn't know the rule. */
export function oracleCount(state, qid, p) {
  const res = r => p.res[r] || 0;
  switch (qid) {
    case 'gold': case 'silver': case 'trading': case 'echo': case 'blue': case 'green': return res(quadrant(qid).resource);
    case 'red': return memberCount(state, p);
    case 'market': return p.members.filter(u => { const d = cardDef(state, u); return d.s + d.w >= BADGE; }).length;
    case 'purple': return workersOnBoard(state, p);
    case 'yellow': return Math.min(...state.resources.map(res));
    case 'thieves': return countMembersOfColor(state, p, 'thieves');
    default: return null;
  }
}
/** The tiebreak a rule names, by the rule's own words, or null. */
export function oracleTiebreak(state, qid, p) {
  switch (qid) {
    case 'red': return countMembersOfColor(state, p, 'red');
    case 'market': return p.members.filter(u => cardDef(state, u).quadrant === 'market').length;
    case 'purple': return p.res.purple || 0;
    case 'yellow': return p.res.yellow || 0;
    default: return null;
  }
}
/** Winners by the oracle: most count, then most tiebreak; nobody when the best is 0 (with no tiebreak to lean on). */
export function oracleWinners(state, qid) {
  const rows = state.players.map(p => ({ id: p.id, c: oracleCount(state, qid, p), t: oracleTiebreak(state, qid, p) ?? 0 }));
  if (rows.some(r => r.c == null)) return null;
  // a full-set or badged rule needs at least one of the measured thing; workers and members can win on the tiebreak
  const needsOne = ['market', 'yellow'].includes(qid);
  const better = (a, b) => a.c - b.c || a.t - b.t;
  const best = rows.reduce((a, b) => (better(b, a) > 0 ? b : a));
  if (best.c === 0 && (needsOne || best.t === 0)) return [];
  return rows.filter(r => better(r, best) === 0).map(r => r.id).sort((a, b) => a - b);
}

const SEAT_NAMES = ['Ana', 'Bo', 'Cy', 'Di'];
/**
 * Plays `n` seeded bot games on mixed tables (every registered sphere, 2–4 seats) and calls
 * onScored({ before, after, record, game }) at each round end, and onMove(state) after each move.
 * before: the state just before the move that ended the round; after: right after it; record: after.contests[-1].
 */
export function playMixedGames(n, { onScored, onMove, seed0 = 9100 } = {}) {
  const { tables } = makeTables(4242, 1);
  for (let g = 0; g < n; g++) {
    const rand = seededRandom(seed0 + g);
    const quadrants = tables[g % tables.length];
    const seats = SEAT_NAMES.slice(0, 2 + (g % 3)).map((name, k) => ({ name, kind: k === 0 && g % 2 ? 'human' : 'bot' }));
    let s = createGame({ seats, seed: seed0 + g, quadrants });
    let guard = 0;
    while (!s.over && guard++ < 6000) {
      const before = s;
      s = applyMove(s, chooseBotMove(s, rand));
      if (onMove) onMove(s, g);
      if ((s.contests || []).length > (before.contests || []).length && onScored) {
        onScored({ before, after: s, record: s.contests[s.contests.length - 1], game: g, prize: RING_VALUE[s.contests.length - 1] });
      }
    }
    if (!s.over) throw new Error(`game ${g} did not finish`);
  }
}
