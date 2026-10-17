// Seat facts read off the engine: this round's seats in turn order, each seat's last moves.
import { turnRail, quadrant } from '../../engine/v4/index.js';
import { turnSequence, firstPickWhy } from '../format.js';

/** This round's seats in their turn order (the first pass of the snake); before round I, round I's order, drawn before
 *  the starting picks (the engine's firstOrder), so the column never reshuffles after the picks (Cory, 2026-10-15). */
export function seatOrder(state) {
  const n = state.players.length;
  if (state.order && state.order.length >= n) return state.order.slice(0, n);
  return Array.isArray(state.firstOrder) && state.firstOrder.length === n ? [...state.firstOrder] : state.players.map(p => p.id);
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
  // "after you twice, P2" (a3: "after You, You" read as a stutter): a run of one seat is said once, and you is lowercase mid-sentence
  // who goes first, as its own short sentence (w4b #16: the card was one run-on line): "Before that: you twice, P2, P4."
  const ahead = k => {
    if (!k) return '';
    const runs = [];
    for (const id of order.slice(0, k)) { const r = runs[runs.length - 1]; if (r && r.id === id) r.n++; else runs.push({ id, n: 1 }); }
    return ` Before that: ${runs.map(r => `${r.id === me ? 'you' : state.players[r.id].name}${r.n === 2 ? ' twice' : r.n > 2 ? ` ${r.n} times` : ''}`).join(', ')}.`;
  };
  for (const p of state.players) {
    const k = order.indexOf(p.id);
    if (k < 0) { out[p.id] = { place: null, label: 'done', twice: false, text: 'done', title: `${name(p.id)} ${p.id === me ? 'have' : 'has'} no placements left this round` }; continue; }
    const twice = order[k + 1] === p.id;
    const now = k === 0 && state.current === p.id;
    const label = now ? 'now' : k === 0 ? 'next' : k === 1 ? 'next' : `in ${k}`;
    const again = twice ? ', then again right after' : '';
    const why = twice ? (seq[k + 1].early ? ` A turn taken early (${seq[k + 1].early}), not an extra one.` : seq[k + 1].kind === 'snake' ? ' In snake order, whoever ends a pass starts the next.' : ` ${seq[k + 1].kind === 'hand' ? 'An extra minion' : 'An extra turn'}${seq[k + 1].why ? ` from ${seq[k + 1].why}` : ''}.`) : '';
    const what = now ? 'Placing now' : label === 'next' ? 'Places next' : `Places in ${k} turns`;
    // whoever opened the round because a member says so says which (w3a A2: "P3 picks first" with no reason)
    const firstBy = state.order && state.order[0] === p.id ? firstPickWhy(state, p.id) : null;
    const opened = firstBy && firstBy !== 'fewest followers' ? ` First this round: ${firstBy}.` : '';
    out[p.id] = { place: k, label, twice, text: twice ? `${label}, twice in a row` : label, title: `${what}${again}.${ahead(now ? 0 : k)}${why}${opened}` };
  }
  return { places: out, order };
}
/**
 * What each seat says about the turns, in plain words (Cory, 2026-10-16: "the turn-order rail is confusing"; the rail is
 * gone and the seats say it): your own seat counts the turns until yours. A rival's seat says nothing (Cory, 2026-10-15:
 * "next" on the seat after the current player is dropped; the glow and the header say whose turn it is):
 * "your turn", an arrow for next, "your turn in 3", or "done this round". Read off the engine's queue (turnPlaces), so
 * extra turns, extra minions and seats with nothing left to place are counted as the turns they are.
 * Returns { [me]: { say, kind: 'now'|'soon'|'in'|'done', n, title } }; empty outside the placing rounds or without a me.
 */
export function seatTurns(state, me = null) {
  const out = {};
  const { places, order } = turnPlaces(state, me);
  if (!(state.round >= 1) || state.over) return out;
  const playing = order.length && state.current != null && order[0] === state.current ? order[0] : null;
  if (me != null && places[me]) {
    const k = order.indexOf(me);
    const tail = places[me].title ? ` ${places[me].title.replace(/^[^.]*\.\s*/, '')}`.trimEnd() : '';
    if (k < 0) out[me] = { say: 'done this round', kind: 'done', n: null, title: 'You have no placements left this round.' };
    else if (k === 0 && playing === me) {
      const twice = order[1] === me;
      out[me] = { say: twice ? 'two turns in a row' : 'your turn', kind: 'now', n: 0, title: twice ? `Your turn now, twice in a row.${tail}` : 'Your turn now.' };
    } else if (k === 0 || (k === 1 && playing != null)) out[me] = { say: '→', kind: 'soon', n: 1, title: `Your turn comes right after this one.${tail}` };
    else out[me] = { say: `your turn in ${k}`, kind: 'in', n: k, title: `${k} turns before yours.${tail}` };
  }
  return out;
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
