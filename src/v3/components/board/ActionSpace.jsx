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
 * Memoized to prevent re-renders when parent state changes but this space hasn't.
 *
 * Zero Framer Motion — all hover/tap via CSS for maximum performance.
 */
import React, { useCallback } from 'react';
import WorkerToken from './WorkerToken';
import RichEffect from '../shared/RichEffect';
import { godColors, tierStyles, base } from '../../styles/theme';

const TIER_NUMERALS = { 1: 'I', 2: 'II', 3: 'III' };

// CSS for hover/active effects (no infinite animations — section-level pulse handles availability)
const actionCSS = document.createElement('style');
actionCSS.textContent = `
.action-space { transition: transform 120ms ease, filter 150ms ease, background 150ms ease, border-color 150ms ease; }
.action-space:hover { filter: brightness(1.15); }
.action-space-interactive:hover { transform: scale(1.03); filter: brightness(1.3); }
.action-space-interactive:active { transform: scale(0.95); transition: transform 60ms ease; }
`;
if (!document.querySelector('[data-action-space-css]')) {
  actionCSS.setAttribute('data-action-space-css', '');
  document.head.appendChild(actionCSS);
}

const ActionSpace = React.memo(function ActionSpace({
  actionId,
  actionName,
  actionEffect,
  actionTier,
  godColor,
  isAvailable,
  isOccupied,
  occupiedBy,
  isNullified,
  isLocked,
  isLastPlaced,
  isJustPlaced,
  onPlace,
  onHover,
  onLeave,
}) {
  const colors = godColors[godColor];
  const tier = tierStyles[actionTier];

  const isInteractive = isAvailable && !isNullified && !isLocked;

  const borderColor = isNullified
    ? 'rgba(225, 29, 72, 0.5)'
    : isLocked
      ? 'rgba(255, 255, 255, 0.04)'
      : isAvailable
        ? colors.glowStrong
        : isOccupied
          ? 'rgba(255, 255, 255, 0.04)'
          : 'rgba(255, 255, 255, 0.06)';

  const bgColor = isNullified
    ? 'rgba(225, 29, 72, 0.06)'
    : isLocked
      ? 'rgba(0, 0, 0, 0.25)'
      : isAvailable
        ? colors.surface
        : isOccupied
          ? 'rgba(0, 0, 0, 0.35)'
          : 'rgba(0, 0, 0, 0.2)';

  const opacity = isLocked ? 0.55 : isNullified ? 0.5 : isOccupied && !isAvailable ? 0.7 : 1;

  const handleClick = useCallback(() => {
    if (isInteractive) onPlace(actionId);
  }, [isInteractive, onPlace, actionId]);

  return (
    <button
      onClick={handleClick}
      className={`action-space ${isInteractive ? 'action-space-interactive' : ''}${isJustPlaced ? ' action-just-placed' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        minHeight: '48px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        opacity,
        cursor: isInteractive ? 'pointer' : 'default',
        outline: 'none',
        flexShrink: 0,
        filter: 'brightness(1)',
        '--god-glow': colors.glow,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Available glow — static, no animation (section-level pulse handles the "alive" feel) */}
      {isInteractive && (
        <div
          style={{
            position: 'absolute',
            inset: '-1px',
            borderRadius: '6px',
            pointerEvents: 'none',
            boxShadow: `inset 0 0 8px ${colors.glow}, 0 0 8px ${colors.glow}, 0 0 3px ${colors.glowStrong}`,
            opacity: 0.6,
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
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: base.textMuted,
            minWidth: '24px',
            height: '20px',
            lineHeight: 1,
          }}
        >
          R{actionTier}
        </span>
      ) : (
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: tier.border,
            color: tier.color,
            minWidth: '24px',
            height: '20px',
            lineHeight: 1,
          }}
        >
          {TIER_NUMERALS[actionTier]}
        </span>
      )}

      {/* Action name + effect — stacked vertically for clean line breaks */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          position: 'relative',
          zIndex: 10,
          textDecoration: isNullified ? 'line-through' : 'none',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1px',
        }}
      >
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          lineHeight: 1.2,
          color: isLocked ? 'rgba(120, 113, 108, 0.5)' : isOccupied ? 'rgba(168, 162, 158, 0.7)' : base.textPrimary,
        }}>
          {actionName}
        </span>
        {actionEffect && !isLocked && (
          <span style={{ fontWeight: 400, color: isOccupied ? 'rgba(168, 162, 158, 0.5)' : base.textMuted, fontSize: '11px', lineHeight: 1.25 }}>
            <RichEffect text={actionEffect} size={11} />
          </span>
        )}
      </div>

      {/* Occupied: small outline worker meeple */}
      {isOccupied && occupiedBy != null && (
        <div style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}>
          <WorkerToken
            playerId={occupiedBy}
            size={20}
            subtle={!isLastPlaced}
            isLastPlaced={isLastPlaced}
          />
        </div>
      )}

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
    </button>
  );
});

export default ActionSpace;
