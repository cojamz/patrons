/**
 * GameLog — Detailed game log with copy-to-clipboard.
 *
 * Shows all engine log entries grouped by round.
 * Expandable panel at the bottom of game end screen.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { base, godColors } from '../../styles/theme';

export default function GameLog({ log, players }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format the log into a clean text string
  const formattedLog = useMemo(() => {
    if (!log || log.length === 0) return '';

    const lines = [];
    lines.push('═══ THE FAVORED — Game Log ═══');
    lines.push('');

    // Add player list
    if (players && players.length > 0) {
      lines.push('Players:');
      for (const p of players) {
        lines.push(`  ${p.id}. ${p.name} — ${p.glory ?? 0} Favor`);
      }
      lines.push('');
    }

    // Group log entries by round markers
    let currentSection = 'Setup';
    lines.push(`--- ${currentSection} ---`);

    for (const entry of log) {
      const text = typeof entry === 'string' ? entry : JSON.stringify(entry);

      // Detect round transitions
      if (/Round \d+ started|Round \d+ begins/i.test(text)) {
        const match = text.match(/Round (\d+)/);
        if (match) {
          currentSection = `Round ${match[1]}`;
          lines.push('');
          lines.push(`--- ${currentSection} ---`);
        }
      }

      lines.push(`  ${text}`);
    }

    lines.push('');
    lines.push('═══ End of Log ═══');
    return lines.join('\n');
  }, [log, players]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedLog);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = formattedLog;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [formattedLog]);

  if (!log || log.length === 0) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors duration-150"
        style={{
          color: base.textMuted,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {expanded ? '▴' : '▾'} Game Log ({log.length} entries)
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-2 rounded-lg overflow-hidden"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {/* Copy button header */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: base.textMuted }}>
                  Full Game Log
                </span>
                <button
                  onClick={handleCopy}
                  className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded transition-colors duration-150"
                  style={{
                    color: copied ? '#4ade80' : base.textSecondary,
                    background: copied ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${copied ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Log entries */}
              <div
                className="p-3 overflow-y-auto scrollbar-hide"
                style={{ maxHeight: '300px', fontFamily: 'monospace' }}
              >
                {log.map((entry, i) => {
                  const text = typeof entry === 'string' ? entry : JSON.stringify(entry);
                  const isRoundMarker = /Round \d+|Game over|draft complete/i.test(text);
                  const isFavor = /favor|glory|VP/i.test(text);
                  const isAction = /placed.*worker|action/i.test(text);

                  return (
                    <div
                      key={i}
                      className="text-[10px] leading-relaxed py-0.5"
                      style={{
                        color: isRoundMarker
                          ? godColors.gold.light
                          : isFavor
                            ? '#E0E0F0'
                            : isAction
                              ? base.textSecondary
                              : base.textMuted,
                        fontWeight: isRoundMarker ? 700 : 400,
                        borderTop: isRoundMarker && i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        marginTop: isRoundMarker && i > 0 ? '4px' : 0,
                        paddingTop: isRoundMarker && i > 0 ? '4px' : 0,
                      }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
