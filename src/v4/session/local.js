// Hot-seat session: the whole game runs on this device. Bots move on their own after a short delay.
import { createGame, applyMove, isLegal, chooseBotMove } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import { createEmitter } from './emitter.js';

/**
 * @typedef {{ player: number, option: string }} Move
 * @typedef {{ name: string, kind: 'human'|'bot', connected: boolean }} SeatInfo
 * @typedef {{ mode: 'local'|'online', roomCode?: string, isHost?: boolean, playerId?: string, seats: SeatInfo[], version: number }} SessionInfo
 * @typedef {{
 *   getState(): object|null,
 *   subscribe(fn: (state: object, info: SessionInfo) => void): () => void,
 *   submit(move: Move): Promise<object>,
 *   readonly mySeats: number[],
 *   readonly info: SessionInfo,
 *   destroy(): void,
 * }} Session
 */

/** Why a move can't be made right now, or null if it can. Shared by local and online sessions. */
export function moveProblem(state, move, mySeats) {
  if (!state) return 'The game has not started.';
  if (state.over) return 'The game is over.';
  if (!move || typeof move.option !== 'string') return 'A move needs an option id.';
  if (!mySeats.includes(move.player)) return `Seat ${move.player + 1} isn't yours.`;
  if (!state.pending || state.pending.player !== move.player) return 'Not your turn.';
  if (!isLegal(state, move)) return `Illegal move: ${move.option}`;
  return null;
}

/** Fills in `player` from the pending decision when the caller left it out. */
export function normalizeMove(state, move) {
  return { player: move?.player ?? state?.pending?.player, option: move?.option };
}

/**
 * @param {{ seats: { name?: string, kind?: 'human'|'bot' }[], seed?: number, botDelayMs?: number, quadrants?: string[] }} opts
 * @returns {Session}
 */
export function createLocalSession({ seats, seed = Math.floor(Math.random() * 2 ** 31), botDelayMs = 450, quadrants }) {
  let state = createGame({ seats: seats.map(s => ({ name: s.name, kind: s.kind || 'human' })), seed, ...(quadrants ? { quadrants } : {}) });
  let version = 1;
  let timer = null;
  let destroyed = false;
  const subs = createEmitter();
  const rand = seededRandom((seed ^ 0x9e3779b9) >>> 0);
  const mySeats = state.players.filter(p => p.kind !== 'bot').map(p => p.id);

  const info = () => ({
    mode: 'local',
    seats: state.players.map(p => ({ name: p.name, kind: p.kind, connected: true })),
    version,
  });

  function apply(move) {
    state = applyMove(state, move);
    version += 1;
    subs.emit(state, info());
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = null;
    const p = state.pending;
    if (destroyed || state.over || !p || state.players[p.player].kind !== 'bot') return;
    timer = setTimeout(() => {
      timer = null;
      if (destroyed) return;
      try { apply(chooseBotMove(state, rand)); } catch (err) { console.error('[v4 local] bot move failed:', err); }
    }, botDelayMs);
  }
  schedule();

  return {
    getState: () => state,
    subscribe(fn) {
      const off = subs.on(fn);
      if (state) fn(state, info());
      return off;
    },
    submit(raw) {
      if (destroyed) return Promise.reject(new Error('Session closed.'));
      const move = normalizeMove(state, raw);
      const problem = moveProblem(state, move, mySeats);
      if (problem) return Promise.reject(new Error(problem));
      try { apply(move); } catch (err) { return Promise.reject(err instanceof Error ? err : new Error(String(err))); }
      return Promise.resolve(state);
    },
    get mySeats() { return [...mySeats]; },
    get info() { return info(); },
    destroy() { destroyed = true; clearTimeout(timer); subs.clear(); },
  };
}
