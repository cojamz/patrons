// A hot-seat session that continues from a saved engine state (same contract as session/local.js).
// session/local.js always starts a new game; once it accepts a starting state, use that and delete this file.
import { applyMove, isLegal, chooseBotMove } from '../engine/v4/index.js';

export function resumeLocalSession({ state: saved, botDelayMs = 450 }) {
  let state = saved;
  let version = 1;
  let timer = null;
  let destroyed = false;
  const subs = new Set();
  const mySeats = state.players.filter(p => p.kind !== 'bot').map(p => p.id);
  const info = () => ({ mode: 'local', seats: state.players.map(p => ({ name: p.name, kind: p.kind, connected: true })), version });
  const apply = move => { state = applyMove(state, move); version += 1; for (const fn of [...subs]) fn(state, info()); schedule(); };
  function schedule() {
    clearTimeout(timer);
    const p = state.pending;
    if (destroyed || state.over || !p || state.players[p.player].kind !== 'bot') return;
    timer = setTimeout(() => { if (!destroyed) { try { apply(chooseBotMove(state)); } catch (e) { console.error('[v4 resume] bot move failed:', e); } } }, botDelayMs);
  }
  schedule();
  return {
    getState: () => state,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    submit(move) {
      if (destroyed) return Promise.reject(new Error('Session closed.'));
      const m = { player: move?.player ?? state.pending?.player, option: move?.option };
      if (!mySeats.includes(m.player)) return Promise.reject(new Error("That seat isn't yours."));
      if (!isLegal(state, m)) return Promise.reject(new Error(`Illegal move: ${m.option}`));
      try { apply(m); } catch (e) { return Promise.reject(e instanceof Error ? e : new Error(String(e))); }
      return Promise.resolve(state);
    },
    get mySeats() { return [...mySeats]; },
    get info() { return info(); },
    destroy() { destroyed = true; clearTimeout(timer); subs.clear(); },
  };
}
