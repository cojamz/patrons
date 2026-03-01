/**
 * useGame — Hook to consume the v3 game context.
 */
import { useContext } from 'react';
import { GameContext } from '../GameProvider';

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}
