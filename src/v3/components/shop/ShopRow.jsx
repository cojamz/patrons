/**
 * ShopRow — Horizontal strip of 3 ShopCard components for one god.
 *
 * Renders the weak, strong, and VP shops. Checks god access and
 * affordability to determine clickability.
 */
import React from 'react';
import { useGame } from '../../hooks/useGame';
import ShopCard from './ShopCard';
import GodIcon from '../icons/GodIcon';
import { godColors, godMeta, base } from '../../styles/theme';
import gods from '../../../engine/v3/data/gods.js';

export default function ShopRow({ godColor }) {
  const { game, actions, currentPlayer } = useGame();

  if (!game) return null;

  const god = gods[godColor];
  if (!god || !god.shops) return null;

  const colors = godColors[godColor];
  const meta = godMeta[godColor];

  // Check if current player has god access
  function hasGodAccess() {
    if (!currentPlayer) return false;
    const godAccess = game.godsAccessedThisTurn || [];
    return godAccess.includes(godColor);
  }

  // Check if player can afford a shop
  function canAffordShop(shop) {
    if (!currentPlayer || !hasGodAccess()) return false;

    const playerResources = currentPlayer.resources || {};
    let totalHave = Object.values(playerResources).reduce((s, v) => s + v, 0);
    let totalNeeded = 0;

    for (const [resource, amount] of Object.entries(shop.cost || {})) {
      if (resource === 'any') {
        totalNeeded += amount;
      } else {
        if ((playerResources[resource] || 0) < amount) return false;
        totalNeeded += amount;
      }
    }

    return totalHave >= totalNeeded;
  }

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <GodIcon god={godColor} size={16} />
        <span
          className="text-[10px] font-bold tracking-wider uppercase"
          style={{ color: colors.light }}
        >
          {meta.name} Shops
        </span>
      </div>

      {/* Shop cards row */}
      <div className="flex items-stretch gap-2">
        {god.shops.map((shop) => {
          const shopId = `${godColor}_${shop.type}`;
          return (
            <ShopCard
              key={shopId}
              godColor={godColor}
              shopType={shop.type}
              cost={shop.cost}
              effect={shop.effect}
              canUse={canAffordShop(shop)}
              onUse={() => actions.useShop(shopId)}
            />
          );
        })}
      </div>
    </div>
  );
}
