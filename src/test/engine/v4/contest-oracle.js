// An independent oracle for the round-end contests, used by the engine test (contests.test.js) and the UI
// test (src/test/v4/ui/contest-truth.test.jsx). It never calls a quadrant's scoring or show: it counts what each
// rule says it counts, straight off the state, so a screen and the engine can both be checked against it.
import { createGame, applyMove, defById, chooseBotMove, RING_VALUE } from '../../../engine/v4/index.js';
import { seededRandom } from '../../../engine/v4/rng.js';
import { makeTables } from './fuzz-tables-runner.js';

// Count printed groups independently of the engine's memberCount helpers.
const printed = def => Math.max(def.f || 0, def.n ?? 1);
const members = (state, p, color = null) => p.members.reduce((n, uid) => {
  const card = state.cards[uid], def = defById(card.def);
  if (color && def.quadrant !== color) return n;
  return n + Math.max(printed(def), card.copy ? printed(defById(card.copy)) : 0);
}, 0);

/** Count the agreed rule directly, without consulting production scoring callbacks or labels. */
export function oracleCount(state, qid, p) {
  const res = r => p.res[r] || 0;
  switch (qid) {
    case 'gold': return res('gold');
    case 'silver': return res('silver');
    case 'red': return res('red');
    case 'echo': return res('green');
    case 'thieves': return res('magenta');
    case 'market': return res('blue');
    case 'yellow': return Math.min(...state.resources.map(res));
    // Other arcs retain their own printed member quantity, including stand-ins and copied card weight.
    default: return members(state, p, qid);
  }
}
/** Contests have no secondary tiebreakers. Kept for callers rendering older records. */
export function oracleTiebreak() { return null; }
/** Every player tied for the largest count shares winner status (each earns half the full prize); zero never scores. */
export function oracleWinners(state, qid) {
  const rows = state.players.map(p => ({ id: p.id, c: oracleCount(state, qid, p) }));
  if (rows.some(r => r.c == null)) return null;
  const best = Math.max(...rows.map(r => r.c));
  const top = best > 0 ? rows.filter(r => r.c === best).map(r => r.id).sort((a, b) => a - b) : [];
  // Tiebreaker (guest, Cory 2026-10-21): "Ties you're in go to you alone" when exactly one tied player holds one
  const tb = top.filter(id => state.players[id].members.some(u => [state.cards[u].def, state.cards[u].copy].includes('benders.tiebreaker')));
  return top.length > 1 && tb.length === 1 ? tb : top;
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
