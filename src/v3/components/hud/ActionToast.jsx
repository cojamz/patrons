/**
 * ActionToast — Brief banner showing what just happened.
 *
 * Slides down from below the top HUD, holds ~2s, fades up.
 * Shows the latest game log entry in a readable format.
 * Stacks up to 3 visible toasts.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, godColors } from '../../styles/theme';

// Clean up log text for display
function formatLogEntry(text) {
  return text
    .replace(/\bPlayer (\d+)\b/g, (_, id) => `Player ${Number(id) + 1}`)
    .replace(/\benvoys\b/gi, 'workers')
    .replace(/\benvoy\b/gi, 'worker')
    .replace(/\bGlory\b/g, 'Favor')
    .replace(/\bglory\b/g, 'favor');
}

// Determine accent color from log entry content
function getAccentColor(text) {
  const lower = text.toLowerCase();
  if (lower.includes('gold')) return godColors.gold.primary;
  if (lower.includes('black') || lower.includes('steal')) return godColors.black.primary;
  if (lower.includes('green') || lower.includes('repeat')) return godColors.green.primary;
  if (lower.includes('yellow')) return godColors.yellow.primary;
  if (lower.includes('favor') || lower.includes('glory')) return godColors.gold.light;
  return 'rgba(168, 162, 158, 0.5)';
}

/**
 * @param {Object} props
 * @param {Object[]} props.logEntries - Array of { id, text, timestamp } events
 */
export default function ActionToast({ logEntries }) {
  // Show at most 3 toasts
  const visible = (logEntries || []).slice(-3);

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
      style={{ top: '64px', zIndex: 45, maxWidth: '500px', width: '100%' }}
    >
      <AnimatePresence>
        {visible.map((entry) => {
          const text = formatLogEntry(entry.text);
          const accent = getAccentColor(entry.text);

          return (
            <motion.div
              key={entry.id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(12, 10, 9, 0.88)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              }}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{
                enter: { type: 'spring', stiffness: 400, damping: 25 },
                exit: { duration: 0.25 },
              }}
            >
              {/* Accent pip */}
              <div
                className="w-1.5 h-4 rounded-full flex-shrink-0"
                style={{ background: accent }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: base.textSecondary }}
              >
                {text}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
