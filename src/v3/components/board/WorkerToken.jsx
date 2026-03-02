/**
 * WorkerToken — Animated worker meeple on the board.
 *
 * Wraps WorkerIcon in a motion.div with layoutId for smooth
 * animated transitions when workers move between spaces.
 * Shows player name tooltip on hover.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WorkerIcon from '../icons/WorkerIcon';
import { playerColors } from '../../styles/theme';
import { tooltip as tooltipVariants } from '../../styles/animations';

export default function WorkerToken({ playerId, size = 32, layoutId, subtle = false, isLastPlaced = false }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = playerColors[playerId] || playerColors[0];

  // Last-placed worker gets a breathing glow. All others render static.
  return (
    <motion.div
      layoutId={layoutId}
      className="relative inline-flex items-center justify-center"
      initial={false}
      animate={isLastPlaced ? {
        filter: [
          `drop-shadow(0 0 4px ${colors.primary}) drop-shadow(0 0 8px ${colors.glow || colors.dark})`,
          `drop-shadow(0 0 8px ${colors.primary}) drop-shadow(0 0 14px ${colors.glow || colors.dark})`,
          `drop-shadow(0 0 4px ${colors.primary}) drop-shadow(0 0 8px ${colors.glow || colors.dark})`,
        ],
      } : {}}
      transition={isLastPlaced ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      style={{
        filter: subtle && !isLastPlaced
          ? `drop-shadow(0 1px 1px rgba(0,0,0,0.4))`
          : `drop-shadow(0 1px 2px rgba(0,0,0,0.6)) drop-shadow(0 0 4px ${colors.primary}) drop-shadow(0 0 8px ${colors.dark})`,
      }}
    >
      <WorkerIcon playerId={playerId} size={size} />

      {/* Player name tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium pointer-events-none z-50"
            variants={tooltipVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              backgroundColor: colors.dark,
              color: colors.light,
              border: `1px solid ${colors.primary}`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
            }}
          >
            {colors.name}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
