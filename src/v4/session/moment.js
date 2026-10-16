// A reload during the Reckoning or the round summary reopens it (saboteur, RC1: the reload skipped it and bot turns
// resolved unseen). The local session holds its bots at a round end until the summary is dismissed and saves that
// hold with the state; on resume this rebuilds the moment the table was showing, the same shape useTable makes live:
// { result, start, after, board }. `start` (the round's first state) and `before` (the state the last move was made
// from, for the scoring snapshot) come from replaying the game's own move list; the engine is deterministic.
import { isRoundEnd, parseRoundEnd, scoringSnapshot } from '../format.js';
import { gameRecord, replayRecord } from './record.js';

/** The states a held round end needs: { before, start } (either may be null if the replay can't give it). */
export function roundEndStates(state) {
  const out = { before: null, start: null };
  if (!state || !Array.isArray(state.history) || !state.history.length || !Array.isArray(state.contests) || !state.contests.length) return out;
  const ended = state.contests[state.contests.length - 1].round;
  const n = state.history.length;
  let round = null;
  try {
    const r = replayRecord(gameRecord(state), {
      upTo: n - 1,
      onMove: next => { if (next.round !== round) { round = next.round; if (round === ended) out.start = next; } },
    });
    if (r.ok && r.played === n - 1 && r.state.moves === state.moves - 1) out.before = r.state;
    // a round that began on the last move itself can't be the one that ended; the first round began on a move
  } catch { /* a record this build can't replay: the moment still opens, from the live state */ }
  return out;
}

/**
 * The round-end moment a held local game was showing, or null: the session must be holding (`roundHold`) at exactly
 * this state, and the log must hold the round's scoring line.
 */
export function restoredMoment(session, state) {
  const hold = session && session.roundHold;
  if (!hold || !state || hold.moves !== state.moves || !Array.isArray(state.log)) return null;
  let end = null;
  for (let i = state.log.length - 1; i >= 0 && !end; i--) if (isRoundEnd(state.log[i])) end = state.log[i];
  const result = end ? parseRoundEnd(state, end) : null;
  if (!result) return null;
  const { before, start } = roundEndStates(state);
  let board = null;
  try { board = scoringSnapshot(before, state); } catch { board = null; }
  return { result, start: start || state, after: state, board };
}
