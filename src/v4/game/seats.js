// Seat facts read off the engine: this round's seats in turn order, each seat's last moves.
import { turnRail, quadrant } from '../../engine/v4/index.js';
import { turnSequence, firstPickWhy } from '../format.js';

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
 * Each seat's next placement in what's left of this round (the engine's queue: snake turnarounds and extra turns are
 * counted as the placements they are): { pid: { place, label, twice, text, title } }, plus the order of placements.
 * label (one meaning each): 'now' (placing now), 'next' (places right after), 'in N' (N placements from now),
 * 'done' (no placements left this round); twice: their next two placements come back to back (the snake turning on
 * them, or an extra turn). Empty outside the placing rounds.
 */
export function turnPlaces(state, me = null) {
  const out = {}, order = [];
  if (!(state.round >= 1) || state.over) return { places: out, order };
  const seq = turnSequence(state).filter(t => t.at !== 'done');
  for (const t of seq) order.push(t.pid);
  const name = id => (id === me ? 'You' : state.players[id].name);
  const list = order.map(name);
  const ahead = k => (k ? ` after ${list.slice(0, k).join(', ')}` : '');
  for (const p of state.players) {
    const k = order.indexOf(p.id);
    if (k < 0) { out[p.id] = { place: null, label: 'done', twice: false, text: 'done', title: `${name(p.id)} ${p.id === me ? 'have' : 'has'} no placements left this round` }; continue; }
    const twice = order[k + 1] === p.id;
    const now = k === 0 && state.current === p.id;
    const label = now ? 'now' : k === 0 ? 'next' : k === 1 ? 'next' : `in ${k}`;
    const why = twice ? (seq[k + 1].kind === 'snake' ? ', then again right after (snake order: whoever ends a pass starts the next)' : `, then again right after (${seq[k + 1].kind === 'hand' ? 'an extra minion' : 'an extra turn'}${seq[k + 1].why ? ` from ${seq[k + 1].why}` : ''})`) : '';
    const what = now ? 'Placing now' : label === 'next' ? 'Places next' : `Places in ${k} turns`;
    // whoever opened the round because a member says so says which (w3a A2: "P3 picks first" with no reason)
    const firstBy = state.order && state.order[0] === p.id ? firstPickWhy(state, p.id) : null;
    const opened = firstBy && firstBy !== 'fewest followers' ? ` (first this round: ${firstBy})` : '';
    out[p.id] = { place: k, label, twice, text: twice ? `${label}, then again` : label, title: `${what}${ahead(now ? 0 : k)}${why}${opened}. Placements still to come: ${list.slice(0, 8).join(', ')}${list.length > 8 ? ', …' : ''}.` };
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
