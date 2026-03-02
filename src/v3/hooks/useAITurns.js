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
import { getShopCost } from '../../engine/v3/rules';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function useAITurns() {
  const {
    game, phase, currentPlayer, availableActions,
    pendingDecision, roundStartDecisionQueue, aiPlayers, actions,
  } = useGame();

  // Keep a ref to the latest actions so setTimeout callbacks never use stale closures.
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

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
    // to be surfaced and resolved before AI takes actions
    if (roundStartDecisionQueue && roundStartDecisionQueue.length > 0) return;

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

      const decisionPlayerId = pendingDecision.playerId || pendingDecision.ownerId || currentId;
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
          actionsRef.current.endTurn();
          processingRef.current = false;
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
        const actionId = pick(availableActions);
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          actionsRef.current.placeWorker(actionId);

          // After placing, try to buy a power card before ending turn.
          // Schedule endTurn after a delay to allow decision handling.
          // If placeWorker creates a pendingDecision, the decision handler
          // will cancel this timer and handle the decision first.
          endTurnTimerRef.current = setTimeout(() => {
            endTurnTimerRef.current = null;
            // Try to buy a shop or power card from the god we just accessed
            tryAIPurchase(game, currentId, actionsRef);
            // End turn after card purchase settles
            setTimeout(() => {
              actionsRef.current.endTurn();
              processingRef.current = false;
            }, 1000);
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
  const currentPlayerId = decision.playerId || decision.ownerId || game.currentPlayer;

  switch (decision.type) {
    case 'gemSelection': {
      const count = decision.count || 1;
      const allowedColors = decision.colors || game.gods || ['gold', 'black', 'green', 'yellow'];
      const title = (decision.title || '').toLowerCase();
      const isPayment = /trade|pay|spend|cost|convert/.test(title);

      // For payment decisions, only pick from colors the player actually has
      let pickableColors = allowedColors;
      if (isPayment) {
        const player = game.players.find(p => p.id === currentPlayerId);
        if (player) {
          pickableColors = allowedColors.filter(c => (player.resources[c] || 0) > 0);
          if (pickableColors.length === 0) pickableColors = allowedColors; // fallback
        }
      }

      const result = {};
      for (let i = 0; i < count; i++) {
        if (isPayment) {
          // For payments, respect actual resource amounts
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
            // Can't pay full amount — submit what we have
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
      // Use decision.options (valid target IDs) when available
      const options = decision.options || [];
      if (options.length > 0) {
        actions.submitDecision(pick(options));
      } else {
        // Fallback: pick from all other players
        const candidates = (game.players || []).filter(p => p.id !== game.currentPlayer);
        if (candidates.length > 0) {
          actions.submitDecision(pick(candidates).id);
        } else {
          // No valid targets — submit self as fallback (never cancel)
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
      // Always submit what's available, even if partial (never cancel)
      actions.submitDecision(result);
      break;
    }

    case 'actionChoice': {
      const choices = decision.options || [];
      if (choices.length > 0) {
        const choice = pick(choices);
        actions.submitDecision(typeof choice === 'object' ? choice.id : choice);
      } else {
        // No options — submit null (never cancel)
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
      // AI picks a random action to nullify
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

    case 'redistributeResources': {
      // Alchemist's Trunk: randomly redistribute total resources across active colors
      const player = game.players.find(p => p.id === (decision.ownerId || currentPlayerId));
      if (!player) { actions.submitDecision({ redistribution: {} }); break; }

      const activeColors = game.gods || ['gold', 'black', 'green', 'yellow'];
      const totalResources = Object.values(player.resources).reduce((sum, v) => sum + v, 0);
      const redistribution = {};
      for (const color of activeColors) redistribution[color] = 0;

      // Randomly distribute total across active colors
      for (let i = 0; i < totalResources; i++) {
        const color = pick(activeColors);
        redistribution[color] = (redistribution[color] || 0) + 1;
      }
      actions.submitDecision({ redistribution });
      break;
    }

    default:
      // Never cancel — submit empty/null as best effort
      actions.submitDecision(null);
      break;
  }
}

/**
 * Check if AI can afford a cost object given their resources.
 * Returns { affordable: bool, totalCost: number } for comparison.
 */
function checkAffordable(playerResources, cost) {
  let specificCost = 0;
  let anyCost = 0;
  for (const [resource, amount] of Object.entries(cost)) {
    if (resource === 'any') {
      anyCost += amount;
    } else {
      if ((playerResources[resource] || 0) < amount) return { affordable: false, totalCost: 0 };
      specificCost += amount;
    }
  }
  const totalHave = Object.values(playerResources).reduce((s, v) => s + Math.max(0, v), 0);
  if (totalHave - specificCost < anyCost) return { affordable: false, totalCost: 0 };
  return { affordable: true, totalCost: specificCost + anyCost };
}

/**
 * Try to buy a shop OR power card for AI player.
 * Evaluates all affordable options from gods accessed this turn,
 * then picks the best one (favor shops > power cards > resource shops).
 */
function tryAIPurchase(gameSnapshot, playerId, actionsRef) {
  const game = gameSnapshot;
  if (!game || game.purchaseMadeThisTurn) return;

  const player = game.players?.find(p => p.id === playerId);
  if (!player) return;

  const godsAccessed = game.godsAccessedThisTurn || [];
  if (godsAccessed.length === 0) return;
  const playerResources = player.resources || {};

  // Collect all affordable options: { type: 'shop'|'card', id, priority }
  const options = [];

  for (const godColor of godsAccessed) {
    const godDef = godsData[godColor];
    if (!godDef) continue;

    // Check shops
    for (const shop of godDef.shops) {
      const shopId = `${godColor}_${shop.type}`;
      const isLocked = shop.type === 'strong' && (game.round || 1) < 2;
      if (isLocked) continue;

      const modifiedCost = getShopCost(game, playerId, shopId);
      const cost = modifiedCost || shop.cost;
      const { affordable } = checkAffordable(playerResources, cost);
      if (!affordable) continue;

      let priority = 1;
      if (shop.type === 'vp') priority = 5;
      else if (shop.type === 'strong') priority = 5;
      else priority = 3;

      options.push({ type: 'shop', id: shopId, priority });
    }

    // Check power cards
    const champion = game.champions?.[playerId];
    if (champion) {
      const currentCards = champion.powerCards || [];
      if (currentCards.length < champion.powerCardSlots) {
        const market = (game.powerCardMarkets || {})[godColor] || [];
        for (const cardId of market) {
          if (!cardId) continue;
          const card = powerCards[cardId];
          if (!card || !card.cost) continue;

          const { affordable } = checkAffordable(playerResources, card.cost);
          if (!affordable) continue;

          // Power cards are generally high priority (permanent benefits)
          options.push({ type: 'card', id: cardId, priority: 7 });
        }
      }
    }
  }

  if (options.length === 0) return;

  // Sort by priority descending, pick the best
  options.sort((a, b) => b.priority - a.priority);
  const best = options[0];

  if (best.type === 'card') {
    actionsRef.current.buyCard(best.id);
  } else {
    actionsRef.current.useShop(best.id);
  }
}
