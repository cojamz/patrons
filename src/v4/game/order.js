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

/**
 * The table the screen draws: the physical state (counters, pieces in flight) with the turn record of the settled
 * interaction state (whose turn, its options, the order). Every field the turn words read goes across together:
 * early (Crunch Time's moved-up turns) belongs to the queue it moved, so a rival's Crunch Time still animating never
 * pairs the old queue with the new moves (the seats then counted the moved turns as extra ones: #113, "turn status
 * desync'd").
 */
export function tableView(physical, interaction) {
  if (physical === interaction) return physical;
  return { ...physical,
    pending: interaction.pending, current: interaction.current, over: interaction.over, order: interaction.order,
    turns: interaction.turns, queue: interaction.queue, early: interaction.early,
  };
}

/**
 * The round's snake said once, in names (Cory's todo, 2026-10-17: "make it clear the turn order is a snake draft"):
 * "Snake order: You, P3, P2, P2, P3, You …" — the first pass, then the way back, so the double turn at each end shows.
 * Read off the engine's order (seatOrder); '' outside the placing rounds.
 */
export function snakeWords(state, me = null) {
  if (!(state.round >= 1) || state.over) return '';
  const first = seatOrder(state);
  if (first.length < 2) return '';
  const name = id => (id === me ? 'You' : state.players[id].name);
  return `Snake order: ${[...first, ...[...first].reverse()].map(name).join(', ')} …`;
}

/** Setup's resource draft runs backward; placements start in firstOrder and snake back. The pending setup task
 * stays in the queue, including the final automatically assigned resource, so no seat is guessed or omitted. */
export function setupOrder(state) {
  if (state.over || state.pending?.kind !== 'setup') return null;
  const first = seatOrder(state);
  const draft = (state.queue || []).filter(t => t.t === 'setupPick').map(t => t.p);
  return { draft, place: [...first, ...[...first].reverse()] };
}
