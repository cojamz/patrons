/**
 * App.jsx — Main entry point for The Favored v3.
 *
 * Wraps the game in GameProvider (local) or MultiplayerGameProvider (online)
 * and orchestrates the full UI:
 *   1. Rules interstitial
 *   2. Mode selection: local vs multiplayer (lobby)
 *   3. Setup / draft / action / round end / game over screens
 *
 * Modal system routes pending decisions to the appropriate modal.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GameProvider from './GameProvider';
import HostSync from './multiplayer/HostSync';
import GuestProvider from './multiplayer/GuestProvider';
import { useGame } from './hooks/useGame';
import { useAITurns } from './hooks/useAITurns';
import { ResourceGradientDefs } from './components/icons/ResourceIcon';
import GameBoard from './components/board/GameBoard';
import PlayerPanel from './components/player/PlayerPanel';
import TurnIndicator from './components/hud/TurnIndicator';
import RoundTracker from './components/hud/RoundTracker';
import Modal from './components/modals/Modal';
import GemSelection from './components/modals/GemSelection';
import TargetPlayer from './components/modals/TargetPlayer';
import ActionChoice from './components/modals/ActionChoice';
import RoundTransition from './components/modals/RoundTransition';
import DiscardArtifact from './components/modals/DiscardArtifact';
import ChooseColor from './components/modals/ChooseColor';
import WorkerIcon from './components/icons/WorkerIcon';
import ChampionIcon from './components/icons/ChampionIcon';
import { CHAMPION_NAMES } from './components/icons/ChampionIcon';
import { base, godColors, playerColors, getThemeCSSVars } from './styles/theme';
import { modalBackdrop, modalContent, cardReveal } from './styles/animations';
import champions from '../engine/v3/data/champions';
import godsData from '../engine/v3/data/gods';
import RulesOverlay, { SLIDES, SlideIcon } from './components/RulesOverlay';
import LobbyScreen from './components/lobby/LobbyScreen';
import WaitingOverlay from './components/lobby/WaitingOverlay';
import { rejoinRoom } from './firebase/rooms';
import { db, ref, get } from './firebase/config';
import TurnAnnouncement from './components/hud/TurnAnnouncement';
import { useGameEvents, filterByType } from './hooks/useGameEvents';

// ============================================================================
// Setup Screen
// ============================================================================

// Rules carousel panel — reusable for setup screen and multiplayer lobby
function RulesPanel() {
  const [slideIndex, setSlideIndex] = useState(0);
  // Skip the intro slide (index 0) — start from the informational slides
  const infoSlides = SLIDES.slice(1);
  const slide = infoSlides[slideIndex];

  return (
    <div
      className="rounded-xl p-6 flex flex-col"
      style={{
        background: 'rgba(28, 25, 23, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span
          className="text-xs uppercase tracking-[0.2em] font-semibold"
          style={{ color: godColors.gold.primary }}
        >
          How to Play
        </span>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${godColors.gold.primary}40, transparent)` }} />
      </div>

      {/* Slide content — click anywhere to advance */}
      <div
        className="flex-1 flex flex-col justify-center cursor-pointer"
        onClick={() => setSlideIndex(i => (i + 1) % infoSlides.length)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* Icon area */}
            <div className="flex items-center justify-center mb-5" style={{ minHeight: '48px' }}>
              <SlideIcon type={slide.icon} />
            </div>

            {/* Heading */}
            <h3
              className="text-xl font-bold mb-3 text-center"
              style={{ color: godColors.gold.light }}
            >
              {slide.heading}
            </h3>

            {/* Body */}
            <p
              className="text-sm leading-relaxed text-center flex-1"
              style={{ color: base.textSecondary }}
            >
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots + arrows */}
      <div className="flex items-center justify-center gap-4 mt-5">
        <button
          onClick={(e) => { e.stopPropagation(); setSlideIndex(i => Math.max(0, i - 1)); }}
          disabled={slideIndex === 0}
          className="flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold transition-all"
          style={{
            color: slideIndex === 0 ? 'rgba(255,255,255,0.1)' : base.textSecondary,
            background: slideIndex === 0 ? 'transparent' : 'rgba(255,255,255,0.05)',
            cursor: slideIndex === 0 ? 'default' : 'pointer',
          }}
        >
          ‹
        </button>
        <div className="flex items-center gap-1.5">
          {infoSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === slideIndex ? '16px' : '6px',
                height: '6px',
                background: i === slideIndex ? godColors.gold.primary : 'rgba(255, 255, 255, 0.15)',
              }}
            />
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setSlideIndex(i => Math.min(infoSlides.length - 1, i + 1)); }}
          disabled={slideIndex === infoSlides.length - 1}
          className="flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold transition-all"
          style={{
            color: slideIndex === infoSlides.length - 1 ? 'rgba(255,255,255,0.1)' : base.textSecondary,
            background: slideIndex === infoSlides.length - 1 ? 'transparent' : 'rgba(255,255,255,0.05)',
            cursor: slideIndex === infoSlides.length - 1 ? 'default' : 'pointer',
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function SetupScreen({ onStart, onMultiplayer, onJoinMultiplayer }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  const [isAI, setIsAI] = useState([false, true, true, true]); // Player 1 human by default

  const handleCountChange = (count) => {
    setPlayerCount(count);
  };

  const handleNameChange = (index, name) => {
    setPlayerNames(prev => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  };

  const toggleAI = (index) => {
    if (index === 0) return; // Player 1 always human
    setIsAI(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleStart = () => {
    const aiPlayers = [];
    for (let i = 0; i < playerCount; i++) {
      if (isAI[i]) aiPlayers.push(i + 1);
    }
    onStart({
      playerCount,
      playerNames: playerNames.slice(0, playerCount),
      aiPlayers,
    });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-auto"
      style={{ background: base.board }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(212, 168, 67, 0.06) 0%, transparent 60%)',
        }}
      />

      <motion.div
        className="relative w-full max-w-3xl mx-4 py-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${godColors.gold.primary})` }} />
            <span
              className="text-xs uppercase tracking-[0.3em] font-medium"
              style={{ color: godColors.gold.primary }}
            >
              A Game of Divine Favor
            </span>
            <div className="h-px w-12" style={{ background: `linear-gradient(90deg, ${godColors.gold.primary}, transparent)` }} />
          </div>

          <h1
            className="text-5xl font-bold tracking-tight"
            style={{
              color: base.textPrimary,
              textShadow: `0 0 40px ${godColors.gold.glow}`,
            }}
          >
            The Favored
          </h1>
          <p className="text-sm mt-2" style={{ color: base.textMuted }}>
            Worker Placement / Engine Building
          </p>
        </div>

        {/* Two-column layout: Setup left, Rules right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Setup panel */}
          <div
            className="rounded-xl p-6 space-y-6"
            style={{
              background: 'rgba(28, 25, 23, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Player count */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider font-medium mb-3"
                style={{ color: base.textMuted }}
              >
                Number of Players
              </label>
              <div className="flex gap-2">
                {[2, 3, 4].map(count => (
                  <button
                    key={count}
                    onClick={() => handleCountChange(count)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: playerCount === count
                        ? godColors.gold.primary
                        : 'rgba(255, 255, 255, 0.04)',
                      color: playerCount === count
                        ? base.textDark
                        : base.textSecondary,
                      border: `1px solid ${
                        playerCount === count
                          ? godColors.gold.primary
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                    }}
                  >
                    {count} Players
                  </button>
                ))}
              </div>
            </div>

            {/* Player names */}
            <div>
              <label
                className="block text-xs uppercase tracking-wider font-medium mb-3"
                style={{ color: base.textMuted }}
              >
                Player Names
              </label>
              <div className="space-y-2">
                {Array.from({ length: playerCount }, (_, i) => {
                  const colors = playerColors[i];
                  const ai = isAI[i];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <WorkerIcon playerId={i} size={22} />
                      <input
                        type="text"
                        value={playerNames[i]}
                        onChange={(e) => handleNameChange(i, e.target.value)}
                        className="flex-1 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors duration-150"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid rgba(255, 255, 255, 0.08)`,
                          color: colors.light,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.primary;
                          e.target.style.boxShadow = `0 0 12px ${colors.primary}20`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder={`Player ${i + 1}`}
                      />
                      <button
                        onClick={() => toggleAI(i)}
                        className="rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-150"
                        style={{
                          background: ai ? 'rgba(212, 168, 67, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${ai ? godColors.gold.border : 'rgba(255, 255, 255, 0.08)'}`,
                          color: ai ? godColors.gold.light : base.textMuted,
                          cursor: i === 0 ? 'not-allowed' : 'pointer',
                          opacity: i === 0 ? 0.3 : 1,
                          minWidth: '40px',
                        }}
                      >
                        {ai ? 'AI' : 'You'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start button */}
            <motion.button
              onClick={handleStart}
              className="w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wider"
              style={{
                background: `linear-gradient(135deg, ${godColors.gold.primary}, ${godColors.gold.dark})`,
                color: base.textDark,
                boxShadow: `0 4px 20px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
              whileHover={{ scale: 1.02, boxShadow: `0 6px 30px ${godColors.gold.glowStrong}` }}
              whileTap={{ scale: 0.97 }}
            >
              Begin Game
            </motion.button>

            {/* Multiplayer divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[10px] uppercase tracking-widest font-medium" style={{ color: base.textMuted }}>
                or play online
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Multiplayer buttons */}
            <div className="flex gap-2">
              <button
                onClick={onMultiplayer}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${godColors.gold.border}`,
                  color: godColors.gold.light,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = godColors.gold.surface;
                  e.currentTarget.style.boxShadow = `0 0 16px ${godColors.gold.glow}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Create Room
              </button>
              <button
                onClick={onJoinMultiplayer}
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: base.textSecondary,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Right: Rules panel */}
          <RulesPanel />
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Champion Draft Screen
// ============================================================================

function ChampionDraftScreen() {
  const { game, pendingDecision, actions, aiPlayers } = useGame();

  // Auto-draft for AI players
  React.useEffect(() => {
    if (!pendingDecision || pendingDecision.type !== 'championChoice') return;
    if (!aiPlayers || aiPlayers.size === 0) return;

    const draftPlayerId = pendingDecision.playerId;
    if (!aiPlayers.has(draftPlayerId)) return;

    const options = pendingDecision.options || [];
    if (options.length === 0) return;

    const timer = setTimeout(() => {
      const pick = options[Math.floor(Math.random() * options.length)];
      const champId = pick.id || pick;
      actions.draftChampion({ championId: champId });
    }, 300);

    return () => clearTimeout(timer);
  }, [pendingDecision, aiPlayers, actions]);

  if (!pendingDecision || pendingDecision.type !== 'championChoice') {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: base.board }}
      >
        <span style={{ color: base.textMuted }}>Setting up draft...</span>
      </div>
    );
  }

  const draftPlayerId = pendingDecision.playerId;
  const player = game?.players.find(p => p.id === draftPlayerId);
  const pColors = playerColors[draftPlayerId] || playerColors[0];
  const availableChampions = pendingDecision.options || [];

  // Don't show the full draft UI for AI players — just show a waiting state
  if (aiPlayers && aiPlayers.has(draftPlayerId)) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: base.board }}
      >
        <span style={{ color: base.textMuted }}>{player?.name || 'AI'} is choosing...</span>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-auto"
      style={{ background: base.board }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(212, 168, 67, 0.06) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-2xl mx-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${pColors.primary})` }} />
            <span
              className="text-xs uppercase tracking-[0.25em] font-medium"
              style={{ color: pColors.primary }}
            >
              Choose Your People
            </span>
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${pColors.primary}, transparent)` }} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <WorkerIcon playerId={draftPlayerId} size={24} />
            <h2
              className="text-2xl font-bold"
              style={{ color: pColors.light }}
            >
              {player?.name || 'Player'}, Choose Your People
            </h2>
          </div>
        </div>

        {/* People cards — options come as { id, name, passive, powerCardSlots } objects from the engine */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableChampions.map((champ, i) => {
            // Options from engine are already full objects with { id, name, passive, powerCardSlots }
            const champId = champ.id || champ;
            const champData = typeof champ === 'object' ? champ : champions.find(c => c.id === champ);
            if (!champData) return null;

            const isLastOdd = i === availableChampions.length - 1 && availableChampions.length % 2 !== 0;

            return (
              <motion.button
                key={champId}
                custom={i}
                variants={cardReveal}
                initial="initial"
                animate="animate"
                onClick={() => actions.draftChampion({ championId: champId })}
                className="text-left rounded-xl p-5 transition-all duration-200"
                style={{
                  background: 'rgba(28, 25, 23, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  ...(isLastOdd ? { gridColumn: '1 / -1', justifySelf: 'center', maxWidth: 'calc(50% - 6px)' } : {}),
                }}
                whileHover={{
                  borderColor: godColors.gold.border,
                  boxShadow: `0 0 20px ${godColors.gold.glow}`,
                  y: -2,
                  transition: { type: 'spring', stiffness: 400, damping: 20 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Champion icon + name header */}
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: godColors.gold.surface,
                      border: `1px solid ${godColors.gold.border}`,
                      boxShadow: `0 0 12px ${godColors.gold.glow}`,
                    }}
                  >
                    <ChampionIcon championId={champId} size={36} color={godColors.gold.light} />
                  </div>
                  <div>
                    <h3
                      className="text-base font-bold"
                      style={{ color: godColors.gold.light }}
                    >
                      {champData.name}
                    </h3>
                    <span
                      className="text-[10px] uppercase tracking-wider font-medium"
                      style={{ color: base.textMuted }}
                    >
                      {champData.powerCardSlots} Artifact Slots
                    </span>
                  </div>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: base.textSecondary }}
                >
                  {champData.passive}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Nullifier Placement Modal (Prescient passive)
// ============================================================================

function NullifierPlacementModal({ decision, onSubmit, onCancel }) {
  const { game } = useGame();
  if (!game) return null;

  const gods = game.gods || ['gold', 'black', 'green', 'yellow'];

  // Get all action IDs that aren't already nullified
  const allActions = [];
  for (const godColor of gods) {
    const god = godsData[godColor];
    if (!god) continue;
    for (const action of god.actions) {
      if (action.tier > game.round) continue; // locked
      if (game.nullifiedSpaces?.[action.id]) continue; // already nullified
      allActions.push({ ...action, godColor });
    }
  }

  return (
    <Modal isOpen={true} onClose={onCancel} title="Place Nullifier" godColor="gold" wide={true}>
      <p style={{ color: base.textSecondary, fontSize: '13px', marginBottom: '12px' }}>
        The Prescient: Choose an action space to nullify this round.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {allActions.map(action => {
          const colors = godColors[action.godColor];
          return (
            <button
              key={action.id}
              onClick={() => onSubmit({ actionId: action.id })}
              className="text-left rounded-lg transition-all"
              style={{
                padding: '8px 12px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: colors.primary, opacity: 0.8 }}>
                  {action.godColor.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: base.textPrimary }}>
                  {action.name}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: base.textMuted, marginTop: '2px' }}>
                {action.effect}
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

// ============================================================================
// Decision Modal Router
// ============================================================================

function DecisionModal() {
  const { pendingDecision, actions, phase, isMultiplayer, mySlot } = useGame();

  if (!pendingDecision) return null;

  // Don't render decision modals during champion draft (handled by ChampionDraftScreen)
  if (phase === 'champion_draft' && pendingDecision.type === 'championChoice') return null;

  // In multiplayer, only show decision modals for the correct player
  // Decisions use `playerId` or `_playerId` to identify the responsible player
  if (isMultiplayer) {
    const decisionOwner = pendingDecision.playerId ?? pendingDecision._playerId;
    if (decisionOwner !== undefined && decisionOwner !== mySlot) {
      return null; // WaitingOverlay handles "waiting for X to decide" in GameInner
    }
  }

  const handleCancel = () => actions.cancelDecision();

  switch (pendingDecision.type) {
    case 'gemSelection':
      return (
        <GemSelection
          decision={pendingDecision}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    case 'targetPlayer':
      return (
        <TargetPlayer
          decision={pendingDecision}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    case 'stealGems':
      return (
        <GemSelection
          decision={{
            ...pendingDecision,
            title: pendingDecision.title || `Choose ${pendingDecision.count} resources to steal`,
            _isSteal: true,
          }}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    case 'actionChoice':
    case 'actionChoices':
      return (
        <ActionChoice
          decision={pendingDecision}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    case 'redistribution':
    case 'redistributeResources':
      return (
        <GemSelection
          decision={{
            ...pendingDecision,
            type: 'gemSelection',
            count: pendingDecision.totalResources || 0,
          }}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    case 'nullifierPlacement':
      return (
        <NullifierPlacementModal
          decision={pendingDecision}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    case 'discardArtifact':
      return (
        <DiscardArtifact
          decision={pendingDecision}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    case 'chooseColor':
      return (
        <ChooseColor
          decision={pendingDecision}
          onSubmit={(answer) => actions.submitDecision(answer)}
          onCancel={handleCancel}
        />
      );

    default:
      // Generic decision fallback
      return (
        <Modal isOpen={true} title={pendingDecision.title || 'Decision Required'}>
          <p style={{ color: base.textSecondary }}>
            Unhandled decision type: {pendingDecision.type}
          </p>
          <pre
            className="mt-3 text-xs p-3 rounded-lg overflow-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              color: base.textMuted,
              maxHeight: '200px',
            }}
          >
            {JSON.stringify(pendingDecision, null, 2)}
          </pre>
        </Modal>
      );
  }
}

// ============================================================================
// Game Screen (main game view)
// ============================================================================

function GameScreen() {
  const { game, phase, actions, roundStartDecisionQueue, pendingDecision, aiPlayers, log, isMultiplayer, mySlot } = useGame();
  const surfaceTimerRef = useRef(null);
  const [showRulesOverlay, setShowRulesOverlay] = useState(false);

  // Game event detection for UI feedback — pass all events to narrator
  const events = useGameEvents();

  // AI auto-plays for non-human players (local mode only — host handles AI in multiplayer)
  useAITurns();

  // Surface buffered round-start decisions after a brief delay
  // so the player can see the board before the modal appears.
  // Wait until any active decision is resolved before surfacing the next.
  useEffect(() => {
    if (surfaceTimerRef.current) {
      clearTimeout(surfaceTimerRef.current);
      surfaceTimerRef.current = null;
    }

    if (roundStartDecisionQueue && roundStartDecisionQueue.length > 0 && !pendingDecision) {
      surfaceTimerRef.current = setTimeout(() => {
        actions.surfaceQueuedDecision();
        surfaceTimerRef.current = null;
      }, 600);
    }

    return () => {
      if (surfaceTimerRef.current) {
        clearTimeout(surfaceTimerRef.current);
      }
    };
  }, [roundStartDecisionQueue, pendingDecision, actions]);

  if (!game) return null;

  const activeGods = game.gods || ['gold', 'black', 'green', 'yellow'];

  return (
    <div
      className="relative w-full min-h-screen"
      style={{ background: base.board }}
    >
      {/* Top HUD bar — left: turn info, center: inline toast, right: round tracker */}
      <div className="sticky top-0 left-0 right-0 z-40 flex items-center px-4 py-2 gap-2"
        style={{ background: 'linear-gradient(to bottom, rgba(12,10,9,0.95) 60%, rgba(12,10,9,0))' }}
      >
        <div className="flex-shrink-0">
          <TurnIndicator />
        </div>

        {/* Inline narrative toast — fills remaining space */}
        <TurnAnnouncement
          narrativeEvents={events}
          players={game.players}
          aiPlayers={aiPlayers}
          currentPlayer={game.currentPlayer}
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          <RoundTracker />
          <button
            onClick={() => setShowRulesOverlay(true)}
            className="flex items-center justify-center rounded-full transition-all duration-200"
            style={{
              width: '28px', height: '28px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: base.textMuted,
              fontSize: '13px', fontWeight: 700,
            }}
            title="How to Play"
            onMouseEnter={e => { e.currentTarget.style.borderColor = godColors.gold.border; e.currentTarget.style.color = godColors.gold.light; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = base.textMuted; }}
          >
            ?
          </button>
        </div>
      </div>

      {/* Main board area */}
      <div className="pb-44">
        <GameBoard />
      </div>

      {/* Player panel (bottom) */}
      <PlayerPanel />

      {/* Decision modals (only for this player in multiplayer) */}
      <DecisionModal />

      {/* Waiting overlay when another player is deciding (multiplayer) */}
      {isMultiplayer && pendingDecision && (() => {
        const decisionOwner = pendingDecision.playerId ?? pendingDecision._playerId;
        if (decisionOwner !== undefined && decisionOwner !== mySlot) {
          const waitPlayer = game.players.find(p => p.id === decisionOwner);
          return <WaitingOverlay waitingFor={waitPlayer ? { name: waitPlayer.name, slot: waitPlayer.id } : null} type="decision" />;
        }
        return null;
      })()}

      {/* Round transition overlay (deferred until pending decisions like Voodoo Doll resolve) */}
      {phase === 'round_end' && !pendingDecision && (
        <RoundTransition
          round={game.round}
          players={game.players}
          activeGods={activeGods}
          gloryDeltas={game.lastRoundGloryDeltas}
          preRoundGlory={game.lastRoundPreGlory}
          onContinue={() => actions.advanceRound()}
        />
      )}

      {/* Game end overlay */}
      {phase === 'game_end' && !pendingDecision && (
        <RoundTransition
          round={3}
          players={game.players}
          gloryDeltas={game.lastRoundGloryDeltas}
          preRoundGlory={game.lastRoundPreGlory}
          activeGods={activeGods}
          log={log}
          onContinue={() => {
            clearSession();
            window.location.reload();
          }}
        />
      )}

      {/* In-game rules overlay */}
      {showRulesOverlay && (
        <RulesOverlay onDismiss={() => setShowRulesOverlay(false)} />
      )}
    </div>
  );
}

// ============================================================================
// App Inner (shared between local and multiplayer)
// ============================================================================

function GameInner({ isMultiplayer, multiplayerConfig, localConfig }) {
  const { initialized, phase, actions, game, pendingDecision, mySlot, isHost } = useGame();
  const initRef = useRef(false);

  // Local mode: auto-init from localConfig on mount
  useEffect(() => {
    if (!isMultiplayer && localConfig && !initialized && !initRef.current) {
      initRef.current = true;
      actions.initGame(localConfig);
    }
  }, [isMultiplayer, localConfig, initialized, actions]);

  // Multiplayer host: auto-init the game on mount
  useEffect(() => {
    if (isMultiplayer && isHost && !initialized && !initRef.current && multiplayerConfig) {
      initRef.current = true;
      actions.initGame({
        playerCount: multiplayerConfig.playerCount,
        playerNames: multiplayerConfig.playerNames,
        aiPlayers: [], // No AI in multiplayer (for now)
      });
    }
  }, [isMultiplayer, isHost, initialized, multiplayerConfig, actions]);

  // Waiting for game to initialize
  if (!initialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: base.board }}>
        <span style={{ color: base.textMuted }}>Setting up game...</span>
      </div>
    );
  }

  // Multiplayer: waiting for host to init the game
  if (isMultiplayer && !initialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: base.board }}>
        <span style={{ color: base.textMuted }}>Waiting for host to start...</span>
      </div>
    );
  }

  // Champion draft phase
  if (phase === 'champion_draft') {
    // In multiplayer, only show draft UI if it's this player's pick
    if (isMultiplayer && pendingDecision?.playerId !== mySlot) {
      const draftPlayer = game?.players.find(p => p.id === pendingDecision?.playerId);
      return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: base.board }}>
          <WaitingOverlay waitingFor={draftPlayer ? { name: draftPlayer.name, slot: draftPlayer.id } : null} type="decision" />
        </div>
      );
    }
    return <ChampionDraftScreen />;
  }

  // All other phases: full game screen
  // In multiplayer, show waiting overlay when it's not your turn
  return (
    <>
      <GameScreen />
      {isMultiplayer && game && game.currentPlayer !== mySlot && !pendingDecision && phase === 'action_phase' && (
        <WaitingOverlay
          waitingFor={{
            name: game.players.find(p => p.id === game.currentPlayer)?.name || 'Player',
            slot: game.currentPlayer,
          }}
          type="turn"
        />
      )}
    </>
  );
}

// ============================================================================
// App Root (mode selection + provider switching)
// ============================================================================

const SESSION_KEY = 'favored_mp_session';

function saveSession(roomCode, playerId) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function App() {
  const themeVars = getThemeCSSVars();
  const [appPhase, setAppPhase] = useState('setup'); // setup | lobby | lobby_join | local | multiplayer
  const [multiplayerConfig, setMultiplayerConfig] = useState(null);
  const [localConfig, setLocalConfig] = useState(null);

  // On mount: check sessionStorage for an active multiplayer session to rejoin
  useEffect(() => {
    const saved = loadSession();
    if (!saved) return;

    const { roomCode, playerId } = saved;

    (async () => {
      try {
        // Verify room still exists and isn't finished
        const snapshot = await get(ref(db, `v3rooms/${roomCode}`));
        if (!snapshot.exists()) {
          clearSession();
          return;
        }

        const room = snapshot.val();
        if (room.status === 'finished' || room.status === 'lobby') {
          clearSession();
          return;
        }

        // Verify this player is still in the room
        if (!room.players?.[playerId]) {
          clearSession();
          return;
        }

        // Restore presence
        await rejoinRoom(roomCode, playerId);

        // Rebuild multiplayer config from room data
        const playerEntries = Object.entries(room.players)
          .sort((a, b) => (a[1].slot ?? 0) - (b[1].slot ?? 0));

        const config = {
          roomCode,
          playerId,
          isHost: room.host === playerId,
          playerCount: playerEntries.length,
          playerNames: playerEntries.map(([, p]) => p.name),
          playerIds: playerEntries.map(([id]) => id),
          slotMap: Object.fromEntries(playerEntries.map(([id, p]) => [id, p.slot])),
        };

        setMultiplayerConfig(config);
        setAppPhase('multiplayer');
      } catch {
        clearSession();
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Setup: unified screen with game setup + rules alongside
  if (appPhase === 'setup') {
    return (
      <div style={themeVars}>
        <ResourceGradientDefs />
        <SetupScreen
          onStart={(config) => {
            setLocalConfig(config);
            setAppPhase('local');
          }}
          onMultiplayer={() => setAppPhase('lobby')}
          onJoinMultiplayer={() => setAppPhase('lobby_join')}
        />
      </div>
    );
  }

  // Lobby: multiplayer create/join (with back button to setup)
  if (appPhase === 'lobby' || appPhase === 'lobby_join') {
    return (
      <div style={themeVars}>
        <ResourceGradientDefs />
        <LobbyScreen
          initialView={appPhase === 'lobby_join' ? 'joining' : 'landing'}
          onStartLocal={() => setAppPhase('setup')}
          onStartMultiplayer={(config) => {
            saveSession(config.roomCode, config.playerId);
            setMultiplayerConfig(config);
            setAppPhase('multiplayer');
          }}
          onBack={() => setAppPhase('setup')}
        />
      </div>
    );
  }

  // Local mode: existing GameProvider flow
  if (appPhase === 'local' && localConfig) {
    return (
      <GameProvider>
        <div style={themeVars}>
          <ResourceGradientDefs />
          <GameInner isMultiplayer={false} localConfig={localConfig} />
        </div>
      </GameProvider>
    );
  }

  // Multiplayer mode: Host uses GameProvider + HostSync, Guest uses GuestProvider
  if (appPhase === 'multiplayer' && multiplayerConfig) {
    const { roomCode, playerId, isHost, slotMap } = multiplayerConfig;

    if (isHost) {
      return (
        <GameProvider>
          <HostSync roomCode={roomCode} playerId={playerId} slotMap={slotMap}>
            <div style={themeVars}>
              <ResourceGradientDefs />
              <GameInner isMultiplayer={true} multiplayerConfig={multiplayerConfig} />
            </div>
          </HostSync>
        </GameProvider>
      );
    }

    return (
      <GuestProvider roomCode={roomCode} playerId={playerId} slotMap={slotMap}>
        <div style={themeVars}>
          <ResourceGradientDefs />
          <GameInner isMultiplayer={true} multiplayerConfig={multiplayerConfig} />
        </div>
      </GuestProvider>
    );
  }

  return null;
}
