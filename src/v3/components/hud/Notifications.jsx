/**
 * Notifications — Auto-dismissing toast notifications for game events.
 *
 * Positioned bottom-left, just above the player panel tabs.
 * Slides up from bottom, auto-fades after ~4s.
 * Color-coded accent bar by player or event type.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, playerColors, godColors } from '../../styles/theme';

const MAX_VISIBLE = 3;
const DISMISS_MS = 4500;

function getAccentColor(entry) {
  if (!entry) return base.divider;
  const lower = entry.toLowerCase();
  if (lower.includes('player 1')) return playerColors[0]?.primary || base.divider;
  if (lower.includes('player 2')) return playerColors[1]?.primary || base.divider;
  if (lower.includes('player 3')) return playerColors[2]?.primary || base.divider;
  if (lower.includes('player 4')) return playerColors[3]?.primary || base.divider;
  if (lower.includes('favor') || lower.includes('glory') || lower.includes('vp')) return godColors.gold.primary;
  if (lower.includes('steal') || lower.includes('lose')) return base.negative;
  if (lower.includes('gain') || lower.includes('bought')) return base.positive;
  return 'rgba(255, 255, 255, 0.2)';
}

function formatEntry(entry) {
  return entry
    .replace(/\benvoys\b/gi, 'workers')
    .replace(/\benvoy\b/gi, 'worker');
}

export default function Notifications({ log }) {
  const [toasts, setToasts] = useState([]);
  const seenCount = useRef(0);

  // When log grows, add new entries as toasts
  useEffect(() => {
    if (!log || log.length === 0) return;
    if (log.length <= seenCount.current) return;

    const newEntries = log.slice(seenCount.current);
    seenCount.current = log.length;

    const newToasts = newEntries.map((entry, i) => ({
      id: Date.now() + i,
      text: entry,
    }));

    setToasts(prev => [...prev, ...newToasts].slice(-MAX_VISIBLE * 2));
  }, [log?.length]);

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toasts]);

  const visible = toasts.slice(-MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed z-30 flex flex-col gap-1.5 pointer-events-none"
      style={{ bottom: '140px', right: '16px', maxWidth: '300px' }}
    >
      <AnimatePresence mode="popLayout">
        {visible.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-start gap-2 rounded-lg px-3 py-2"
            style={{
              background: '#14120F',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'auto',
            }}
          >
            {/* Colored accent bar */}
            <div
              className="w-0.5 rounded-full self-stretch flex-shrink-0"
              style={{
                background: getAccentColor(toast.text),
                minHeight: '14px',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                lineHeight: 1.4,
                color: base.textSecondary,
                fontWeight: 500,
              }}
            >
              {formatEntry(toast.text)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
