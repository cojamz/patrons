/**
 * GameBoard — Main game layout for Patrons v3.
 *
 * Gods have two states: FOCUSED (full detail) and COLLAPSED (summary).
 * One god is focused at a time. Collapsed gods show occupation at a glance.
 * Clicking a collapsed god focuses it. Auto-focuses on interaction.
 *
 * Layout adapts: focused god gets more space, collapsed gods compress.
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import GodArea from './GodArea';
import { useGameState } from '../../hooks/useGame';
import { useGameEvents, filterByType } from '../../hooks/useGameEvents';
import { base, playerColors, godColors } from '../../styles/theme';
import WorkerIcon from '../icons/WorkerIcon';
import GodIcon from '../icons/GodIcon';
import ResourceIcon from '../icons/ResourceIcon';
import godsData from '../../../engine/v3/data/gods';
import { powerCards } from '../../../engine/v3/data/powerCards';

const GOD_LAYOUT = ['gold', 'black', 'green', 'yellow'];

// Build action lookup
const ACTION_LOOKUP = {};
for (const [godColor, god] of Object.entries(godsData)) {
  for (const action of god.actions) {
    ACTION_LOOKUP[action.id] = { name: action.name, godColor, effect: action.effect };
  }
}

// Build shop lookup: "gold_strong" → { name, effect, godColor }
const SHOP_LOOKUP = {};
for (const [godColor, god] of Object.entries(godsData)) {
  for (const shop of god.shops || []) {
    const typeLabel = shop.type === 'vp' ? 'VP' : shop.type === 'strong' ? 'Advanced' : 'Basic';
    SHOP_LOOKUP[`${godColor}_${shop.type}`] = {
      name: `${god.name} ${typeLabel} Shop`,
      effect: shop.effect,
      godColor,
    };
  }
}

// Build card name → definition lookup
const CARD_NAME_TO_DEF = new Map();
for (const [id, card] of Object.entries(powerCards)) {
  CARD_NAME_TO_DEF.set(card.name, card);
}

// Snapshot player state for diffing
function snapshotPlayers(players) {
  if (!players) return [];
  return players.map(p => ({
    id: p.id,
    name: p.name,
    resources: { ...p.resources },
    glory: p.glory,
  }));
}

// Compute per-player resource + favor deltas between two snapshots
function computePlayerDeltas(prev, curr) {
  if (!prev || !curr || prev.length === 0) return [];
  const deltas = [];
  for (const cp of curr) {
    const pp = prev.find(p => p.id === cp.id);
    if (!pp) continue;
    const resourceDeltas = {};
    let hasChange = false;
    for (const [color, val] of Object.entries(cp.resources)) {
      const diff = val - (pp.resources[color] || 0);
      if (diff !== 0) {
        resourceDeltas[color] = diff;
        hasChange = true;
      }
    }
    const favorDelta = (cp.glory || 0) - (pp.glory || 0);
    if (hasChange || favorDelta !== 0) {
      deltas.push({
        playerId: cp.id,
        playerName: cp.name,
        resourceDeltas,
        favorDelta,
      });
    }
  }
  return deltas;
}

// Parse the latest purchase from new log entries
function parsePurchaseFromLogs(newLogs) {
  for (let i = newLogs.length - 1; i >= 0; i--) {
    const text = newLogs[i];
    const boughtMatch = text.match(/^Bought (.+)$/);
    if (boughtMatch) {
      const cardName = boughtMatch[1];
      const cardDef = CARD_NAME_TO_DEF.get(cardName);
      return {
        type: 'artifact',
        name: cardName,
        godColor: cardDef?.god || 'gold',
        description: cardDef?.description || null,
      };
    }
    const paidMatch = text.match(/^Paid for (.+)$/);
    if (paidMatch) {
      const shopName = paidMatch[1];
      // Find matching shop
      for (const [key, shop] of Object.entries(SHOP_LOOKUP)) {
        if (shop.name === shopName || key === shopName || shopName.toLowerCase().includes(shop.name.toLowerCase())) {
          return { type: 'shop', name: shop.name, godColor: shop.godColor, description: shop.effect };
        }
      }
      // Fallback
      return { type: 'shop', name: shopName, godColor: 'gold', description: null };
    }
  }
  return null;
}

// --- ActionResultBanner — Board-level opponent action/purchase overlay ---

function ActionResultBanner({ info }) {
  const pColors = playerColors[info.playerId] || playerColors[0];
  const gColors = godColors[info.godColor] || godColors.gold;

  // Sort deltas: acting player first, then others with non-zero changes
  const playerDeltas = (info.playerDeltas || []).sort((a, b) => {
    if (a.playerId === info.playerId) return -1;
    if (b.playerId === info.playerId) return 1;
    return 0;
  });

  const verbText = info.type === 'placement' ? 'placed at' : 'bought';

  return (
    <div
      className="placement-banner-in"
      style={{
        position: 'absolute',
        top: '18%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '10px 20px',
        borderRadius: '10px',
        background: 'rgba(12, 10, 9, 0.93)',
        border: `2px solid ${pColors.primary}66`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 20px ${pColors.primary}30`,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        '--banner-color': pColors.primary,
      }}
    >
      {/* Row 1: Who + What */}
      <div className="flex items-center gap-2">
        <WorkerIcon playerId={info.playerId} size={16} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: pColors.light }}>
          {info.playerName}
        </span>
        <span style={{ fontSize: '11px', color: base.textMuted }}>{verbText}</span>
        <GodIcon god={info.godColor} size={16} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: gColors.light }}>
          {info.actionName}
        </span>
      </div>

      {/* Row 2: Effect/description text */}
      {info.effectText && (
        <div style={{
          fontSize: '11px',
          color: base.textMuted,
          fontStyle: 'italic',
          opacity: 0.8,
          maxWidth: '340px',
          textAlign: 'center',
          whiteSpace: 'normal',
          lineHeight: '14px',
        }}>
          {info.effectText}
        </div>
      )}

      {/* Divider + Per-player impact */}
      {playerDeltas.length > 0 && (
        <>
          <div style={{
            width: '80%',
            borderTop: '1px dashed rgba(255,255,255,0.12)',
            margin: '2px 0',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
            {playerDeltas.map(pd => {
              const pdColors = playerColors[pd.playerId] || playerColors[0];
              const resEntries = Object.entries(pd.resourceDeltas).filter(([, v]) => v !== 0);
              const hasFavor = pd.favorDelta != null && pd.favorDelta !== 0;
              if (resEntries.length === 0 && !hasFavor) return null;

              return (
                <div key={pd.playerId} className="flex items-center gap-2">
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: pdColors.light,
                    minWidth: '50px',
                  }}>
                    {pd.playerName}
                  </span>
                  {resEntries.map(([color, amt]) => (
                    <span key={color} className="inline-flex items-center gap-0.5">
                      <span
                        className="font-bold"
                        style={{
                          fontSize: '12px',
                          color: amt > 0 ? 'rgba(167, 243, 208, 0.9)' : 'rgba(225, 29, 72, 0.85)',
                        }}
                      >
                        {amt > 0 ? '+' : ''}{amt}
                      </span>
                      <ResourceIcon type={color} size={14} />
                    </span>
                  ))}
                  {hasFavor && (
                    <span className="inline-flex items-center gap-0.5">
                      <span
                        className="font-bold"
                        style={{
                          fontSize: '12px',
                          color: pd.favorDelta > 0 ? '#E8C547' : 'rgba(225, 29, 72, 0.85)',
                        }}
                      >
                        {pd.favorDelta > 0 ? '+' : ''}{pd.favorDelta}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#E8C547' }}>F</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function GameBoard() {
  const { game, aiPlayers, isMultiplayer, mySlot, pendingDecision, log } = useGameState();
  const activeGods = game?.gods || GOD_LAYOUT;
  const [focusedGod, setFocusedGod] = useState(activeGods[0] || null);

  // --- Turn border pulse (uses useGameEvents for turnChange only) ---
  const events = useGameEvents();
  const [turnBorderColor, setTurnBorderColor] = useState(null);

  useEffect(() => {
    const turnChanges = filterByType(events, 'turnChange');
    if (turnChanges.length > 0) {
      const latest = turnChanges[turnChanges.length - 1];
      const color = (playerColors[latest.toPlayer] || playerColors[0]).primary;
      setTurnBorderColor(color);
      const timer = setTimeout(() => setTurnBorderColor(null), 800);
      return () => clearTimeout(timer);
    }
  }, [events]);

  // --- ActionResultBanner: state snapshot diffing ---
  const [bannerInfo, setBannerInfo] = useState(null);
  const prevPlayersRef = useRef(null);
  const trackedActionsLen = useRef(0);
  const trackedPurchaseRef = useRef(false);
  const prevLogLenRef = useRef(0);
  const bannerTimerRef = useRef(null);

  useEffect(() => {
    if (!game) return;

    const roundActions = game.roundActions || [];
    const currentPurchase = !!game.purchaseMadeThisTurn;

    // Round reset: actions got shorter (new round)
    if (roundActions.length < trackedActionsLen.current) {
      trackedActionsLen.current = 0;
      trackedPurchaseRef.current = false;
      prevPlayersRef.current = snapshotPlayers(game.players);
      prevLogLenRef.current = log?.length || 0;
      return;
    }

    const prevSnap = prevPlayersRef.current;

    // --- New placement detected ---
    if (roundActions.length > trackedActionsLen.current && !pendingDecision) {
      const latestAction = roundActions[roundActions.length - 1];
      const action = ACTION_LOOKUP[latestAction.actionId];
      const player = game.players?.find(p => p.id === latestAction.playerId);

      // Determine if this is an opponent
      const isOpponent = isMultiplayer
        ? latestAction.playerId !== mySlot
        : aiPlayers?.has(latestAction.playerId);

      if (isOpponent && prevSnap) {
        const currSnap = snapshotPlayers(game.players);
        const deltas = computePlayerDeltas(prevSnap, currSnap);

        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);

        setBannerInfo({
          type: 'placement',
          playerName: player?.name || `P${latestAction.playerId + 1}`,
          playerId: latestAction.playerId,
          actionName: action?.name || 'Action',
          godColor: action?.godColor || 'gold',
          effectText: action?.effect || null,
          playerDeltas: deltas,
        });

        bannerTimerRef.current = setTimeout(() => setBannerInfo(null), 4000);
      }

      trackedActionsLen.current = roundActions.length;
      prevPlayersRef.current = snapshotPlayers(game.players);
      prevLogLenRef.current = log?.length || 0;
      return;
    }

    // --- New purchase detected ---
    if (currentPurchase && !trackedPurchaseRef.current && !pendingDecision) {
      const newLogs = (log || []).slice(prevLogLenRef.current);
      const purchase = parsePurchaseFromLogs(newLogs);

      // Figure out who bought it (current player of the game state)
      const buyerId = game.currentPlayer;
      const isOpponent = isMultiplayer
        ? buyerId !== mySlot
        : aiPlayers?.has(buyerId);

      if (isOpponent && prevSnap && purchase) {
        const currSnap = snapshotPlayers(game.players);
        const deltas = computePlayerDeltas(prevSnap, currSnap);

        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);

        const player = game.players?.find(p => p.id === buyerId);
        setBannerInfo({
          type: purchase.type,
          playerName: player?.name || `P${buyerId + 1}`,
          playerId: buyerId,
          actionName: purchase.name,
          godColor: purchase.godColor,
          effectText: purchase.description,
          playerDeltas: deltas,
        });

        bannerTimerRef.current = setTimeout(() => setBannerInfo(null), 4000);
      }

      trackedPurchaseRef.current = true;
      prevPlayersRef.current = snapshotPlayers(game.players);
      prevLogLenRef.current = log?.length || 0;
      return;
    }

    // --- Snapshot update: stable state, update baseline ---
    if (
      roundActions.length === trackedActionsLen.current &&
      currentPurchase === trackedPurchaseRef.current &&
      !pendingDecision
    ) {
      prevPlayersRef.current = snapshotPlayers(game.players);
      prevLogLenRef.current = log?.length || 0;
    }

    // Reset purchase tracking on new turn (purchaseMadeThisTurn goes false)
    if (!currentPurchase && trackedPurchaseRef.current) {
      trackedPurchaseRef.current = false;
    }
  }, [game, pendingDecision, log, aiPlayers, isMultiplayer, mySlot]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  // --- Color tint when watching (AI or remote player's turn) ---
  const isAITurn = game?.phase === 'action_phase' && aiPlayers?.has(game?.currentPlayer);
  const isRemoteTurn = game?.phase === 'action_phase' && isMultiplayer && game?.currentPlayer !== mySlot;
  const isWatching = isAITurn || isRemoteTurn;
  const watchingColor = isWatching
    ? (playerColors[game?.currentPlayer] || playerColors[0]).primary
    : null;

  // Auto-focus when a god is interacted with (track via godsAccessedThisTurn)
  // Delayed 200ms so flash/burst animations register before the layout shift
  useEffect(() => {
    if (!game) return;
    const accessed = game.godsAccessedThisTurn || [];
    if (accessed.length > 0) {
      const lastAccessed = accessed[accessed.length - 1];
      if (activeGods.includes(lastAccessed) && lastAccessed !== focusedGod) {
        const timer = setTimeout(() => setFocusedGod(lastAccessed), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [game?.godsAccessedThisTurn?.length]);

  const handleFocus = useCallback((godColor) => {
    setFocusedGod(godColor);
  }, []);

  if (!game) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{ background: base.board, color: base.textMuted }}
      >
        <span className="text-lg">Waiting for game...</span>
      </div>
    );
  }

  // Compute grid layout based on god count and focus — memoized to avoid layout thrashing
  const godCount = activeGods.length;
  const gridStyle = useMemo(() => {
    const cols = godCount <= 2
      ? activeGods.map(g => g === focusedGod ? '3fr' : '2fr').join(' ')
      : activeGods.map(g => g === focusedGod ? '2.5fr' : '1.2fr').join(' ');
    return {
      gridTemplateColumns: cols,
      gridTemplateRows: '1fr',
    };
  }, [focusedGod, godCount, activeGods]);

  // Turn border pulse: inset glow + outer glow that fades over 800ms
  const borderShadow = turnBorderColor
    ? `inset 0 0 0 2px ${turnBorderColor}, 0 0 20px ${turnBorderColor}40`
    : 'inset 0 0 0 2px transparent, 0 0 20px transparent';

  return (
    <div
      className="relative w-full mx-auto"
      style={{
        background: base.board,
        height: 'calc(100vh - 230px)',
        maxWidth: '1440px',
        boxShadow: borderShadow,
        transition: 'box-shadow 800ms ease-out',
      }}
    >
      {/* Stone texture noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%)',
          backgroundSize: '4px 4px',
          opacity: 0.6,
        }}
      />

      {/* Secondary texture layer for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 67, 0.03) 0%, transparent 60%)',
        }}
      />

      {/* Color tint overlay — active player's color at 5% during their turn */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: watchingColor || 'transparent',
          opacity: isWatching ? 0.05 : 0,
          transition: 'opacity 300ms ease, background 300ms ease',
          zIndex: 15,
        }}
      />

      {/* Board-level action result banner */}
      {bannerInfo && <ActionResultBanner info={bannerInfo} />}

      {/* God grid with focus-aware sizing */}
      <div
        className="relative z-10 grid gap-3 p-3 w-full h-full"
        style={gridStyle}
      >
        {activeGods.map(godColor => (
          <GodArea
            key={godColor}
            godColor={godColor}
            isFocused={godColor === focusedGod}
            onFocus={() => handleFocus(godColor)}
            isBeingWatched={isWatching && (game.godsAccessedThisTurn || []).includes(godColor)}
            watchingPlayerColor={watchingColor}
          />
        ))}
      </div>
    </div>
  );
}
