// The warning on a card or space that gives a minion (Cory, 2026-10-29: "cards like extra hand and other things that
// give extra minions would need to warn when minions are out"): with the spare minions gone this round, it says so.
import { minionPool } from '../../engine/v4/index.js';

const GIVES = /extra turn|minions? this round/i;

/** "No spare minions left this round." when `text` gives a minion now and none are left, else null. */
export function poolNote(state, text) {
  if (!state || state.over || !(state.round >= 2) || !text) return null;
  const now = GIVES.test(text) || (state.round === 3 && /minions? in round III/i.test(text));
  return now && minionPool(state) === 0 ? 'No spare minions left this round.' : null;
}
