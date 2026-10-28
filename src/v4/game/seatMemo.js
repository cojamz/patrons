// When a chair may skip a render (perf, 2026-10-15). The engine clones the whole state on every step, so a chair's
// memo never held: all four re-rendered on every bot step. A chair now re-renders only when something it shows changed:
// its player, its members' cards, its turn words ("your turn in 3"), its rank, its last space, the round, or a
// new log line naming it (its members' hops and its leader's gestures read the log). Every other prop must be the same.
// (Its next round's income left the chair with the readable seats; it also left this signature, where it cost an engine
// dry run of the round start on every step: up to ~100ms of a round III bot step at 4x CPU, input pass 2026-10-28.)
import { followers } from '../../engine/v4/index.js';
import { newLogLines } from '../format.js';
import { lastSpace, seatTurns } from './seats.js';
import { seatRanks } from './RankRow.jsx';

// (Tune pass, 2026-10-28: the sessions now share every unchanged part with the state before (session/share.js), so
// the chair's player, its members' cards and the table's colors are compared by identity first; JSON only when they
// are different objects, as on the scoring board's copies. Only the small derived words are still a string.)
const cache = new WeakMap(); // state → Map(me → { places, ranks, sig: Map(pid → string) })
function sigOf(state, pid, me) {
  let m = cache.get(state);
  if (!m) { m = new Map(); cache.set(state, m); }
  let v = m.get(me);
  if (!v) { v = { places: seatTurns(state, me), ranks: seatRanks(state, me), sig: new Map() }; m.set(me, v); }
  let s = v.sig.get(pid);
  if (s === undefined) {
    s = JSON.stringify([v.places[pid] || null, v.ranks[pid] || null, lastSpace(state, pid), followers(state, state.players[pid])]);
    v.sig.set(pid, s);
  }
  return s;
}
const samePart = (x, y) => x === y || JSON.stringify(x) === JSON.stringify(y);

/** memo's comparator for CultSeat: true when the chair would draw the same thing. */
export function sameSeat(a, b) {
  for (const k in b) if (k !== 'state' && a[k] !== b[k]) return false;
  for (const k in a) if (!(k in b)) return false;
  if (a.state === b.state) return true;
  const sa = a.state, sb = b.state;
  if (!sa || !sb || sa.seed !== sb.seed || sa.players.length !== sb.players.length) return false;
  try {
    if (sa.round !== sb.round || !!sa.over !== !!sb.over) return false;
    const pa = sa.players[b.pid], pb = sb.players[b.pid];
    if (!samePart(pa, pb) || !samePart(sa.resources, sb.resources) || !samePart(sa.quadrants, sb.quadrants)) return false;
    for (const u of pb.members) if (!samePart(sa.cards[u], sb.cards[u])) return false;
    if (sigOf(sa, b.pid, b.me ?? null) !== sigOf(sb, b.pid, b.me ?? null)) return false;
    const name = sb.players[b.pid].name;
    return !newLogLines(sa, sb).some(l => l.includes(name));
  } catch { return false; }
}
