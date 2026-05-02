/**
 * useGame / useGameState / useGameActions — Hooks to consume game contexts.
 *
 * Split context architecture:
 *   GameStateContext  — game state, changes on every action (high frequency)
 *   GameActionsContext — action dispatchers, stable references (never changes)
 *
 * useGameState()   → state only (components that just render game data)
 * useGameActions() → actions only (stable, never triggers re-renders)
 * useGame()        → both merged (backward compat for components needing both)
 */
import { useContext, useMemo } from 'react';
import { GameStateContext, GameActionsContext } from '../GameProvider';

/** State only — for components that just read game state. */
export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return ctx;
}

/** Actions only — stable references, never triggers re-renders from state changes. */
export function useGameActions() {
  const ctx = useContext(GameActionsContext);
  if (!ctx) {
    throw new Error('useGameActions must be used within a GameProvider');
  }
  return ctx;
}

/** Combined state + actions — backward compat. */
export function useGame() {
  const state = useContext(GameStateContext);
  const actions = useContext(GameActionsContext);
  if (!state) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return useMemo(() => ({ ...state, actions }), [state, actions]);
}
