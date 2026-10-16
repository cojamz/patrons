// The chairs in turn order (Cory, 2026-10-15: "players should be positioned in turn order!!! the snake draft and who
// is next isn't clear"): position is order. The seats stand in one column in this round's first-pass order (fewest
// followers first, the engine's state.order); the snake walks down it on odd passes and back up on even ones, so the
// seat at each end places twice in a row. Read off the engine; nothing here is a rule.
import { WORKERS } from '../../engine/v4/index.js';
import { turnSequence } from '../format.js';
import { seatOrder } from './seats.js';

/** { order: [pid] (first pass), slot: { pid: index }, pass (0-based), passes, dir: 'down'|'up', extra (an extra turn
 *  after the snake) }. Before round I: seat order, no pass. */
export function snakeOrder(state) {
  const order = seatOrder(state);
  const slot = Object.fromEntries(order.map((pid, k) => [pid, k]));
  const n = state.players.length;
  const passes = state.round >= 1 ? (WORKERS[state.round - 1] || 0) : 0;
  let pass = 0, extra = false;
  if (state.round >= 1 && !state.over) {
    const seq = turnSequence(state);
    const doneSnake = seq.filter(t => t.at === 'done' && t.kind === 'snake').length;
    const cur = seq.find(t => t.at !== 'done');
    extra = !!cur && cur.kind !== 'snake';
    pass = Math.max(0, Math.min(passes - 1, Math.floor(doneSnake / n)));
  }
  return { order, slot, pass, passes, dir: pass % 2 ? 'up' : 'down', extra };
}
