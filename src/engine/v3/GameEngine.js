/**
 * Patrons v3 — GameEngine
 *
 * Top-level orchestration API. Wires together the event system,
 * state helpers, phases, actions, shops, and power cards.
 *
 * Every function is pure: state in, { state, log, pendingDecision? } out.
 */

import { dispatchEvent, EventType, registerHandler, resetHandlerFrequencies } from './events.js';
import {
  Phase, executeChampionDraft, executeRoundStart, executeRoundEnd,
  advanceTurn, isGameOver, resortTurnOrder, ACTIONS_PER_ROUND,
} from './phases.js';
import {
  addResources, removeResources, addGlory, removeGlory,
  getPlayer, getOtherPlayers, hasModifier, slotPowerCard,
  trackGodAccess, canAccessGod, placeWorker,
  createV3GameState, createResult, createDecisionRequest, formatResources,
} from './stateHelpers.js';
import { routeAction } from './actions/index.js';
import { resolveShop, canAffordShop, payShopCost } from './shops/shopResolver.js';
import { getAvailableActions, getActionGod, canAfford, payCost } from './rules.js';
import { powerCards } from './data/powerCards.js';
import champions from './data/champions.js';
import gods from './data/gods.js';
import { CARDS_DEALT_PER_GOD } from './data/constants.js';

const MAX_RECURSION_DEPTH = 5;

// --- Glory condition event mapping ---

function getGloryEventType(godColor) {
  switch (godColor) {
    case 'gold': return EventType.ROUND_END;
    case 'yellow': return EventType.ROUND_END;
    case 'black': return EventType.PLAYER_PENALIZED;
    case 'green': return EventType.ACTION_REPEATED;
    default: return EventType.ROUND_END;
  }
}

// --- Shuffle helper (Fisher-Yates) ---

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Create a new v3 game. Returns initial state in CHAMPION_DRAFT phase.
 */
export function createGame({ playerCount, playerNames, godSet = ['gold', 'black', 'green', 'yellow'], gameMode = 'basic' }) {
  let state = createV3GameState({ playerCount, playerNames, godSet, gameMode });

  // Set phase to CHAMPION_DRAFT
  state = { ...state, phase: Phase.CHAMPION_DRAFT, draftIndex: 0 };

  // Build power card markets — deal CARDS_DEALT_PER_GOD face-up per god
  // Use powerCards.js IDs (e.g. 'golden_scepter') not gods.js IDs (e.g. 'gold_goldenScepter')
  const powerCardMarkets = {};
  for (const godColor of godSet) {
    const godCardIds = Object.keys(powerCards).filter(id => powerCards[id].god === godColor);
    const deck = shuffle(godCardIds);
    powerCardMarkets[godColor] = deck.slice(0, CARDS_DEALT_PER_GOD);
  }
  state = { ...state, powerCardMarkets };

  // Register glory condition handlers for each player × each god
  const playerIds = state.players.map(p => p.id);
  for (const playerId of playerIds) {
    for (const godColor of godSet) {
      state = registerHandler(state, {
        id: `${godColor}_glory_condition_p${playerId}`,
        eventType: getGloryEventType(godColor),
        source: 'glory_condition',
        sourceId: `${godColor}_glory_condition`,
        ownerId: playerId,
        config: {},
      });
    }
  }

  // Initialize blessed tracking
  const blessedUsed = {};
  for (const pid of playerIds) {
    blessedUsed[pid] = false;
  }
  state = { ...state, blessedUsed };

  return { state, log: ['Game created!'] };
}

/**
 * Execute a player action with full event pipeline.
 */
export function executeAction(state, playerId, actionId, decisions = {}, options = {}) {
  const { recursionDepth = 0, isRepeat = false } = options;
  const log = [];

  // 1. Validate recursion depth
  if (recursionDepth >= MAX_RECURSION_DEPTH) {
    return { state, log: [`Max recursion depth (${MAX_RECURSION_DEPTH}) reached, action ${actionId} skipped`] };
  }

  // 2. Validate action exists
  const godColor = getActionGod(actionId, state.gods);
  if (!godColor) {
    return { state, log: [`Unknown action: ${actionId}`] };
  }

  // 3. Check nullified spaces
  if (state.nullifiedSpaces && state.nullifiedSpaces[actionId]) {
    return { state, log: [`Action ${actionId} is nullified this round`] };
  }

  // 4. Check occupied spaces (unless modifier or repeat)
  if (!isRepeat && recursionDepth === 0) {
    const occupied = state.occupiedSpaces || {};
    if (occupied[actionId] && !hasModifier(state, playerId, 'ignore_occupied')) {
      return { state, log: [`Action ${actionId} is occupied`] };
    }
  }

  // 5. If not a repeat and at root depth: place worker, track god access, record round action
  if (!isRepeat && recursionDepth === 0) {
    state = placeWorker(state, actionId, playerId);
    state = trackGodAccess(state, playerId, godColor);
    state = {
      ...state,
      roundActions: [...(state.roundActions || []), { playerId, actionId }],
    };
    log.push(`Player ${playerId} placed worker at ${actionId}`);
  }

  // 6. Snapshot player resources before action for RESOURCE_GAINED detection
  const playerBefore = getPlayer(state, playerId);
  const resourcesBefore = { ...playerBefore.resources };

  // 7. Route to action handler
  const actionResult = routeAction(state, playerId, actionId, state.gods, decisions, recursionDepth);
  state = actionResult.state;
  if (actionResult.log) log.push(...actionResult.log);

  // 8. If pendingDecision, return immediately
  if (actionResult.pendingDecision) {
    return { state, log, pendingDecision: actionResult.pendingDecision };
  }

  // 9. Handle chained/recursive executeAction (green repeat/copy)
  if (actionResult.executeAction) {
    const chain = actionResult.executeAction;
    const subResult = executeAction(
      state,
      chain.playerId,
      chain.actionId,
      chain.decisions || {},
      { recursionDepth: chain.recursionDepth || recursionDepth + 1, isRepeat: true }
    );
    state = subResult.state;
    if (subResult.log) log.push(...subResult.log);
    if (subResult.pendingDecision) {
      return { state, log, pendingDecision: subResult.pendingDecision };
    }

    // Handle chained actions (from loop/unravel)
    if (chain.chainedActions) {
      for (const chained of chain.chainedActions) {
        const chainedResult = executeAction(
          state,
          chained.playerId,
          chained.actionId,
          chained.decisions || {},
          { recursionDepth: chained.recursionDepth || recursionDepth + 1, isRepeat: true }
        );
        state = chainedResult.state;
        if (chainedResult.log) log.push(...chainedResult.log);
        if (chainedResult.pendingDecision) {
          return { state, log, pendingDecision: chainedResult.pendingDecision };
        }
      }
    }
  }

  // 9b. Dispatch PLAYER_PENALIZED events for black actions that penalize
  if (actionResult.penalizedPlayers && actionResult.penalizedPlayers.length > 0) {
    for (const penalizedId of actionResult.penalizedPlayers) {
      const penalizeResult = dispatchEvent(state, EventType.PLAYER_PENALIZED, {
        playerId,
        targetPlayerId: penalizedId,
        actionId,
      });
      state = penalizeResult.state;
      if (penalizeResult.log) log.push(...penalizeResult.log);
      if (penalizeResult.pendingDecisions && penalizeResult.pendingDecisions.length > 0) {
        state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...penalizeResult.pendingDecisions] };
      }
    }
  }

  // 10. Detect resource gains and dispatch RESOURCE_GAINED event
  const playerAfter = getPlayer(state, playerId);
  const resourcesAfter = playerAfter.resources;
  const gainedResources = {};
  for (const color of Object.keys(resourcesAfter)) {
    const diff = (resourcesAfter[color] || 0) - (resourcesBefore[color] || 0);
    if (diff > 0) gainedResources[color] = diff;
  }
  if (Object.keys(gainedResources).length > 0) {
    const gainResult = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId,
      resources: gainedResources,
      source: 'action',
      actionId,
    });
    state = gainResult.state;
    if (gainResult.log) log.push(...gainResult.log);
    if (gainResult.pendingDecisions && gainResult.pendingDecisions.length > 0) {
      state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...gainResult.pendingDecisions] };
    }
  }

  // 11. Dispatch ACTION_EXECUTED event
  const execResult = dispatchEvent(state, EventType.ACTION_EXECUTED, {
    playerId,
    actionId,
    godColor,
    recursionDepth,
  });
  state = execResult.state;
  if (execResult.log) log.push(...execResult.log);
  if (execResult.pendingDecisions && execResult.pendingDecisions.length > 0) {
    state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...execResult.pendingDecisions] };
  }

  // 12. If this was a repeat: dispatch ACTION_REPEATED event
  if (isRepeat) {
    const repeatResult = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId,
      actionId,
      godColor,
      recursionDepth,
    });
    state = repeatResult.state;
    if (repeatResult.log) log.push(...repeatResult.log);
    if (repeatResult.pendingDecisions && repeatResult.pendingDecisions.length > 0) {
      state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...repeatResult.pendingDecisions] };
    }
  }

  return { state, log };
}

/**
 * Use a shop benefit.
 */
export function executeShop(state, playerId, shopId, decisions = {}) {
  const log = [];

  // 1. Determine god color from shopId (e.g. 'gold_weak' -> 'gold')
  const godColor = shopId.split('_')[0];

  // 2. Check god access
  if (!canAccessGod(state, playerId, godColor)) {
    return { state, log: [`Cannot use ${shopId}: you haven't acted at the ${godColor} god this turn`] };
  }

  // 3. Pay shop cost
  const payResult = payShopCost(state, playerId, shopId, decisions);
  if (!payResult.canAfford) {
    return { state, log: [`Cannot afford ${shopId}`] };
  }
  if (payResult.pendingDecision) {
    return { state: payResult.state, log: [], pendingDecision: payResult.pendingDecision };
  }
  state = payResult.state;
  log.push(`Paid for ${shopId}`);

  // 4. Resolve shop benefit
  const shopResult = resolveShop(state, playerId, shopId, decisions);
  state = shopResult.state;
  if (shopResult.log) log.push(...shopResult.log);

  if (shopResult.pendingDecision) {
    return { state, log, pendingDecision: shopResult.pendingDecision };
  }

  // 5. Handle recursive executeAction from shop (green repeat/copy shops)
  if (shopResult.executeAction) {
    const chain = shopResult.executeAction;
    const subResult = executeAction(
      state,
      chain.playerId,
      chain.actionId,
      chain.decisions || {},
      { recursionDepth: chain.recursionDepth || 1, isRepeat: true }
    );
    state = subResult.state;
    if (subResult.log) log.push(...subResult.log);
    if (subResult.pendingDecision) {
      return { state, log, pendingDecision: subResult.pendingDecision };
    }
  }

  // 6. Dispatch SHOP_USED event
  const shopTier = shopId.split('_')[1]; // 'weak', 'strong', 'vp'
  const shopEvent = dispatchEvent(state, EventType.SHOP_USED, {
    playerId,
    godColor,
    shopTier,
    shopId,
  });
  state = shopEvent.state;
  if (shopEvent.log) log.push(...shopEvent.log);
  if (shopEvent.pendingDecisions && shopEvent.pendingDecisions.length > 0) {
    state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...shopEvent.pendingDecisions] };
  }

  return { state, log };
}

/**
 * Buy a power card from a god's market.
 */
export function buyPowerCard(state, playerId, cardId, decisions = {}) {
  const log = [];

  // 1. Look up card in powerCards data
  const card = powerCards[cardId];
  if (!card) {
    return { state, log: [`Unknown power card: ${cardId}`] };
  }

  const godColor = card.god;

  // 2. Check god access
  if (!canAccessGod(state, playerId, godColor)) {
    return { state, log: [`Cannot buy ${card.name}: you haven't acted at the ${godColor} god this turn`] };
  }

  // 3. Check card is in market
  const market = (state.powerCardMarkets || {})[godColor] || [];
  if (!market.includes(cardId)) {
    return { state, log: [`${card.name} is not available in the market`] };
  }

  // 4. Check player has empty card slot
  const champion = state.champions[playerId];
  if (!champion) {
    return { state, log: [`Player ${playerId} has no champion`] };
  }
  const currentCards = champion.powerCards || [];
  if (currentCards.length >= champion.powerCardSlots) {
    return { state, log: [`No empty power card slots available`] };
  }

  // 5. Calculate cost (with The Blessed discount)
  let cost = { ...card.cost };
  if (champion.id === 'blessed' && !(state.blessedUsed || {})[playerId]) {
    // Reduce total cost by 2 — remove from 'any' first, then from specific colors
    let discount = 2;
    if (cost.any && cost.any > 0) {
      const reduction = Math.min(discount, cost.any);
      cost.any -= reduction;
      discount -= reduction;
      if (cost.any === 0) delete cost.any;
    }
    if (discount > 0) {
      for (const color of Object.keys(cost)) {
        if (color === 'any') continue;
        const reduction = Math.min(discount, cost[color]);
        cost[color] -= reduction;
        discount -= reduction;
        if (cost[color] === 0) delete cost[color];
        if (discount <= 0) break;
      }
    }
    // Mark blessed as used
    state = {
      ...state,
      blessedUsed: { ...(state.blessedUsed || {}), [playerId]: true },
    };
    log.push('The Blessed: first power card discount applied (-2 cost)');
  }

  // 6. Pay cost
  const payResult = payCost(state, playerId, cost, decisions);
  if (!payResult.canAfford) {
    return { state, log: [`Cannot afford ${card.name}`] };
  }
  if (payResult.pendingDecision) {
    return { state: payResult.state, log, pendingDecision: payResult.pendingDecision };
  }
  state = payResult.state;

  // 7. Slot the card
  state = slotPowerCard(state, playerId, cardId);
  log.push(`Bought ${card.name}`);

  // 8. Remove from market (cards don't refill)
  const newMarket = market.filter(id => id !== cardId);
  state = {
    ...state,
    powerCardMarkets: {
      ...state.powerCardMarkets,
      [godColor]: newMarket,
    },
  };

  // 9. Register any event handlers from the card
  if (card.handlers) {
    for (const handlerDef of card.handlers) {
      state = registerHandler(state, {
        id: `${cardId}_p${playerId}`,
        eventType: handlerDef.eventType,
        source: 'power_card',
        sourceId: cardId,
        ownerId: playerId,
        config: handlerDef.config || {},
        frequency: handlerDef.frequency,
      });
    }
  }

  // 10. Apply onPurchase effects
  if (card.onPurchase) {
    if (card.onPurchase.type === 'resource_gain' && card.onPurchase.resources) {
      state = addResources(state, playerId, card.onPurchase.resources);
      log.push(`${card.name} on-purchase: +${formatResources(card.onPurchase.resources)}`);
    }
    if (card.onPurchase.type === 'resource_gain_each_color') {
      const gains = {};
      for (const color of state.gods) {
        gains[color] = 1;
      }
      state = addResources(state, playerId, gains);
      log.push(`${card.name} on-purchase: +1 of each active color`);
    }
  }

  // 11. Dispatch POWER_CARD_BOUGHT event
  const buyEvent = dispatchEvent(state, EventType.POWER_CARD_BOUGHT, {
    playerId,
    cardId,
    godColor,
  });
  state = buyEvent.state;
  if (buyEvent.log) log.push(...buyEvent.log);
  if (buyEvent.pendingDecisions && buyEvent.pendingDecisions.length > 0) {
    state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...buyEvent.pendingDecisions] };
  }

  return { state, log };
}

/**
 * End current player's turn.
 */
export function endTurn(state) {
  const log = [];
  const currentPlayerId = state.currentPlayer;

  // 1. Dispatch TURN_END event
  const turnEndResult = dispatchEvent(state, EventType.TURN_END, {
    playerId: currentPlayerId,
  });
  state = turnEndResult.state;
  if (turnEndResult.log) log.push(...turnEndResult.log);

  // 2. Collect any pending decisions from turn-end triggers
  const pendingDecisions = [];
  if (turnEndResult.pendingDecisions && turnEndResult.pendingDecisions.length > 0) {
    pendingDecisions.push(...turnEndResult.pendingDecisions);
  }

  // 3. Reset handler frequencies for 'once_per_turn'
  state = resetHandlerFrequencies(state, 'turn');

  // 4. Advance turn
  state = advanceTurn(state);

  // 5. If the phase became ROUND_END, don't dispatch TURN_START
  if (state.phase === Phase.ROUND_END) {
    log.push('All players out of workers.');
    if (pendingDecisions.length > 0) {
      state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...pendingDecisions] };
    }
    return { state, log };
  }

  // 6. Dispatch TURN_START for next player
  const nextPlayerId = state.currentPlayer;
  const turnStartResult = dispatchEvent(state, EventType.TURN_START, {
    playerId: nextPlayerId,
  });
  state = turnStartResult.state;
  if (turnStartResult.log) log.push(...turnStartResult.log);
  if (turnStartResult.pendingDecisions) {
    pendingDecisions.push(...turnStartResult.pendingDecisions);
  }

  if (pendingDecisions.length > 0) {
    state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...pendingDecisions] };
  }

  log.push(`Player ${nextPlayerId}'s turn`);

  return { state, log, pendingDecisions: pendingDecisions.length > 0 ? pendingDecisions : undefined };
}

/**
 * Advance to next round (called when all players out of workers).
 */
export function advanceRound(state) {
  const log = [];
  const pendingDecisions = [];

  // 1. Dispatch ROUND_END event (triggers glory conditions, Voodoo Doll, etc.)
  const roundEndResult = dispatchEvent(state, EventType.ROUND_END, {
    round: state.round,
  });
  state = roundEndResult.state;
  if (roundEndResult.log) log.push(...roundEndResult.log);
  if (roundEndResult.pendingDecisions) {
    pendingDecisions.push(...roundEndResult.pendingDecisions);
  }

  // 2. Execute round end phase transition
  const endResult = executeRoundEnd(state);
  state = endResult.state;
  if (endResult.log) log.push(...endResult.log);

  // 3. If game over, dispatch GAME_END
  if (state.phase === Phase.GAME_END) {
    const gameEndResult = dispatchEvent(state, EventType.GAME_END, {});
    state = gameEndResult.state;
    if (gameEndResult.log) log.push(...gameEndResult.log);
    if (gameEndResult.pendingDecisions) {
      pendingDecisions.push(...gameEndResult.pendingDecisions);
    }
    if (pendingDecisions.length > 0) {
      state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...pendingDecisions] };
    }
    return { state, log };
  }

  // 4. Resort turn order and execute round start
  state = resortTurnOrder(state);
  const startResult = executeRoundStart(state);
  state = startResult.state;
  if (startResult.log) log.push(...startResult.log);

  // 5. Dispatch ROUND_START event (triggers Gold Idol, Crystal Watch, Horn of Plenty, Prescient nullifiers)
  const roundStartResult = dispatchEvent(state, EventType.ROUND_START, {
    round: state.round,
  });
  state = roundStartResult.state;
  if (roundStartResult.log) log.push(...roundStartResult.log);
  if (roundStartResult.pendingDecisions) {
    pendingDecisions.push(...roundStartResult.pendingDecisions);
  }

  // 6. Reset handler frequency for 'once_per_round'
  state = resetHandlerFrequencies(state, 'round');

  // Set current player to first in turn order
  if (state.turnOrder && state.turnOrder.length > 0) {
    state = { ...state, currentPlayer: state.turnOrder[0], turnDirection: 1 };
  }

  if (pendingDecisions.length > 0) {
    state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...pendingDecisions] };
  }

  return { state, log, pendingDecisions: pendingDecisions.length > 0 ? pendingDecisions : undefined };
}

/**
 * Resolve a queued decision (from power card triggers, champion passives, etc.)
 */
export function resolveDecision(state, decisionId, answer) {
  const log = [];
  const queue = state.decisionQueue || [];
  const decisionIndex = queue.findIndex(d => d.sourceId === decisionId || d.type === decisionId);

  if (decisionIndex === -1) {
    return { state, log: [`No pending decision found: ${decisionId}`] };
  }

  const decision = queue[decisionIndex];
  const newQueue = [...queue.slice(0, decisionIndex), ...queue.slice(decisionIndex + 1)];
  state = { ...state, decisionQueue: newQueue };

  // Route based on decision type
  if (decision.sourceId === 'voodoo_doll' && answer.targetPlayer) {
    const targetId = answer.targetPlayer;
    state = removeGlory(state, targetId, decision.effect.gloryLoss, 'voodoo_doll');
    log.push(`Voodoo Doll: Player ${targetId} loses ${decision.effect.gloryLoss} Glory`);
  } else if (decision.sourceId === 'prescient_passive' && answer.actionId) {
    state = {
      ...state,
      nullifiedSpaces: { ...state.nullifiedSpaces, [answer.actionId]: true },
    };
    log.push(`The Prescient: nullified ${answer.actionId}`);
  } else if (decision.sourceId === 'alchemists_trunk' && answer.redistribution) {
    const player = getPlayer(state, decision.ownerId);
    const totalResources = Object.values(player.resources).reduce((sum, v) => sum + v, 0);
    const newTotal = Object.values(answer.redistribution).reduce((sum, v) => sum + v, 0);
    if (newTotal === totalResources) {
      state = {
        ...state,
        players: state.players.map(p => {
          if (p.id !== decision.ownerId) return p;
          return { ...p, resources: { ...answer.redistribution } };
        }),
      };
      log.push(`Alchemist's Trunk: resources redistributed`);
    } else {
      log.push(`Alchemist's Trunk: redistribution total mismatch`);
    }
  }

  return { state, log };
}

// Re-exports
export { getAvailableActions } from './rules.js';
export { isGameOver, Phase } from './phases.js';
export { EventType } from './events.js';
