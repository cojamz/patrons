/**
 * WaitingOverlay — Shown to non-active players when waiting for another
 * player to make a decision or take their turn.
 */
import React from 'react';
import { motion } from 'motion/react';
import { base, godColors, playerColors } from '../../styles/theme';
import WorkerIcon from '../icons/WorkerIcon';

export default function WaitingOverlay({ waitingFor, type = 'turn' }) {
  if (!waitingFor) return null;

  const colors = playerColors[waitingFor.slot ?? 0] || playerColors[0];
  const label = type === 'decision'
    ? `${waitingFor.name} is deciding...`
    : `${waitingFor.name}'s turn`;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-[80] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(12, 10, 9, 0.3)' }}
      />
      <motion.div
        className="relative flex items-center gap-3 px-6 py-3 rounded-xl"
        style={{
          background: 'rgba(28, 25, 23, 0.95)',
          border: `1px solid ${colors.primary}40`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px ${colors.primary}15`,
        }}
        initial={{ y: 20, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
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
      </motion.div>
    </motion.div>
  );
}
