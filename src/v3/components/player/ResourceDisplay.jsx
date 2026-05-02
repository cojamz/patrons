/**
 * ResourceDisplay — Row of resource gems with animated counts.
 *
 * Each resource type shows its unique gem shape + count.
 * Zero-count resources are dimmed but still visible.
 * Counts animate with a scale pop when values change.
 * Hover shows a styled tooltip explaining the resource's playstyle.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { resourceStyles, godMeta, godColors } from '../../styles/theme';
import { counterPop } from '../../styles/animations';
import ResourceIcon from '../icons/ResourceIcon';

const RESOURCE_ORDER = ['gold', 'black', 'green', 'yellow'];

const RESOURCE_HINTS = {
  gold: {
    flavor: 'Wealth & Prosperity',
    desc: 'Hoard riches to fuel your economy. Gold buys the best shops and artifacts, and having lots of it earns Favor from Aurum at the end of each round.',
  },
  black: {
    flavor: 'Shadows & Aggression',
    desc: 'For players who like to play dirty. Use black blessings to steal from rivals and disrupt their plans. Every theft earns Favor from Noctis.',
  },
  green: {
    flavor: 'Time & Tempo',
    desc: 'Repeat your best moves for extra value. Green blessings let you copy actions for powerful combos. Each repeat earns Favor from Chronis.',
  },
  yellow: {
    flavor: 'Abundance & Flexibility',
    desc: 'The wildcard resource — converts to any color you need. Great for adapting your strategy. Earn Favor from Solara by diversifying into new colors.',
  },
};

function ResourceGem({ type, count }) {
  const { value: displayCount, direction } = useAnimatedValue(count);
  const style = resourceStyles[type];
  const colors = godColors[type];
  const meta = godMeta[type];
  const hasAny = count > 0;
  const [hovered, setHovered] = useState(false);

  // Flash background on change
  const flashColor = direction === 'up'
    ? `rgba(${hexToRgb(style.color)}, 0.25)`
    : direction === 'down'
      ? 'rgba(225, 29, 72, 0.2)'
      : null;

  const hint = RESOURCE_HINTS[type];

  return (
    <motion.div
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={{
        opacity: hasAny ? 1 : 0.35,
        background: flashColor || (hasAny ? `rgba(${hexToRgb(style.color)}, 0.08)` : 'rgba(0,0,0,0)'),
      }}
      transition={{ duration: direction ? 0.15 : 0.4 }}
    >
      <div className="relative">
        <ResourceIcon type={type} size={26} glow={hasAny} />
        {/* Ambient glow behind gem when count > 0 */}
        {hasAny && (
          <div
            className="absolute inset-0 rounded-full blur-md -z-10"
            style={{
              background: style.color,
              opacity: 0.25,
              transform: 'scale(1.6)',
            }}
          />
        )}
      </div>
      <motion.span
        className="text-base font-semibold tabular-nums min-w-[1.25rem] text-center"
        animate={
          direction === 'up'
            ? counterPop.positive
            : direction === 'down'
              ? counterPop.negative
              : {}
        }
        style={{
          color: hasAny ? style.highlight : 'rgba(168, 162, 158, 0.5)',
        }}
      >
        {displayCount}
      </motion.span>

      {/* Styled tooltip */}
      <AnimatePresence>
        {hovered && hint && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              width: '220px',
              borderRadius: '10px',
              background: 'rgba(10, 9, 8, 0.98)',
              border: `1.5px solid ${colors.primary}88`,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.8)`,
              pointerEvents: 'none',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '8px 12px 6px',
              background: `linear-gradient(135deg, ${colors.surface} 0%, rgba(12,10,9,0.9) 100%)`,
              borderBottom: `1px solid ${colors.primary}33`,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <ResourceIcon type={type} size={18} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>
                  {meta?.name || type}
                </div>
                <div style={{ fontSize: '9px', color: colors.primary, opacity: 0.7, fontStyle: 'italic' }}>
                  {hint.flavor}
                </div>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: '8px 12px 10px' }}>
              <div style={{ fontSize: '11px', lineHeight: 1.5, color: 'rgba(200, 200, 210, 0.8)' }}>
                {hint.desc}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Convert a hex color string to comma-separated RGB values.
 * Handles both #RGB and #RRGGBB formats.
 */
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

export default function ResourceDisplay({ resources, activeGods }) {
  if (!resources) return null;

  const visibleResources = activeGods
    ? RESOURCE_ORDER.filter(r => activeGods.includes(r))
    : RESOURCE_ORDER;

  return (
    <div className="flex items-center gap-1.5">
      {visibleResources.map(type => (
        <ResourceGem
          key={type}
          type={type}
          count={resources[type] || 0}
        />
      ))}
    </div>
  );
}
