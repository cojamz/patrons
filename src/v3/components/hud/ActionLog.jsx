/**
 * ActionLog — Compact collapsible game event log.
 *
 * Shows the last few events as a small floating strip.
 * Click to expand/collapse. Transforms "worker" → "envoy" in display.
 */
import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, godColors, playerColors } from '../../styles/theme';

const COLLAPSED_ENTRIES = 3;

function getBorderColor(entry) {
  if (!entry) return base.divider;
  const lower = entry.toLowerCase();
  if (lower.includes('player 1')) return playerColors[0]?.primary || base.divider;
  if (lower.includes('player 2')) return playerColors[1]?.primary || base.divider;
  if (lower.includes('player 3')) return playerColors[2]?.primary || base.divider;
  if (lower.includes('player 4')) return playerColors[3]?.primary || base.divider;
  if (lower.includes('favor') || lower.includes('glory') || lower.includes('vp')) return '#E8C547';
  if (lower.includes('steal') || lower.includes('lose')) return base.negative;
  if (lower.includes('gain') || lower.includes('bought')) return base.positive;
  return 'rgba(255, 255, 255, 0.1)';
}

/** Normalize legacy terminology for display */
function formatEntry(entry) {
  return entry
    .replace(/\benvoys\b/gi, 'workers')
    .replace(/\benvoy\b/gi, 'worker');
}

export default function ActionLog({ log }) {
  const scrollRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log?.length]);

  if (!log || log.length === 0) return null;

  const visibleEntries = expanded ? log : log.slice(-COLLAPSED_ENTRIES);

  return (
    <div
      className="rounded-lg cursor-pointer select-none"
      style={{
        background: 'rgba(20, 18, 16, 0.88)',
        border: `1px solid ${base.glassBorder}`,
        backdropFilter: 'blur(8px)',
        maxWidth: '240px',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5"
        style={{ borderBottom: `1px solid ${base.divider}` }}
      >
        <span
          style={{
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: base.textMuted,
          }}
        >
          Log
        </span>
        <span
          style={{
            fontSize: '8px',
            color: base.textMuted,
          }}
        >
          {expanded ? '▼' : `▲ ${log.length}`}
        </span>
      </div>

      {/* Entries */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: expanded ? '160px' : '72px' }}
      >
        <div className="px-2 py-1" style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {visibleEntries.map((entry, i) => {
            const globalIndex = expanded ? i : log.length - COLLAPSED_ENTRIES + i;
            return (
              <div
                key={`${globalIndex}-${entry}`}
                className="flex items-start gap-1.5"
                style={{ padding: '1px 0' }}
              >
                <div
                  className="shrink-0 w-0.5 rounded-full self-stretch"
                  style={{
                    background: getBorderColor(entry),
                    minHeight: '10px',
                  }}
                />
                <span
                  style={{
                    fontSize: '10px',
                    lineHeight: 1.3,
                    color: base.textSecondary,
                  }}
                >
                  {formatEntry(entry)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
