// Hot-seat session: the whole game runs on this device. Bots move on their own after a short delay.
import { createTalkLog, cleanTalk, TALK_GAP_MS } from './talk.js';
import { isLegal, chooseBotMove, setBotLevels } from '../../engine/v4/index.js';
import { seededRandom } from '../../engine/v4/rng.js';
import { createEmitter } from './emitter.js';
import { newGame, step, trackState, botStep } from './record.js';
import { share } from './share.js';
import { askBot } from './botThink.js';
import { settleEmojis } from '../emojiPick.js';

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
  // a placement that showed hidden cards (a draw from the pile, Peek's look at its top) can't be taken back: undoing it
  // would put the old row back after you'd seen what's coming (blind tester: undo leaked the deck)
  if (revealed(cp.state, state)) return false;
  return !!(state.pending && state.pending.player === cp.player && state.pending.kind !== 'place');
}
/** Did any card leave the face-down pile between `before` and `after` (dealt face up, drawn, or taken), or does
 *  `after`'s decision show pile cards `before`'s didn't (Peek looking at the top 4)? */
export function revealed(before, after) {
  if (!before || !after || !Array.isArray(before.pile) || !Array.isArray(after.pile)) return false;
  const still = new Set(after.pile);
  if (before.pile.some(u => !still.has(u))) return true;
  const shown = st => new Set((st.pending?.options || []).flatMap(o => Object.entries(o.at || {}).filter(([, w]) => w === 'pile').map(([u]) => u)));
  const was = shown(before);
  return [...shown(after)].some(u => !was.has(u));
}
/** Why a move is refused in a tab that no longer owns the local game (another tab took it). */
export const AWAY_TEXT = 'This game is open in another tab.';
/** How long the next bot waits after a human's buy, so "Undo buy" is really there to press. */
export const UNDO_BUY_HOLD_MS = 1600;

/**
 * Local sessions add undo for the acting human's last placement: `undo()` restores the state from just before it,
 * offered only while that placement is the last thing that happened. Any further move (by anyone, bots included)
 * or a round ending clears it. Bots never undo.
 * @param {{ seats?: { name?: string, kind?: 'human'|'bot' }[], seed?: number, botDelayMs?: number|(() => number), quadrants?: string[], state?: object, undo?: UndoCheckpoint|null,
 *   holdRoundEnds?: boolean, hold?: { moves: number }|null, isOwner?: () => boolean }} opts
 *   Pass `state` (a saved engine state) to resume instead of starting a new game; `seats`, `seed` and `quadrants` are then ignored.
 *   Pass `undo` (a saved `undoCheckpoint`) with it to keep undo across a reload; it's dropped unless still valid for `state`.
 *   `holdRoundEnds` (the app): when a round is scored the bots wait until `continueRound()` (the summary was dismissed),
 *   so the save stays on the round end and a reload reopens the summary. `hold` (a saved `roundHold`) resumes held.
 *   `isOwner` (the app's tab lease): checked before every move; once it says no, nothing more is applied here
 *   (another tab has the game) and bots stop.
 * @returns {Session & { canUndo(): boolean, undo(): boolean, readonly undoCheckpoint: UndoCheckpoint|null,
 *   readonly roundHold: { moves: number }|null, continueRound(): boolean }}
 */
export function createLocalSession({ seats, seed = Math.floor(Math.random() * 2 ** 31), botDelayMs = 450, quadrants, rules, botLevel, state: saved, undo: savedUndo, holdRoundEnds = false, hold: savedHold = null, isOwner = null }) {
  // A new game is stamped with this build's content hash and records its moves (state.build, state.history).
  // Every seat wears an emoji, none twice: a person's pick, else a random free one (bots too), seeded by the game.
  const dressed = saved ? null : settleEmojis(seats.map(s => ({ name: s.name, kind: s.kind || 'human', ...(s.emoji ? { emoji: s.emoji } : {}) })), seededRandom((seed ^ 0x5eed) >>> 0));
  let state = saved || newGame({ seats: dressed, seed, ...(quadrants ? { quadrants } : {}), ...(rules ? { rules } : {}) });
  // The setup screen's bot level (Easy / Normal / Hard) goes on every bot seat of a new game; a resumed game keeps its own.
  if (!saved && botLevel) setBotLevels(state, state.players.map(p => (p.kind === 'bot' ? botLevel : null)));
  let version = 1;
  let timer = null;
  let destroyed = false;
  let buyStart = null; // the buy-step state a purchase started from (undo-buy returns there)
  let checkpoint = saved && checkpointValid(savedUndo, saved) && saved.players[savedUndo.player]?.kind !== 'bot' ? savedUndo : null;
  const subs = createEmitter();
  const talk = createTalkLog();
  let talkN = 0, talkAt = 0;
  // Bot tie-breaks: seeded from the game seed, or (on resume) from the engine's current rng so it varies by position.
  const rand = seededRandom(((saved ? saved.rng ^ saved.seed : seed) ^ 0x9e3779b9) >>> 0);
  const mySeats = state.players.filter(p => p.kind !== 'bot').map(p => p.id);
  // a round just scored, its summary not yet dismissed: bots wait (holdRoundEnds)
  let roundHold = holdRoundEnds && saved && savedHold && savedHold.moves === saved.moves ? { moves: saved.moves } : null;
  const mayMove = () => !isOwner || isOwner();
  const scoredRounds = st => (Array.isArray(st.contests) ? st.contests.length : 0);

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
    // every part that didn't change is the very object it was, so the table's memo checks hold (session/share.js)
    state = share(before, next);
    // Only a human's placement opens a checkpoint; every other move closes it. A round ending inside the
    // placement (or the game ending) leaves nothing to undo.
    const human = mySeats.includes(move.player);
    const kind = before.pending && before.pending.kind;
    // a member used in the place step isn't a placement: it closes the checkpoint (it may show hidden cards)
    const placed = kind === 'place' && human && !move.option.startsWith('use:');
    // a purchase: from the buy step (one-way, paid at once) or from the pay step (after choosing how)
    if (kind === 'buy' && human && /^(card|tier):/.test(move.option)) buyStart = before;
    const bought = human && buyStart && ((kind === 'buy' && /^(card|tier):/.test(move.option) && !(state.pending && state.pending.kind === 'pay'))
      || (kind === 'pay' && move.option !== 'back'));
    const firstPick = kind === 'setup' && human && state.pending && state.pending.kind === 'setup' && state.pending.player === move.player;
    if (placed) checkpoint = { kind: 'place', state: before, player: move.player, moves: state.moves };
    else if (firstPick) checkpoint = { kind: 'setup', state: before, player: move.player, moves: state.moves };
    // a purchase is undoable only while the next to move is a bot: handing the device to another person ends it
    else if (bought && !(state.pending && mySeats.includes(state.pending.player) && state.pending.player !== move.player)) checkpoint = { kind: 'buy', state: buyStart, player: move.player, moves: state.moves };
    // a placement's own choices, one pick at a time (a steal coin by coin, Cheap Seats, a swap): Undo placement stays
    // through them while the choice goes on (live panel round 3: it vanished after the first pick), back to before the minion went out; a pick
    // that shows hidden cards still ends it (checkpointValid)
    else if (kind === 'choose' && human && checkpoint && checkpoint.kind === 'place' && checkpoint.player === move.player && checkpoint.moves === before.moves
      && state.pending && state.pending.kind === 'choose' && state.pending.player === move.player) checkpoint = { ...checkpoint, moves: state.moves };
    else checkpoint = null;
    if (!(kind === 'pay' || (kind === 'buy' && state.pending && state.pending.kind === 'pay'))) buyStart = null;
    if (!checkpointValid(checkpoint, state)) checkpoint = null;
    if (holdRoundEnds && scoredRounds(state) > scoredRounds(before)) roundHold = { moves: state.moves };
    emit();
    schedule();
  }

  const canUndo = () => !destroyed && checkpointValid(checkpoint, state);

  let turn = 0; // bumps on every schedule(): a bot's answer for an older turn is dropped
  function schedule() {
    clearTimeout(timer);
    timer = null;
    const my = ++turn;
    const p = state.pending;
    if (destroyed || roundHold || state.over || !p || state.players[p.player].kind !== 'bot') return;
    // (no hold after a buy: the payment step, with Back, is the safety net); a function reads the speed setting live
    const hold = typeof botDelayMs === 'function' ? botDelayMs() : botDelayMs;
    // In a browser the bot thinks in a worker from the moment its turn arrives, so the hold hides the thinking and
    // none of it lands on the main thread mid-spin. Its draws start from this rng's position and come back with
    // the answer, so the game goes exactly as if it had thought here. No worker (tests), or no usable answer:
    // it thinks here when the hold ends, as always.
    const asked = askBot(state, rand.state);
    let held = false, answer;
    const go = () => {
      if (my !== turn || !held || (asked && answer === undefined)) return;
      timer = null;
      if (destroyed || roundHold || !mayMove()) return;
      if (answer && isLegal(state, answer.move)) {
        let next = null;
        try { next = step(state, answer.move); } catch { next = null; }
        if (next) { rand.state = answer.rng; apply(answer.move, next); return; }
      }
      // A bot move that throws never stalls the game silently: it's logged, the first option that applies cleanly
      // is played instead, and a notice is reported (record.js reportProblem). Only if no option applies does the
      // game stop, with a 'stuck' notice.
      const r = botStep(state, st => chooseBotMove(st, rand), { tag: 'v4 local' });
      if (r.state) apply(r.move, r.state);
    };
    if (asked) asked.then(a => { answer = a || null; go(); });
    timer = setTimeout(() => { held = true; go(); }, hold);
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
      if (!mayMove()) return Promise.reject(new Error(AWAY_TEXT));
      const move = normalizeMove(state, raw);
      const problem = moveProblem(state, move, mySeats);
      if (problem) return Promise.reject(new Error(problem));
      roundHold = null; // a person moving means the summary is behind them
      try { apply(move); } catch (err) { return Promise.reject(err instanceof Error ? err : new Error(String(err))); }
      return Promise.resolve(state);
    },
    canUndo,
    undo() {
      if (!canUndo() || !mayMove()) return false;
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
    /** { moves } while a scored round waits for its summary to be dismissed (bots hold), else null. Saved with the state. */
    get roundHold() { return roundHold ? { ...roundHold } : null; },
    /** The round summary was dismissed: bots go on. Republishes the state so the app saves it without the hold. */
    continueRound() {
      if (!roundHold || destroyed) return false;
      roundHold = null;
      emit();
      schedule();
      return true;
    },
    get mySeats() { return [...mySeats]; },
    get info() { return info(); },
    /** Table talk (talk.js): a person at this screen says a quick line or a few typed words. */
    say(seat, text) {
      const t = cleanTalk(text);
      const now = Date.now();
      if (destroyed || !t || !mySeats.includes(seat) || now - talkAt < TALK_GAP_MS) return false;
      talkAt = now;
      talk.add({ id: `l${(talkN += 1)}`, seat, text: t, at: now, logAt: state.log.length });
      return true;
    },
    /** Every line said so far, oldest first. */
    get talk() { return talk.list; },
    onTalk: fn => talk.on(fn),
    destroy() { destroyed = true; turn += 1; clearTimeout(timer); subs.clear(); talk.clear(); },
  };
}
