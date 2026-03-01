/**
 * GodArea — One god quadrant on the board.
 *
 * Two modes:
 *   FOCUSED: Full detail — actions with descriptions, shops, card market
 *   COLLAPSED: Compact overview — action rows, mini shops, mini cards
 *              with rich hover tooltips positioned near the hovered element
 *
 * Click a collapsed area to focus it. Shops/cards still interactive when collapsed.
 */
import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import ActionSpace from './ActionSpace';
import GodIcon from '../icons/GodIcon';
import ResourceIcon from '../icons/ResourceIcon';
import CardPixelIcon from '../icons/CardPixelIcon';
import WorkerToken from './WorkerToken';
import { useGame } from '../../hooks/useGame';
import { godColors, godMeta, base, tierStyles, shopStyles, resourceStyles } from '../../styles/theme';
import { godAreaGlow, staggerContainer, staggerItem, tooltip as tooltipVariants } from '../../styles/animations';
import gods from '../../../engine/v3/data/gods.js';
import { powerCards } from '../../../engine/v3/data/powerCards';
import { CARDS_DEALT_PER_GOD } from '../../../engine/v3/data/constants';

function parseCost(cost) {
  if (!cost) return [];
  return Object.entries(cost).map(([color, amount]) => ({ color, amount }));
}

// ============================================================================
// Floating Tooltip — positions near the hovered element
// ============================================================================

function FloatingTooltip({ tooltip, godColor }) {
  const { type, data, rect } = tooltip;
  const colors = godColors[godColor];

  if (!rect) return null;

  // Position to the right of the element, or left if too close to right edge
  const OFFSET = 10;
  const tooltipWidth = 280;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  let left = rect.right + OFFSET;
  if (left + tooltipWidth > viewportWidth - 16) {
    left = rect.left - tooltipWidth - OFFSET;
  }
  // Clamp left to viewport
  left = Math.max(8, left);

  let top = rect.top;
  // Don't let it overflow bottom
  top = Math.min(top, viewportHeight - 220);
  top = Math.max(8, top);

  const tooltipStyle = {
    position: 'fixed',
    left: `${left}px`,
    top: `${top}px`,
    zIndex: 9999,
    width: `${tooltipWidth}px`,
    padding: '12px 16px',
    borderRadius: '10px',
    background: '#000000',
    border: `2px solid ${colors.primary}`,
    boxShadow: `0 12px 40px rgba(0, 0, 0, 1), 0 0 0 4px rgba(0, 0, 0, 0.8), 0 0 16px ${colors.glow}`,
    pointerEvents: 'none',
  };

  if (type === 'action') {
    const action = data;
    return (
      <motion.div
        style={tooltipStyle}
        variants={tooltipVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: tierStyles[action.tier]?.color || base.textMuted,
            background: tierStyles[action.tier]?.border || base.divider,
            padding: '2px 5px', borderRadius: '3px',
          }}>
            Tier {['', 'I', 'II', 'III'][action.tier]}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>
            {action.name}
          </span>
        </div>
        {action.effect && (
          <div style={{ fontSize: '12px', lineHeight: 1.5, color: base.textSecondary }}>
            {action.effect}
          </div>
        )}
      </motion.div>
    );
  }

  if (type === 'shop') {
    const shop = data;
    const costEntries = parseCost(shop.cost);
    const style = shopStyles[shop.type];
    return (
      <motion.div style={tooltipStyle} variants={tooltipVariants} initial="initial" animate="animate" exit="exit">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: style.color,
            background: `${style.color}20`, padding: '2px 5px', borderRadius: '3px',
          }}>
            {style.label} Shop
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: base.textMuted }}>Cost:</span>
          {costEntries.map(({ color, amount }) => (
            <div key={color} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: base.textPrimary }}>{amount}</span>
              {color === 'any' ? (
                <span style={{ fontSize: '10px', color: base.textMuted }}>*</span>
              ) : (
                <ResourceIcon type={color} size={12} />
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '12px', lineHeight: 1.5, color: base.textSecondary }}>
          {shop.effect}
        </div>
      </motion.div>
    );
  }

  if (type === 'card') {
    const cardId = data;
    const card = powerCards[cardId];
    if (!card) return null;
    const costEntries = Object.entries(card.cost || {});
    return (
      <motion.div style={tooltipStyle} variants={tooltipVariants} initial="initial" animate="animate" exit="exit">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <CardPixelIcon cardId={cardId} size={24} color={colors.light} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>
              {card.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              {costEntries.map(([resource, amount]) => (
                <div key={resource} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: resourceStyles[resource]?.highlight || base.textMuted,
                  }}>
                    {amount}
                  </span>
                  {resource === 'any' ? (
                    <span style={{ fontSize: '9px', color: base.textMuted }}>*</span>
                  ) : (
                    <ResourceIcon type={resource} size={11} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', lineHeight: 1.5, color: base.textSecondary }}>
          {card.description}
        </div>
      </motion.div>
    );
  }

  return null;
}

// ============================================================================
// Main GodArea Component
// ============================================================================

export default function GodArea({ godColor, isFocused = true, onFocus }) {
  const { game, availableActions, actions, currentPlayer } = useGame();
  const colors = godColors[godColor];
  const meta = godMeta[godColor];
  const godData = gods[godColor];

  // Single tooltip state for the whole god area
  const [tooltip, setTooltip] = useState(null);

  const showTooltip = useCallback((type, data, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ type, data, rect });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!godData || !game) return null;

  const currentRound = game.round;
  const occupiedSpaces = game.occupiedSpaces || {};
  const nullifiedSpaces = game.nullifiedSpaces || {};

  // Group actions by tier
  const tier1 = godData.actions.filter(a => a.tier === 1);
  const tier2 = godData.actions.filter(a => a.tier === 2);
  const tier3 = godData.actions.filter(a => a.tier === 3);

  const tierGroups = [
    { tier: 1, actions: tier1, label: 'I' },
    { tier: 2, actions: tier2, label: 'II' },
    { tier: 3, actions: tier3, label: 'III' },
  ];

  function getActionState(action) {
    const isLocked = action.tier > currentRound;
    const isOccupied = occupiedSpaces[action.id] != null;
    const occupiedBy = isOccupied ? occupiedSpaces[action.id] : null;
    const isNullified = !!nullifiedSpaces[action.id];
    const isAvailable =
      !isLocked &&
      !isOccupied &&
      !isNullified &&
      availableActions.includes(action.id);

    return { isAvailable, isOccupied, occupiedBy, isNullified, isLocked };
  }

  function handlePlace(actionId) {
    actions.placeWorker(actionId);
  }

  function handleShop(shopType) {
    const shopId = `${godColor}_${shopType}`;
    actions.useShop(shopId);
  }

  // Card market logic
  const market = (game.powerCardMarkets || {})[godColor] || [];
  const slots = [];
  for (let i = 0; i < CARDS_DEALT_PER_GOD; i++) {
    slots.push(market[i] || null);
  }

  function canBuyCard(cardId) {
    if (!currentPlayer || !cardId) return false;
    const godAccess = game.godsAccessedThisTurn || [];
    if (!godAccess.includes(godColor)) return false;
    const playerId = currentPlayer.id;
    const champion = game.champions?.[playerId];
    if (!champion) return false;
    const currentCards = champion.powerCards || [];
    if (currentCards.length >= champion.powerCardSlots) return false;
    const card = powerCards[cardId];
    if (!card) return false;
    const playerResources = currentPlayer.resources || {};
    let totalHave = Object.values(playerResources).reduce((s, v) => s + v, 0);
    let totalNeeded = 0;
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

  // ========== COLLAPSED RENDER ==========
  // Narrow vertical strip: god header → actions → shops → cards stacked top to bottom
  if (!isFocused) {

    return (
      <>
      <div
        className="relative rounded-xl flex flex-col overflow-hidden"
        style={{
          border: `1px solid ${colors.border}`,
          background: base.board,
          minHeight: 0,
          height: '100%',
          cursor: 'pointer',
        }}
        onClick={onFocus}
      >
        {/* God aura */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{ background: colors.gradient, opacity: 0.4 }}
        />

        <div
          className="relative z-10 flex flex-col h-full overflow-y-auto scrollbar-hide"
          style={{ padding: '6px 5px', gap: '4px' }}
        >
          {/* God identity — centered header */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pb-1">
            <div
              className="flex items-center justify-center rounded-md"
              style={{
                width: '28px', height: '28px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 0 8px ${colors.glow}`,
              }}
            >
              <GodIcon god={godColor} size={18} />
            </div>
            <div style={{
              fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.06em', lineHeight: 1,
              color: colors.text, textAlign: 'center',
            }}>
              {meta.name}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: colors.border, opacity: 0.4, flexShrink: 0 }} />

          {/* Actions — compact vertical list (stone/utilitarian feel) */}
          <div className="flex flex-col gap-0.5 min-h-0 overflow-y-auto scrollbar-hide">
            {godData.actions.map(action => {
              const state = getActionState(action);
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-1 rounded px-1.5"
                  style={{
                    height: '20px', flexShrink: 0,
                    border: `1px solid ${state.isLocked ? 'rgba(255, 255, 255, 0.02)' : state.isAvailable ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)'}`,
                    background: state.isAvailable ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    opacity: state.isLocked ? 0.3 : state.isOccupied ? 0.5 : state.isNullified ? 0.35 : 1,
                  }}
                  onMouseEnter={(e) => { e.stopPropagation(); showTooltip('action', action, e); }}
                  onMouseLeave={hideTooltip}
                >
                  <span style={{
                    fontSize: '7px', fontWeight: 700,
                    color: state.isLocked ? base.textMuted : (tierStyles[action.tier]?.color || base.textMuted),
                    minWidth: '10px',
                  }}>
                    {state.isLocked ? `R${action.tier}` : ['', 'I', 'II', 'III'][action.tier]}
                  </span>
                  <span style={{
                    fontSize: '8px', fontWeight: 600, lineHeight: 1,
                    color: state.isLocked ? base.textMuted : base.textPrimary,
                    flex: 1, minWidth: 0,
                    textDecoration: state.isNullified ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {action.name}
                  </span>
                  {state.isOccupied && state.occupiedBy != null && (
                    <WorkerToken playerId={state.occupiedBy} size={12} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Shops — warm parchment feel, distinct from actions */}
          <div style={{ height: '1px', background: 'rgba(250, 245, 239, 0.12)', flexShrink: 0 }} />
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            {godData.shops.map(shop => {
              const style = shopStyles[shop.type];
              const isShopLocked = shop.type === 'strong' && currentRound < 2;
              return (
                <button
                  key={shop.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isShopLocked) handleShop(shop.type);
                  }}
                  onMouseEnter={(e) => showTooltip('shop', shop, e)}
                  onMouseLeave={hideTooltip}
                  disabled={isShopLocked}
                  className="w-full text-left"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    padding: '2px 4px', borderRadius: '4px',
                    background: 'rgba(250, 245, 239, 0.05)',
                    border: `1px solid rgba(250, 245, 239, 0.08)`,
                    borderLeft: `2px solid ${style.color}`,
                    opacity: isShopLocked ? 0.3 : 0.85,
                    cursor: isShopLocked ? 'default' : 'pointer',
                    outline: 'none', flexShrink: 0,
                  }}
                >
                  <span style={{
                    fontSize: '7px', fontWeight: 700,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: style.color,
                  }}>
                    {style.label}
                  </span>
                  <div className="flex items-center gap-0.5 ml-auto">
                    {parseCost(shop.cost).map(({ color, amount }) => (
                      <div key={color} className="flex items-center" style={{ gap: '1px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: base.textMuted }}>{amount}</span>
                        {color === 'any' ? (
                          <span style={{ fontSize: '7px', color: base.textMuted }}>*</span>
                        ) : (
                          <ResourceIcon type={color} size={8} />
                        )}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Cards — god-colored glow, premium feel */}
          <div style={{ height: '1px', background: colors.border, opacity: 0.3, flexShrink: 0 }} />
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            {slots.map((cardId, i) => {
              if (!cardId) return null;
              const card = powerCards[cardId];
              if (!card) return null;
              const buyable = canBuyCard(cardId);
              return (
                <button
                  key={cardId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (buyable) actions.buyCard(cardId);
                  }}
                  onMouseEnter={(e) => showTooltip('card', cardId, e)}
                  onMouseLeave={hideTooltip}
                  className="w-full text-left"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    padding: '2px 4px', borderRadius: '4px',
                    background: buyable
                      ? `radial-gradient(ellipse at 30% 40%, ${colors.surface} 0%, rgba(28, 25, 23, 0.9) 80%)`
                      : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${buyable ? colors.primary : colors.border}`,
                    borderLeft: `3px solid ${colors.primary}`,
                    boxShadow: buyable ? `0 0 6px ${colors.glow}` : 'none',
                    opacity: buyable ? 1 : 0.5,
                    cursor: buyable ? 'pointer' : 'default',
                    outline: 'none', flexShrink: 0,
                  }}
                >
                  <CardPixelIcon cardId={cardId} size={12} color={buyable ? colors.light : base.textMuted} />
                  <span style={{
                    fontSize: '8px', fontWeight: 600, color: buyable ? colors.text : base.textMuted,
                    flex: 1, minWidth: 0,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {card.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {tooltip && createPortal(<FloatingTooltip tooltip={tooltip} godColor={godColor} />, document.body)}
      </>
    );
  }

  // ========== FOCUSED RENDER (full detail) ==========
  return (
    <>
    <div
      className="relative rounded-xl flex flex-col"
      style={{
        border: `1px solid ${colors.border}`,
        background: base.board,
        minHeight: 0,
        boxShadow: `0 0 12px ${colors.glow}, inset 0 0 20px ${colors.surface}`,
      }}
    >
      {/* God aura background gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{ background: colors.gradient }}
        {...godAreaGlow}
      />

      {/* Surface noise */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-conic-gradient(rgba(255,255,255,0.08) 0% 25%, transparent 0% 50%)',
          backgroundSize: '4px 4px',
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full"
        style={{ padding: '8px 10px', gap: '6px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2" style={{ height: '32px' }}>
          <div
            className="flex items-center justify-center rounded-md"
            style={{
              width: '28px',
              height: '28px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              boxShadow: `0 0 8px ${colors.glow}`,
              flexShrink: 0,
            }}
          >
            <GodIcon god={godColor} size={18} />
          </div>
          <div className="min-w-0">
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                lineHeight: 1.1,
                color: colors.text,
              }}
            >
              {meta.name}
            </div>
            <div
              style={{
                fontSize: '10px',
                lineHeight: 1.1,
                color: colors.primary,
                opacity: 0.7,
              }}
            >
              {meta.title}
            </div>
          </div>
        </div>

        {/* ── ACTIONS SECTION ── stone/utilitarian feel */}
        <div
          className="rounded-lg min-h-0 overflow-y-auto overflow-x-visible"
          style={{
            background: 'rgba(255, 255, 255, 0.015)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            padding: '4px',
          }}
        >
          {/* Section label */}
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
            <span style={{
              fontSize: '7px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(168, 162, 158, 0.5)',
            }}>
              Actions
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
          </div>

          {tierGroups.map((group, gi) => {
            if (group.actions.length === 0) return null;
            const isGroupLocked = group.tier > currentRound;

            return (
              <div key={group.tier}>
                {gi > 0 && (
                  <div className="flex items-center gap-1.5" style={{ padding: '3px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: isGroupLocked ? base.divider : tierStyles[group.tier].border }} />
                    <span style={{
                      fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: isGroupLocked ? base.textMuted : tierStyles[group.tier].color,
                      opacity: isGroupLocked ? 0.5 : 0.8,
                    }}>
                      Tier {group.label}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: isGroupLocked ? base.divider : tierStyles[group.tier].border }} />
                  </div>
                )}

                <div
                  className="grid"
                  style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}
                >
                  {group.actions.map(action => {
                    const state = getActionState(action);
                    return (
                      <ActionSpace
                        key={action.id}
                        action={action}
                        godColor={godColor}
                        isAvailable={state.isAvailable}
                        isOccupied={state.isOccupied}
                        occupiedBy={state.occupiedBy}
                        isNullified={state.isNullified}
                        isLocked={state.isLocked}
                        onPlace={handlePlace}
                        onHover={(e) => showTooltip('action', action, e)}
                        onLeave={hideTooltip}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MARKET SECTION ── warm parchment/trade feel */}
        <div
          className="rounded-lg flex-shrink-0"
          style={{
            background: 'rgba(250, 245, 239, 0.035)',
            border: '1px solid rgba(250, 245, 239, 0.08)',
            padding: '4px',
          }}
        >
          {/* Section label */}
          <div className="flex items-center gap-1.5 mb-1">
            <div style={{ flex: 1, height: '1px', background: 'rgba(250, 245, 239, 0.1)' }} />
            <span style={{
              fontSize: '7px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(250, 245, 239, 0.4)',
            }}>
              Market
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(250, 245, 239, 0.1)' }} />
          </div>

          <motion.div
            className="flex"
            style={{ gap: '4px' }}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {godData.shops.map(shop => {
              const style = shopStyles[shop.type];
              const costEntries = parseCost(shop.cost);
              const isShopLocked = shop.type === 'strong' && currentRound < 2;

              return (
                <motion.button
                  key={shop.type}
                  variants={staggerItem}
                  onClick={isShopLocked ? undefined : () => handleShop(shop.type)}
                  onMouseEnter={(e) => showTooltip('shop', shop, e)}
                  onMouseLeave={hideTooltip}
                  disabled={isShopLocked}
                  className="flex-1 text-left transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: 'rgba(250, 245, 239, 0.04)',
                    border: `1px solid rgba(250, 245, 239, 0.06)`,
                    borderTop: `2px solid ${style.color}`,
                    borderRadius: '5px',
                    padding: '5px 6px',
                    opacity: isShopLocked ? 0.35 : 1,
                    cursor: isShopLocked ? 'default' : 'pointer',
                  }}
                >
                  <div className="flex items-center gap-1" style={{ marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: style.color,
                    }}>
                      {style.label}
                    </span>
                    {isShopLocked && (
                      <span style={{ fontSize: '7px', color: base.textMuted }}>(R2)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5" style={{ marginBottom: '1px' }}>
                    {costEntries.map(({ color, amount }) => (
                      <div key={color} className="flex items-center gap-0.5">
                        <span style={{ fontSize: '10px', fontWeight: 700, color: base.textSecondary }}>
                          {amount}
                        </span>
                        {color === 'any' ? (
                          <span style={{ fontSize: '9px', color: base.textMuted }}>*</span>
                        ) : (
                          <ResourceIcon type={color} size={14} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', lineHeight: 1.2, color: base.textSecondary }}>
                    {shop.effect}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* ── POWER CARDS SECTION ── divine/premium feel with god-colored glow */}
        <div
          className="rounded-lg flex-shrink-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${colors.surface} 0%, rgba(28, 25, 23, 0.4) 80%)`,
            border: `1px solid ${colors.border}`,
            boxShadow: `inset 0 1px 8px ${colors.glow}`,
            padding: '4px',
          }}
        >
          <CardMarketInline
            slots={slots}
            godColor={godColor}
            colors={colors}
            canBuyCard={canBuyCard}
            onBuy={(cardId) => actions.buyCard(cardId)}
            onCardHover={(cardId, e) => showTooltip('card', cardId, e)}
            onCardLeave={hideTooltip}
          />
        </div>
      </div>
    </div>
    {/* Floating tooltip — portaled to body to escape grid stacking context */}
    {tooltip && createPortal(<FloatingTooltip tooltip={tooltip} godColor={godColor} />, document.body)}
    </>
  );
}

// ============================================================================
// Collapsed Action Row — tier + name + occupation indicator
// ============================================================================

function CollapsedActionRow({ action, godColor, state, onHover, onLeave }) {
  const colors = godColors[godColor];
  const tier = tierStyles[action.tier];

  const borderColor = state.isNullified
    ? 'rgba(225, 29, 72, 0.4)'
    : state.isLocked
      ? 'rgba(255, 255, 255, 0.04)'
      : state.isAvailable
        ? colors.border
        : 'rgba(255, 255, 255, 0.04)';

  const bgColor = state.isAvailable
    ? `${colors.surface}`
    : 'transparent';

  return (
    <div
      className="relative flex items-center gap-1.5 rounded px-2"
      style={{
        height: '24px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        opacity: state.isLocked ? 0.3 : state.isNullified ? 0.45 : state.isOccupied ? 0.65 : 1,
        cursor: 'pointer',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Available glow */}
      {state.isAvailable && !state.isOccupied && (
        <div
          className="absolute inset-0 rounded pointer-events-none"
          style={{ boxShadow: `inset 0 0 6px ${colors.glow}` }}
        />
      )}

      {/* Tier badge */}
      <span style={{
        fontSize: '8px', fontWeight: 700, color: state.isLocked ? base.textMuted : tier.color,
        minWidth: '14px', textAlign: 'center',
      }}>
        {state.isLocked ? `R${action.tier}` : ['', 'I', 'II', 'III'][action.tier]}
      </span>

      {/* Action name */}
      <span style={{
        flex: 1, fontSize: '10px', fontWeight: 600, lineHeight: 1,
        color: state.isLocked ? base.textMuted : base.textPrimary,
        textDecoration: state.isNullified ? 'line-through' : 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {action.name}
      </span>

      {/* Occupation indicator */}
      {state.isOccupied && state.occupiedBy != null && (
        <WorkerToken playerId={state.occupiedBy} size={14} />
      )}

      {/* Nullified X */}
      {state.isNullified && (
        <span style={{ fontSize: '9px', color: base.negative, fontWeight: 700, lineHeight: 1 }}>
          ✕
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Card Market (focused mode — full detail)
// ============================================================================

function CardMarketInline({ slots, godColor, colors, canBuyCard, onBuy, onCardHover, onCardLeave }) {
  return (
    <div>
      {/* POWER CARDS section label */}
      <div className="flex items-center gap-1.5" style={{ marginBottom: '6px' }}>
        <div style={{ flex: 1, height: '1px', background: colors.border, opacity: 0.4 }} />
        <span style={{
          fontSize: '7px', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: colors.primary, opacity: 0.7,
        }}>
          Power Cards
        </span>
        <span style={{ fontSize: '8px', color: base.textMuted }}>
          ({slots.filter(Boolean).length})
        </span>
        <div style={{ flex: 1, height: '1px', background: colors.border, opacity: 0.4 }} />
      </div>

      <motion.div
        className="flex"
        style={{ gap: '6px' }}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {slots.map((cardId, i) => {
          if (cardId) {
            return (
              <MarketCard
                key={cardId}
                cardId={cardId}
                godColor={godColor}
                colors={colors}
                canBuy={canBuyCard(cardId)}
                onBuy={onBuy}
                onHover={onCardHover}
                onLeave={onCardLeave}
              />
            );
          }

          return (
            <div
              key={`empty-${i}`}
              style={{
                flex: 1, minHeight: '80px', borderRadius: '8px',
                border: `1px dashed ${colors.border}`,
                background: 'rgba(255, 255, 255, 0.01)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '4px',
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                border: `1px dashed ${colors.border}`,
                opacity: 0.3,
              }} />
              <span style={{ fontSize: '8px', fontWeight: 600, color: base.textMuted, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Sold
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

// MarketCard — a proper mini-card for the market, not a flat pill
function MarketCard({ cardId, godColor, colors, canBuy, onBuy, onHover, onLeave }) {
  const card = powerCards[cardId];
  if (!card) return null;

  const costEntries = Object.entries(card.cost || {});

  return (
    <motion.button
      variants={staggerItem}
      onClick={canBuy ? () => onBuy(cardId) : undefined}
      disabled={!canBuy}
      onMouseEnter={(e) => onHover?.(cardId, e)}
      onMouseLeave={onLeave}
      className="text-left transition-all"
      style={{
        position: 'relative', flex: 1, minWidth: 0,
        borderRadius: '8px',
        overflow: 'hidden',
        outline: 'none',
        cursor: canBuy ? 'pointer' : 'default',
        opacity: canBuy ? 1 : 0.5,
      }}
    >
      {/* Card frame — layered for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: canBuy
            ? `linear-gradient(160deg, ${colors.primary}30 0%, ${colors.primary}10 30%, rgba(12,10,9,0.95) 100%)`
            : 'rgba(28, 25, 23, 0.9)',
          border: `1.5px solid ${canBuy ? colors.primary + '55' : colors.border}`,
          borderRadius: '8px',
          boxShadow: canBuy
            ? `0 4px 16px rgba(0,0,0,0.5), 0 0 12px ${colors.glow}, inset 0 0 0 1px rgba(255,255,255,0.03)`
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />

      {/* Inner frame line */}
      {canBuy && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '3px', left: '3px', right: '3px', bottom: '3px',
            border: `1px solid ${colors.primary}18`,
            borderRadius: '6px',
          }}
        />
      )}

      {/* God glow */}
      {canBuy && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 15%, ${colors.glow} 0%, transparent 50%)`,
            opacity: 0.4,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col" style={{ padding: '8px 8px 6px' }}>
        {/* Icon + name row */}
        <div className="flex items-center" style={{ gap: '6px', marginBottom: '4px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: canBuy
              ? `radial-gradient(circle, ${colors.surface} 30%, rgba(0,0,0,0.4) 100%)`
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${canBuy ? colors.primary + '44' : colors.border}`,
            boxShadow: canBuy ? `0 0 8px ${colors.glow}` : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CardPixelIcon
              cardId={cardId}
              size={18}
              color={canBuy ? colors.light : base.textMuted}
              glowColor={canBuy ? colors.primary : undefined}
            />
          </div>
          <span style={{
            fontSize: '10px', fontWeight: 700, lineHeight: 1.1,
            color: canBuy ? colors.text : base.textMuted,
            flex: 1, minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {card.name}
          </span>
        </div>

        {/* Description */}
        <div style={{
          fontSize: '9px', lineHeight: 1.35,
          color: canBuy ? base.textSecondary : 'rgba(168, 162, 158, 0.5)',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: '5px',
        }}>
          {card.description}
        </div>

        {/* Cost row + buy indicator */}
        <div className="flex items-center" style={{ gap: '4px' }}>
          <div className="flex items-center" style={{ gap: '3px', flex: 1 }}>
            {costEntries.map(([resource, amount]) => (
              <div key={resource} className="flex items-center" style={{ gap: '2px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  color: canBuy ? (resourceStyles[resource]?.highlight || base.textSecondary) : base.textMuted,
                }}>
                  {amount}
                </span>
                {resource === 'any' ? (
                  <span style={{ fontSize: '8px', color: base.textMuted }}>*</span>
                ) : (
                  <ResourceIcon type={resource} size={11} />
                )}
              </div>
            ))}
          </div>
          {canBuy && (
            <span style={{
              fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#0a0908',
              background: colors.primary,
              padding: '1px 6px', borderRadius: '3px',
            }}>
              Buy
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
