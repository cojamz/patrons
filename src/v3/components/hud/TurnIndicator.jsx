/**
 * TurnIndicator — Pure status badge, left-aligned.
 *
 * Shows: Round 1/3 · [WorkerIcon] P1 · Place (5)
 * Action narration is handled by PlacementToast in GodArea.
 * Watching status is handled by the Event Line.
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameState } from '../../hooks/useGame';
import WorkerIcon from '../icons/WorkerIcon';
import { playerColors, base } from '../../styles/theme';

const PHASE_LABELS = {
  champion_draft: 'Draft Phase',
  round_start: 'Round Starting...',
  action_phase: null,
  round_end: 'Round Complete',
  game_end: 'Game Over',
};

/** Returns { phase, label, isDecision } */
function getSubPhase(phase, pendingDecision, game) {
  if (pendingDecision) {
    switch (pendingDecision.type) {
      case 'targetPlayer':
        return { label: 'Choose Target', isDecision: true };
      case 'gemSelection':
        return { label: 'Select Blessings', isDecision: true };
      case 'stealGems':
        return { label: 'Choose Steal', isDecision: true };
      case 'actionChoice':
      case 'actionChoices':
        return { label: 'Choose Action', isDecision: true };
      case 'nullifierPlacement':
        return { label: 'Place Nullifier', isDecision: true };
      case 'redistribution':
      case 'redistributeResources':
        return { label: 'Redistribute', isDecision: true };
      default:
        return { label: pendingDecision.title || 'Decide', isDecision: true };
    }
  }

  if (phase === 'action_phase') {
    const wLeft = game?.players?.find(p => p.id === game.currentPlayer)?.workersLeft ?? 0;
    if (game?.workerPlacedThisTurn) {
      if (game?.purchaseMadeThisTurn) {
        return { phase: 'End Turn', label: null, isDecision: false };
      }
      return { phase: 'Buy Phase', label: null, isDecision: false };
    }
    if (wLeft > 0) {
      return { phase: 'Place a worker', label: `${wLeft} left`, isDecision: false };
    }
    return { phase: 'End Turn', label: null, isDecision: false };
  }
  return null;
}

export default function TurnIndicator() {
  const { game, phase, currentPlayer, pendingDecision } = useGameState();

  if (!game) return null;

  const player = currentPlayer;
  const colors = playerColors[player?.id] || playerColors[0];
  const subPhase = getSubPhase(phase, pendingDecision, game);
  const nonActionLabel = PHASE_LABELS[phase];
  const isActionPhase = phase === 'action_phase';

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {isActionPhase ? (
        <>
          {/* Round badge */}
          <span
            className="text-xs font-bold tracking-wider uppercase"
            style={{
              color: 'rgba(212, 168, 67, 0.8)',
              fontSize: '10px',
            }}
          >
            Round {game.round || 1}/3
          </span>
          <span style={{ color: base.textMuted, fontSize: '10px' }}>·</span>

          {/* Player worker icon */}
          <div
            className="flex-shrink-0 flex items-center justify-center worker-icon-glow"
            style={{ '--glow-color': colors.primary }}
          >
            <WorkerIcon playerId={player?.id ?? 0} size={18} />
          </div>

          {/* Player name */}
          <span
            className="text-xs font-bold tracking-wide uppercase whitespace-nowrap"
            style={{ color: colors.light }}
          >
            {player?.name || 'Player'}
          </span>

          {/* Turn phase + detail */}
          {subPhase && (
            <AnimatePresence mode="wait">
              <motion.span
                key={subPhase.phase || subPhase.label}
                className="text-xs whitespace-nowrap"
                style={{
                  color: subPhase.isDecision ? '#FBBF24' : base.textMuted,
                }}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                · {subPhase.isDecision ? subPhase.label : subPhase.phase}{subPhase.label && !subPhase.isDecision ? ` · ${subPhase.label}` : ''}
              </motion.span>
            </AnimatePresence>
          )}
        </>
      ) : (
        <span
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: base.textSecondary }}
        >
          {nonActionLabel || phase}
        </span>
      )}
    </div>
  );
}
