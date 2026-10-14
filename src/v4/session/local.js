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
 * True when `move`, made from `before` (leaving `after`), commits the checkpointed player's turn:
 * a recruit, follower buy, activation or pass, or a payment (anything but Back).
 */
function commits(before, move, after) {
  const kind = before.pending && before.pending.kind;
  if (kind === 'buy') return /^(card|tier|pass|use)/.test(move.option) && !(after.pending && after.pending.kind === 'pay');
  if (kind === 'pay') return move.option !== 'back';
  return false;
}

/**
 * Local sessions add undo for the acting human's last placement: `undo()` restores the state from just
 * before their last 'place' move, offered until they commit anything else (buy, pass, pay, use) or the
 * turn moves on. Bots never undo.
 * @param {{ seats?: { name?: string, kind?: 'human'|'bot' }[], seed?: number, botDelayMs?: number, quadrants?: string[], state?: object }} opts
 *   Pass `state` (a saved engine state) to resume instead of starting a new game; `seats`, `seed` and `quadrants` are then ignored.
 * @returns {Session & { canUndo(): boolean, undo(): boolean }}
 */
export function createLocalSession({ seats, seed = Math.floor(Math.random() * 2 ** 31), botDelayMs = 450, quadrants, state: saved }) {
  let state = saved || createGame({ seats: seats.map(s => ({ name: s.name, kind: s.kind || 'human' })), seed, ...(quadrants ? { quadrants } : {}) });
  let version = 1;
  let timer = null;
  let destroyed = false;
  let checkpoint = null; // { state, player }: the state from just before a human's placement
  const subs = createEmitter();
  // Bot tie-breaks: seeded from the game seed, or (on resume) from the engine's current rng so it varies by position.
  const rand = seededRandom(((saved ? saved.rng ^ saved.seed : seed) ^ 0x9e3779b9) >>> 0);
  const mySeats = state.players.filter(p => p.kind !== 'bot').map(p => p.id);

  const info = () => ({
    mode: 'local',
    seats: state.players.map(p => ({ name: p.name, kind: p.kind, connected: true })),
    version,
  });

  function emit() {
    version += 1;
    subs.emit(state, info());
  }

  function apply(move) {
    const before = state;
    state = applyMove(state, move);
    if (before.pending && before.pending.kind === 'place' && mySeats.includes(move.player)) {
      checkpoint = { state: before, player: move.player };
    } else if (checkpoint) {
      const turnOver = !state.pending || state.pending.player !== checkpoint.player || state.pending.kind === 'place';
      if (turnOver || (move.player === checkpoint.player && commits(before, move, state))) checkpoint = null;
    }
    emit();
    schedule();
  }

  const canUndo = () => !!(!destroyed && checkpoint && state.pending && state.pending.player === checkpoint.player);

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
    canUndo,
    undo() {
      if (!canUndo()) return false;
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
