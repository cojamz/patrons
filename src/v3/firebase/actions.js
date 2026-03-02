/**
 * Action submission protocol for The Favored multiplayer.
 *
 * Remote players submit action intents to Firebase.
 * The host listens, validates, and executes via the engine.
 *
 * Action types:
 *   placeWorker   — { actionId }
 *   endTurn       — {}
 *   useShop       — { shopId }
 *   buyCard       — { cardId }
 *   submitDecision — { answer }
 *   draftChampion — { championId }
 */
import { db, ref, set, serverTimestamp } from './config.js';
import { clearPlayerAction } from './rooms.js';

/**
 * Submit an action to Firebase (remote player → host).
 * @param {string} roomCode
 * @param {string} playerId - The submitting player's ID
 * @param {object} action - { type: string, ...payload }
 */
export async function submitAction(roomCode, playerId, action) {
  await set(ref(db, `v3rooms/${roomCode}/actions/${playerId}`), {
    ...action,
    timestamp: serverTimestamp(),
  });
}

/**
 * Submit a worker placement action.
 */
export function submitPlaceWorker(roomCode, playerId, actionId) {
  return submitAction(roomCode, playerId, { type: 'placeWorker', actionId });
}

/**
 * Submit an end turn action.
 */
export function submitEndTurn(roomCode, playerId) {
  return submitAction(roomCode, playerId, { type: 'endTurn' });
}

/**
 * Submit a shop use action.
 */
export function submitUseShop(roomCode, playerId, shopId) {
  return submitAction(roomCode, playerId, { type: 'useShop', shopId });
}

/**
 * Submit a power card purchase.
 */
export function submitBuyCard(roomCode, playerId, cardId) {
  return submitAction(roomCode, playerId, { type: 'buyCard', cardId });
}

/**
 * Submit a decision response (gem selection, target player, etc.).
 */
export function submitDecision(roomCode, playerId, answer) {
  return submitAction(roomCode, playerId, { type: 'submitDecision', answer });
}

/**
 * Submit a champion draft choice.
 */
export function submitDraftChampion(roomCode, playerId, championId) {
  return submitAction(roomCode, playerId, { type: 'draftChampion', championId });
}

/**
 * Submit a round advance action.
 */
export function submitAdvanceRound(roomCode, playerId) {
  return submitAction(roomCode, playerId, { type: 'advanceRound' });
}

/**
 * Submit a cancel decision action.
 */
export function submitCancelDecision(roomCode, playerId) {
  return submitAction(roomCode, playerId, { type: 'cancelDecision' });
}

export { clearPlayerAction };
