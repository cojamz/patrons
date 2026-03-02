/**
 * FloatingDeltas — Floating "+2 gold" labels that animate upward and fade out.
 *
 * Renders above the resource display in PlayerPanel.
 * Each delta: god-colored text, floats up ~40px over 1.2s, fades out.
 * Multiple deltas stack horizontally (one per resource type).
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { godColors, base } from '../../styles/theme';

/**
 * @param {Object} props
 * @param {Object[]} props.deltas - Array of { id, playerId, deltas: { gold: +2, black: -1 }, timestamp }
 */
export default function FloatingDeltas({ deltas }) {
  if (!deltas || deltas.length === 0) return null;

  // Flatten all resource deltas into individual floating labels
  const labels = [];
  for (const event of deltas) {
    for (const [resource, amount] of Object.entries(event.deltas || {})) {
      if (amount === 0) continue;
      labels.push({
        key: `${event.id}-${resource}`,
        resource,
        amount,
        timestamp: event.timestamp,
      });
    }
  }

  if (labels.length === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 flex justify-center pointer-events-none"
      style={{ bottom: '100%', marginBottom: '4px', zIndex: 30 }}
    >
      <AnimatePresence>
        {labels.map((label) => {
          const colors = godColors[label.resource] || godColors.gold;
          const isPositive = label.amount > 0;
          const text = isPositive ? `+${label.amount}` : `${label.amount}`;

          return (
            <motion.span
              key={label.key}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums mx-0.5"
              initial={{ opacity: 0, y: 8, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{
                enter: { type: 'spring', stiffness: 400, damping: 20 },
                exit: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
              }}
              style={{
                color: isPositive ? colors.light : base.negativeLight,
                background: isPositive
                  ? `rgba(${hexToRgb(colors.primary)}, 0.2)`
                  : 'rgba(225, 29, 72, 0.15)',
                border: `1px solid ${isPositive ? colors.primary + '44' : 'rgba(225, 29, 72, 0.3)'}`,
                textShadow: `0 0 8px ${isPositive ? colors.glow : 'rgba(225, 29, 72, 0.4)'}`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: colors.primary }}
              />
              {text}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function hexToRgb(hex) {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
