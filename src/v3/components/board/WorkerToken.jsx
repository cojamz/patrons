/**
 * WorkerToken — Worker meeple on the board.
 *
 * Shows player-colored meeple icon with optional glow for last-placed worker.
 * Player name tooltip on hover.
 *
 * Zero Framer Motion — CSS glow animation, plain hover tooltip.
 */
import React, { useState } from 'react';
import WorkerIcon from '../icons/WorkerIcon';
import { playerColors } from '../../styles/theme';

// CSS for worker entrance + tooltip (no infinite glow animation — was repainting via filter)
const workerCSS = document.createElement('style');
workerCSS.textContent = `
@keyframes workerEntrance {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.worker-entrance { animation: workerEntrance 350ms ease-out both; }
.worker-tooltip {
  opacity: 0;
  transform: translateX(-50%) translateY(2px);
  transition: opacity 120ms ease, transform 120ms ease;
  pointer-events: none;
}
.worker-token:hover .worker-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
`;
if (!document.querySelector('[data-worker-css]')) {
  workerCSS.setAttribute('data-worker-css', '');
  document.head.appendChild(workerCSS);
}

export default React.memo(function WorkerToken({ playerId, size = 32, subtle = false, isLastPlaced = false }) {
  const colors = playerColors[playerId] || playerColors[0];

  return (
    <div
      className={`worker-token relative inline-flex items-center justify-center worker-entrance`}
      style={{
        filter: subtle && !isLastPlaced
          ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))'
          : isLastPlaced
            ? `drop-shadow(0 0 6px ${colors.primary}) drop-shadow(0 0 12px ${colors.glow || colors.dark})`
            : `drop-shadow(0 1px 2px rgba(0,0,0,0.6)) drop-shadow(0 0 4px ${colors.primary}) drop-shadow(0 0 8px ${colors.dark})`,
      }}
    >
      <WorkerIcon playerId={playerId} size={size} />

      {/* Player name tooltip — CSS only */}
      <div
        className="worker-tooltip absolute -top-8 left-1/2 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium z-50"
        style={{
          backgroundColor: colors.dark,
          color: colors.light,
          border: `1px solid ${colors.primary}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {colors.name}
      </div>
    </div>
  );
});
