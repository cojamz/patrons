// Hot-seat session for this device, with two things session/local.js doesn't do yet:
//   - start from a saved engine state (resume after a reload), and
//   - undo your last placement until you buy or pass (UI-side; the engine has no undo).
// Same contract as session/local.js: getState, subscribe, submit, mySeats, info, destroy; plus canUndo/undo.
import { createGame, applyMove, isLegal, chooseBotMove } from '../engine/v4/index.js';

export function createLocalTable({ seats, seed = Math.floor(Math.random() * 2 ** 31), state: saved, botDelayMs = 450 }) {
  let state = saved || createGame({ seats: seats.map(s => ({ name: s.name, kind: s.kind || 'human' })), seed });
  let version = 1;
  let timer = null;
  let destroyed = false;
  let checkpoint = null; // { state, player } from just before your placement
  const subs = new Set();
  const mySeats = state.players.filter(p => p.kind !== 'bot').map(p => p.id);
  const info = () => ({ mode: 'local', seats: state.players.map(p => ({ name: p.name, kind: p.kind, connected: true })), version });
  const emit = () => { version += 1; for (const fn of [...subs]) fn(state, info()); };

  function apply(move) {
    const before = state;
    const kind = before.pending && before.pending.kind;
    state = applyMove(state, move);
    if (move.option.startsWith('slot:') && mySeats.includes(move.player)) checkpoint = { state: before, player: move.player };
    else if (checkpoint) {
      const committed = (kind === 'buy' && /^(card|tier|pass|use)/.test(move.option) && !(state.pending && state.pending.kind === 'pay'))
        || kind === 'pay' && move.option !== 'back';
      const turnOver = !state.pending || state.pending.player !== checkpoint.player || state.pending.kind === 'place';
      if (committed || turnOver) checkpoint = null;
    }
    emit();
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    const p = state.pending;
    if (destroyed || state.over || !p || state.players[p.player].kind !== 'bot') return;
    timer = setTimeout(() => {
      if (destroyed) return;
      try { apply(chooseBotMove(state)); } catch (e) { console.error('[v4 local] bot move failed:', e); }
    }, botDelayMs);
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
    canUndo: () => !!(checkpoint && state.pending && state.pending.player === checkpoint.player),
    undo() {
      if (!checkpoint) return false;
      state = checkpoint.state;
      checkpoint = null;
      emit();
      schedule();
      return true;
    },
    get mySeats() { return [...mySeats]; },
    get info() { return info(); },
    destroy() { destroyed = true; clearTimeout(timer); subs.clear(); },
  };
}
