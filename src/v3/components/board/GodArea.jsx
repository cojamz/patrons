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
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ActionSpace from './ActionSpace';
import GodIcon from '../icons/GodIcon';
import ResourceIcon, { WildcardIcon } from '../icons/ResourceIcon';
import CardPixelIcon from '../icons/CardPixelIcon';
import ArtifactImage from '../icons/ArtifactImage';
import WorkerToken from './WorkerToken';
import RichEffect from '../shared/RichEffect';
import { useGameState, useGameActions } from '../../hooks/useGame';
import { useGameEvents, filterByType } from '../../hooks/useGameEvents';
import { godColors, godMeta, base, tierStyles, shopStyles, resourceStyles, favorConditionStyle, playerColors } from '../../styles/theme';
import gods from '../../../engine/v3/data/gods.js';
import { powerCards } from '../../../engine/v3/data/powerCards';
import { CARDS_DEALT_PER_GOD } from '../../../engine/v3/data/constants';
import { getShopCost } from '../../../engine/v3/rules';

// All CSS for god area — hover effects only.
// Removed godAreaGlow and collapsedPulse (were causing 20+ repaints/frame).
// Action section pulse is now handled by .placement-glow in index.css (loud primary signal).
const godAreaStyle = document.createElement('style');
godAreaStyle.textContent = `
.shop-btn { transition: transform 120ms ease, box-shadow 150ms ease, opacity 150ms ease; }
.shop-btn:hover { transform: translateY(-2px); }
.card-btn { transition: transform 120ms ease, opacity 150ms ease; }
.card-btn:hover { transform: translateY(-3px); }
.card-btn:active { transform: scale(0.97); }
.collapsed-shop-btn { transition: filter 120ms ease; }
.collapsed-shop-btn:hover { filter: brightness(1.2); }
`;
if (!document.querySelector('[data-god-area-css]')) {
  godAreaStyle.setAttribute('data-god-area-css', '');
  document.head.appendChild(godAreaStyle);
}

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
    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.8)`,
    pointerEvents: 'none',
  };

  if (type === 'action') {
    const action = data;
    return (
      <div style={tooltipStyle}>
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
            <RichEffect text={action.effect} size={12} />
          </div>
        )}
      </div>
    );
  }

  if (type === 'shop') {
    const shop = data;
    const costEntries = parseCost(shop.cost);
    const style = shopStyles[shop.type];
    return (
      <div style={tooltipStyle}>
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
          <RichEffect text={shop.effect} size={12} />
        </div>
      </div>
    );
  }

  if (type === 'card') {
    const cardId = data;
    const card = powerCards[cardId];
    if (!card) return null;
    const costEntries = Object.entries(card.cost || {});
    return (
      <div style={tooltipStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ArtifactImage cardId={cardId} size={32} color={colors.light} />
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
          <RichEffect text={card.description} size={12} />
        </div>
      </div>
    );
  }

  if (type === 'vpCondition') {
    return (
      <div style={{ ...tooltipStyle, border: `2px solid ${favorConditionStyle.border}` }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: favorConditionStyle.text, marginBottom: '6px' }}>
          Favor Condition
        </div>
        <div style={{ fontSize: '12px', lineHeight: 1.5, color: base.textSecondary, marginBottom: '6px' }}>
          <RichEffect text={data.description} size={12} />
        </div>
        <div style={{ fontSize: '11px', lineHeight: 1.5, color: base.textMuted }}>
          Each patron rewards Favor for a different style of play. Earn Favor by meeting this condition during the game.
        </div>
      </div>
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

export default React.memo(function GodArea({ godColor, isFocused = true, onFocus, isBeingWatched = false, watchingPlayerColor }) {
  const { game, availableActions, currentPlayer, pendingDecision, isMultiplayer, mySlot } = useGameState();
  const actions = useGameActions();
  const colors = godColors[godColor];
  const meta = godMeta[godColor];
  const godData = gods[godColor];

  // Single tooltip state for the whole god area
  const [tooltip, setTooltip] = useState(null);

  // Ref for pendingDecision so callbacks stay stable
  const pendingRef = useRef(pendingDecision);
  pendingRef.current = pendingDecision;

  // Clear tooltip when a decision modal opens
  useEffect(() => {
    if (pendingDecision) setTooltip(null);
  }, [pendingDecision]);

  const showTooltip = useCallback((type, data, e) => {
    // Suppress tooltips when a modal/decision is active to prevent z-index conflicts
    if (pendingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ type, data, rect });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  // In multiplayer, only allow interactions when it's this player's turn
  const isMyTurn = !isMultiplayer || game?.currentPlayer === mySlot;

  if (!godData || !game) return null;

  const currentRound = game.round;
  const occupiedSpaces = game.occupiedSpaces || {};
  const nullifiedSpaces = game.nullifiedSpaces || {};

  // Determine last-placed worker for glow effect
  const roundActions = game.roundActions || [];
  const lastPlacedActionId = roundActions.length > 0
    ? roundActions[roundActions.length - 1].actionId
    : null;

  // --- Action flash + placement toast on worker placement ---
  const events = useGameEvents();
  const [flashingActionId, setFlashingActionId] = useState(null);
  const [borderSurge, setBorderSurge] = useState(false);
  const processedPlacementIds = useRef(new Set());

  // Clear processed IDs on turn change so new turn's events always fire
  useEffect(() => {
    processedPlacementIds.current.clear();
  }, [game?.currentPlayer]);

  // Pre-build this god's action ID set once (stable across renders)
  const godActionIdSet = useMemo(
    () => new Set(godData.actions.map(a => a.id)),
    [godData.actions]
  );

  useEffect(() => {
    // Quick scan — only check workerPlaced events, bail fast if none relevant
    let recent = null;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.type === 'workerPlaced' && godActionIdSet.has(e.actionId)) {
        recent = e;
        break;
      }
    }
    if (!recent || processedPlacementIds.current.has(recent.id)) return;

    processedPlacementIds.current.add(recent.id);
    // Prune to last 20 entries
    if (processedPlacementIds.current.size > 20) {
      const entries = [...processedPlacementIds.current];
      processedPlacementIds.current = new Set(entries.slice(-20));
    }

    setFlashingActionId(recent.actionId);
    setBorderSurge(true);

    const flashTimer = setTimeout(() => {
      setFlashingActionId(null);
      setBorderSurge(false);
    }, 800);

    return () => {
      clearTimeout(flashTimer);
    };
  }, [events, godActionIdSet]);

  // --- Market "sold" flash — track previous card slots to detect purchases ---
  const prevCardsRef = useRef(null);
  const [soldSlotIndex, setSoldSlotIndex] = useState(null);

  const cardMarket = (game.powerCardMarkets || {})[godColor] || [];
  useEffect(() => {
    if (!prevCardsRef.current) {
      prevCardsRef.current = cardMarket.map(c => c?.id || c || null);
      return;
    }
    const prevCards = prevCardsRef.current;
    const newCards = cardMarket.map(c => c?.id || c || null);
    prevCardsRef.current = newCards;

    // Find which slot went from filled → empty/null
    for (let i = 0; i < Math.max(prevCards.length, newCards.length); i++) {
      if (prevCards[i] && !newCards[i]) {
        setSoldSlotIndex(i);
        const timer = setTimeout(() => setSoldSlotIndex(null), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [cardMarket]);

  // Group actions by tier — memoized since godData is static
  const tierGroups = useMemo(() => [
    { tier: 1, actions: godData.actions.filter(a => a.tier === 1), label: 'I' },
    { tier: 2, actions: godData.actions.filter(a => a.tier === 2), label: 'II' },
    { tier: 3, actions: godData.actions.filter(a => a.tier === 3), label: 'III' },
  ], [godData]);

  // Pre-compute action states — memoized to avoid per-render recalc
  const actionStates = useMemo(() => {
    const map = {};
    for (const action of godData.actions) {
      const isLocked = action.tier > currentRound;
      const isOccupied = occupiedSpaces[action.id] != null;
      const occupiedBy = isOccupied ? occupiedSpaces[action.id] : null;
      const isNullified = !!nullifiedSpaces[action.id];
      const isAvailable = isMyTurn && !isLocked && !isNullified && availableActions.includes(action.id);
      map[action.id] = { isAvailable, isOccupied, occupiedBy, isNullified, isLocked };
    }
    return map;
  }, [godData, currentRound, occupiedSpaces, nullifiedSpaces, availableActions]);

  // Whether any action in this god is currently available (for container pulse)
  const hasAnyAvailable = useMemo(() =>
    Object.values(actionStates).some(s => s.isAvailable),
    [actionStates]
  );

  function getActionState(action) {
    return actionStates[action.id];
  }

  const handlePlace = useCallback((actionId) => {
    actions.placeWorker(actionId);
  }, [actions]);

  const handleShop = useCallback((shopType) => {
    const shopId = `${godColor}_${shopType}`;
    actions.useShop(shopId);
  }, [actions, godColor]);

  // Check if the current player can afford a shop's cost (respects shopCostModifier)
  function canAffordShop(shop) {
    if (!currentPlayer || !game) return false;
    // Multiplayer: only the current player can buy
    if (!isMyTurn) return false;
    // Only during action phase
    if (game.phase !== 'action_phase') return false;
    // Must have placed a patron at this god's temple this turn
    const godAccess = game.godsAccessedThisTurn || [];
    if (!godAccess.includes(godColor)) return false;
    // One purchase per turn (shop or power card)
    if (game.purchaseMadeThisTurn) return false;
    // Hoard blocks shopping this turn
    if (currentPlayer.effects?.includes('noShopThisTurn')) return false;
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

  /**
   * Compute the effective cost for a power card, accounting for Blessed discount
   * and Haggle (shopDiscount) effect. Reduces 'any' first, then specific colors.
   */
  function getCardCost(cardId) {
    const card = powerCards[cardId];
    if (!card) return null;
    const cost = { ...card.cost };
    let discount = 0;
    const playerId = currentPlayer?.id;
    const champion = game.champions?.[playerId];

    // Haggle shopDiscount (-2)
    if (currentPlayer?.effects?.includes('shopDiscount')) {
      discount += 2;
    }
    // Blessed first-card discount (-2)
    if (champion?.id === 'blessed' && !(game.blessedUsed || {})[playerId]) {
      discount += 2;
    }

    // Apply discount: reduce 'any' first, then specific colors
    if (discount > 0) {
      if (cost.any && cost.any > 0) {
        const reduction = Math.min(discount, cost.any);
        cost.any -= reduction;
        discount -= reduction;
        if (cost.any === 0) delete cost.any;
      }
      if (discount > 0) {
        for (const color of Object.keys(cost)) {
          if (color === 'any' || discount <= 0) continue;
          const reduction = Math.min(discount, cost[color]);
          cost[color] -= reduction;
          discount -= reduction;
          if (cost[color] === 0) delete cost[color];
        }
      }
    }
    return cost;
  }

  function canBuyCard(cardId) {
    if (!currentPlayer || !cardId) return false;
    if (!isMyTurn) return false;
    if (game.phase !== 'action_phase') return false;
    const godAccess = game.godsAccessedThisTurn || [];
    if (!godAccess.includes(godColor)) return false;
    if (game.purchaseMadeThisTurn) return false;
    if (currentPlayer.effects?.includes('noShopThisTurn')) return false;
    const playerId = currentPlayer.id;
    const champion = game.champions?.[playerId];
    if (!champion) return false;
    const cost = getCardCost(cardId);
    if (!cost) return false;
    const playerResources = currentPlayer.resources || {};
    let totalHave = Object.values(playerResources).reduce((s, v) => s + v, 0);
    let totalNeeded = 0;
    for (const [resource, amount] of Object.entries(cost)) {
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
    && (game.godsAccessedThisTurn || []).includes(godColor)
    && !game.purchaseMadeThisTurn && !pendingDecision;

  // ========== COLLAPSED RENDER ==========
  // Narrow vertical strip: god header → actions → shops → cards stacked top to bottom
  if (!isFocused) {

    return (
      <>
      <div
        className={`relative rounded-xl flex flex-col ${isBeingWatched ? 'god-watching-glow' : ''}`}
        style={{
          border: `1px solid ${colors.border}`,
          background: base.board,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '--watching-color': watchingPlayerColor || 'transparent',
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
        {/* Placement burst overlay (collapsed) */}
        {borderSurge && (
          <div
            key={`burst-${flashingActionId}`}
            className="absolute inset-0 rounded-xl god-placement-burst"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${colors.glowStrong} 0%, transparent 70%)`,
              zIndex: 25,
            }}
          />
        )}
        {/* God aura */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{ background: colors.gradient, opacity: 0.4 }}
        />

        <div
          className="relative z-10 flex flex-col h-full overflow-y-auto scrollbar-hide"
          style={{ padding: '6px 5px', gap: '4px' }}
        >
          {/* God identity — left-aligned compact header */}
          <div className="flex items-center gap-2 flex-shrink-0 pb-1">
            <div
              className="flex items-center justify-center rounded-md"
              style={{
                width: '22px', height: '22px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 0 8px ${colors.glow}`,
                flexShrink: 0,
              }}
            >
              <ResourceIcon type={godColor} size={16} />
            </div>
            <div style={{ minWidth: 0, flexShrink: 0 }}>
              <div style={{
                fontSize: '12px', fontWeight: 800,
                letterSpacing: '0.04em', lineHeight: 1,
                textTransform: 'uppercase',
                color: colors.text,
              }}>
                {meta.name}
              </div>
              <div style={{
                fontSize: '8px', fontWeight: 600,
                lineHeight: 1.3,
                color: colors.primary, opacity: 0.7,
              }}>
                {meta.title}
              </div>
            </div>
            {godData.gloryCondition && (
              <span
                onMouseEnter={(e) => showTooltip('vpCondition', godData.gloryCondition, e)}
                onMouseLeave={hideTooltip}
                style={{
                  fontSize: '8px', lineHeight: 1.3,
                  fontWeight: 400, fontStyle: 'italic',
                  color: 'rgba(200, 200, 220, 0.45)',
                  cursor: 'help',
                  marginLeft: 'auto',
                  textAlign: 'right',
                }}
              >
                <RichEffect text={godData.gloryCondition.description} size={9} />
              </span>
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

          {/* Actions — compact vertical list (stone/utilitarian feel).
              Worker placement is the primary signal — uses placement-glow (loud, god-colored). */}
          <div
            className={`flex flex-col gap-0.5 min-h-0 overflow-y-auto scrollbar-hide ${hasAnyAvailable ? 'placement-glow' : ''}`}
            style={{
              position: 'relative',
              flexShrink: 0,
              borderRadius: hasAnyAvailable ? '6px' : undefined,
              background: hasAnyAvailable ? colors.surface : undefined,
              border: hasAnyAvailable ? `1px solid ${colors.border}` : undefined,
              padding: hasAnyAvailable ? '2px' : undefined,
              '--god-glow': colors.glow,
              '--god-glow-strong': colors.glowStrong,
              '--placement-glow-max': `0 0 18px ${colors.glow}, 0 0 6px ${colors.glowStrong}, inset 0 0 8px ${colors.glow}`,
            }}
          >
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

          {/* Footer hint: small chip showing how many shops/cards are available here.
           * Lets the player decide whether to focus this god without overcrowding the column.
           * Click anywhere on the column to focus and see full shops/artifacts. */}
          {(() => {
            const affordableShops = godData.shops.filter(s => {
              const isLocked = s.type === 'strong' && currentRound < 2;
              return !isLocked && canAffordShop(s);
            }).length;
            const affordableCards = slots.filter(cid => cid && canBuyCard(cid)).length;
            if (affordableShops === 0 && affordableCards === 0) return null;
            return (
              <div
                className="flex items-center justify-center gap-2 flex-shrink-0 mt-auto"
                style={{
                  padding: '4px 6px',
                  borderTop: `1px solid ${colors.border}`,
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: colors.text,
                  opacity: 0.7,
                }}
                title="Click column to focus and view shops/artifacts"
              >
                {affordableShops > 0 && <span>shops·{affordableShops}</span>}
                {affordableCards > 0 && <span>artifacts·{affordableCards}</span>}
              </div>
            );
          })()}
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
      className={`relative rounded-xl flex flex-col ${isBeingWatched ? 'god-watching-glow' : ''}`}
      style={{
        border: `1px solid ${borderSurge ? colors.primary : colors.border}`,
        background: base.board,
        minHeight: 0,
        overflow: 'hidden',
        boxShadow: `0 0 12px ${colors.glow}, inset 0 0 20px ${colors.surface}`,
        transition: 'border-color 300ms ease-out',
        '--watching-color': watchingPlayerColor || 'transparent',
      }}
    >
      {/* Placement burst overlay (focused) */}
      {borderSurge && (
        <div
          key={`burst-${flashingActionId}`}
          className="absolute inset-0 rounded-xl god-placement-burst"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${colors.glowStrong} 0%, transparent 70%)`,
            zIndex: 25,
          }}
        />
      )}
      {/* God aura background gradient — static opacity (no animation = no repaint) */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: colors.gradient,
          opacity: 0.5,
        }}
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
        style={{ padding: '8px 12px', gap: '6px' }}
      >
        {/* Header — god identity + favor condition, single row */}
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
            <ResourceIcon type={godColor} size={20} />
          </div>
          <span style={{
            fontSize: '17px', fontWeight: 800, letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: colors.text, flexShrink: 0,
          }}>
            {meta.name}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 600, lineHeight: 1.1,
            color: colors.primary, opacity: 0.7, flexShrink: 0,
          }}>
            {meta.title}
          </span>
          {godData.gloryCondition && (
            <span
              onMouseEnter={(e) => showTooltip('vpCondition', godData.gloryCondition, e)}
              onMouseLeave={hideTooltip}
              style={{
                fontSize: '11px', lineHeight: 1.3, fontWeight: 400,
                fontStyle: 'italic',
                color: 'rgba(200, 200, 220, 0.5)',
                cursor: 'help',
                marginLeft: 'auto',
                textAlign: 'right',
                maxWidth: '55%',
              }}
            >
              <RichEffect text={godData.gloryCondition.description} size={10} />
            </span>
          )}
        </div>

        {/* ── ACTIONS SECTION ── cold stone/utilitarian feel.
            Worker placement is THE primary action — uses placement-glow (loud, fast, god-colored). */}
        <div
          className={`rounded-lg overflow-x-visible flex-shrink-0 ${hasAnyAvailable ? 'placement-glow' : ''}`}
          style={{
            position: 'relative',
            background: hasAnyAvailable ? colors.surface : 'rgba(180, 195, 210, 0.03)',
            border: `1px solid ${hasAnyAvailable ? colors.border : 'rgba(180, 195, 210, 0.06)'}`,
            boxShadow: hasAnyAvailable
              ? undefined
              : 'inset 0 1px 4px rgba(0, 0, 0, 0.25), inset 0 0 8px rgba(180, 195, 210, 0.02)',
            padding: '4px',
            '--god-glow': colors.glow,
            '--god-glow-strong': colors.glowStrong,
            '--placement-glow-max': `0 0 22px ${colors.glow}, 0 0 8px ${colors.glowStrong}, inset 0 0 12px ${colors.glow}`,
          }}
        >
          {tierGroups.map((group) => {
            if (group.actions.length === 0) return null;
            // T3 actions get full width (usually just 1 big action)
            const cols = group.tier === 3 ? '1fr' : 'repeat(2, 1fr)';

            return (
              <div
                key={group.tier}
                className="grid"
                style={{ gridTemplateColumns: cols, gap: '2px' }}
              >
                {group.actions.map(action => {
                  const state = getActionState(action);
                  const effect = getDynamicEffect(action);
                  return (
                    <ActionSpace
                      key={action.id}
                      actionId={action.id}
                      actionName={action.name}
                      actionEffect={effect}
                      actionTier={action.tier}
                      godColor={godColor}
                      isAvailable={state.isAvailable}
                      isOccupied={state.isOccupied}
                      occupiedBy={state.occupiedBy}
                      isNullified={state.isNullified}
                      isLocked={state.isLocked}
                      isLastPlaced={action.id === lastPlacedActionId}
                      isJustPlaced={action.id === flashingActionId}
                      onPlace={handlePlace}
                      onHover={(e) => showTooltip('action', { ...action, effect }, e)}
                      onLeave={hideTooltip}
                    />
                  );
                })}
              </div>
            );
          })}

        </div>

        {/* ── MARKET SECTION ── warm parchment/trade feel */}
        <div
          className={`rounded-lg flex-shrink-0 ${shouldHighlightMarket ? 'buyable-glow' : ''}`}
          style={{
            background: shouldHighlightMarket ? 'rgba(250, 235, 215, 0.08)' : 'rgba(250, 235, 215, 0.05)',
            border: shouldHighlightMarket ? '1.5px solid rgba(250, 235, 215, 0.4)' : '1px solid rgba(250, 235, 215, 0.12)',
            borderTop: shouldHighlightMarket ? '2px solid rgba(250, 235, 215, 0.5)' : '2px solid rgba(250, 235, 215, 0.15)',
            padding: '6px',
            '--glow-max': shouldHighlightMarket
              ? '0 0 18px rgba(250, 235, 215, 0.25), inset 0 0 8px rgba(250, 235, 215, 0.08)'
              : 'inset 0 1px 6px rgba(250, 235, 215, 0.04)',
            boxShadow: shouldHighlightMarket ? undefined : 'inset 0 1px 6px rgba(250, 235, 215, 0.04)',
          }}
        >
          {/* Shops — 3 columns, compact with type label + effect + cost */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {godData.shops.map(shop => {
              const style = shopStyles[shop.type];
              const modifiedCost = (currentPlayer && game) ? getShopCost(game, currentPlayer.id, `${godColor}_${shop.type}`) : null;
              const costEntries = parseCost(modifiedCost || shop.cost);
              const isShopLocked = shop.type === 'strong' && currentRound < 2;
              const affordable = !isShopLocked && canAffordShop(shop);

              // Distinct background per shop type
              const shopBg = affordable
                ? shop.type === 'vp'
                  ? `linear-gradient(170deg, ${style.color}18 0%, ${style.color}08 40%, rgba(250, 235, 215, 0.03) 100%)`
                  : shop.type === 'strong'
                    ? `linear-gradient(170deg, ${style.color}14 0%, rgba(250, 235, 215, 0.05) 100%)`
                    : `linear-gradient(180deg, rgba(250, 235, 215, 0.06) 0%, rgba(250, 235, 215, 0.02) 100%)`
                : 'rgba(250, 235, 215, 0.02)';

              return (
                <button
                  key={shop.type}
                  onClick={isShopLocked || !isMyTurn ? undefined : () => handleShop(shop.type)}
                  onMouseEnter={(e) => showTooltip('shop', shop, e)}
                  onMouseLeave={hideTooltip}
                  className={`shop-btn ${affordable ? 'buyable-glow' : ''}`}
                  style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    background: shopBg,
                    border: `1px solid ${affordable ? `${style.color}40` : 'rgba(250, 235, 215, 0.06)'}`,
                    borderTop: `3px solid ${affordable ? style.color : `${style.color}30`}`,
                    opacity: isShopLocked ? 0.6 : affordable ? 1 : 0.65,
                    cursor: isShopLocked ? 'default' : 'pointer',
                    outline: 'none',
                    overflow: 'visible',
                    boxShadow: affordable
                      ? `inset 0 0 12px ${style.color}10`
                      : 'none',
                    '--glow-max': affordable ? `0 0 16px ${style.color}50, inset 0 0 8px ${style.color}20, 0 0 4px ${style.color}40` : undefined,
                  }}
                >
                  {/* Type label + cost on same line */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em',
                      textTransform: 'uppercase', color: style.color,
                    }}>
                      {style.label}
                    </span>
                    <div className="flex items-center" style={{ gap: '3px' }}>
                      {costEntries.map(({ color, amount }) => (
                        <div key={color} className="flex items-center" style={{ gap: '1px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: base.textMuted }}>
                            {amount}
                          </span>
                          {color === 'any' ? (
                            <WildcardIcon size={13} />
                          ) : (
                            <ResourceIcon type={color} size={13} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Effect text */}
                  <div style={{
                    fontSize: '12px', lineHeight: 1.4,
                    color: affordable ? base.textPrimary : 'rgba(168, 162, 158, 0.8)',
                  }}>
                    <RichEffect text={shop.effect} size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── POWER CARDS SECTION ── divine/premium feel with god-colored glow */}
        {slots.some(s => s != null) ? (
          <div
            className={`rounded-lg ${shouldHighlightMarket ? 'buyable-glow' : ''}`}
            style={{
              flex: 1,
              minHeight: 0,
              background: `radial-gradient(ellipse at 50% 0%, ${colors.surface} 0%, rgba(28, 25, 23, 0.4) 80%)`,
              border: shouldHighlightMarket ? `1px solid ${colors.primary}55` : `1px solid ${colors.border}`,
              padding: '6px',
              '--glow-min': `inset 0 1px 8px ${colors.glow}`,
              '--glow-max': `inset 0 1px 10px ${colors.glow}, 0 0 20px ${colors.glow}, 0 0 6px ${colors.glowStrong}`,
              boxShadow: shouldHighlightMarket ? undefined : `inset 0 1px 8px ${colors.glow}`,
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: '1fr',
                gap: '6px',
                flex: 1,
                minHeight: 0,
                alignItems: 'stretch',
              }}
            >
              {slots.map((cardId, i) => {
                if (!cardId) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className={soldSlotIndex === i ? 'market-slot-sold' : ''}
                      style={{
                        borderRadius: '8px',
                        border: `1px dashed ${colors.border}`,
                        background: 'rgba(255, 255, 255, 0.01)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 600, color: base.textMuted, opacity: 0.3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Sold
                      </span>
                    </div>
                  );
                }
                const card = powerCards[cardId];
                if (!card) return null;
                const buyable = canBuyCard(cardId);
                const effectiveCost = getCardCost(cardId) || card.cost || {};
                const cardCostEntries = Object.entries(effectiveCost);
                return (
                  <button
                    key={cardId}
                    onClick={buyable && isMyTurn ? () => actions.buyCard(cardId) : undefined}
                    onMouseEnter={(e) => showTooltip('card', cardId, e)}
                    onMouseLeave={hideTooltip}
                    className={`text-left card-btn ${buyable ? 'buyable-glow' : ''}`}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'visible',
                      outline: 'none',
                      cursor: buyable ? 'pointer' : 'default',
                      opacity: buyable ? 1 : 0.5,
                      width: '100%',
                      height: '100%',
                      '--glow-max': buyable
                        ? `0 0 20px ${colors.glow}, 0 0 8px ${colors.glowStrong}, inset 0 0 10px ${colors.glow}`
                        : undefined,
                    }}
                  >
                    {/* Card frame */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: buyable
                          ? `linear-gradient(170deg, ${colors.light}15 0%, ${colors.primary}12 20%, rgba(12,10,9,0.95) 60%)`
                          : 'rgba(28, 25, 23, 0.9)',
                        border: `1.5px solid ${buyable ? colors.primary + '66' : colors.border}`,
                        borderRadius: '8px',
                        boxShadow: buyable
                          ? `0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${colors.glow}`
                          : '0 1px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                    {/* Content — centered image+text block, cost bottom-right */}
                    <div className="relative z-10 flex flex-col h-full" style={{ padding: '12px' }}>
                      {/* Centered block: image + name/desc */}
                      <div className="flex items-start" style={{ gap: '10px', flex: 1, display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '80px', height: '80px', borderRadius: '12px', flexShrink: 0,
                          background: buyable
                            ? `radial-gradient(circle at 38% 32%, ${colors.light}30 0%, ${colors.surface} 50%, rgba(0,0,0,0.5) 100%)`
                            : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${buyable ? colors.primary + '55' : colors.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ArtifactImage
                            cardId={cardId}
                            size={60}
                            color={buyable ? colors.light : base.textMuted}
                            glowColor={buyable ? colors.primary : undefined}
                          />
                        </div>
                        <div className="flex-1 min-w-0" style={{ alignSelf: 'center' }}>
                          <div style={{
                            fontSize: '14px', fontWeight: 700, lineHeight: 1.2,
                            color: buyable ? colors.text : base.textMuted,
                          }}>
                            {card.name}
                          </div>
                          <div style={{
                            fontSize: '12px', lineHeight: 1.35,
                            color: buyable ? base.textSecondary : 'rgba(168, 162, 158, 0.5)',
                            marginTop: '3px',
                          }}>
                            <RichEffect text={card.description} size={12} />
                          </div>
                        </div>
                      </div>
                      {/* Cost — bottom-right */}
                      <div className="flex items-center justify-end" style={{ gap: '4px' }}>
                        <span style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: base.textMuted, opacity: 0.6 }}>
                          Cost
                        </span>
                        {cardCostEntries.map(([resource, amount]) => (
                          <div key={resource} className="flex items-center" style={{ gap: '2px' }}>
                            <span style={{
                              fontSize: '14px', fontWeight: 700,
                              color: buyable ? (resourceStyles[resource]?.highlight || base.textSecondary) : base.textMuted,
                            }}>
                              {amount}
                            </span>
                            {resource === 'any' ? (
                              <WildcardIcon size={15} />
                            ) : (
                              <ResourceIcon type={resource} size={15} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
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
});

// ============================================================================
// Collapsed Action Row — tier + name + occupation indicator
// ============================================================================

const CollapsedActionRow = React.memo(function CollapsedActionRow({ action, godColor, state, onHover, onLeave }) {
  const colors = godColors[godColor];
  const tier = tierStyles[action.tier];

  const borderColor = state.isNullified
    ? 'rgba(225, 29, 72, 0.4)'
    : state.isLocked
      ? 'rgba(255, 255, 255, 0.04)'
      : state.isAvailable
        ? colors.glowStrong
        : 'rgba(255, 255, 255, 0.04)';

  const bgColor = state.isAvailable
    ? `${colors.surface}`
    : state.isOccupied
      ? 'rgba(0, 0, 0, 0.3)'
      : 'transparent';

  return (
    <div
      className="relative flex items-center gap-1.5 rounded px-2"
      style={{
        height: '28px',
        border: `1px solid ${borderColor}`,
        background: bgColor,
        opacity: state.isLocked ? 0.2 : state.isNullified ? 0.35 : state.isOccupied ? 0.4 : 1,
        cursor: 'pointer',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Available glow — static (section-level pulse handles the "alive" feel) */}
      {state.isAvailable && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '-1px',
            borderRadius: '5px',
            boxShadow: `inset 0 0 6px ${colors.glow}, 0 0 6px ${colors.glow}, 0 0 2px ${colors.glowStrong}`,
            opacity: 0.5,
          }}
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
        flex: 1, fontSize: '11px', fontWeight: 600, lineHeight: 1,
        color: state.isLocked ? 'rgba(120, 113, 108, 0.5)' : state.isOccupied ? 'rgba(168, 162, 158, 0.5)' : base.textPrimary,
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
});

