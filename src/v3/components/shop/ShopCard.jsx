/**
 * ShopCard — Individual shop card with cost display.
 *
 * Compact card showing the shop type label, cost in resource icons,
 * and effect text. God-colored border accent.
 * Clickable when the player can use it, dimmed otherwise.
 * Hover tooltip shows full shop info even when disabled.
 */
import React, { useState } from 'react';
import { motion } from 'motion/react';
import ResourceIcon, { WildcardIcon } from '../icons/ResourceIcon';
import { godColors, shopStyles, base, resourceStyles } from '../../styles/theme';

/**
 * Render shop cost as resource icons.
 */
function ShopCostDisplay({ cost }) {
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
                className="text-[11px] font-semibold"
                style={{ color: base.textSecondary }}
              >
                {amount}
              </span>
              <WildcardIcon size={13} />
            </div>
          );
        }

        return (
          <div key={resource} className="flex items-center gap-0.5">
            <span
              className="text-[11px] font-semibold"
              style={{ color: resourceStyles[resource]?.highlight || base.textSecondary }}
            >
              {amount}
            </span>
            <ResourceIcon type={resource} size={13} />
          </div>
        );
      })}
    </div>
  );
}

export default function ShopCard({ godColor, shopType, cost, effect, canUse = false, onUse }) {
  const [hovered, setHovered] = useState(false);
  const colors = godColors[godColor] || godColors.gold;
  const typeStyle = shopStyles[shopType] || shopStyles.weak;

  return (
    <motion.button
      onClick={canUse ? onUse : undefined}
      disabled={false}
      className="relative text-left rounded-lg overflow-visible flex-1 min-w-0"
      style={{
        background: canUse ? base.card : base.cardDark,
        opacity: canUse ? 1 : hovered ? 0.7 : 0.5,
        cursor: canUse ? 'pointer' : 'default',
        border: `1px solid ${base.cardBorder}`,
        borderTop: `3px solid ${colors.primary}`,
        transition: 'opacity 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={canUse ? {
        y: -2,
        boxShadow: `0 6px 16px rgba(0,0,0,0.3), 0 0 8px ${colors.glow}`,
        transition: { type: 'spring', stiffness: 400, damping: 20 },
      } : {}}
      whileTap={canUse ? { scale: 0.97 } : {}}
    >
      <div className="p-2.5 flex flex-col gap-1.5">
        {/* Type label */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: typeStyle.color }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: typeStyle.color }}
          >
            {typeStyle.label}
          </span>
        </div>

        {/* Cost */}
        <ShopCostDisplay cost={cost} />

        {/* Effect description */}
        <div
          className="text-[10px] leading-snug"
          style={{ color: base.textMuted }}
        >
          {effect}
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute z-50 rounded-lg p-3 pointer-events-none"
          style={{
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '220px',
            background: 'rgba(20, 18, 16, 0.96)',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${colors.glow}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Tooltip arrow */}
          <div
            className="absolute"
            style={{
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '10px',
              height: '10px',
              background: 'rgba(20, 18, 16, 0.96)',
              borderRight: `1px solid ${colors.border}`,
              borderBottom: `1px solid ${colors.border}`,
            }}
          />

          {/* Tooltip header */}
          <div className="flex items-center gap-1.5 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: typeStyle.color }}
            />
            <span
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: typeStyle.color }}
            >
              {typeStyle.label} Shop
            </span>
          </div>

          {/* Effect text */}
          <div
            className="text-[11px] leading-relaxed mb-2"
            style={{ color: base.textPrimary, opacity: canUse ? 1 : 0.7 }}
          >
            {effect}
          </div>

          {/* Cost breakdown */}
          <div
            className="pt-2 flex items-center gap-2"
            style={{ borderTop: `1px solid ${base.divider}` }}
          >
            <span
              className="text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: base.textMuted }}
            >
              Cost:
            </span>
            <ShopCostDisplay cost={cost} />
          </div>

          {/* Status indicator */}
          <div
            className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-center rounded py-0.5"
            style={{
              background: canUse ? colors.surface : 'rgba(255,255,255,0.03)',
              color: canUse ? colors.primary : base.textMuted,
              border: `1px solid ${canUse ? colors.border : base.divider}`,
            }}
          >
            {canUse ? 'Available' : 'Unavailable'}
          </div>
        </div>
      )}
    </motion.button>
  );
}
