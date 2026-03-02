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
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import ActionSpace from './ActionSpace';
import GodIcon from '../icons/GodIcon';
import ResourceIcon, { WildcardIcon } from '../icons/ResourceIcon';
import CardPixelIcon from '../icons/CardPixelIcon';
import WorkerToken from './WorkerToken';
import { useGame } from '../../hooks/useGame';
import { godColors, godMeta, base, tierStyles, shopStyles, resourceStyles, favorConditionStyle } from '../../styles/theme';
import { godAreaGlow, staggerContainer, staggerItem, tooltip as tooltipVariants } from '../../styles/animations';
import gods from '../../../engine/v3/data/gods.js';
import { powerCards } from '../../../engine/v3/data/powerCards';
import { CARDS_DEALT_PER_GOD } from '../../../engine/v3/data/constants';
import { getShopCost } from '../../../engine/v3/rules';

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
                    <WildcardIcon size={11} />
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

  if (type === 'vpCondition') {
    return (
      <motion.div
        style={{ ...tooltipStyle, border: `2px solid ${favorConditionStyle.border}` }}
        variants={tooltipVariants} initial="initial" animate="animate" exit="exit"
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: favorConditionStyle.text, marginBottom: '6px' }}>
          Favor Condition
        </div>
        <div style={{ fontSize: '12px', lineHeight: 1.5, color: base.textSecondary, marginBottom: '6px' }}>
          {data.description}
        </div>
        <div style={{ fontSize: '11px', lineHeight: 1.5, color: base.textMuted }}>
          Each god rewards Favor for a different style of play. Earn Favor by meeting this condition during the game. Favor counts as victory points at end of game.
        </div>
      </motion.div>
    );
  }

  return null;
}

// ============================================================================
// Section Label — header with info tooltip for Actions / Shops / Powers
// ============================================================================

// Small section label with ? tooltip (portaled to body)
function SectionHint({ label, hint, color }) {
  const [hintRect, setHintRect] = useState(null);
  const iconRef = useRef(null);

  return (
    <div className="flex items-center justify-center gap-1" style={{ padding: '1px 0', marginBottom: '1px' }}>
      <span style={{
        fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color, opacity: 0.5,
      }}>
        {label}
      </span>
      {hint && (
        <>
          <span
            ref={iconRef}
            onMouseEnter={() => {
              if (iconRef.current) setHintRect(iconRef.current.getBoundingClientRect());
            }}
            onMouseLeave={() => setHintRect(null)}
            style={{
              fontSize: '7px', fontWeight: 700, color,
              opacity: 0.3, cursor: 'help',
              width: '12px', height: '12px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              border: `1px solid ${color}30`,
            }}
          >
            ?
          </span>
          {hintRect && createPortal(
            <div style={{
              position: 'fixed',
              top: `${hintRect.bottom + 6}px`,
              left: `${hintRect.left + hintRect.width / 2}px`,
              transform: 'translateX(-50%)',
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#000000',
              border: `1px solid ${color}40`,
              fontSize: '11px',
              lineHeight: 1.5,
              color: 'rgba(214, 211, 209, 0.9)',
              width: '220px',
              textAlign: 'center',
              zIndex: 99999,
              boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
            }}>
              {hint}
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main GodArea Component
// ============================================================================

export default function GodArea({ godColor, isFocused = true, onFocus }) {
  const { game, availableActions, actions, currentPlayer, pendingDecision } = useGame();
  const colors = godColors[godColor];
  const meta = godMeta[godColor];
  const godData = gods[godColor];

  // Single tooltip state for the whole god area
  const [tooltip, setTooltip] = useState(null);

  // Clear tooltip when a decision modal opens
  useEffect(() => {
    if (pendingDecision) setTooltip(null);
  }, [pendingDecision]);

  const showTooltip = useCallback((type, data, e) => {
    // Suppress tooltips when a modal/decision is active to prevent z-index conflicts
    if (pendingDecision) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ type, data, rect });
  }, [pendingDecision]);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!godData || !game) return null;

  const currentRound = game.round;
  const occupiedSpaces = game.occupiedSpaces || {};
  const nullifiedSpaces = game.nullifiedSpaces || {};

  // Determine last-placed worker for glow effect
  const roundActions = game.roundActions || [];
  const lastPlacedActionId = roundActions.length > 0
    ? roundActions[roundActions.length - 1].actionId
    : null;

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
    // availableActions already accounts for hourglass (ignore_occupied) modifier,
    // so trust the engine rather than filtering occupied out here.
    const isAvailable =
      !isLocked &&
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

  // Check if the current player can afford a shop's cost (respects shopCostModifier)
  function canAffordShop(shop) {
    if (!currentPlayer || !game) return false;
    // Must have placed a patron at this god's temple this turn
    const godAccess = game.godsAccessedThisTurn || [];
    if (!godAccess.includes(godColor)) return false;
    // One purchase per turn (shop or power card)
    if (game.purchaseMadeThisTurn) return false;
    const playerResources = currentPlayer.resources || {};
    const shopId = `${godColor}_${shop.type}`;
    const cost = getShopCost(game, currentPlayer.id, shopId) || shop.cost || {};
    let totalHave = Object.values(playerResources).reduce((s, v) => s + v, 0);
    let anyNeeded = 0;
    for (const [resource, amount] of Object.entries(cost)) {
      if (resource === 'any') {
        anyNeeded += amount;
      } else {
        if ((playerResources[resource] || 0) < amount) return false;
      }
    }
    // Check 'any' cost against remaining total resources
    const specificCost = Object.entries(cost)
      .filter(([r]) => r !== 'any')
      .reduce((s, [, v]) => s + v, 0);
    return (totalHave - specificCost) >= anyNeeded;
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
    // One purchase per turn (shop or power card)
    if (game.purchaseMadeThisTurn) return false;
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

  // Dynamic effect text for copy/echo actions — shows what will actually happen
  function getDynamicEffect(action) {
    if (action.copySource === 'lastActionAnyPlayer') {
      const roundActions = game.roundActions || [];
      let lastAction = null;
      for (let i = roundActions.length - 1; i >= 0; i--) {
        if (roundActions[i].actionId !== action.id) {
          lastAction = roundActions[i];
          break;
        }
      }
      if (lastAction) {
        const allGods = Object.values(gods);
        let actionName = lastAction.actionId;
        for (const g of allGods) {
          const found = g.actions.find(a => a.id === lastAction.actionId);
          if (found) { actionName = found.name; break; }
        }
        const p = game.players.find(pp => pp.id === lastAction.playerId);
        const playerName = p?.name || `Player ${lastAction.playerId}`;
        // Include resource prefix if action has it
        const prefix = action.resources ? Object.entries(action.resources).map(([c, n]) => `+${n} ${c}`).join(', ') + ', ' : '';
        return `${prefix}copy ${actionName} (${playerName}'s last)`;
      }
      const prefix = action.resources ? Object.entries(action.resources).map(([c, n]) => `+${n} ${c}`).join(', ') + ', ' : '';
      return `${prefix}no action to copy yet`;
    }
    if (action.copySource === 'lastGainPreviousPlayer') {
      // Show what the previous player last gained
      const roundActions = game.roundActions || [];
      const turnOrder = game.turnOrder || game.players?.map(p => p.id) || [];
      const currentIdx = turnOrder.indexOf(game.currentPlayer);
      const prevIdx = currentIdx > 0 ? currentIdx - 1 : turnOrder.length - 1;
      const prevPlayerId = turnOrder[prevIdx];
      const prevPlayer = game.players?.find(p => p.id === prevPlayerId);
      const prevName = prevPlayer?.name || `Player ${prevPlayerId}`;
      const lastGain = prevPlayer?.lastGain;
      if (lastGain && Object.keys(lastGain).length > 0) {
        const gainStr = Object.entries(lastGain).map(([c, n]) => `${n} ${c}`).join(', ');
        return `+2 yellow, copy ${prevName}'s gain (${gainStr})`;
      }
      return `+2 yellow, copy ${prevName}'s gain (none yet)`;
    }
    return action.effect;
  }

  // Determine what sections to highlight for turn guidance
  const isActionPhase = game.phase === 'action_phase';
  const shouldHighlightMarket = isActionPhase && game.workerPlacedThisTurn
    && (game.godsAccessedThisTurn || []).includes(godColor) && !pendingDecision;

  // ========== COLLAPSED RENDER ==========
  // Narrow vertical strip: god header → actions → shops → cards stacked top to bottom
  if (!isFocused) {

    return (
      <>
      <div
        className="relative rounded-xl flex flex-col overflow-hidden transition-all duration-200"
        style={{
          border: `1px solid ${colors.border}`,
          background: base.board,
          minHeight: 0,
          height: '100%',
          cursor: 'pointer',
        }}
        onClick={onFocus}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          e.currentTarget.style.boxShadow = `0 0 12px ${colors.glow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.boxShadow = 'none';
        }}
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
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.06em', lineHeight: 1,
              color: colors.text, textAlign: 'center',
            }}>
              {meta.name}
            </div>
            <div style={{
              fontSize: '8px', fontWeight: 500,
              lineHeight: 1, textAlign: 'center',
              color: colors.primary, opacity: 0.7,
            }}>
              {meta.title}
            </div>
            {godData.gloryCondition && (
              <div
                onMouseEnter={(e) => showTooltip('vpCondition', godData.gloryCondition, e)}
                onMouseLeave={hideTooltip}
                style={{
                  fontSize: '8px', lineHeight: 1.3, textAlign: 'center',
                  fontWeight: 700,
                  color: favorConditionStyle.text,
                  textShadow: favorConditionStyle.textShadow,
                  padding: '3px 6px',
                  marginTop: '2px',
                  borderRadius: '4px',
                  background: favorConditionStyle.background,
                  border: `1px solid ${favorConditionStyle.border}`,
                  boxShadow: `0 0 8px rgba(220, 220, 240, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06)`,
                  cursor: 'help',
                }}
              >
                {godData.gloryCondition.description}
              </div>
            )}
          </div>

          {/* Actions label */}
          <div className="flex items-center gap-1 flex-shrink-0" style={{ padding: '0 2px' }}>
            <div style={{ flex: 1, height: '1px', background: colors.border, opacity: 0.3 }} />
            <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(180, 195, 210, 0.4)' }}>
              Actions
            </span>
            <div style={{ flex: 1, height: '1px', background: colors.border, opacity: 0.3 }} />
          </div>

          {/* Actions — compact vertical list (stone/utilitarian feel) */}
          <div className="flex flex-col gap-0.5 min-h-0 overflow-y-auto scrollbar-hide" style={{ flex: 1 }}>
            {godData.actions.map(action => {
              const state = getActionState(action);
              const dynamicAction = { ...action, effect: getDynamicEffect(action) };
              return (
                <CollapsedActionRow
                  key={action.id}
                  action={dynamicAction}
                  godColor={godColor}
                  state={state}
                  onHover={(e) => { e.stopPropagation(); showTooltip('action', dynamicAction, e); }}
                  onLeave={hideTooltip}
                />
              );
            })}
          </div>

          {/* Shops label */}
          <div className="flex items-center gap-1 flex-shrink-0" style={{ padding: '0 2px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(250, 235, 215, 0.15)' }} />
            <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250, 235, 215, 0.4)' }}>
              Shops
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(250, 235, 215, 0.15)' }} />
          </div>
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            {godData.shops.map(shop => {
              const style = shopStyles[shop.type];
              const isShopLocked = shop.type === 'strong' && currentRound < 2;
              const affordable = !isShopLocked && canAffordShop(shop);
              return (
                <button
                  key={shop.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isShopLocked) handleShop(shop.type);
                  }}
                  onMouseEnter={(e) => showTooltip('shop', shop, e)}
                  onMouseLeave={hideTooltip}
                  disabled={false}
                  className="w-full"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    padding: '3px 5px', borderRadius: '4px',
                    background: affordable ? 'rgba(250, 235, 215, 0.09)' : 'rgba(250, 235, 215, 0.06)',
                    border: `1px solid rgba(250, 235, 215, 0.1)`,
                    borderLeft: `${style.borderWidth || '2px'} solid ${style.color}`,
                    opacity: isShopLocked ? 0.3 : 0.85,
                    cursor: isShopLocked ? 'default' : 'pointer',
                    outline: 'none', flexShrink: 0,
                  }}
                >
                  <span style={{
                    fontSize: style.fontSize || '9px', fontWeight: 700,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: style.color,
                  }}>
                    {style.label}
                  </span>
                  <div className="flex items-center gap-0.5 ml-auto">
                    {parseCost(shop.cost).map(({ color, amount }) => (
                      <div key={color} className="flex items-center" style={{ gap: '1px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: base.textMuted }}>{amount}</span>
                        {color === 'any' ? (
                          <WildcardIcon size={9} />
                        ) : (
                          <ResourceIcon type={color} size={9} />
                        )}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Artifacts label */}
          <div className="flex items-center gap-1 flex-shrink-0" style={{ padding: '0 2px' }}>
            <div style={{ flex: 1, height: '1px', background: colors.border, opacity: 0.3 }} />
            <span style={{ fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.text, opacity: 0.35 }}>
              Artifacts
            </span>
            <div style={{ flex: 1, height: '1px', background: colors.border, opacity: 0.3 }} />
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
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
                  className="w-full"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '4px 6px', borderRadius: '6px',
                    background: buyable
                      ? `radial-gradient(ellipse at 20% 30%, ${colors.surface} 0%, rgba(28, 25, 23, 0.85) 80%)`
                      : `radial-gradient(ellipse at 20% 30%, ${colors.surface}40 0%, rgba(28, 25, 23, 0.6) 80%)`,
                    border: `1.5px solid ${buyable ? colors.primary + '66' : colors.border}`,
                    boxShadow: buyable ? `0 0 8px ${colors.glow}, inset 0 0 6px ${colors.glow}` : `inset 0 0 4px ${colors.glow}`,
                    opacity: buyable ? 1 : 0.5,
                    cursor: buyable ? 'pointer' : 'default',
                    outline: 'none', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: buyable ? colors.surface : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${buyable ? colors.primary + '55' : colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: buyable ? `0 0 4px ${colors.glow}` : 'none',
                  }}>
                    <CardPixelIcon cardId={cardId} size={12} color={buyable ? colors.light : base.textMuted} />
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 600, color: buyable ? colors.text : base.textMuted,
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
        style={{ padding: '8px 12px', gap: '5px' }}
      >
        {/* Header — god identity + favor condition */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ minHeight: '32px' }}>
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
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span style={{
                fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em',
                lineHeight: 1.1, color: colors.text,
              }}>
                {meta.name}
              </span>
              <span style={{
                fontSize: '9px', lineHeight: 1.1,
                color: colors.primary, opacity: 0.6,
              }}>
                {meta.title}
              </span>
            </div>
            {godData.gloryCondition && (
              <div
                className="flex items-center"
                onMouseEnter={(e) => showTooltip('vpCondition', godData.gloryCondition, e)}
                onMouseLeave={hideTooltip}
                style={{
                  marginTop: '4px',
                  padding: '4px 10px',
                  borderRadius: '5px',
                  background: favorConditionStyle.background,
                  border: `1px solid ${favorConditionStyle.border}`,
                  boxShadow: `0 0 12px rgba(220, 220, 240, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)`,
                  cursor: 'help',
                }}
              >
                <span style={{
                  fontSize: '11px', lineHeight: 1.3, fontWeight: 700,
                  color: favorConditionStyle.text,
                  textShadow: favorConditionStyle.textShadow,
                }}>
                  {godData.gloryCondition.description}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── ACTIONS SECTION ── cold stone/utilitarian feel */}
        <div
          className="rounded-lg min-h-0 overflow-y-auto overflow-x-visible"
          style={{
            flex: 1,
            background: 'rgba(180, 195, 210, 0.03)',
            border: '1px solid rgba(180, 195, 210, 0.06)',
            boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.25), inset 0 0 8px rgba(180, 195, 210, 0.02)',
            padding: '4px',
          }}
        >
          {tierGroups.map((group) => {
            if (group.actions.length === 0) return null;

            return (
              <div
                key={group.tier}
                className="grid"
                style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}
              >
                {group.actions.map(action => {
                  const state = getActionState(action);
                  const dynamicAction = { ...action, effect: getDynamicEffect(action) };
                  return (
                    <ActionSpace
                      key={action.id}
                      action={dynamicAction}
                      godColor={godColor}
                      isAvailable={state.isAvailable}
                      isOccupied={state.isOccupied}
                      occupiedBy={state.occupiedBy}
                      isNullified={state.isNullified}
                      isLocked={state.isLocked}
                      isLastPlaced={action.id === lastPlacedActionId}
                      onPlace={handlePlace}
                      onHover={(e) => showTooltip('action', dynamicAction, e)}
                      onLeave={hideTooltip}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── MARKET SECTION ── warm parchment/trade feel */}
        <motion.div
          className="rounded-lg flex-shrink-0"
          style={{
            background: 'rgba(250, 235, 215, 0.05)',
            border: shouldHighlightMarket ? '1px solid rgba(250, 235, 215, 0.3)' : '1px solid rgba(250, 235, 215, 0.12)',
            borderTop: shouldHighlightMarket ? '2px solid rgba(250, 235, 215, 0.4)' : '2px solid rgba(250, 235, 215, 0.15)',
            padding: '4px',
          }}
          animate={shouldHighlightMarket ? {
            boxShadow: [
              'inset 0 1px 6px rgba(250, 235, 215, 0.04)',
              'inset 0 1px 6px rgba(250, 235, 215, 0.04), 0 0 14px rgba(250, 235, 215, 0.15)',
              'inset 0 1px 6px rgba(250, 235, 215, 0.04)',
            ],
          } : { boxShadow: 'inset 0 1px 6px rgba(250, 235, 215, 0.04)' }}
          transition={shouldHighlightMarket
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }}
        >
          <SectionHint
            label="Shops"
            hint="Spend blessings for powerful effects. Place a patron here first. One purchase per turn (shop or power card)."
            color="rgba(250, 235, 215, 0.45)"
          />
          {/* Shops — compact placards, effect text is the hero */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {godData.shops.map(shop => {
              const style = shopStyles[shop.type];
              const modifiedCost = (currentPlayer && game) ? getShopCost(game, currentPlayer.id, `${godColor}_${shop.type}`) : null;
              const costEntries = parseCost(modifiedCost || shop.cost);
              const isShopLocked = shop.type === 'strong' && currentRound < 2;
              const affordable = !isShopLocked && canAffordShop(shop);

              return (
                <motion.button
                  key={shop.type}
                  onClick={isShopLocked ? undefined : () => handleShop(shop.type)}
                  onMouseEnter={(e) => showTooltip('shop', shop, e)}
                  onMouseLeave={hideTooltip}
                  disabled={false}
                  style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    borderRadius: '6px',
                    background: affordable
                      ? `linear-gradient(180deg, ${style.color}12 0%, rgba(250, 235, 215, 0.04) 100%)`
                      : 'rgba(250, 235, 215, 0.02)',
                    border: `1px solid ${affordable ? `${style.color}30` : 'rgba(250, 235, 215, 0.06)'}`,
                    opacity: isShopLocked ? 0.3 : affordable ? 1 : 0.55,
                    cursor: isShopLocked ? 'default' : 'pointer',
                    outline: 'none',
                    overflow: 'hidden',
                  }}
                  whileHover={!isShopLocked ? { y: -2, boxShadow: `0 4px 12px rgba(0,0,0,0.3)` } : undefined}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {/* Tier banner — colored strip at top */}
                  <div style={{
                    padding: '3px 8px',
                    background: `${style.color}18`,
                    borderBottom: `1px solid ${style.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em',
                      textTransform: 'uppercase', color: style.color,
                    }}>
                      {style.label}
                    </span>
                    {isShopLocked && <span style={{ fontSize: '7px', color: base.textMuted }}>R2</span>}
                    {/* Cost inline in banner */}
                    <div className="flex items-center" style={{ gap: '3px' }}>
                      {costEntries.map(({ color, amount }) => (
                        <div key={color} className="flex items-center" style={{ gap: '1px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: base.textMuted }}>
                            {amount}
                          </span>
                          {color === 'any' ? (
                            <WildcardIcon size={10} />
                          ) : (
                            <ResourceIcon type={color} size={10} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Effect text — the hero content */}
                  <div style={{
                    flex: 1, padding: '6px 8px',
                    fontSize: '11px', lineHeight: 1.35, textAlign: 'center',
                    color: affordable ? base.textPrimary : base.textMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {shop.effect}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── POWER CARDS SECTION ── divine/premium feel with god-colored glow */}
        {slots.some(s => s != null) ? (
          <motion.div
            className="rounded-lg flex-shrink-0"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${colors.surface} 0%, rgba(28, 25, 23, 0.4) 80%)`,
              border: shouldHighlightMarket ? `1px solid ${colors.primary}55` : `1px solid ${colors.border}`,
              padding: '4px',
            }}
            animate={shouldHighlightMarket ? {
              boxShadow: [
                `inset 0 1px 8px ${colors.glow}`,
                `inset 0 1px 8px ${colors.glow}, 0 0 14px ${colors.glow}`,
                `inset 0 1px 8px ${colors.glow}`,
              ],
            } : { boxShadow: `inset 0 1px 8px ${colors.glow}` }}
            transition={shouldHighlightMarket
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }}
          >
            <SectionHint
              label="Artifacts"
              hint="Permanent artifacts with lasting abilities. New artifacts appear each round. Place a patron here first. One purchase per turn (shop or artifact)."
              color={colors.text}
            />
            <motion.div
              className="flex"
              style={{ gap: '6px' }}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {slots.map((cardId, i) => {
                if (!cardId) {
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
                }
                const card = powerCards[cardId];
                if (!card) return null;
                const buyable = canBuyCard(cardId);
                const cardCostEntries = Object.entries(card.cost || {});
                return (
                  <motion.button
                    key={cardId}
                    variants={staggerItem}
                    onClick={buyable ? () => actions.buyCard(cardId) : undefined}
                    disabled={false}
                    onMouseEnter={(e) => showTooltip('card', cardId, e)}
                    onMouseLeave={hideTooltip}
                    className="text-center"
                    style={{
                      position: 'relative', flex: 1, minWidth: 0,
                      borderRadius: '8px',
                      overflow: 'visible',
                      outline: 'none',
                      cursor: buyable ? 'pointer' : 'default',
                      opacity: buyable ? 1 : 0.5,
                    }}
                    whileHover={buyable ? { y: -3 } : undefined}
                    whileTap={buyable ? { scale: 0.97 } : undefined}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    {/* Card frame — gem-like premium surface */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: buyable
                          ? `linear-gradient(170deg, ${colors.light}15 0%, ${colors.primary}12 20%, rgba(12,10,9,0.95) 60%)`
                          : 'rgba(28, 25, 23, 0.9)',
                        border: `1.5px solid ${buyable ? colors.primary + '66' : colors.border}`,
                        borderRadius: '8px',
                        boxShadow: buyable
                          ? `0 3px 12px rgba(0,0,0,0.5), 0 0 14px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`
                          : '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    />
                    {/* Specular highlight — top edge catch */}
                    {buyable && (
                      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
                        height: '40%', borderRadius: '8px 8px 0 0',
                        background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)`,
                      }} />
                    )}
                    {/* Content — icon-dominant layout */}
                    <div className="relative z-10 flex flex-col items-center" style={{ padding: '10px 6px 6px' }}>
                      {/* Large icon — the artifact's visual identity */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: buyable
                          ? `radial-gradient(circle at 38% 32%, ${colors.light}40 0%, ${colors.surface} 45%, rgba(0,0,0,0.6) 100%)`
                          : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${buyable ? colors.primary + '55' : colors.border}`,
                        boxShadow: buyable
                          ? `0 0 16px ${colors.glow}, 0 0 6px ${colors.glowStrong}, inset 0 -2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.15)`
                          : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '6px',
                      }}>
                        <CardPixelIcon
                          cardId={cardId}
                          size={28}
                          color={buyable ? colors.light : base.textMuted}
                          glowColor={buyable ? colors.primary : undefined}
                        />
                      </div>
                      {/* Card name */}
                      <span style={{
                        fontSize: '10px', fontWeight: 700, lineHeight: 1.2,
                        color: buyable ? colors.text : base.textMuted,
                        marginBottom: '3px',
                        maxWidth: '100%',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {card.name}
                      </span>
                      {/* Description */}
                      <div style={{
                        fontSize: '9px', lineHeight: 1.3,
                        color: buyable ? base.textSecondary : 'rgba(168, 162, 158, 0.5)',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        marginBottom: '6px',
                      }}>
                        {card.description}
                      </div>
                      {/* Cost row */}
                      <div className="flex items-center justify-center" style={{ gap: '4px' }}>
                        {cardCostEntries.map(([resource, amount]) => (
                          <div key={resource} className="flex items-center" style={{ gap: '2px' }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 700,
                              color: buyable ? (resourceStyles[resource]?.highlight || base.textSecondary) : base.textMuted,
                            }}>
                              {amount}
                            </span>
                            {resource === 'any' ? (
                              <WildcardIcon size={12} />
                            ) : (
                              <ResourceIcon type={resource} size={12} />
                            )}
                          </div>
                        ))}
                        {buyable && (
                          <span style={{
                            fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: '#0a0908',
                            background: colors.primary,
                            padding: '2px 6px', borderRadius: '3px',
                            marginLeft: '2px',
                          }}>
                            Buy
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        ) : (
          <div
            className="rounded-lg flex-shrink-0 flex items-center justify-center"
            style={{
              background: colors.surface,
              border: `1px dashed ${colors.border}`,
              padding: '6px 8px',
              opacity: 0.5,
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 600, color: base.textMuted, letterSpacing: '0.04em' }}>
              All artifacts claimed
            </span>
          </div>
        )}
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
      {state.isAvailable && (
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
        <WorkerToken playerId={state.occupiedBy} size={18} />
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

