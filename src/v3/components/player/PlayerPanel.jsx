/**
 * PlayerPanel — Fixed bottom HUD for the current player.
 *
 * Luxury card-game feel: dark glass panel with warm divine glow,
 * animated favor counter, resource gems, worker meeples,
 * power card slots, and an End Turn button.
 *
 * Top strip shows all players as tabs; the current player is expanded.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../hooks/useGame';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { godColors, playerColors, base } from '../../styles/theme';
import { favorChange } from '../../styles/animations';
import ResourceDisplay from './ResourceDisplay';
import PowerCardSlot from './PowerCardSlot';
import WorkerIcon from '../icons/WorkerIcon';
import ChampionIcon from '../icons/ChampionIcon';
import CardPixelIcon from '../icons/CardPixelIcon';
import champions from '../../../engine/v3/data/champions';
import { powerCards as powerCardsData } from '../../../engine/v3/data/powerCards';
import { ACTIONS_PER_ROUND } from '../../../engine/v3/data/constants';

// --- Player Tab (top strip, non-current players) ---

function PlayerTab({ player, champion, isCurrent, onClick }) {
  const colors = playerColors[player.id] || playerColors[0];
  const { value: favorDisplay } = useAnimatedValue(player.glory);
  const powerCards = champion?.powerCards || [];

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all duration-200"
      style={{
        background: isCurrent
          ? 'rgba(28, 25, 23, 0.92)'
          : 'rgba(28, 25, 23, 0.5)',
        borderBottom: isCurrent
          ? `2px solid ${colors.primary}`
          : '2px solid transparent',
        opacity: isCurrent ? 1 : 0.7,
      }}
    >
      {/* Player color pip */}
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{
          background: colors.primary,
          boxShadow: isCurrent ? `0 0 6px ${colors.primary}` : 'none',
        }}
      />
      <span
        className="text-xs font-semibold truncate max-w-[80px]"
        style={{ color: isCurrent ? colors.light : base.textSecondary }}
      >
        {player.name}
      </span>
      <span
        className="text-xs tabular-nums font-medium"
        style={{ color: godColors.gold.light, opacity: 0.8 }}
      >
        {favorDisplay}
      </span>
      {/* Power card icons */}
      {powerCards.length > 0 && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {powerCards.map(cardId => {
            const cardData = powerCardsData[cardId];
            return (
              <span
                key={cardId}
                title={cardData ? `${cardData.name}: ${cardData.description}` : cardId}
              >
                <CardPixelIcon
                  cardId={cardId}
                  size={12}
                  color={isCurrent ? godColors.gold.light : base.textMuted}
                />
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}

// --- Favor Counter ---

function FavorCounter({ glory }) {
  const { value: displayFavor, direction } = useAnimatedValue(glory);

  const glowColor = direction === 'up'
    ? godColors.gold.glowStrong
    : direction === 'down'
      ? 'rgba(225, 29, 72, 0.5)'
      : godColors.gold.glow;

  const textColor = direction === 'up'
    ? godColors.gold.light
    : direction === 'down'
      ? base.negativeLight
      : godColors.gold.primary;

  return (
    <div className="flex flex-col items-center gap-0.5" title="Favor — victory points. Highest favor wins!">
      <span
        className="text-[10px] uppercase tracking-widest font-medium"
        style={{ color: base.textMuted }}
      >
        Favor
      </span>
      <motion.div
        className="relative"
        animate={direction ? favorChange.animate : {}}
      >
        <span
          className="text-3xl font-bold tabular-nums leading-none"
          style={{
            color: textColor,
            textShadow: `0 0 20px ${glowColor}`,
            transition: 'color 0.3s ease',
          }}
        >
          {displayFavor}
        </span>
      </motion.div>
    </div>
  );
}

// --- Workers Remaining ---

function WorkersDisplay({ playerId, workersLeft, totalWorkers }) {
  const total = totalWorkers || 4;

  return (
    <div
      className="flex flex-col items-center gap-1"
      title={`${workersLeft} of ${total} patrons remaining this round`}
    >
      <span
        className="text-[10px] uppercase tracking-widest font-medium"
        style={{ color: base.textMuted }}
      >
        Patrons
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <WorkerIcon
            key={i}
            playerId={playerId}
            size={18}
            ghost={i >= workersLeft}
          />
        ))}
      </div>
    </div>
  );
}

// --- Champion Tooltip Wrapper ---

function ChampionTooltipWrapper({ championData, colors, children }) {
  const [hovered, setHovered] = useState(false);

  if (!championData) return children;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              marginBottom: '8px',
              zIndex: 9999,
              width: '260px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#0a0908',
              border: `2px solid ${godColors.gold.primary}`,
              boxShadow: `0 16px 48px rgba(0, 0, 0, 1), 0 0 0 4px rgba(0, 0, 0, 0.9), 0 0 16px ${godColors.gold.glow}`,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              fontSize: '12px', fontWeight: 700, color: godColors.gold.text,
              marginBottom: '6px',
            }}>
              {championData.name}
            </div>
            <div style={{
              fontSize: '9px', fontWeight: 600, color: godColors.gold.primary,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '6px', opacity: 0.7,
            }}>
              People Power
            </div>
            <div style={{
              fontSize: '11px', lineHeight: 1.5, color: base.textSecondary,
            }}>
              {championData.passive}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Panel ---

export default function PlayerPanel() {
  const { game, currentPlayer, phase, log, actions } = useGame();

  const [viewingId, setViewingId] = useState(null);

  // Reset to own panel when the active player changes (turn change)
  useEffect(() => {
    setViewingId(null);
  }, [currentPlayer?.id]);

  if (!game || !currentPlayer) return null;

  // viewingPlayer: defaults to currentPlayer, or the selected tab
  const viewingPlayer = viewingId !== null
    ? game.players.find(p => p.id === viewingId) || currentPlayer
    : currentPlayer;
  const isViewingSelf = viewingPlayer.id === currentPlayer.id;

  const playerIndex = viewingPlayer.id;
  const colors = playerColors[playerIndex] || playerColors[0];

  // Find the champion data for the viewed player
  const championState = game.champions?.[playerIndex];
  const championData = championState
    ? champions.find(c => c.id === championState.id)
    : null;

  // Power card slots
  const powerCardIds = championState?.powerCards || [];
  const totalSlots = championState?.powerCardSlots || 4;

  // Workers info
  const workersLeft = viewingPlayer.workersLeft ?? 0;
  const totalWorkers = ACTIONS_PER_ROUND[(game.round || 1) - 1] || 4;

  // End turn only available when viewing yourself and it's action phase
  const isMyTurn = phase === 'action_phase' && isViewingSelf;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Player tabs strip */}
      <div
        className="flex items-end gap-0.5 px-4"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(28, 25, 23, 0.7) 50%, rgba(28, 25, 23, 0.92) 100%)',
          paddingTop: '6px',
        }}
      >
        {game.players.map(player => (
          <PlayerTab
            key={player.id}
            player={player}
            champion={game.champions?.[player.id]}
            isCurrent={player.id === viewingPlayer.id}
            onClick={() => setViewingId(player.id === currentPlayer.id ? null : player.id)}
          />
        ))}
      </div>

      {/* Viewing indicator */}
      {!isViewingSelf && (
        <div
          className="text-center text-xs py-1 font-semibold tracking-wide cursor-pointer"
          style={{
            background: `linear-gradient(90deg, ${colors.primary}22, ${colors.primary}44, ${colors.primary}22)`,
            color: colors.light,
            borderTop: `1px solid ${colors.primary}66`,
          }}
          onClick={() => setViewingId(null)}
        >
          Viewing {viewingPlayer.name}'s panel — click to return
        </div>
      )}

      {/* Main panel */}
      <div
        className="relative"
        style={{
          background: 'rgba(28, 25, 23, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(212, 168, 67, 0.15)',
        }}
      >
        {/* Subtle top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212, 168, 67, 0.25), transparent)',
          }}
        />

        <div className="flex items-center gap-6 px-5 py-3">
          {/* -- Player identity + Favor -- */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Champion icon */}
            {championData && (
              <div
                className="flex items-center justify-center rounded-md flex-shrink-0"
                style={{
                  width: '36px',
                  height: '36px',
                  background: godColors.gold.surface,
                  border: `1px solid ${godColors.gold.border}`,
                }}
              >
                <ChampionIcon championId={championState.id} size={26} color={godColors.gold.light} />
              </div>
            )}

            {/* Player name & champion — hover for passive power */}
            <ChampionTooltipWrapper championData={championData} colors={colors}>
              <div className="flex flex-col gap-0.5 cursor-help">
                <span
                  className="text-sm font-bold tracking-wide"
                  style={{ color: colors.light }}
                >
                  {viewingPlayer.name}
                </span>
                {championData && (
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: base.textMuted, borderBottom: '1px dotted rgba(168,162,158,0.3)' }}
                  >
                    {championData.name}
                  </span>
                )}
              </div>
            </ChampionTooltipWrapper>

            {/* Vertical divider */}
            <div
              className="w-px h-10 flex-shrink-0"
              style={{ background: base.divider }}
            />

            {/* Favor counter */}
            <FavorCounter glory={viewingPlayer.glory} />
          </div>

          {/* Vertical divider */}
          <div
            className="w-px h-10 flex-shrink-0"
            style={{ background: base.divider }}
          />

          {/* -- Resources -- */}
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: base.textMuted }}
            >
              Resources
            </span>
            <ResourceDisplay resources={viewingPlayer.resources} activeGods={game.gods} />
          </div>

          {/* Vertical divider */}
          <div
            className="w-px h-10 flex-shrink-0"
            style={{ background: base.divider }}
          />

          {/* -- Workers -- */}
          <WorkersDisplay
            playerId={playerIndex}
            workersLeft={workersLeft}
            totalWorkers={totalWorkers}
          />

          {/* Vertical divider */}
          <div
            className="w-px h-10 flex-shrink-0"
            style={{ background: base.divider }}
          />

          {/* -- Power Card Slots -- */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span
              className="text-[10px] uppercase tracking-widest font-medium"
              style={{ color: base.textMuted }}
            >
              Power Cards
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {Array.from({ length: totalSlots }, (_, i) => {
                const cardId = powerCardIds[i] || null;
                return (
                  <PowerCardSlot
                    key={i}
                    cardId={cardId}
                    slotIndex={i}
                    isEmpty={!cardId}
                  />
                );
              })}
            </div>
          </div>

          {/* -- Recent Log + End Turn -- */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {/* Mini log — scrollable */}
            <div
              className="flex flex-col gap-0.5 overflow-y-auto scrollbar-hide"
              style={{ maxWidth: '240px', maxHeight: '52px' }}
            >
              {(log || []).slice(-8).map((entry, i, arr) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 flex-shrink-0"
                  style={{
                    fontSize: '9px',
                    lineHeight: 1.3,
                    color: base.textMuted,
                    opacity: i < arr.length - 1 ? 0.4 + (i / arr.length) * 0.4 : 0.9,
                  }}
                >
                  <div
                    className="w-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      minHeight: '10px',
                      alignSelf: 'stretch',
                    }}
                  />
                  <span style={{
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {entry
                      .replace(/\bworkers\b/gi, 'patrons')
                      .replace(/\bworker\b/gi, 'patron')
                      .replace(/\benvoys\b/gi, 'patrons')
                      .replace(/\benvoy\b/gi, 'patron')
                      .replace(/\bGlory\b/g, 'Favor')
                      .replace(/\bglory\b/g, 'favor')}
                  </span>
                </div>
              ))}
            </div>

            <motion.button
              className="flex-shrink-0 px-5 py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wider transition-colors duration-200"
              title={!isMyTurn ? `Waiting for ${currentPlayer?.name || 'another player'}` : 'End your turn'}
              style={{
                background: isMyTurn
                  ? `linear-gradient(135deg, ${godColors.gold.primary}, ${godColors.gold.dark})`
                  : 'rgba(120, 113, 108, 0.2)',
                color: isMyTurn ? base.textDark : base.textMuted,
                border: isMyTurn
                  ? `1px solid ${godColors.gold.light}`
                  : '1px solid rgba(120, 113, 108, 0.15)',
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
                boxShadow: isMyTurn
                  ? `0 0 20px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`
                  : 'none',
                opacity: isMyTurn ? 1 : 0.4,
              }}
              whileHover={isMyTurn ? { scale: 1.04, boxShadow: `0 0 30px ${godColors.gold.glowStrong}` } : {}}
              whileTap={isMyTurn ? { scale: 0.97 } : {}}
              onClick={() => isMyTurn && actions.endTurn()}
              disabled={!isMyTurn}
            >
              End Turn
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
