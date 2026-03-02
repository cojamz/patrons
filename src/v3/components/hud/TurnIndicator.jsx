/**
 * TurnIndicator — Single-line turn status, left-aligned.
 *
 * Shows: [WorkerIcon] Player 1's Turn · Place Patron (3 remaining)
 * Sub-phase updates: Place Patron → Buy Phase → Choose Target etc.
 * Turn order preview trails after.
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
        return { label: 'Redistribute', isDecision: true };
      default:
        return { label: pendingDecision.title || 'Decide', isDecision: true };
    }
  }

  if (phase === 'action_phase') {
    const wLeft = game?.players?.find(p => p.id === game.currentPlayer)?.workersLeft ?? 0;
    if (game?.workerPlacedThisTurn) {
      return { label: 'Buy Phase', isDecision: false };
    }
    if (wLeft > 0) {
      return { label: 'Place Patron', detail: `${wLeft} remaining`, isDecision: false };
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
    <div className="flex items-center gap-2 min-w-0">
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
            <WorkerIcon playerId={player?.id ?? 0} size={20} />
          </motion.div>

          {/* Player name */}
          <span
            className="text-sm font-bold tracking-wide uppercase whitespace-nowrap"
            style={{ color: colors.light }}
          >
            {player?.name || 'Player'}'s Turn
          </span>

          <span style={{ color: base.textMuted, opacity: 0.3 }}>·</span>

          {/* Sub-phase label */}
          {subPhase && (
            <AnimatePresence mode="wait">
              <motion.div
                key={subPhase.label}
                className="flex items-center gap-1.5 whitespace-nowrap"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: subPhase.isDecision ? '#FBBF24' : base.textPrimary,
                  }}
                >
                  {subPhase.label}
                </span>
                {subPhase.detail && (
                  <span
                    className="text-xs"
                    style={{ color: base.textMuted }}
                  >
                    ({subPhase.detail})
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Turn order preview */}
          {game.turnOrder && game.turnOrder.length > 1 && (
            <TurnOrderPreview game={game} />
          )}
        </>
      ) : (
        <span
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: base.textSecondary }}
        >
          {nonActionLabel || phase}
        </span>
      )}
    </div>
  );
}

function TurnOrderPreview({ game }) {
  const order = game.turnOrder;
  const currentIdx = order.indexOf(game.currentPlayer);
  let dir = game.turnDirection || 1;
  const upcoming = [];

  let idx = currentIdx;
  for (let i = 0; i < 10 && upcoming.length < 3; i++) {
    let nextIdx = idx + dir;
    if (nextIdx >= order.length) { dir = -1; nextIdx = order.length - 2; }
    else if (nextIdx < 0) { dir = 1; nextIdx = 1; }
    if (nextIdx >= 0 && nextIdx < order.length && order[nextIdx] !== (upcoming.length > 0 ? upcoming[upcoming.length - 1] : game.currentPlayer)) {
      upcoming.push(order[nextIdx]);
    }
    idx = nextIdx < 0 ? 0 : nextIdx >= order.length ? order.length - 1 : nextIdx;
  }

  if (upcoming.length === 0) return null;

  return (
    <>
      <div className="w-px h-3.5 mx-1.5 flex-shrink-0" style={{ background: base.divider }} />
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <span
          className="text-[9px] uppercase tracking-wider font-medium mr-0.5"
          style={{ color: base.textMuted }}
        >
          Next
        </span>
        {upcoming.map((pid, i) => {
          const p = game.players.find(pp => pp.id === pid);
          const outOfWorkers = p && p.workersLeft <= 0;
          return (
            <div
              key={`${pid}-${i}`}
              className="flex items-center"
              style={{ opacity: outOfWorkers ? 0.2 : 0.6 - (i * 0.12) }}
              title={`${p?.name || `Player ${pid}`}${outOfWorkers ? ' (done)' : ''}`}
            >
              <WorkerIcon playerId={pid} size={14} />
              {i < upcoming.length - 1 && (
                <span style={{ fontSize: '7px', color: base.textMuted, opacity: 0.3, margin: '0 1px' }}>›</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
