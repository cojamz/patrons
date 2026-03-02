/**
 * RoundTracker — Horizontal 3-segment round progress bar.
 *
 * Filled segments for completed rounds, the current round glows
 * with a gold accent, and future rounds stay dim. Roman numerals
 * label each segment.
 */
import React from 'react';
import { motion } from 'motion/react';
import { useGame } from '../../hooks/useGame';
import { godColors, base } from '../../styles/theme';

const SEGMENTS = [
  { round: 1, numeral: 'I', workers: 3, label: 'Round 1 — 3 patrons, Tier 1 actions' },
  { round: 2, numeral: 'II', workers: 4, label: 'Round 2 — 4 patrons, Tier 2 unlocked' },
  { round: 3, numeral: 'III', workers: 5, label: 'Round 3 — 5 patrons, Tier 3 unlocked' },
];

export default function RoundTracker() {
  const { game } = useGame();

  if (!game) return null;

  const currentRound = game.round || 1;
  const gold = godColors.gold;

  return (
    <div
      className="flex items-center gap-1 px-3 py-2 rounded-lg"
      style={{
        background: base.glass,
        border: `1px solid ${base.glassBorder}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <span
        className="text-[10px] font-semibold tracking-wider uppercase mr-2"
        style={{ color: base.textMuted }}
      >
        Round
      </span>

      {SEGMENTS.map(({ round, numeral, label }) => {
        const isCompleted = round < currentRound;
        const isCurrent = round === currentRound;
        const isFuture = round > currentRound;

        return (
          <motion.div
            key={round}
            className="relative flex items-center justify-center rounded-md cursor-default"
            title={`${label}${isCurrent ? ' (current)' : isCompleted ? ' (complete)' : ''}`}
            style={{
              width: '36px',
              height: '24px',
              background: isCompleted
                ? gold.primary
                : isCurrent
                  ? gold.surface
                  : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${
                isCompleted
                  ? gold.primary
                  : isCurrent
                    ? gold.border
                    : 'rgba(255, 255, 255, 0.06)'
              }`,
              opacity: isFuture ? 0.4 : 1,
            }}
            animate={
              isCurrent
                ? {
                    boxShadow: [
                      `0 0 6px ${gold.glow}`,
                      `0 0 14px ${gold.glowStrong}`,
                      `0 0 6px ${gold.glow}`,
                    ],
                  }
                : {}
            }
            transition={
              isCurrent
                ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                : {}
            }
          >
            <span
              className="text-[11px] font-bold tracking-wider"
              style={{
                color: isCompleted
                  ? base.textDark
                  : isCurrent
                    ? gold.light
                    : base.textMuted,
              }}
            >
              {numeral}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
