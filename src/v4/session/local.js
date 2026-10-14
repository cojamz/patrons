// Hot-seat session: the whole game runs on this device. Bots move on their own after a short delay.
import { isLegal, chooseBotMove, setBotLevels } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import { createEmitter } from './emitter.js';
import { newGame, step, trackState, botStep } from './record.js';

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
 * An undo checkpoint: the state from just before a human's placement, valid only while nothing else has happened.
 * @typedef {{ state: object, player: number, moves: number }} UndoCheckpoint  (`moves` = state.moves right after the placement)
 */

/** True when `cp` can still undo from `state`: the placement was the very last move, in the same round, and it's still the placer's decision. */
export function checkpointValid(cp, state) {
  if (!(cp && cp.state && state && !state.over && state.moves === cp.moves && state.round === cp.state.round)) return false;
  // a buy can be taken back until anyone moves next; a placement only while it's still the placer's decision
  if (cp.kind === 'buy') return true;
  // a first starting pick, while its second pick is still open
  if (cp.kind === 'setup') return !!(state.pending && state.pending.player === cp.player && state.pending.kind === 'setup');
  return !!(state.pending && state.pending.player === cp.player && state.pending.kind !== 'place');
}
/** How long the next bot waits after a human's buy, so "Undo buy" is really there to press. */
export const UNDO_BUY_HOLD_MS = 1600;

/**
 * Local sessions add undo for the acting human's last placement: `undo()` restores the state from just before it,
 * offered only while that placement is the last thing that happened. Any further move (by anyone, bots included)
 * or a round ending clears it. Bots never undo.
 * @param {{ seats?: { name?: string, kind?: 'human'|'bot' }[], seed?: number, botDelayMs?: number, quadrants?: string[], state?: object, undo?: UndoCheckpoint|null }} opts
 *   Pass `state` (a saved engine state) to resume instead of starting a new game; `seats`, `seed` and `quadrants` are then ignored.
 *   Pass `undo` (a saved `undoCheckpoint`) with it to keep undo across a reload; it's dropped unless still valid for `state`.
 * @returns {Session & { canUndo(): boolean, undo(): boolean, readonly undoCheckpoint: UndoCheckpoint|null }}
 */
export function createLocalSession({ seats, seed = Math.floor(Math.random() * 2 ** 31), botDelayMs = 450, quadrants, botLevel, state: saved, undo: savedUndo }) {
  // A new game is stamped with this build's content hash and records its moves (state.build, state.history).
  let state = saved || newGame({ seats: seats.map(s => ({ name: s.name, kind: s.kind || 'human' })), seed, ...(quadrants ? { quadrants } : {}) });
  // The setup screen's bot level (Easy / Normal / Hard) goes on every bot seat of a new game; a resumed game keeps its own.
  if (!saved && botLevel) setBotLevels(state, state.players.map(p => (p.kind === 'bot' ? botLevel : null)));
  let version = 1;
  let timer = null;
  let destroyed = false;
  let buyStart = null; // the buy-step state a purchase started from (undo-buy returns there)
  let checkpoint = saved && checkpointValid(savedUndo, saved) && saved.players[savedUndo.player]?.kind !== 'bot' ? savedUndo : null;
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
    trackState(state);
    subs.emit(state, info());
  }
  trackState(state);

  // `next` is passed when the move was already applied (a bot step); otherwise it's applied here.
  function apply(move, next = step(state, move)) {
    const before = state;
    state = next;
    // Only a human's placement opens a checkpoint; every other move closes it. A round ending inside the
    // placement (or the game ending) leaves nothing to undo.
    const human = mySeats.includes(move.player);
    const kind = before.pending && before.pending.kind;
    const placed = kind === 'place' && human;
    // a purchase: from the buy step (one-way, paid at once) or from the pay step (after choosing how)
    if (kind === 'buy' && human && /^(card|tier):/.test(move.option)) buyStart = before;
    const bought = human && buyStart && ((kind === 'buy' && /^(card|tier):/.test(move.option) && !(state.pending && state.pending.kind === 'pay'))
      || (kind === 'pay' && move.option !== 'back'));
    const firstPick = kind === 'setup' && human && state.pending && state.pending.kind === 'setup' && state.pending.player === move.player;
    if (placed) checkpoint = { kind: 'place', state: before, player: move.player, moves: state.moves };
    else if (firstPick) checkpoint = { kind: 'setup', state: before, player: move.player, moves: state.moves };
    // a purchase is undoable only while the next to move is a bot: handing the device to another person ends it
    else if (bought && !(state.pending && mySeats.includes(state.pending.player) && state.pending.player !== move.player)) checkpoint = { kind: 'buy', state: buyStart, player: move.player, moves: state.moves };
    else checkpoint = null;
    if (!(kind === 'pay' || (kind === 'buy' && state.pending && state.pending.kind === 'pay'))) buyStart = null;
    if (!checkpointValid(checkpoint, state)) checkpoint = null;
    emit();
    schedule();
  }

  const canUndo = () => !destroyed && checkpointValid(checkpoint, state);

  function schedule() {
    clearTimeout(timer);
    timer = null;
    const p = state.pending;
    if (destroyed || state.over || !p || state.players[p.player].kind !== 'bot') return;
    const hold = botDelayMs; // (no hold after a buy: the payment step, with Back, is the safety net)
    timer = setTimeout(() => {
      timer = null;
      if (destroyed) return;
      // A bot move that throws never stalls the game silently: it's logged, the first option that applies cleanly
      // is played instead, and a notice is reported (record.js reportProblem). Only if no option applies does the
      // game stop, with a 'stuck' notice.
      const r = botStep(state, st => chooseBotMove(st, rand), { tag: 'v4 local' });
      if (r.state) apply(r.move, r.state);
    }, hold);
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
    /** The live undo checkpoint (or null), for saving next to the state so undo survives a reload. */
    get undoCheckpoint() { return canUndo() ? checkpoint : null; },
    /** 'place', 'buy' or 'setup' (a first starting pick) while undo is available, else null. */
    get undoKind() { return canUndo() ? checkpoint.kind || 'place' : null; },
    /** The seat whose move undo would take back, or null. */
    get undoSeat() { return canUndo() ? checkpoint.player : null; },
    get mySeats() { return [...mySeats]; },
    get info() { return info(); },
    destroy() { destroyed = true; clearTimeout(timer); subs.clear(); },
  };
}
