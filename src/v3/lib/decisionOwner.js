/**
 * Standard decision-owner resolution. Use everywhere we ask "who owns this pendingDecision?"
 * Order: playerId (engine canonical) → _playerId (UI tag set by GameProvider) → ownerId
 *        (passive/source owner) → fallback (e.g. currentPlayer).
 * Returns undefined if none match and no fallback given.
 */
export function getDecisionOwner(decision, fallback) {
  if (!decision) return fallback;
  return decision.playerId ?? decision._playerId ?? decision.ownerId ?? fallback;
}
