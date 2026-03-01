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
import { workerPlace, tooltip as tooltipVariants } from '../../styles/animations';

export default function WorkerToken({ playerId, size = 28, layoutId }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = playerColors[playerId] || playerColors[0];

  return (
    <motion.div
      layoutId={layoutId}
      className="relative inline-flex items-center justify-center"
      variants={workerPlace}
      initial="initial"
      animate="animate"
      exit="exit"
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      style={{
        filter: `drop-shadow(0 2px 4px ${colors.dark})`,
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
