/**
 * useAITurns — Auto-plays turns for AI-controlled players.
 *
 * When the current player is AI:
 *   - Action phase: picks a random available action, places worker, then ends turn
 *   - Decisions (gem selection, target player, etc.): makes a random valid choice
 *
 * Uses a small delay (400ms) so the human can see what's happening.
 * Atomic: places one worker then immediately schedules endTurn.
 * A processingRef guard prevents re-entry during the place→endTurn sequence.
 */
import { useEffect, useRef } from 'react';
import { useGame } from './useGame';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function useAITurns() {
  const {
    game, phase, currentPlayer, availableActions,
    pendingDecision, aiPlayers, actions,
  } = useGame();

  const timerRef = useRef(null);
  const endTurnTimerRef = useRef(null);
  const processingRef = useRef(false);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (endTurnTimerRef.current) clearTimeout(endTurnTimerRef.current);
    };
  }, []);

  // Reset processing flag when player changes
  useEffect(() => {
    processingRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (endTurnTimerRef.current) clearTimeout(endTurnTimerRef.current);
  }, [game?.currentPlayer]);

  useEffect(() => {
    if (!game || !aiPlayers || aiPlayers.size === 0) return;

    const currentId = game.currentPlayer;
    if (!aiPlayers.has(currentId)) return;
    if (processingRef.current) return;

    // Handle pending decisions first
    if (pendingDecision) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleAIDecision(pendingDecision, game, actions);
      }, 400);
      return;
    }

    // Action phase: place a worker then end turn
    if (phase === 'action_phase') {
      const player = game.players.find(p => p.id === currentId);
      const workersLeft = player?.workersLeft ?? 0;

      if (workersLeft > 0 && availableActions.length > 0) {
        processingRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          const actionId = pick(availableActions);
          actions.placeWorker(actionId);

          // Schedule endTurn after state settles
          endTurnTimerRef.current = setTimeout(() => {
            actions.endTurn();
            // processingRef resets via the currentPlayer change effect
          }, 500);
        }, 450);
      } else {
        // No workers or no available actions — end turn
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          actions.endTurn();
        }, 300);
      }
    }
  }, [game?.currentPlayer, phase, pendingDecision?.type]);
}

function handleAIDecision(decision, game, actions) {
  switch (decision.type) {
    case 'gemSelection': {
      const count = decision.count || 1;
      const allowedColors = decision.colors || game.gods || ['gold', 'black', 'green', 'yellow'];
      const selected = [];
      for (let i = 0; i < count; i++) {
        selected.push(pick(allowedColors));
      }
      actions.submitDecision(selected);
      break;
    }

    case 'targetPlayer': {
      const candidates = (game.players || []).filter(p => p.id !== game.currentPlayer);
      if (candidates.length > 0) {
        actions.submitDecision(pick(candidates).id);
      } else {
        actions.cancelDecision();
      }
      break;
    }

    case 'stealGems': {
      const count = decision.count || 2;
      const targetRes = decision.targetResources || {};
      const available = Object.entries(targetRes).filter(([, v]) => v > 0);
      const result = {};
      let remaining = count;
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      for (const [color, amount] of shuffled) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, amount);
        result[color] = take;
        remaining -= take;
      }
      if (remaining <= 0) {
        actions.submitDecision(result);
      } else {
        actions.cancelDecision();
      }
      break;
    }

    case 'actionChoice': {
      const choices = decision.options || [];
      if (choices.length > 0) {
        const choice = pick(choices);
        actions.submitDecision(typeof choice === 'object' ? choice.id : choice);
      } else {
        actions.cancelDecision();
      }
      break;
    }

    case 'actionChoices': {
      const choices = decision.options || [];
      const count = decision.count || 1;
      const shuffled = [...choices].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count).map(c => typeof c === 'object' ? c.id : c);
      actions.submitDecision(selected);
      break;
    }

    case 'nullifierPlacement': {
      // AI just cancels nullifier placement for now
      actions.cancelDecision();
      break;
    }

    default:
      actions.cancelDecision();
      break;
  }
}
