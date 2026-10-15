// When a chair may skip a render (perf, 2026-10-15). The engine clones the whole state on every step, so a chair's
// memo never held: all four re-rendered on every bot step. A chair now re-renders only when something it shows changed:
// its player, its members' cards, its turn words ("next", "your turn in 3"), its rank, its income, its last space, the round, or a
// new log line naming it (its members' hops and its leader's gestures read the log). Every other prop must be the same.
import { followers } from '../../engine/v4/index.js';
import { newLogLines } from '../format.js';
import { lastSpace, seatTurns } from './seats.js';
import { seatRanks } from './RankRow.jsx';
import { incomeOf } from './build.js';

const cache = new WeakMap(); // state → Map(me → { places, ranks, sig: Map(pid → string) })
function sigOf(state, pid, me) {
  let m = cache.get(state);
  if (!m) { m = new Map(); cache.set(state, m); }
  let v = m.get(me);
  if (!v) { v = { places: seatTurns(state, me), ranks: seatRanks(state, me), sig: new Map() }; m.set(me, v); }
  let s = v.sig.get(pid);
  if (s === undefined) {
    const p = state.players[pid];
    s = JSON.stringify([p, p.members.map(u => state.cards[u]), v.places[pid] || null, v.ranks[pid] || null, incomeOf(state, pid),
      lastSpace(state, pid), followers(state, p), state.round, !!state.over, state.resources, state.quadrants]);
    v.sig.set(pid, s);
  }
  return s;
}

/** memo's comparator for CultSeat: true when the chair would draw the same thing. */
export function sameSeat(a, b) {
  for (const k in b) if (k !== 'state' && a[k] !== b[k]) return false;
  for (const k in a) if (!(k in b)) return false;
  if (a.state === b.state) return true;
  const sa = a.state, sb = b.state;
  if (!sa || !sb || sa.seed !== sb.seed || sa.players.length !== sb.players.length) return false;
  try {
    if (sigOf(sa, b.pid, b.me ?? null) !== sigOf(sb, b.pid, b.me ?? null)) return false;
    const name = sb.players[b.pid].name;
    return !newLogLines(sa, sb).some(l => l.includes(name));
  } catch { return false; }
}
