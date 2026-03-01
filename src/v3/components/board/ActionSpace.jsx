/**
 * ActionSpace — Single-line compact worker placement space.
 *
 * Visual states:
 *   - Available: god-colored border glow, clickable, subtle pulse
 *   - Occupied: shows small WorkerToken on right, dimmed border
 *   - Nullified: red tint, strikethrough name, red X
 *   - Locked: dim text, round badge (R2/R3) instead of tier
 *
 * Each space is a single compact row (~28px). Name and effect on the same line.
 */
import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { AnimatePresence } from 'motion/react';
import WorkerToken from './WorkerToken';
import { godColors, tierStyles, base } from '../../styles/theme';
import { actionSpaceHover, actionSpaceTap } from '../../styles/animations';

const TIER_NUMERALS = { 1: 'I', 2: 'II', 3: 'III' };

export default function ActionSpace({
  action,
  godColor,
  isAvailable,
  isOccupied,
  occupiedBy,
  isNullified,
  isLocked,
  onPlace,
  onHover,
  onLeave,
}) {
  const rowRef = useRef(null);

  const colors = godColors[godColor];
  const tier = tierStyles[action.tier];

  // Determine visual state
  const isInteractive = isAvailable && !isOccupied && !isNullified && !isLocked;

  // Border color varies by state
  const borderColor = isNullified
    ? 'rgba(225, 29, 72, 0.5)'
    : isLocked
      ? 'rgba(255, 255, 255, 0.06)'
      : isAvailable
        ? colors.glowStrong
        : isOccupied
          ? colors.border
          : colors.border;

  // Background varies by state
  const bgColor = isNullified
    ? 'rgba(225, 29, 72, 0.06)'
    : isLocked
      ? 'rgba(255, 255, 255, 0.02)'
      : isAvailable
        ? colors.surface
        : 'rgba(0, 0, 0, 0.2)';

  // Opacity varies by state
  const opacity = isLocked ? 0.35 : isNullified ? 0.5 : isOccupied ? 0.7 : 1;

  return (
    <motion.button
      ref={rowRef}
      onClick={isInteractive ? () => onPlace(action.id) : undefined}
      disabled={!isInteractive}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        height: '28px',
        padding: '0 8px',
        borderRadius: '5px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        opacity,
        cursor: isInteractive ? 'pointer' : 'default',
        textAlign: 'left',
        outline: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={isInteractive ? actionSpaceHover : undefined}
      whileTap={isInteractive ? actionSpaceTap : undefined}
    >
      {/* Available pulse glow */}
      {isAvailable && !isOccupied && !isNullified && !isLocked && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '5px',
            pointerEvents: 'none',
          }}
          animate={{
            boxShadow: [
              `inset 0 0 6px ${colors.glow}, 0 0 4px ${colors.glow}`,
              `inset 0 0 10px ${colors.glowStrong}, 0 0 8px ${colors.glow}`,
              `inset 0 0 6px ${colors.glow}, 0 0 4px ${colors.glow}`,
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Tier pill / Lock badge */}
      {isLocked ? (
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: base.textMuted,
            minWidth: '20px',
            height: '16px',
            lineHeight: 1,
          }}
        >
          R{action.tier}
        </span>
      ) : (
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: tier.border,
            color: tier.color,
            minWidth: '20px',
            height: '16px',
            lineHeight: 1,
          }}
        >
          {TIER_NUMERALS[action.tier]}
        </span>
      )}

      {/* Action name + effect inline */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
          zIndex: 10,
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1,
          color: isLocked ? base.textMuted : base.textPrimary,
          textDecoration: isNullified ? 'line-through' : 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {action.name}
        {action.effect && !isLocked && (
          <span style={{ fontWeight: 400, color: base.textMuted, marginLeft: '6px', fontSize: '10px' }}>
            {action.effect}
          </span>
        )}
      </span>

      {/* Occupied: show small worker meeple */}
      <AnimatePresence>
        {isOccupied && occupiedBy != null && (
          <div style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}>
            <WorkerToken
              playerId={occupiedBy}
              size={18}
              layoutId={`worker-${action.id}`}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Nullified overlay — small red X */}
      {isNullified && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '5px',
              background: 'rgba(225, 29, 72, 0.08)',
            }}
          />
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ position: 'relative' }}>
            <line x1="4" y1="4" x2="12" y2="12" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <line x1="12" y1="4" x2="4" y2="12" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </svg>
        </div>
      )}
    </motion.button>
  );
}
