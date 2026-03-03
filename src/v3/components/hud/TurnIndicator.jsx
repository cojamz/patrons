/**
 * TurnIndicator — Compact turn status badge, left-aligned.
 *
 * Shows: [WorkerIcon] P1 · Place (5)
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../hooks/useGame';
import WorkerIcon from '../icons/WorkerIcon';
import { playerColors, base } from '../../styles/theme';

const PHASE_LABELS = {
  champion_draft: 'Draft Phase',
  round_start: 'Round Starting...',
  action_phase: null,
  round_end: 'Round Complete',
  game_end: 'Game Over',
};

/** Returns { label, detail?, isDecision } */
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
        return { label: 'End Turn', isDecision: false };
      }
      return { label: 'Buy or End Turn', isDecision: false };
    }
    if (wLeft > 0) {
      return { label: `${wLeft} worker${wLeft > 1 ? 's' : ''} left`, isDecision: false };
    }
    return { label: 'End Turn', isDecision: false };
  }
  return null;
}

export default function TurnIndicator() {
  const { game, phase, currentPlayer, pendingDecision } = useGame();

  if (!game) return null;

  const player = currentPlayer;
  const colors = playerColors[player?.id] || playerColors[0];
  const isActionPhase = phase === 'action_phase';
  const subPhase = getSubPhase(phase, pendingDecision, game);
  const nonActionLabel = PHASE_LABELS[phase];

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {isActionPhase ? (
        <>
          {/* Player worker icon */}
          <motion.div
            className="flex-shrink-0 flex items-center justify-center"
            animate={{
              filter: [
                `drop-shadow(0 0 2px ${colors.primary})`,
                `drop-shadow(0 0 6px ${colors.primary})`,
                `drop-shadow(0 0 2px ${colors.primary})`,
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <WorkerIcon playerId={player?.id ?? 0} size={18} />
          </motion.div>

          {/* Player name */}
          <span
            className="text-xs font-bold tracking-wide uppercase whitespace-nowrap"
            style={{ color: colors.light }}
          >
            {player?.name || 'Player'}
          </span>

          {/* Sub-phase label */}
          {subPhase && (
            <AnimatePresence mode="wait">
              <motion.span
                key={subPhase.label}
                className="text-xs whitespace-nowrap"
                style={{
                  color: subPhase.isDecision ? '#FBBF24' : base.textMuted,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                · {subPhase.label}{subPhase.detail ? ` (${subPhase.detail})` : ''}
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
