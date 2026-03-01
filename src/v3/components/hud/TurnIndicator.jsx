/**
 * TurnIndicator — Current player + phase display.
 *
 * Compact HUD element for the top-center of the board.
 * Shows the active player's name in their color with a breathing
 * glow animation, plus a human-readable phase label.
 */
import React from 'react';
import { motion } from 'motion/react';
import { useGame } from '../../hooks/useGame';
import WorkerIcon from '../icons/WorkerIcon';
import { playerColors, base } from '../../styles/theme';

const PHASE_LABELS = {
  champion_draft: 'Draft Phase',
  round_start: 'Round Start',
  action_phase: 'Place Patrons',
  round_end: 'Round End',
  game_end: 'Game Over',
};

export default function TurnIndicator() {
  const { game, phase, currentPlayer } = useGame();

  if (!game) return null;

  const player = currentPlayer;
  const colors = playerColors[player?.id] || playerColors[0];
  const phaseLabel = PHASE_LABELS[phase] || phase;

  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5 rounded-xl"
      style={{
        background: base.glass,
        border: `1px solid ${base.glassBorder}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Breathing player indicator */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={{
          filter: [
            `drop-shadow(0 0 4px ${colors.primary})`,
            `drop-shadow(0 0 10px ${colors.primary})`,
            `drop-shadow(0 0 4px ${colors.primary})`,
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <WorkerIcon playerId={player?.id ?? 0} size={22} />
      </motion.div>

      {/* Player name */}
      <span
        className="text-sm font-bold tracking-wide"
        style={{ color: colors.primary }}
      >
        {player?.name || 'Player'}
      </span>

      {/* Divider */}
      <div
        className="w-px h-4"
        style={{ background: base.divider }}
      />

      {/* Phase label */}
      <span
        className="text-xs font-medium tracking-wider uppercase"
        style={{ color: base.textSecondary }}
      >
        {phaseLabel}
      </span>
    </div>
  );
}
