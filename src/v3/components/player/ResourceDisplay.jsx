/**
 * ResourceDisplay — Row of resource gems with animated counts.
 *
 * Each resource type shows its unique gem shape + count.
 * Zero-count resources are dimmed but still visible.
 * Counts animate with a scale pop when values change.
 */
import React from 'react';
import { motion } from 'motion/react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { resourceStyles, godMeta } from '../../styles/theme';
import { counterPop } from '../../styles/animations';
import ResourceIcon from '../icons/ResourceIcon';

const RESOURCE_ORDER = ['gold', 'black', 'green', 'yellow'];

function ResourceGem({ type, count }) {
  const { value: displayCount, direction } = useAnimatedValue(count);
  const style = resourceStyles[type];
  const hasAny = count > 0;

  const meta = godMeta[type];
  const tooltipText = meta ? `${meta.name}, ${meta.title}` : type;

  // Flash background on change
  const flashColor = direction === 'up'
    ? `rgba(${hexToRgb(style.color)}, 0.25)`
    : direction === 'down'
      ? 'rgba(225, 29, 72, 0.2)'
      : null;

  return (
    <motion.div
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
      title={tooltipText}
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
