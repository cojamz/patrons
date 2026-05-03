/**
 * useAITurns — Auto-plays turns for AI-controlled players.
 *
 * When the current player is AI:
 *   - Action phase: picks a random available action, places worker, then ends turn
 *   - Decisions (gem selection, target player, etc.): makes a random valid choice
 *   - Round end: auto-advances if all players are AI
 *
 * Key design decisions:
 *   - Uses `game` as a dependency (not just `game?.currentPlayer`) so the effect
 *     re-fires even during snake turns where the same player goes twice in a row.
 *   - processingRef prevents double-entry during the place→endTurn sequence.
 *   - endTurn timer is cancelled when a pendingDecision appears mid-action.
 *   - processingRef is cleared after endTurn so the next turn can proceed.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useGame } from './useGame';
import godsData from '../../engine/v3/data/gods';
import { powerCards } from '../../engine/v3/data/powerCards';
import { getShopCost, canAfford } from '../../engine/v3/rules';
import { canAffordShop } from '../../engine/v3/shops/shopResolver';
import { heuristicActionPicker, heuristicDecisionFn } from '../../engine/v3/balanceAI';
import { getDecisionOwner } from '../lib/decisionOwner';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function useAITurns() {
  const {
    game, phase, currentPlayer, availableActions,
    pendingDecision, roundStartDecisionQueue, aiPlayers, actions,
  } = useGame();

  // Keep refs to the latest state so setTimeout callbacks never use stale closures.
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const gameRef = useRef(game);
  gameRef.current = game;

  const timerRef = useRef(null);
  const endTurnTimerRef = useRef(null);
  const processingRef = useRef(false);

  // Clear all pending timers
  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (endTurnTimerRef.current) { clearTimeout(endTurnTimerRef.current); endTurnTimerRef.current = null; }
  }, []);

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers]);

  // Main AI effect — uses `game` as dependency so it fires on every state change,
  // including snake turns where the same player goes again.
  useEffect(() => {
    if (!game || !aiPlayers || aiPlayers.size === 0) return;

    // Wait for round-start decisions (prescient nullifiers, fortunate resources)
    // to be surfaced and resolved before AI takes actions.
    // But allow AI to resolve a surfaced pendingDecision even while queue isn't empty.
    if (roundStartDecisionQueue && roundStartDecisionQueue.length > 0 && !pendingDecision) return;

    // Round end: auto-advance if all players are AI
    if (phase === 'round_end') {
      const allAI = game.players.every(p => aiPlayers.has(p.id));
      if (allAI) {
        clearTimers();
        timerRef.current = setTimeout(() => {
          actionsRef.current.advanceRound();
        }, 2500);
      }
      return;
    }

    const currentId = game.currentPlayer;

    // Handle pending decisions first — check if the decision's player is AI
    if (pendingDecision) {
      // Cancel any endTurn timer — decision must be resolved first
      if (endTurnTimerRef.current) {
        clearTimeout(endTurnTimerRef.current);
        endTurnTimerRef.current = null;
      }

      const decisionPlayerId = getDecisionOwner(pendingDecision, currentId);
      if (!aiPlayers.has(decisionPlayerId)) return;

      // Don't re-schedule if we already have a timer pending for this decision
      if (timerRef.current) return;

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        handleAIDecision(pendingDecision, game, actionsRef.current);
      }, 1500);
      return;
    }

    // Not AI's turn — skip
    if (!aiPlayers.has(currentId)) return;

    // Already processing a place→endTurn sequence.
    // If both timers are null, the endTurn timer was cancelled by a decision handler
    // and never rescheduled — we need to schedule endTurn now to unstick.
    if (processingRef.current) {
      if (!endTurnTimerRef.current && !timerRef.current) {
        endTurnTimerRef.current = setTimeout(() => {
          endTurnTimerRef.current = null;
          // Try to buy a shop/power card before ending turn
          // (same as the normal path — without this, actions with
          // pendingDecisions always skip the purchase window)
          const purchased = tryAIPurchase(gameRef.current, currentId, actionsRef);
          if (!purchased) {
            actionsRef.current.endTurn();
            processingRef.current = false;
          }
        }, 1200);
      }
      return;
    }

    // Action phase: place a worker then end turn
    if (phase === 'action_phase') {
      const player = game.players.find(p => p.id === currentId);
      const workersLeft = player?.workersLeft ?? 0;

      if (workersLeft > 0 && availableActions.length > 0) {
        processingRef.current = true;
        clearTimers();
        const actionId = heuristicActionPicker(game, currentId, availableActions) || pick(availableActions);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          actionsRef.current.placeWorker(actionId);

          // After placing, try to buy a shop/power card before ending turn.
          // If placeWorker creates a pendingDecision, the decision handler
          // will cancel this endTurnTimer and handle the decision first.
          endTurnTimerRef.current = setTimeout(() => {
            endTurnTimerRef.current = null;
            // Use gameRef.current for FRESH state (game closure is stale by now)
            const purchased = tryAIPurchase(gameRef.current, currentId, actionsRef);
            if (!purchased) {
              // No purchase attempted — end turn immediately
              actionsRef.current.endTurn();
              processingRef.current = false;
            }
            // If purchased, the purchase may trigger a pendingDecision
            // (e.g. gemSelection for 'any' costs, targetPlayer for black shops).
            // The decision handler at line ~73 will handle it, and the
            // "unstick" logic at line ~99 will schedule endTurn after all
            // decisions resolve.
          }, 1800);
        }, 2000);
      } else {
        // No workers or no available actions — end turn
        processingRef.current = true;
        clearTimers();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          actionsRef.current.endTurn();
          processingRef.current = false;
        }, 800);
      }
    }
  }, [game, phase, pendingDecision, roundStartDecisionQueue, availableActions, aiPlayers, actions, clearTimers]);
}

function handleAIDecision(decision, game, actions) {
  const currentPlayerId = getDecisionOwner(decision, game.currentPlayer);

  // Try MCTS heuristic first for supported decision types
  const mctsAnswer = tryHeuristicDecision(decision, game, currentPlayerId);
  if (mctsAnswer !== null) {
    // Unwrap MCTS return format → UI action format
    switch (decision.type) {
      case 'championChoice':
        actions.draftChampion(mctsAnswer);
        return;
      case 'gemSelection':
        actions.submitDecision(mctsAnswer.gemSelection);
        return;
      case 'targetPlayer':
        actions.submitDecision(mctsAnswer.targetPlayer);
        return;
      case 'stealGems':
        actions.submitDecision(mctsAnswer.stealGems);
        return;
      case 'actionChoice':
        actions.submitDecision(mctsAnswer.actionChoice);
        return;
      case 'actionChoices':
        actions.submitDecision(mctsAnswer.actionChoices);
        return;
      case 'nullifierPlacement':
        if (mctsAnswer.nullifierPlacement) {
          actions.submitDecision({ actionId: mctsAnswer.nullifierPlacement });
          return;
        }
        break; // fall through to random
      default:
        break;
    }
  }

  // Fall back to random logic for unsupported types or when MCTS returns null
  switch (decision.type) {
    case 'gemSelection': {
      const count = decision.count || 1;
      const allowedColors = decision.colors || game.gods || ['gold', 'black', 'green', 'yellow'];
      const title = (decision.title || '').toLowerCase();
      const isPayment = /trade|pay|spend|cost|convert/.test(title);

      let pickableColors = allowedColors;
      if (isPayment) {
        const player = game.players.find(p => p.id === currentPlayerId);
        if (player) {
          pickableColors = allowedColors.filter(c => (player.resources[c] || 0) > 0);
          if (pickableColors.length === 0) pickableColors = allowedColors;
        }
      }

      const result = {};
      for (let i = 0; i < count; i++) {
        if (isPayment) {
          const player = game.players.find(p => p.id === currentPlayerId);
          const available = pickableColors.filter(c => {
            const owned = (player?.resources[c] || 0);
            const alreadyPicked = result[c] || 0;
            return owned > alreadyPicked;
          });
          if (available.length > 0) {
            const color = pick(available);
            result[color] = (result[color] || 0) + 1;
          } else {
            break;
          }
        } else {
          const color = pick(pickableColors);
          result[color] = (result[color] || 0) + 1;
        }
      }
      actions.submitDecision(result);
      break;
    }

    case 'targetPlayer': {
      const options = decision.options || [];
      if (options.length > 0) {
        actions.submitDecision(pick(options));
      } else {
        const candidates = (game.players || []).filter(p => p.id !== game.currentPlayer);
        if (candidates.length > 0) {
          actions.submitDecision(pick(candidates).id);
        } else {
          actions.submitDecision(game.currentPlayer);
        }
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
      actions.submitDecision(result);
      break;
    }

    case 'actionChoice': {
      const choices = decision.options || [];
      if (choices.length > 0) {
        const choice = pick(choices);
        actions.submitDecision(typeof choice === 'object' ? choice.id : choice);
      } else {
        actions.submitDecision(null);
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

    case 'championChoice': {
      const options = decision.options || [];
      if (options.length > 0) {
        const choice = pick(options);
        actions.draftChampion({ championId: choice.id || choice });
      }
      break;
    }

    case 'nullifierPlacement': {
      const activeGods = game.gods || ['gold', 'black', 'green', 'yellow'];
      const round = game.round || 1;
      const nullified = game.nullifiedSpaces || {};
      const validActionIds = [];
      for (const godColor of activeGods) {
        const god = godsData[godColor];
        if (!god) continue;
        for (const action of god.actions) {
          if (action.tier <= round && !nullified[action.id]) {
            validActionIds.push(action.id);
          }
        }
      }
      if (validActionIds.length > 0) {
        actions.submitDecision({ actionId: pick(validActionIds) });
      } else {
        actions.submitDecision({ actionId: null });
      }
      break;
    }

    case 'discardArtifact': {
      const options = decision.options || [];
      if (options.length > 0) {
        actions.submitDecision(options[0].id);
      }
      break;
    }

    case 'chooseColor': {
      const options = decision.options || [];
      if (options.length > 0) {
        actions.submitDecision(pick(options));
      } else {
        actions.submitDecision(null);
      }
      break;
    }

    case 'turnOrderChoice': {
      const options = decision.options || [1];
      // AI prefers going first
      actions.submitDecision({ position: options[0] });
      break;
    }

    case 'redistributeResources': {
      const player = game.players.find(p => p.id === (decision.ownerId || currentPlayerId));
      if (!player) { actions.submitDecision({ redistribution: {} }); break; }

      const activeColors = game.gods || ['gold', 'black', 'green', 'yellow'];
      const totalResources = Object.values(player.resources).reduce((sum, v) => sum + v, 0);
      const redistribution = {};
      for (const color of activeColors) redistribution[color] = 0;

      for (let i = 0; i < totalResources; i++) {
        const color = pick(activeColors);
        redistribution[color] = (redistribution[color] || 0) + 1;
      }
      actions.submitDecision({ redistribution });
      break;
    }

    default:
      actions.submitDecision(null);
      break;
  }
}

/**
 * Try heuristic (MCTS) decision. Returns the MCTS answer object or null if
 * the decision type isn't handled or MCTS fails.
 */
function tryHeuristicDecision(decision, game, playerId) {
  try {
    // Types not handled by MCTS — skip immediately
    if (decision.type === 'redistributeResources' || decision.type === 'discardArtifact') {
      return null;
    }
    const answer = heuristicDecisionFn(game, playerId, decision);
    if (!answer) return null;
    return answer;
  } catch {
    return null;
  }
}

/**
 * Try to buy a shop OR power card for AI player.
 * 60% chance to attempt a purchase. Randomly picks from affordable options.
 * Returns true if a purchase was attempted, false otherwise.
 */
function tryAIPurchase(gameSnapshot, playerId, actionsRef) {
  const game = gameSnapshot;
  if (!game || game.purchaseMadeThisTurn) return false;

  // Hoard effect blocks all purchases this turn
  const player = game.players?.find(p => p.id === playerId);
  if (player?.effects?.includes('noShopThisTurn')) return false;

  // 85% chance to try buying
  if (Math.random() > 0.85) return false;

  const accessed = game.godsAccessedThisTurn || [];
  if (accessed.length === 0) return false;

  // Gather all affordable options
  const options = [];

  // Affordable power cards
  const champion = game.champions?.[playerId];
  const hasCardSlots = champion && (champion.powerCards?.length || 0) < (champion.powerCardSlots || 4);
  if (hasCardSlots) {
    for (const god of accessed) {
      for (const cardId of ((game.powerCardMarkets || {})[god] || [])) {
        const card = powerCards[cardId];
        if (card && canAfford(game, playerId, card.cost)) {
          options.push({ type: 'card', id: cardId });
        }
      }
    }
  }

  // Affordable shops
  for (const god of accessed) {
    const godData = godsData[god];
    if (!godData) continue;
    for (const shop of (godData.shops || [])) {
      if (shop.tier > (game.round || 1)) continue;
      const shopId = `${god}_${shop.type}`;
      if (canAffordShop(game, playerId, shopId)) {
        options.push({ type: 'shop', id: shopId });
      }
    }
  }

  if (options.length === 0) return false;

  // Prioritize cards over shops — cards are strategic investments
  const cards = options.filter(o => o.type === 'card');
  const choice = cards.length > 0 ? pick(cards) : pick(options);
  if (choice.type === 'card') {
    actionsRef.current.buyCard(choice.id);
  } else {
    actionsRef.current.useShop(choice.id);
  }
  return true;
}
