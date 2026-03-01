/**
 * CardMarket — Power card purchase display for one god.
 *
 * Horizontal row of face-up power cards from the god's market.
 * Empty slots shown where cards have been purchased.
 * God-colored header identifies which market this is.
 */
import React from 'react';
import { motion } from 'motion/react';
import { useGame } from '../../hooks/useGame';
import PowerCard from './PowerCard';
import GodIcon from '../icons/GodIcon';
import { godColors, godMeta, base } from '../../styles/theme';
import { CARDS_DEALT_PER_GOD } from '../../../engine/v3/data/constants';
import { canAfford } from '../../../engine/v3/rules';
import { powerCards } from '../../../engine/v3/data/powerCards';

export default function CardMarket({ godColor }) {
  const { game, actions, currentPlayer } = useGame();

  if (!game) return null;

  const colors = godColors[godColor];
  const meta = godMeta[godColor];
  const market = (game.powerCardMarkets || {})[godColor] || [];

  // Build slots: fill with cards where present, null for empty
  const slots = [];
  for (let i = 0; i < CARDS_DEALT_PER_GOD; i++) {
    slots.push(market[i] || null);
  }

  // Check if current player can buy cards (has god access + card slots + can afford)
  function canBuyCard(cardId) {
    if (!currentPlayer || !cardId) return false;
    const playerId = currentPlayer.id;

    // Check god access
    const godAccess = game.godsAccessedThisTurn || [];
    if (!godAccess.includes(godColor)) return false;

    // Check card slot availability
    const champion = game.champions?.[playerId];
    if (!champion) return false;
    const currentCards = champion.powerCards || [];
    if (currentCards.length >= champion.powerCardSlots) return false;

    // Check affordability
    const card = powerCards[cardId];
    if (!card) return false;

    // Simple affordability check against card cost
    const playerResources = currentPlayer.resources || {};
    let totalNeeded = 0;
    let totalHave = Object.values(playerResources).reduce((s, v) => s + v, 0);

    for (const [resource, amount] of Object.entries(card.cost)) {
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
      {/* God-colored header */}
      <div className="flex items-center gap-2">
        <GodIcon god={godColor} size={20} />
        <span
          className="text-xs font-bold tracking-wider uppercase"
          style={{ color: colors.light }}
        >
          {meta.name} Cards
        </span>
        <span
          className="text-[10px]"
          style={{ color: base.textMuted }}
        >
          ({market.length} available)
        </span>
      </div>

      {/* Card row */}
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {slots.map((cardId, i) => {
          if (cardId) {
            return (
              <PowerCard
                key={cardId}
                cardId={cardId}
                godColor={godColor}
                index={i}
                canBuy={canBuyCard(cardId)}
                onBuy={(id) => actions.buyCard(id)}
              />
            );
          }

          // Empty slot
          return (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center rounded-lg"
              style={{
                width: '160px',
                minHeight: '140px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px dashed ${colors.border}`,
              }}
            >
              <span
                className="text-[10px] font-medium"
                style={{ color: base.textMuted }}
              >
                Sold
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
