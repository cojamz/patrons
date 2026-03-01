/**
 * Patrons v3 — Balance AI (Heuristic)
 *
 * Smarter-than-random AI for balance testing. Uses position evaluation
 * and lookahead to make reasonable game decisions.
 *
 * Not meant to be optimal -- just good enough to expose balance issues
 * that random play would miss (e.g., dominant strategies, dead cards).
 */

import { getPlayer, getOtherPlayers, canAccessGod } from './stateHelpers.js';
import { getAvailableActions, getActionGod, canAfford, getShopDef, getShopCost } from './rules.js';
import { routeAction } from './actions/index.js';
import { canAffordShop } from './shops/shopResolver.js';
import gods from './data/gods.js';
import champions from './data/champions.js';
import { powerCards } from './data/powerCards.js';

// ---------------------------------------------------------------------------
// Position Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate game position from a player's perspective.
 * Returns a numeric score -- higher is better.
 */
export function evaluatePosition(state, playerId) {
  const player = getPlayer(state, playerId);
  if (!player) return 0;

  let score = 0;

  // 1. Current glory (weight: 10)
  score += (player.glory || 0) * 10;

  // 2. Total resources (weight: 1 per resource)
  const resources = player.resources || {};
  const totalResources = Object.values(resources).reduce((sum, v) => sum + Math.max(0, v), 0);
  score += totalResources;

  // 3. Gold count (extra weight due to Gold glory condition)
  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
  if (activeGods.includes('gold')) {
    score += (resources.gold || 0) * 2;
  }

  // 4. Resource diversity (weight: 2 per color with >0)
  const colorsOwned = Object.entries(resources).filter(([, amt]) => amt > 0).length;
  score += colorsOwned * 2;

  // 5. Power cards owned (weight: 5 per card)
  const champion = state.champions?.[playerId];
  const cardCount = champion?.powerCards?.length || 0;
  score += cardCount * 5;

  // 6. Workers remaining (more valuable early)
  const round = state.round || 1;
  const workerWeight = round <= 2 ? 2 : 1;
  score += (player.workersLeft || 0) * workerWeight;

  // 7. Relative position vs opponents (weight: 1 per glory ahead of average)
  const others = getOtherPlayers(state, playerId);
  if (others.length > 0) {
    const avgGlory = others.reduce((sum, p) => sum + (p.glory || 0), 0) / others.length;
    score += ((player.glory || 0) - avgGlory);
  }

  return score;
}

// ---------------------------------------------------------------------------
// Action Picking
// ---------------------------------------------------------------------------

/**
 * Pick the best action using position evaluation.
 * Simulates each action and picks the one with the highest evaluated score.
 */
export function heuristicActionPicker(state, playerId, availableActions) {
  if (!availableActions || availableActions.length === 0) return null;
  if (availableActions.length === 1) return availableActions[0];

  let bestAction = availableActions[0];
  let bestScore = -Infinity;

  for (const actionId of availableActions) {
    try {
      // Simulate executing the action
      const result = routeAction(state, playerId, actionId, state.gods);
      let simState = result.state;

      // If there's a pending decision, use a quick random resolution
      // (we don't want to recurse deeply for evaluation)
      if (result.pendingDecision) {
        // Use the pre-action state for scoring instead of trying to resolve
        simState = state;
      }

      const score = evaluatePosition(simState, playerId) + (Math.random() * 0.5);

      if (score > bestScore) {
        bestScore = score;
        bestAction = actionId;
      }
    } catch {
      // If simulation fails, just give it a low score
      continue;
    }
  }

  return bestAction;
}

// ---------------------------------------------------------------------------
// Shop Decisions
// ---------------------------------------------------------------------------

/**
 * Decide whether to use a shop and which one.
 * Returns shopId or null.
 */
export function heuristicShopDecision(state, playerId) {
  const accessed = state.godsAccessedThisTurn || [];
  if (accessed.length === 0) return null;

  const player = getPlayer(state, playerId);
  if (!player) return null;

  let bestShop = null;
  let bestValue = 0;

  for (const godColor of accessed) {
    const shopTypes = ['weak', 'strong', 'vp'];
    for (const shopType of shopTypes) {
      const shopId = `${godColor}_${shopType}`;

      if (!canAffordShop(state, playerId, shopId)) continue;

      // Estimate benefit value
      const value = estimateShopValue(state, playerId, shopId);
      if (value > bestValue) {
        bestValue = value;
        bestShop = shopId;
      }
    }
  }

  // Only use shop if the estimated value is worth it
  return bestValue > 2 ? bestShop : null;
}

/**
 * Estimate the value of a shop benefit for heuristic evaluation.
 */
function estimateShopValue(state, playerId, shopId) {
  const [color, type] = shopId.split('_');
  const round = state.round || 1;
  const player = getPlayer(state, playerId);

  switch (shopId) {
    // Gold shops
    case 'gold_weak': return 3; // +2 gold is decent
    case 'gold_strong': return (player.resources?.gold || 0) > 3 ? 8 : 2; // doubling is great with lots of gold
    case 'gold_vp': return 8; // +4 glory is always good

    // Black shops
    case 'black_weak': return 3; // steal 1 glory
    case 'black_strong': return 6; // steal 3 glory
    case 'black_vp': return 7; // steal 2 from each, scales with players

    // Green shops
    case 'green_weak': return 4; // repeat action
    case 'green_strong': return 5; // copy action
    case 'green_vp': return 9; // +4 glory + extra turn

    // Yellow shops
    case 'yellow_weak': return 3; // double next gain
    case 'yellow_strong': {
      // Trigger glory condition: value depends on diversity
      const colorsOwned = Object.entries(player.resources || {})
        .filter(([, amt]) => amt > 0).length;
      return colorsOwned * 2;
    }
    case 'yellow_vp': {
      // Complete sets
      const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
      const completeSets = Math.min(
        ...activeGods.map(c => (player.resources?.[c] || 0))
      );
      return completeSets > 0 ? completeSets * 3 : 0;
    }

    default: return 1;
  }
}

// ---------------------------------------------------------------------------
// Card Decisions
// ---------------------------------------------------------------------------

/**
 * Decide whether to buy a power card.
 * Returns cardId or null.
 */
export function heuristicCardDecision(state, playerId) {
  const accessed = state.godsAccessedThisTurn || [];
  if (accessed.length === 0) return null;

  const player = getPlayer(state, playerId);
  if (!player) return null;

  // Check if player has an empty card slot
  const champion = (state.champions || {})[playerId];
  if (!champion) return null;
  const currentCards = champion.powerCards || [];
  if (currentCards.length >= (champion.powerCardSlots || 4)) return null;

  let bestCard = null;
  let bestValue = 3; // minimum threshold — only buy if value > 3

  for (const godColor of accessed) {
    const market = (state.powerCardMarkets || {})[godColor] || [];

    for (const cardId of market) {
      const card = powerCards[cardId];
      if (!card) continue;

      // Check affordability
      if (!canAfford(state, playerId, card.cost)) continue;

      const value = estimateCardValue(state, playerId, cardId, card);
      if (value > bestValue) {
        bestValue = value;
        bestCard = cardId;
      }
    }
  }

  return bestCard;
}

/**
 * Estimate the value of a power card for heuristic AI.
 */
function estimateCardValue(state, playerId, cardId, card) {
  const round = state.round || 1;
  const remainingRounds = 3 - round + 1;
  const player = getPlayer(state, playerId);
  const resources = player?.resources || {};

  switch (cardId) {
    // --- Gold cards ---
    case 'golden_scepter':
      // +1 on every gold gain — value scales with gold-focused play
      return (resources.gold || 0) > 2 ? 7 : 4;
    case 'gold_idol':
      // +2 gold per round — more valuable early
      return 3 + remainingRounds * 2;
    case 'golden_chalice':
      // +1 any on gold gain from actions — moderate
      return 5;
    case 'golden_ring':
      // +1 gold when others gain gold — depends on opponents
      return 4;
    case 'gold_crown':
      // End-game: +1 Glory per 2 gold — valuable if hoarding gold
      return Math.floor((resources.gold || 0) / 2) + 3;
    case 'gold_vault':
      // Steal immunity — valuable against black-heavy opponents
      return state.gods.includes('black') ? 5 : 2;

    // --- Black cards ---
    case 'onyx_spyglass':
      // +1 black when others buy cards — situational
      return 3;
    case 'voodoo_doll':
      // -2 Glory to chosen player each round — strong disruption
      return 4 + remainingRounds * 2;
    case 'thieves_gloves':
      // +1 any on steal actions — good for aggressive play
      return 5;
    case 'tome_of_deeds':
      // Glory steal immunity — strong defensive
      return state.gods.includes('black') ? 6 : 3;
    case 'obsidian_coin':
      // Wildcard black — helps afford black cards/shops
      return 4;
    case 'cursed_blade':
      // +1 extra on glory steals — snowball potential
      return 5;

    // --- Green cards ---
    case 'hourglass':
      // Ignore occupied — extremely powerful, but expensive
      return 8;
    case 'capacitor':
      // +1 green on repeat — good if using green actions
      return 4;
    case 'crystal_watch':
      // +3 green per round — great economy
      return 3 + remainingRounds * 2;
    case 'diadem_of_expertise':
      // Double glory on repeats — strong for green strategies
      return 6;
    case 'crystal_ball':
      // Repeat from unoccupied — solid flexibility
      return 5;
    case 'emerald_coin':
      // Wildcard green
      return 4;

    // --- Yellow cards ---
    case 'horn_of_plenty':
      // +1 of each color per round — premium economy card
      return 4 + remainingRounds * state.gods.length;
    case 'prismatic_gem':
      // Wildcard yellow
      return 4;
    case 'rainbow_crest':
      // +1 on multi-color gains — synergizes with yellow play
      return 4;
    case 'alchemists_trunk':
      // Redistribute resources — good for flexibility
      return 4;
    case 'abundance_charm':
      // +1 on basic gains — solid passive income
      return 5;
    case 'travelers_journal':
      // +1 Glory on multi-color turn — consistent Glory source
      return 3 + remainingRounds;

    default:
      return 3;
  }
}

// ---------------------------------------------------------------------------
// Heuristic Decision Function
// ---------------------------------------------------------------------------

/**
 * Heuristic decision function for game decisions.
 * Makes smarter-than-random choices for targets, gem selection, etc.
 */
export function heuristicDecisionFn(state, playerId, pendingDecision) {
  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];

  switch (pendingDecision.type) {
    case 'championChoice': {
      return pickChampion(state, playerId, pendingDecision);
    }

    case 'gemSelection': {
      return pickGems(state, playerId, pendingDecision, activeColors);
    }

    case 'targetPlayer': {
      return pickTarget(state, playerId, pendingDecision);
    }

    case 'actionChoice': {
      return pickActionChoice(state, playerId, pendingDecision);
    }

    case 'actionChoices': {
      const options = pendingDecision.options || [];
      const count = pendingDecision.count || 1;
      // Pick highest-value actions
      const scored = options.map(actionId => ({
        actionId,
        score: scoreRepeatAction(state, playerId, actionId) + Math.random() * 0.3,
      }));
      scored.sort((a, b) => b.score - a.score);
      return { actionChoices: scored.slice(0, count).map(s => s.actionId) };
    }

    case 'stealGems': {
      return pickStealGems(state, playerId, pendingDecision);
    }

    case 'nullifierPlacement': {
      const options = pendingDecision.options || [];
      if (options.length === 0) return { nullifierPlacement: null };
      // Nullify high-value actions (tier 2-3 preferred)
      const pick = options[Math.floor(Math.random() * options.length)];
      return { nullifierPlacement: typeof pick === 'string' ? pick : pick.id };
    }

    case 'redistribute': {
      return pickRedistribution(state, playerId, pendingDecision, activeColors);
    }

    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Decision Helpers
// ---------------------------------------------------------------------------

function pickChampion(state, playerId, decision) {
  const options = decision.options || [];
  if (options.length === 0) return { championId: null };

  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];

  // Score each champion based on synergy with active gods
  const scored = options.map(champ => {
    let score = 5; // baseline

    switch (champ.id) {
      case 'deft':
        // Extra action per round is always solid
        score += 3;
        break;
      case 'ambitious':
        // Extra power card slot: better when cards are affordable
        score += 2;
        break;
      case 'fortunate':
        // Starting resources: good for early tempo
        score += 2;
        break;
      case 'favored':
        // Shop bonus: better with expensive shops
        score += activeGods.includes('gold') ? 2 : 1;
        break;
      case 'blessed':
        // First card discount: solid early-game value
        score += 2;
        break;
      case 'prescient':
        // Nullifiers: good for denial
        score += 1;
        break;
    }

    return { id: champ.id, score: score + Math.random() * 1.5 };
  });

  scored.sort((a, b) => b.score - a.score);
  return { championId: scored[0].id };
}

function pickGems(state, playerId, decision, activeColors) {
  const count = decision.count || 1;
  const player = getPlayer(state, playerId);
  const resources = player?.resources || {};

  // Strategy: maximize diversity (good for Yellow glory condition)
  // Fill colors we have the least of first
  const colorCounts = activeColors.map(c => ({
    color: c,
    count: resources[c] || 0,
  }));
  colorCounts.sort((a, b) => a.count - b.count);

  const selection = {};
  let remaining = count;

  // Distribute to lowest-count colors first
  for (const { color } of colorCounts) {
    if (remaining <= 0) break;
    selection[color] = (selection[color] || 0) + 1;
    remaining--;
  }

  // If we still need more, cycle through
  while (remaining > 0) {
    const color = colorCounts[remaining % colorCounts.length].color;
    selection[color] = (selection[color] || 0) + 1;
    remaining--;
  }

  return { gemSelection: selection };
}

function pickTarget(state, playerId, decision) {
  const others = state.players.filter(
    p => p.id !== (decision.excludePlayer || playerId)
  );
  if (others.length === 0) return { targetPlayer: null };

  // Target the player with the most glory (competitive targeting)
  const sorted = [...others].sort((a, b) => (b.glory || 0) - (a.glory || 0));
  return { targetPlayer: sorted[0].id };
}

function pickActionChoice(state, playerId, decision) {
  const options = decision.options || [];
  if (options.length === 0) return { actionChoice: null };

  // Pick the highest-value repeatable action
  let bestOption = options[0];
  let bestScore = -Infinity;

  for (const option of options) {
    const actionId = typeof option === 'string' ? option : (option.value || option.id || option);
    const score = scoreRepeatAction(state, playerId, actionId) + Math.random() * 0.3;
    if (score > bestScore) {
      bestScore = score;
      bestOption = option;
    }
  }

  return { actionChoice: typeof bestOption === 'string' ? bestOption : (bestOption.value || bestOption.id || bestOption) };
}

function pickStealGems(state, playerId, decision) {
  const targetResources = decision.targetResources || {};
  const count = decision.count || 1;
  const selection = {};
  let remaining = count;

  // Steal the most valuable resources (prioritize what we need for diversity)
  const player = getPlayer(state, playerId);
  const myResources = player?.resources || {};
  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];

  // Prefer stealing colors we don't have
  const sorted = Object.entries(targetResources)
    .filter(([, amount]) => amount > 0)
    .map(([color, amount]) => ({
      color,
      amount,
      myCount: myResources[color] || 0,
    }))
    .sort((a, b) => a.myCount - b.myCount); // steal what we have least of

  for (const { color, amount } of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(amount, remaining);
    selection[color] = take;
    remaining -= take;
  }

  return { stealGems: selection };
}

function pickRedistribution(state, playerId, decision, activeColors) {
  const totalResources = decision.totalResources || 0;
  // Redistribute evenly for maximum diversity
  const selection = {};
  let remaining = totalResources;
  let idx = 0;

  while (remaining > 0) {
    const color = activeColors[idx % activeColors.length];
    selection[color] = (selection[color] || 0) + 1;
    remaining--;
    idx++;
  }

  return { gemSelection: selection };
}

/**
 * Score a repeatable action for heuristic decision-making.
 */
function scoreRepeatAction(state, playerId, actionId) {
  // Simple heuristic: resource gain actions are best, glory actions even better
  const actionPrefix = actionId.split('_')[0];
  const player = getPlayer(state, playerId);

  // Prefer actions that give resources we need
  if (actionId.includes('collectTribute') || actionId.includes('skulk') || actionId.includes('bide') || actionId.includes('bless')) {
    return 4; // simple resource gains
  }
  if (actionId.includes('forage') || actionId.includes('harvest') || actionId.includes('gather')) {
    return 5; // flexible resource gains
  }
  if (actionId.includes('cashIn') || actionId.includes('flourish')) {
    return 7; // glory/big resource actions
  }
  if (actionId.includes('hex') || actionId.includes('ruin')) {
    return 6; // penalize opponents
  }

  return 3; // default
}
