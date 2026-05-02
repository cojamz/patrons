/**
 * RoundTracker — Compact round badge.
 *
 * Shows "R1" / "R2" / "R3" with a subtle gold glow on the current round.
 * Small dots indicate progress (filled = completed, ring = current, dim = future).
 */
import React from 'react';
import { useGameState } from '../../hooks/useGame';
import { godColors } from '../../styles/theme';

export default function RoundTracker() {
  const { game } = useGameState();

  if (!game) return null;

  const currentRound = game.round || 1;
  const gold = godColors.gold;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-default round-tracker-glow"
      title={`Round ${currentRound} of 3`}
      style={{
        background: gold.surface,
        border: `1px solid ${gold.border}`,
        '--glow-color': gold.glow,
        '--glow-strong': gold.glowStrong,
      }}
    >
      <span
        className="text-xs font-bold tracking-wide"
        style={{ color: gold.light }}
      >
        R{currentRound}
      </span>

      {/* Progress dots */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3].map(r => (
          <div
            key={r}
            className="rounded-full"
            style={{
              width: '4px',
              height: '4px',
              background: r < currentRound
                ? gold.primary
                : r === currentRound
                  ? gold.light
                  : 'rgba(255, 255, 255, 0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
