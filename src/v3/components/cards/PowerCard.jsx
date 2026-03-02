/**
 * PowerCard — Individual power card component.
 *
 * Compact by default: card name + cost icons in a single row (~50px tall).
 * On hover: smoothly expands to reveal description text (~100px tall).
 * Thick god-colored left border accent. Stagger animation via cardReveal.
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { powerCards } from '../../../engine/v3/data/powerCards';
import ResourceIcon, { WildcardIcon } from '../icons/ResourceIcon';
import { godColors, base, resourceStyles } from '../../styles/theme';
import { cardReveal } from '../../styles/animations';

/**
 * Compact cost display — inline icons for the collapsed card header.
 */
function CostDisplay({ cost }) {
  if (!cost || Object.keys(cost).length === 0) {
    return <span className="text-[10px]" style={{ color: base.textMuted }}>Free</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(cost).map(([resource, amount]) => {
        if (resource === 'any') {
          return (
            <div key="any" className="flex items-center gap-0.5">
              <span
                className="text-[10px] font-semibold"
                style={{ color: base.textSecondary }}
              >
                {amount}
              </span>
              <WildcardIcon size={12} />
            </div>
          );
        }

        return (
          <div key={resource} className="flex items-center gap-0.5">
            <span
              className="text-[10px] font-semibold"
              style={{ color: resourceStyles[resource]?.highlight || base.textSecondary }}
            >
              {amount}
            </span>
            <ResourceIcon type={resource} size={12} />
          </div>
        );
      })}
    </div>
  );
}

export default function PowerCard({ cardId, godColor, onBuy, canBuy = false, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const card = powerCards[cardId];
  if (!card) return null;

  const colors = godColors[godColor] || godColors.gold;

  return (
    <motion.button
      custom={index}
      variants={cardReveal}
      initial="initial"
      animate="animate"
      onClick={canBuy ? () => onBuy(cardId) : undefined}
      disabled={false}
      className="relative text-left rounded-lg overflow-visible"
      style={{
        background: canBuy ? base.card : base.cardDark,
        opacity: canBuy ? 1 : 0.55,
        cursor: canBuy ? 'pointer' : 'default',
        width: '155px',
        border: `1px solid ${base.cardBorder}`,
        borderLeftWidth: '4px',
        borderLeftColor: colors.primary,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={canBuy ? {
        y: -3,
        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 12px ${colors.glow}`,
        transition: { type: 'spring', stiffness: 400, damping: 20 },
      } : {
        y: -1,
        boxShadow: `0 4px 12px rgba(0,0,0,0.2)`,
        transition: { type: 'spring', stiffness: 400, damping: 20 },
      }}
      whileTap={canBuy ? { scale: 0.97 } : {}}
    >
      {/* Compact header — always visible */}
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <div
          className="text-[11px] font-bold leading-tight truncate flex-1"
          style={{ color: base.textDark }}
        >
          {card.name}
        </div>
        <div className="flex-shrink-0">
          <CostDisplay cost={card.cost} />
        </div>
      </div>

      {/* Expandable description — revealed on hover */}
      <div
        style={{
          maxHeight: hovered ? '80px' : '0px',
          opacity: hovered ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
        }}
      >
        <div className="px-2.5 pb-2">
          {/* Description */}
          <div
            className="text-[10px] leading-snug mb-1.5"
            style={{ color: base.textMuted }}
          >
            {card.description}
          </div>

          {/* Buy indicator */}
          {canBuy && (
            <div
              className="text-[9px] font-semibold uppercase tracking-wider text-center rounded py-0.5"
              style={{
                background: colors.surface,
                color: colors.primary,
                border: `1px solid ${colors.border}`,
              }}
            >
              Buy
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
