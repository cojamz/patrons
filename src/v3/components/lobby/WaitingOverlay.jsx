/**
 * WaitingOverlay — Shown to non-active players when waiting for another
 * player to make a decision or take their turn.
 *
 * Semi-transparent so the game board is visible behind it.
 * Includes a "Leave Game" escape hatch.
 */
import React from 'react';
import { motion } from 'motion/react';
import { base, godColors, playerColors } from '../../styles/theme';
import WorkerIcon from '../icons/WorkerIcon';

export default function WaitingOverlay({ waitingFor, type = 'turn', onLeave }) {
  if (!waitingFor) return null;

  const colors = playerColors[waitingFor.slot ?? 0] || playerColors[0];
  const label = type === 'decision'
    ? `${waitingFor.name} is deciding...`
    : type === 'draft'
      ? `${waitingFor.name} is drafting a champion...`
      : `${waitingFor.name}'s turn`;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-[80]"
      style={{ pointerEvents: 'auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(12, 10, 9, 0.15)' }}
      />
      <motion.div
        className="relative flex flex-col items-center gap-2"
        style={{ pointerEvents: 'auto' }}
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
      >
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-xl"
          style={{
            background: 'rgba(28, 25, 23, 0.95)',
            border: `1px solid ${colors.primary}40`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${colors.primary}15`,
          }}
        >
          <motion.div
            animate={{
              filter: [
                `drop-shadow(0 0 2px ${colors.primary})`,
                `drop-shadow(0 0 8px ${colors.primary})`,
                `drop-shadow(0 0 2px ${colors.primary})`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <WorkerIcon playerId={waitingFor.slot ?? 0} size={24} />
          </motion.div>
          <span className="text-sm font-semibold" style={{ color: colors.light }}>
            {label}
          </span>
          <motion.span
            className="text-lg"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: base.textMuted }}
          >
            ...
          </motion.span>
        </div>
        {onLeave && (
          <button
            onClick={onLeave}
            className="text-xs px-3 py-1 rounded"
            style={{
              color: base.textMuted,
              background: 'rgba(28, 25, 23, 0.8)',
              border: '1px solid rgba(168, 162, 158, 0.15)',
              cursor: 'pointer',
              opacity: 0.6,
            }}
          >
            Leave Game
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
