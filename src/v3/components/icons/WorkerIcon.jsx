/**
 * WorkerIcon — SVG meeple shape with player color.
 *
 * Classic board game meeple silhouette with inner shadow
 * and highlight for that "carved wooden piece" feel.
 */
import React from 'react';
import { playerColors } from '../../styles/theme';

export default function WorkerIcon({ playerId, size = 24, className = '', ghost = false }) {
  const colors = playerColors[playerId] || playerColors[0];
  const w = size;
  const h = size;

  // Meeple path — scaled to viewBox
  // Classic meeple: head circle + body with arms spread
  const scale = size / 24; // normalize to 24x24 base

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      className={className}
      style={{ opacity: ghost ? 0.3 : 1 }}
    >
      <defs>
        <linearGradient id={`worker-grad-${playerId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="100%" stopColor={colors.dark} />
        </linearGradient>
        <filter id={`worker-shadow-${playerId}`}>
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="rgba(0,0,0,0.4)" />
        </filter>
      </defs>

      <g filter={`url(#worker-shadow-${playerId})`}>
        {/* Meeple body path */}
        <path
          d={`
            M12 3
            C13.7 3 15 4.3 15 6
            C15 7.2 14.3 8.2 13.3 8.7
            L16.5 12
            L20 12
            C20 12 20 14 18 14
            L16 14
            L17 20
            C17 20 17 22 15 22
            L9 22
            C7 22 7 20 7 20
            L8 14
            L6 14
            C4 14 4 12 4 12
            L7.5 12
            L10.7 8.7
            C9.7 8.2 9 7.2 9 6
            C9 4.3 10.3 3 12 3Z
          `}
          fill={`url(#worker-grad-${playerId})`}
          stroke={colors.dark}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />

        {/* Head highlight */}
        <circle cx="11.2" cy="5.3" r="0.8" fill="white" opacity="0.25" />

        {/* Body highlight */}
        <path
          d="M10 13 L11 10 L13 10 L14 13 Z"
          fill="white"
          opacity="0.1"
        />
      </g>
    </svg>
  );
}
