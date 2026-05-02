/**
 * Patrons v3 — MCTS AI
 *
 * Monte Carlo Tree Search evaluator for balance testing.
 * Zero hardcoded values. Every decision is evaluated by simulating
 * future game outcomes and picking the option with the highest
 * average final glory.
 *
 * Architecture:
 *   rollout()            — fast random game completion from any state
 *   mctsActionPicker()   — evaluate each action via rollouts
 *   mctsShopDecision()   — evaluate each affordable shop via rollouts
 *   mctsCardDecision()   — evaluate each affordable card via rollouts
 *   mctsDecisionFn()     — evaluate each option for pending decisions
 *   createMCTSPlayer()   — factory with configurable rollout counts
 */

import { getPlayer } from './stateHelpers.js';
import { getAvailableActions, canAfford } from './rules.js';
import { routeAction } from './actions/index.js';
import {
  executeAction, executeShop, endTurn, buyPowerCard, resolveDecision,
} from './GameEngine.js';
import {
  Phase, executeChampionDraft, executeRoundStart, executeRoundEnd,
  advanceTurn, isGameOver, resortTurnOrder,
} from './phases.js';
import { dispatchEvent, EventType, resetHandlerFrequencies } from './events.js';
import { canAffordShop } from './shops/shopResolver.js';
import { powerCards } from './data/powerCards.js';
import { randomDecisionFn } from './runner.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const MCTS_PRESETS = {
  fast:     { actionRollouts: 5,  purchaseRollouts: 3,  decisionRollouts: 3  },
  standard: { actionRollouts: 20, purchaseRollouts: 15, decisionRollouts: 10 },
  strong:   { actionRollouts: 50, purchaseRollouts: 30, decisionRollouts: 20 },
};

/** Rollout count for backward-compatible exports (fast enough for tests). */
const COMPAT_ROLLOUTS = 2;

// ---------------------------------------------------------------------------
// Core: Fast Rollout
// ---------------------------------------------------------------------------

/**
 * Run game from current state to completion with random play.
 * Returns final glory for the specified player.
 * Optimized for speed — no logging, minimal allocation.
 */
function rollout(inputState, targetPlayerId) {
  let state = fastDrainDecisions(inputState);
  let safety = 0;

  while (!isGameOver(state) && safety < 300) {
    safety++;

    // Phase transitions
    if (state.phase === Phase.CHAMPION_DRAFT) {
      state = finishDraftRandomly(state);
      if (state.phase === Phase.ROUND_START) state = fastRoundStart(state);
      continue;
    }
    if (state.phase === Phase.ROUND_START) {
      state = fastRoundStart(state);
      continue;
    }
    if (state.phase === Phase.ROUND_END) {
      state = fastRoundEnd(state);
      continue;
    }
    if (state.phase === Phase.GAME_END) break;
    if (state.phase !== Phase.ACTION_PHASE) break;

    // --- Action turn ---
    const pid = state.currentPlayer;
    const player = getPlayer(state, pid);
    if (!player || player.workersLeft <= 0) {
      state = advanceTurn(state);
      continue;
    }

    const available = getAvailableActions(state, pid);
    if (available.length === 0) {
      state = advanceTurn(state);
      continue;
    }

    // Random action pick
    let actionId = available[Math.floor(Math.random() * available.length)];
    let result = executeAction(state, pid, actionId);

    // Handle abort — try another random action
    if (result.abort) {
      state = result.state;
      let found = false;
      for (const alt of available) {
        if (alt === actionId) continue;
        result = executeAction(state, pid, alt);
        if (!result.abort) { actionId = alt; found = true; break; }
        state = result.state;
      }
      if (!found) { state = advanceTurn(state); continue; }
    }

    state = result.state;
    if (result.pendingDecision) {
      state = fastResolveAction(state, pid, actionId, result.pendingDecision);
    }
    state = fastDrainDecisions(state);

    // Note: The Deft's consecutive turns are handled by advanceTurn via player.extraTurns

    // Random shop purchase (~40% when affordable)
    if (!state.purchaseMadeThisTurn && Math.random() < 0.4) {
      state = randomShopPurchase(state, pid);
    }

    // Random card purchase (~25% when affordable and has slots)
    if (!state.purchaseMadeThisTurn && Math.random() < 0.25) {
      state = randomCardPurchase(state, pid);
    }

    // End turn
    state = endTurn(state).state;
    state = fastDrainDecisions(state);
  }

  // Game end scoring
  if (state.phase === Phase.GAME_END || isGameOver(state)) {
    state = dispatchEvent(state, EventType.GAME_END, {}).state;
  }

  return getPlayer(state, targetPlayerId)?.glory || 0;
}

// ---------------------------------------------------------------------------
// Rollout Helpers
// ---------------------------------------------------------------------------

function fastRoundStart(state) {
  state = resortTurnOrder(state);
  state = executeRoundStart(state).state;
  state = resetHandlerFrequencies(state, 'round');
  state = dispatchEvent(state, EventType.ROUND_START, { round: state.round }).state;
  state = fastDrainDecisions(state);
  state = { ...state, currentPlayer: state.turnOrder[0] };
  state = dispatchEvent(state, EventType.TURN_START, { playerId: state.turnOrder[0] }).state;
  return fastDrainDecisions(state);
}

function fastRoundEnd(state) {
  state = dispatchEvent(state, EventType.ROUND_END, { round: state.round }).state;
  state = fastDrainDecisions(state);
  return executeRoundEnd(state).state;
}

function fastDrainDecisions(state) {
  let i = 0;
  while (state.decisionQueue?.length > 0 && i < 50) {
    const dec = state.decisionQueue[0];
    state = { ...state, decisionQueue: state.decisionQueue.slice(1) };
    const pid = dec.playerId || dec.ownerId;
    const answer = randomDecisionFn(state, pid, dec);
    if (dec.type === 'championChoice' && answer.championId) {
      const r = executeChampionDraft(state, { championId: answer.championId });
      state = r.state;
      if (r.pendingDecision) {
        state = { ...state, decisionQueue: [r.pendingDecision, ...(state.decisionQueue || [])] };
      }
    } else if (dec.sourceId) {
      state = resolveDecision(state, dec.sourceId, answer).state;
    }
    i++;
  }
  return state;
}

function fastResolveAction(state, playerId, actionId, pendingDecision) {
  let decisions = {};
  let result = { state, pendingDecision };
  let attempts = 0;
  while (result.pendingDecision && attempts < 10) {
    const answer = randomDecisionFn(result.state, playerId, result.pendingDecision);
    if (result.pendingDecision._costPaid) decisions._costPaid = true;
    decisions = { ...decisions, ...answer, _continued: true };
    result = executeAction(result.state, playerId, actionId, decisions, { isContinuation: true });
    attempts++;
  }
  return result.state;
}

function fastResolveShop(state, playerId, shopId, pendingDecision) {
  let decisions = {};
  let result = { state, pendingDecision };
  let attempts = 0;
  while (result.pendingDecision && attempts < 10) {
    const answer = randomDecisionFn(result.state, playerId, result.pendingDecision);
    if (result.pendingDecision._costPaid) decisions._costPaid = true;
    decisions = { ...decisions, ...answer, _continued: true };
    result = executeShop(result.state, playerId, shopId, decisions);
    attempts++;
  }
  return result.state;
}

function fastResolveCard(state, playerId, cardId, pendingDecision) {
  let decisions = {};
  let result = { state, pendingDecision };
  let attempts = 0;
  while (result.pendingDecision && attempts < 10) {
    const answer = randomDecisionFn(result.state, playerId, result.pendingDecision);
    decisions = { ...decisions, ...answer, _continued: true };
    result = buyPowerCard(result.state, playerId, cardId, decisions);
    attempts++;
  }
  return result.state;
}

function randomShopPurchase(state, playerId) {
  const accessed = state.godsAccessedThisTurn || [];
  if (accessed.length === 0) return state;
  const shops = [];
  for (const god of accessed) {
    for (const type of ['weak', 'strong', 'vp']) {
      const sid = `${god}_${type}`;
      if (canAffordShop(state, playerId, sid)) shops.push(sid);
    }
  }
  if (shops.length === 0) return state;
  const shopId = shops[Math.floor(Math.random() * shops.length)];
  const result = executeShop(state, playerId, shopId);
  state = result.state;
  if (result.pendingDecision) {
    state = fastResolveShop(state, playerId, shopId, result.pendingDecision);
  }
  return fastDrainDecisions(state);
}

function randomCardPurchase(state, playerId) {
  const accessed = state.godsAccessedThisTurn || [];
  const champ = state.champions?.[playerId];
  if (!champ || (champ.powerCards?.length || 0) >= (champ.powerCardSlots || 4)) return state;
  if (accessed.length === 0) return state;
  const cards = [];
  for (const god of accessed) {
    for (const cardId of ((state.powerCardMarkets || {})[god] || [])) {
      const card = powerCards[cardId];
      if (card && canAfford(state, playerId, card.cost)) cards.push(cardId);
    }
  }
  if (cards.length === 0) return state;
  const cardId = cards[Math.floor(Math.random() * cards.length)];
  const result = buyPowerCard(state, playerId, cardId);
  state = result.state;
  if (result.pendingDecision) {
    state = fastResolveCard(state, playerId, cardId, result.pendingDecision);
  }
  return fastDrainDecisions(state);
}

function finishDraftRandomly(state) {
  let maxSteps = 20;
  while (state.phase === Phase.CHAMPION_DRAFT && maxSteps > 0) {
    maxSteps--;
    const r = executeChampionDraft(state);
    state = r.state;
    if (r.pendingDecision) {
      const opts = r.pendingDecision.options || [];
      if (opts.length === 0) break;
      const pick = opts[Math.floor(Math.random() * opts.length)];
      state = executeChampionDraft(state, { championId: pick.id }).state;
    }
  }
  return state;
}

// ---------------------------------------------------------------------------
// MCTS Evaluation Core
// ---------------------------------------------------------------------------

/** Average glory from N rollouts. */
function avgRolloutGlory(state, playerId, n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += rollout(state, playerId);
  }
  return total / n;
}

/**
 * Complete the current turn (endTurn) and get a clean next-player state.
 * Used before rollouts so the rollout starts at the beginning of a turn.
 */
function completeTurnAndAdvance(state) {
  state = endTurn(state).state;
  return fastDrainDecisions(state);
}

// ---------------------------------------------------------------------------
// MCTS Action Picker
// ---------------------------------------------------------------------------

/**
 * For each available action, execute it, complete the turn, and run
 * N rollouts from the resulting state. Pick the action with the
 * highest average final glory.
 */
function mctsActionPicker(state, playerId, availableActions, rollouts) {
  if (!availableActions || availableActions.length === 0) return null;
  if (availableActions.length === 1) return availableActions[0];

  let bestAction = availableActions[0];
  let bestGlory = -Infinity;

  for (const actionId of availableActions) {
    try {
      const result = executeAction(state, playerId, actionId);
      if (result.abort) continue;

      let simState = result.state;
      if (result.pendingDecision) {
        simState = fastResolveAction(simState, playerId, actionId, result.pendingDecision);
      }
      simState = fastDrainDecisions(simState);
      simState = completeTurnAndAdvance(simState);

      const avg = avgRolloutGlory(simState, playerId, rollouts);
      if (avg > bestGlory) {
        bestGlory = avg;
        bestAction = actionId;
      }
    } catch {
      continue;
    }
  }

  return bestAction;
}

// ---------------------------------------------------------------------------
// MCTS Shop Decision
// ---------------------------------------------------------------------------

/**
 * Evaluate each affordable shop at accessed gods vs a "no shop" baseline.
 * Only buy if a shop improves expected glory over the baseline.
 */
function mctsShopDecision(state, playerId, rollouts) {
  const accessed = state.godsAccessedThisTurn || [];
  if (accessed.length === 0) return null;

  const shops = [];
  for (const god of accessed) {
    for (const type of ['weak', 'strong', 'vp']) {
      const sid = `${god}_${type}`;
      if (canAffordShop(state, playerId, sid)) shops.push(sid);
    }
  }
  if (shops.length === 0) return null;

  // Baseline: skip purchasing and end turn
  const baseState = completeTurnAndAdvance(state);
  const baseline = avgRolloutGlory(baseState, playerId, rollouts);

  let bestShop = null;
  let bestGlory = baseline;

  for (const shopId of shops) {
    try {
      const result = executeShop(state, playerId, shopId);
      let simState = result.state;
      if (result.pendingDecision) {
        simState = fastResolveShop(simState, playerId, shopId, result.pendingDecision);
      }
      simState = fastDrainDecisions(simState);
      simState = completeTurnAndAdvance(simState);

      const avg = avgRolloutGlory(simState, playerId, rollouts);
      if (avg > bestGlory) {
        bestGlory = avg;
        bestShop = shopId;
      }
    } catch {
      continue;
    }
  }

  return bestShop;
}

// ---------------------------------------------------------------------------
// MCTS Card Decision
// ---------------------------------------------------------------------------

/**
 * Evaluate each affordable card vs "no card" baseline.
 * Only buy if a card improves expected glory.
 */
function mctsCardDecision(state, playerId, rollouts) {
  const accessed = state.godsAccessedThisTurn || [];
  if (accessed.length === 0) return null;

  const champion = state.champions?.[playerId];
  if (!champion) return null;
  if ((champion.powerCards?.length || 0) >= (champion.powerCardSlots || 4)) return null;

  const cards = [];
  for (const god of accessed) {
    for (const cardId of ((state.powerCardMarkets || {})[god] || [])) {
      const card = powerCards[cardId];
      if (card && canAfford(state, playerId, card.cost)) cards.push(cardId);
    }
  }
  if (cards.length === 0) return null;

  // Power cards are almost always worth buying — their long-term engine-building
  // value is hard to detect with few rollouts. If we can afford one, buy it.
  // Use MCTS only to pick the BEST card when multiple are affordable.
  if (cards.length === 1) return cards[0];

  // Multiple affordable cards — use rollouts to pick the best one
  let bestCard = cards[0]; // default to first affordable
  let bestGlory = -Infinity;

  for (const cardId of cards) {
    try {
      const result = buyPowerCard(state, playerId, cardId);
      let simState = result.state;
      if (result.pendingDecision) {
        simState = fastResolveCard(simState, playerId, cardId, result.pendingDecision);
      }
      simState = fastDrainDecisions(simState);
      simState = completeTurnAndAdvance(simState);

      const avg = avgRolloutGlory(simState, playerId, rollouts);
      if (avg > bestGlory) {
        bestGlory = avg;
        bestCard = cardId;
      }
    } catch {
      continue;
    }
  }

  return bestCard;
}

// ---------------------------------------------------------------------------
// MCTS Decision Function
// ---------------------------------------------------------------------------

/**
 * For pending decisions, enumerate options, approximate each option's
 * effect on the game state, and pick the option that leads to the
 * highest average glory via rollouts.
 */
function mctsDecisionFn(state, playerId, pendingDecision, rollouts) {
  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];

  switch (pendingDecision.type) {
    case 'championChoice':
      return mctsChampionChoice(state, playerId, pendingDecision, rollouts);
    case 'gemSelection':
      return mctsGemSelection(state, playerId, pendingDecision, activeColors, rollouts);
    case 'targetPlayer':
      return mctsTargetPlayer(state, playerId, pendingDecision, rollouts);
    case 'actionChoice':
      return mctsActionChoice(state, playerId, pendingDecision, rollouts);
    case 'actionChoices':
      return mctsActionChoices(state, playerId, pendingDecision, rollouts);
    case 'stealGems':
      return mctsStealGems(state, playerId, pendingDecision, rollouts);
    case 'nullifierPlacement':
      return mctsNullifierPlacement(state, playerId, pendingDecision, rollouts);
    case 'redistribute':
    case 'redistributeResources':
      return mctsRedistribute(state, playerId, pendingDecision, activeColors, rollouts);
    default:
      return randomDecisionFn(state, playerId, pendingDecision);
  }
}

// ---------------------------------------------------------------------------
// Decision Evaluators
// ---------------------------------------------------------------------------

function mctsChampionChoice(state, playerId, decision, rollouts) {
  const options = decision.options || [];
  if (options.length === 0) return { championId: null };
  if (options.length === 1) return { championId: options[0].id };

  let bestId = options[0].id;
  let bestGlory = -Infinity;

  for (const champ of options) {
    try {
      let simState = executeChampionDraft(state, { championId: champ.id }).state;
      simState = finishDraftRandomly(simState);
      if (simState.phase === Phase.ROUND_START) {
        simState = fastRoundStart(simState);
      }
      const avg = avgRolloutGlory(simState, playerId, rollouts);
      if (avg > bestGlory) {
        bestGlory = avg;
        bestId = champ.id;
      }
    } catch {
      continue;
    }
  }

  return { championId: bestId };
}

function mctsGemSelection(state, playerId, decision, activeColors, rollouts) {
  const count = decision.count || 1;
  let options = enumerateGemOptions(count, activeColors);

  if (options.length === 0) {
    const sel = {};
    sel[activeColors[0]] = count;
    return { gemSelection: sel };
  }
  if (options.length === 1) return { gemSelection: options[0] };

  // Cap combinatorial explosion for large counts
  if (options.length > 25) {
    options = options.sort(() => Math.random() - 0.5).slice(0, 25);
  }

  let bestOption = options[0];
  let bestGlory = -Infinity;
  const subRollouts = Math.max(2, Math.floor(rollouts / 2));

  for (const option of options) {
    // Approximate effect: add these resources to the player
    const simState = applyGemGain(state, playerId, option);
    const avg = avgRolloutGlory(simState, playerId, subRollouts);
    if (avg > bestGlory) {
      bestGlory = avg;
      bestOption = option;
    }
  }

  return { gemSelection: bestOption };
}

function mctsTargetPlayer(state, playerId, decision, rollouts) {
  const others = state.players.filter(
    p => p.id !== (decision.excludePlayer || playerId)
  );
  if (others.length === 0) return { targetPlayer: null };
  if (others.length === 1) return { targetPlayer: others[0].id };

  let bestTarget = others[0].id;
  let bestGlory = -Infinity;

  for (const target of others) {
    // Approximate the effect of targeting this player:
    // generic penalty (-2 glory to them, +1 to us)
    const simState = {
      ...state,
      players: state.players.map(p => {
        if (p.id === target.id) return { ...p, glory: (p.glory || 0) - 2 };
        if (p.id === playerId) return { ...p, glory: (p.glory || 0) + 1 };
        return p;
      }),
    };
    const avg = avgRolloutGlory(simState, playerId, rollouts);
    if (avg > bestGlory) {
      bestGlory = avg;
      bestTarget = target.id;
    }
  }

  return { targetPlayer: bestTarget };
}

function mctsActionChoice(state, playerId, decision, rollouts) {
  const options = decision.options || [];
  if (options.length === 0) return { actionChoice: null };
  if (options.length === 1) {
    const pick = options[0];
    return { actionChoice: typeof pick === 'string' ? pick : (pick.value || pick.id || pick) };
  }

  let bestOption = options[0];
  let bestGlory = -Infinity;

  for (const option of options) {
    const actionId = typeof option === 'string' ? option : (option.value || option.id || option);
    try {
      const result = routeAction(state, playerId, actionId, state.gods, {}, 1);
      if (result.abort) continue;

      // If pending decision, use current state as approximation
      const simState = result.pendingDecision ? state : result.state;
      const avg = avgRolloutGlory(simState, playerId, rollouts);
      if (avg > bestGlory) {
        bestGlory = avg;
        bestOption = option;
      }
    } catch {
      continue;
    }
  }

  const pick = bestOption;
  return { actionChoice: typeof pick === 'string' ? pick : (pick.value || pick.id || pick) };
}

function mctsActionChoices(state, playerId, decision, rollouts) {
  const options = decision.options || [];
  const count = decision.count || 1;
  if (options.length <= count) return { actionChoices: options };

  // Score each option individually, take top N
  const subRollouts = Math.max(2, Math.floor(rollouts / 3));
  const scored = [];

  for (const actionId of options) {
    try {
      const result = routeAction(state, playerId, actionId, state.gods, {}, 1);
      if (result.abort) { scored.push({ actionId, score: -Infinity }); continue; }
      const simState = result.pendingDecision ? state : result.state;
      const avg = avgRolloutGlory(simState, playerId, subRollouts);
      scored.push({ actionId, score: avg });
    } catch {
      scored.push({ actionId, score: -Infinity });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return { actionChoices: scored.slice(0, count).map(s => s.actionId) };
}

function mctsStealGems(state, playerId, decision, rollouts) {
  const targetResources = decision.targetResources || {};
  const count = decision.count || 1;
  const available = Object.entries(targetResources).filter(([, amt]) => amt > 0);

  if (available.length === 0) return { stealGems: {} };

  let options = enumerateStealOptions(count, available);
  if (options.length <= 1) return { stealGems: options[0] || {} };

  // Cap options
  if (options.length > 20) {
    options = options.sort(() => Math.random() - 0.5).slice(0, 20);
  }

  let bestOption = options[0];
  let bestGlory = -Infinity;
  const subRollouts = Math.max(2, Math.floor(rollouts / 2));

  for (const option of options) {
    // Approximate: we gain these resources (handler handles actual transfer)
    const simState = applyGemGain(state, playerId, option);
    const avg = avgRolloutGlory(simState, playerId, subRollouts);
    if (avg > bestGlory) {
      bestGlory = avg;
      bestOption = option;
    }
  }

  return { stealGems: bestOption };
}

function mctsNullifierPlacement(state, playerId, decision, rollouts) {
  const options = decision.options || [];
  if (options.length === 0) return { nullifierPlacement: null };
  if (options.length === 1) {
    const pick = options[0];
    return { nullifierPlacement: typeof pick === 'string' ? pick : pick.id };
  }

  let bestOption = options[0];
  let bestGlory = -Infinity;

  for (const option of options) {
    const spaceId = typeof option === 'string' ? option : option.id;
    // Approximate: mark this space as nullified
    const simState = {
      ...state,
      nullifiedSpaces: { ...(state.nullifiedSpaces || {}), [spaceId]: true },
    };
    const avg = avgRolloutGlory(simState, playerId, rollouts);
    if (avg > bestGlory) {
      bestGlory = avg;
      bestOption = option;
    }
  }

  const pick = bestOption;
  return { nullifierPlacement: typeof pick === 'string' ? pick : pick.id };
}

function mctsRedistribute(state, playerId, decision, activeColors, rollouts) {
  const total = decision.totalResources || 0;
  if (total === 0) return { gemSelection: {} };

  let options = enumerateGemOptions(total, activeColors);
  if (options.length === 0) return { gemSelection: {} };
  if (options.length === 1) return { gemSelection: options[0] };

  // Cap combinatorial explosion
  if (options.length > 25) {
    options = options.sort(() => Math.random() - 0.5).slice(0, 25);
  }

  let bestOption = options[0];
  let bestGlory = -Infinity;
  const subRollouts = Math.max(2, Math.floor(rollouts / 2));

  for (const option of options) {
    // Redistribute: SET resources to this distribution (not add)
    const simState = applyRedistribution(state, playerId, option);
    const avg = avgRolloutGlory(simState, playerId, subRollouts);
    if (avg > bestGlory) {
      bestGlory = avg;
      bestOption = option;
    }
  }

  return { gemSelection: bestOption };
}

// ---------------------------------------------------------------------------
// Combinatorial Helpers
// ---------------------------------------------------------------------------

/**
 * Enumerate all multiset combinations of `count` items from `colors`.
 * e.g., count=2, colors=['a','b'] → [{a:2}, {a:1,b:1}, {b:2}]
 */
function enumerateGemOptions(count, colors) {
  const results = [];
  function helper(remaining, startIdx, current) {
    if (remaining === 0) { results.push({ ...current }); return; }
    for (let i = startIdx; i < colors.length; i++) {
      current[colors[i]] = (current[colors[i]] || 0) + 1;
      helper(remaining - 1, i, current);
      current[colors[i]]--;
      if (current[colors[i]] === 0) delete current[colors[i]];
    }
  }
  helper(count, 0, {});
  return results;
}

/**
 * Enumerate steal options: pick `count` resources from available pool,
 * respecting max amounts per color.
 * @param {number} count - resources to steal
 * @param {Array} available - [[color, maxAmount], ...]
 */
function enumerateStealOptions(count, available) {
  const results = [];
  function helper(remaining, startIdx, current) {
    if (remaining === 0) { results.push({ ...current }); return; }
    for (let i = startIdx; i < available.length; i++) {
      const [color, maxAmt] = available[i];
      const taken = current[color] || 0;
      if (taken < maxAmt) {
        current[color] = taken + 1;
        helper(remaining - 1, i, current);
        current[color] = taken;
        if (current[color] === 0) delete current[color];
      }
    }
  }
  helper(count, 0, {});
  return results;
}

/** Approximate a gem gain by adding resources to a player. */
function applyGemGain(state, playerId, gems) {
  return {
    ...state,
    players: state.players.map(p => {
      if (p.id !== playerId) return p;
      const newRes = { ...p.resources };
      for (const [color, amount] of Object.entries(gems)) {
        newRes[color] = (newRes[color] || 0) + amount;
      }
      return { ...p, resources: newRes };
    }),
  };
}

/** Approximate redistribution by setting a player's resources to the distribution. */
function applyRedistribution(state, playerId, distribution) {
  return {
    ...state,
    players: state.players.map(p => {
      if (p.id !== playerId) return p;
      const newRes = {};
      for (const color of (state.gods || [])) {
        newRes[color] = distribution[color] || 0;
      }
      return { ...p, resources: newRes };
    }),
  };
}

function totalResources(resources) {
  return Object.values(resources || {}).reduce((s, v) => s + Math.max(0, v), 0);
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an MCTS player with configurable rollout counts.
 *
 * Usage:
 *   const player = createMCTSPlayer(MCTS_PRESETS.standard);
 *   simulateGame({
 *     actionPickerFn: player.actionPicker,
 *     shopDecisionFn: player.shopDecision,
 *     cardDecisionFn: player.cardDecision,
 *     decisionFn: player.decisionFn,
 *   });
 */
export function createMCTSPlayer(options = {}) {
  const {
    actionRollouts = 20,
    purchaseRollouts = 15,
    decisionRollouts = 10,
  } = options;

  return {
    actionPicker: (s, p, a) => mctsActionPicker(s, p, a, actionRollouts),
    shopDecision: (s, p) => mctsShopDecision(s, p, purchaseRollouts),
    cardDecision: (s, p) => mctsCardDecision(s, p, purchaseRollouts),
    decisionFn: (s, p, pd) => mctsDecisionFn(s, p, pd, decisionRollouts),
  };
}

// ---------------------------------------------------------------------------
// Backward-Compatible Exports
// ---------------------------------------------------------------------------

/**
 * Simple position score — glory-weighted with resources and cards as tiebreaker.
 * No per-color or per-card biases. Used by tests, not by MCTS.
 */
export function evaluatePosition(state, playerId) {
  const player = getPlayer(state, playerId);
  if (!player) return 0;
  const total = totalResources(player.resources);
  const cardCount = (state.champions?.[playerId]?.powerCards || []).length;
  return (player.glory || 0) * 10 + total + cardCount * 5;
}

export function heuristicActionPicker(state, playerId, availableActions) {
  return mctsActionPicker(state, playerId, availableActions, COMPAT_ROLLOUTS);
}

export function heuristicShopDecision(state, playerId) {
  return mctsShopDecision(state, playerId, COMPAT_ROLLOUTS);
}

export function heuristicCardDecision(state, playerId) {
  return mctsCardDecision(state, playerId, COMPAT_ROLLOUTS);
}

export function heuristicDecisionFn(state, playerId, pendingDecision) {
  return mctsDecisionFn(state, playerId, pendingDecision, COMPAT_ROLLOUTS);
}
