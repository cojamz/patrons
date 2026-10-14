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
  const q = quadrant(qid);
  // a plain "Most <resource>" rule counts that resource (Gold, Silver, White, Green, Purple…)
  if (q.scoring.label === `Most ${q.resource}`) return res(q.resource);
  switch (qid) {
    case 'red': return memberCount(state, p);
    case 'market': return p.members.filter(u => { const d = cardDef(state, u); return d.s + d.w >= BADGE; }).length;
    case 'purple': return /workers on the board/.test(q.scoring.label) ? workersOnBoard(state, p) : null;
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
    case 'purple': return /purple breaks ties/.test(quadrant(qid).scoring.label) ? p.res.purple || 0 : null;
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
const randomMove = (s, rand) => { const o = s.pending.options; return { player: s.pending.player, option: o[Math.floor(rand() * o.length)].id }; };

/** The table exactly when a round was scored: `move` replayed onto `before`, stopping right after endRound. */
export function scoringMoment(before, move) {
  const cut = before.queue.findIndex(t => t.t === 'endRound');
  return applyMove({ ...before, queue: before.queue.slice(0, cut + 1) }, move);
}

/**
 * Plays games g0..g0+n-1, seeded, on mixed tables (every registered sphere, 2–4 seats): even games with random legal
 * movers, every botEvery-th game with the normal bots. Calls onMove(state, g) after each move, and at each round end
 * onScored({ before, move, after, moment, record, prize, game }): moment is the table at scoring, record is
 * after.contests's newest entry.
 */
export function playMixedGames(n, { onScored, onMove, g0 = 0, seed0 = 9100, botEvery = 4 } = {}) {
  const { tables } = makeTables(4242, 1);
  for (let g = g0; g < g0 + n; g++) {
    const rand = seededRandom(seed0 + g);
    const quadrants = tables[g % tables.length];
    const seats = SEAT_NAMES.slice(0, 2 + (g % 3)).map((name, k) => ({ name, kind: k === 0 && g % 2 ? 'human' : 'bot' }));
    let s = createGame({ seats, seed: seed0 + g, quadrants });
    let guard = 0;
    while (!s.over && guard++ < 6000) {
      const before = s;
      const move = g % botEvery === botEvery - 1 ? chooseBotMove(s, rand) : randomMove(s, rand);
      s = applyMove(s, move);
      if (onMove) onMove(s, g);
      if ((s.contests || []).length > (before.contests || []).length && onScored) {
        const record = s.contests[s.contests.length - 1];
        onScored({ before, move, after: s, moment: scoringMoment(before, move), record, game: g, prize: RING_VALUE[record.round - 1] });
      }
    }
    if (!s.over) throw new Error(`game ${g} did not finish`);
  }
}
