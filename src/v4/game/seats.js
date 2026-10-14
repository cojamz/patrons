// Seat facts read off the engine: this round's seats in turn order, each seat's last moves.
import { turnRail, quadrant } from '../../engine/v4/index.js';

/** This round's seats in their turn order (the first pass of the snake); before round I, seat order. */
export function seatOrder(state) {
  const n = state.players.length;
  return state.order && state.order.length >= n ? state.order.slice(0, n) : state.players.map(p => p.id);
}
/** { pid: workers still to place }, and who's up now / next, from the engine's turn record (turnRail). */
export function railInfo(state) {
  const r = turnRail(state);
  return { current: r.current, next: r.next[0] ?? null, done: r.done, upcoming: r.next };
}
/**
 * Each seat's place in what's left of this round's turn order (the engine's queue, snake and extra turns included):
 * { pid: { place: 0 (up now) | 1 (next) | 2… , label: 'now' | 'next' | '3rd' … | 'done' } }, plus the order itself.
 * Empty outside the placing rounds.
 */
export function turnPlaces(state) {
  const out = {}, order = [];
  if (!(state.round >= 1) || state.over) return { places: out, order };
  const r = turnRail(state);
  for (const p of [r.current, ...r.next]) if (p != null && !order.includes(p)) order.push(p);
  const ord = n => `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
  for (const p of state.players) {
    const k = order.indexOf(p.id);
    out[p.id] = k < 0 ? { place: null, label: 'done' } : { place: k, label: k === 0 ? (r.current === p.id ? 'now' : 'first') : k === 1 ? 'next' : ord(k + 1) };
  }
  return { places: out, order };
}
/** A player's last n placements this round, newest first: ["Rush (Gold)", …]. */
export function lastMoves(state, pid, n = 3) {
  const name = state.players[pid].name;
  const out = [];
  for (let i = state.log.length - 1; i >= 0 && out.length < n; i--) {
    const l = state.log[i];
    if (/^Round \S+ begins\./.test(l)) break;
    const m = l.match(/^(.+?) (?:took|joined .+? on) (.+?) \((\w+)\)\.$/);
    if (m && m[1] === name) out.push(`${m[2]} (${m[3]})`);
  }
  return out;
}
/** The space a player took most recently this round: { key, name, qid } or null. */
export function lastSpace(state, pid) {
  const name = state.players[pid].name;
  for (let i = state.log.length - 1; i >= 0; i--) {
    const l = state.log[i];
    if (/^Round \S+ begins\./.test(l)) return null;
    const m = l.match(/^(.+?) took (.+?) \((\w+)\)\.$/);
    if (!m || m[1] !== name) continue;
    const q = state.quadrants.findIndex(id => quadrant(id).name === m[3]);
    if (q < 0) continue;
    const i2 = quadrant(state.quadrants[q]).actions.findIndex(a => a.name === m[2]);
    if (i2 >= 0) return { key: `${q}-${i2}`, name: m[2], qid: state.quadrants[q] };
  }
  return null;
}
