/**
 * Patrons v3 — GameEngine
 *
 * Top-level orchestration API. Wires together the event system,
 * state helpers, phases, actions, shops, and power cards.
 *
 * Every function is pure: state in, { state, log, pendingDecision? } out.
 */

import { dispatchEvent, EventType, registerHandler, removeHandler, resetHandlerFrequencies } from './events.js';
import {
  Phase, executeChampionDraft, executeRoundStart, executeRoundEnd,
  advanceTurn, isGameOver, resortTurnOrder, ACTIONS_PER_ROUND,
} from './phases.js';
import {
  addResources, removeResources, addGlory, removeGlory,
  getPlayer, getOtherPlayers, hasModifier, slotPowerCard, removePowerCard,
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
    case 'yellow': return EventType.NEW_COLOR_GAINED;
    case 'black': return EventType.STEAL_ACTION;
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
  const powerCardDecks = {};
  for (const godColor of godSet) {
    const godCardIds = Object.keys(powerCards).filter(id => powerCards[id].god === godColor);
    const deck = shuffle(godCardIds);
    powerCardMarkets[godColor] = deck.slice(0, CARDS_DEALT_PER_GOD);
    powerCardDecks[godColor] = deck.slice(CARDS_DEALT_PER_GOD);
  }
  state = { ...state, powerCardMarkets, powerCardDecks };

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
  const { recursionDepth = 0, isRepeat = false, isContinuation = false } = options;
  const skipPlacement = isRepeat || isContinuation;
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

  // 4. Check occupied spaces (unless repeat, continuation, or modifier)
  if (!skipPlacement && recursionDepth === 0) {
    const occupied = state.occupiedSpaces || {};
    if (occupied[actionId] && !hasModifier(state, playerId, 'ignore_occupied')) {
      return { state, log: [`Action ${actionId} is occupied`] };
    }
  }

  // 5. If fresh placement (not repeat/continuation) at root depth: place worker, track god access
  const preplacementState = (!skipPlacement && recursionDepth === 0) ? state : null;
  if (!skipPlacement && recursionDepth === 0) {
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
  let resourcesBefore = { ...playerBefore.resources };

  // 7. Route to action handler
  const actionResult = routeAction(state, playerId, actionId, state.gods, decisions, recursionDepth);
  state = actionResult.state;
  if (actionResult.log) log.push(...actionResult.log);

  // 7b. If handler signals abort (e.g. no valid targets), revert worker placement
  if (actionResult.abort && preplacementState) {
    return { state: preplacementState, log: actionResult.log || ['Action cancelled — no valid targets'], abort: true };
  }

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
      // Annotate with the nested action's ID so the UI resolves
      // the decision against the correct (inner) action handler
      return {
        state, log,
        pendingDecision: { ...subResult.pendingDecision, _resolveActionId: chain.actionId },
      };
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
          return {
            state, log,
            pendingDecision: { ...chainedResult.pendingDecision, _resolveActionId: chained.actionId },
          };
        }
      }
    }

    // Re-snapshot resources after recursive execution so the outer RESOURCE_GAINED
    // diff only captures this action's own gains, not the child action's gains
    // (which already dispatched their own RESOURCE_GAINED event).
    resourcesBefore = { ...getPlayer(state, playerId).resources };
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

  // 9c. Dispatch GLORY_STOLEN events for actions that steal glory (e.g. pickpocket)
  if (actionResult.gloryStolen && actionResult.gloryStolen.length > 0) {
    for (const steal of actionResult.gloryStolen) {
      const gloryEvent = dispatchEvent(state, EventType.GLORY_STOLEN, {
        playerId: steal.playerId,
        targetPlayerId: steal.targetPlayerId,
        amount: steal.amount,
        source: actionId,
      });
      state = gloryEvent.state;
      if (gloryEvent.log) log.push(...gloryEvent.log);
      if (gloryEvent.pendingDecisions && gloryEvent.pendingDecisions.length > 0) {
        state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...gloryEvent.pendingDecisions] };
      }
    }
  }

  // 9d. Dispatch RESOURCE_STOLEN events for actions that steal resources (e.g. ransack, extort)
  if (actionResult.resourcesStolen && actionResult.resourcesStolen.length > 0) {
    for (const steal of actionResult.resourcesStolen) {
      const stealEvent = dispatchEvent(state, EventType.RESOURCE_STOLEN, {
        playerId: steal.playerId,
        targetPlayerId: steal.targetPlayerId,
        resources: steal.resources,
        source: actionId,
      });
      state = stealEvent.state;
      if (stealEvent.log) log.push(...stealEvent.log);
      if (stealEvent.pendingDecisions && stealEvent.pendingDecisions.length > 0) {
        state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...stealEvent.pendingDecisions] };
      }
    }
  }

  // 9e. Dispatch single STEAL_ACTION event if this was a steal (for Black Favor condition)
  if (actionResult.isStealing) {
    const stealActionResult = dispatchEvent(state, EventType.STEAL_ACTION, {
      playerId,
      actionId,
    });
    state = stealActionResult.state;
    if (stealActionResult.log) log.push(...stealActionResult.log);
    if (stealActionResult.pendingDecisions && stealActionResult.pendingDecisions.length > 0) {
      state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...stealActionResult.pendingDecisions] };
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
    // Track turn resource gains (for Traveler's Journal, etc.)
    const prevTurnGains = state.turnResourceGains || {};
    const prevPlayerGains = prevTurnGains[playerId] || {};
    const newPlayerGains = { ...prevPlayerGains };
    Object.entries(gainedResources).forEach(([color, amount]) => {
      newPlayerGains[color] = (newPlayerGains[color] || 0) + amount;
    });
    state = {
      ...state,
      turnResourceGains: { ...prevTurnGains, [playerId]: newPlayerGains },
    };

    // Determine if this is a basic gain action (simple +N resource, no side effects)
    const actionDef = godColor && gods[godColor]
      ? gods[godColor].actions.find(a => a.id === actionId)
      : null;
    const isBasicGain = actionDef && (
      actionDef.effectType === 'gainResource' ||
      (Array.isArray(actionDef.effectType) && actionDef.effectType.length === 1 && actionDef.effectType[0] === 'gainResource')
    );

    const gainResult = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId,
      resources: gainedResources,
      source: 'action',
      actionId,
      godColor,
      isBasicGain: !!isBasicGain,
    });
    state = gainResult.state;
    if (gainResult.log) log.push(...gainResult.log);
    if (gainResult.pendingDecisions && gainResult.pendingDecisions.length > 0) {
      state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...gainResult.pendingDecisions] };
    }

    // 10b. Detect 0→N color transitions for Yellow Favor condition
    const newColorsGained = Object.keys(gainedResources).filter(color =>
      (resourcesBefore[color] || 0) === 0 && gainedResources[color] > 0
    );
    if (newColorsGained.length > 0) {
      const newColorResult = dispatchEvent(state, EventType.NEW_COLOR_GAINED, {
        playerId,
        newColors: newColorsGained,
        newColorsCount: newColorsGained.length,
      });
      state = newColorResult.state;
      if (newColorResult.log) log.push(...newColorResult.log);
      if (newColorResult.pendingDecisions && newColorResult.pendingDecisions.length > 0) {
        state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...newColorResult.pendingDecisions] };
      }
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

  // 2b. Check noShopThisTurn effect (from Hoard)
  const shopPlayer = getPlayer(state, playerId);
  if (shopPlayer?.effects?.includes('noShopThisTurn') && !decisions._costPaid) {
    return { state, log: ['Cannot use shops this turn (Hoard effect)'] };
  }

  // 2c. One purchase per turn (shop or power card)
  if (state.purchaseMadeThisTurn && !decisions._costPaid) {
    return { state, log: [`You can only make one purchase (shop or power card) per turn`] };
  }

  // 3. Pay shop cost (skip if already paid in a prior decision step)
  if (!decisions._costPaid) {
    const payResult = payShopCost(state, playerId, shopId, decisions);
    if (!payResult.canAfford) {
      return { state, log: [`Cannot afford ${shopId}`] };
    }
    if (payResult.pendingDecision) {
      return { state: payResult.state, log: [], pendingDecision: payResult.pendingDecision };
    }
    state = payResult.state;
    log.push(`Paid for ${shopId}`);
  }

  // 4. Resolve shop benefit
  const shopResult = resolveShop(state, playerId, shopId, decisions);
  state = shopResult.state;
  if (shopResult.log) log.push(...shopResult.log);

  if (shopResult.pendingDecision) {
    // Cost is already paid — mark so future re-calls skip payment
    return { state, log, pendingDecision: { ...shopResult.pendingDecision, _costPaid: true } };
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
      // Cost is already paid — mark so future re-calls skip payment
      return { state, log, pendingDecision: { ...subResult.pendingDecision, _costPaid: true } };
    }
  }

  // 6. Dispatch GLORY_STOLEN events (triggers Cursed Blade, etc.)
  if (shopResult.gloryStolen && shopResult.gloryStolen.length > 0) {
    for (const steal of shopResult.gloryStolen) {
      const gloryEvent = dispatchEvent(state, EventType.GLORY_STOLEN, {
        playerId: steal.playerId,
        targetPlayerId: steal.targetPlayerId,
        amount: steal.amount,
        source: shopId,
      });
      state = gloryEvent.state;
      if (gloryEvent.log) log.push(...gloryEvent.log);
      if (gloryEvent.pendingDecisions && gloryEvent.pendingDecisions.length > 0) {
        state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...gloryEvent.pendingDecisions] };
      }

      // Also dispatch PLAYER_PENALIZED so black glory condition fires
      const penalizeEvent = dispatchEvent(state, EventType.PLAYER_PENALIZED, {
        playerId: steal.playerId,
        targetPlayerId: steal.targetPlayerId,
        actionId: shopId,
      });
      state = penalizeEvent.state;
      if (penalizeEvent.log) log.push(...penalizeEvent.log);
      if (penalizeEvent.pendingDecisions && penalizeEvent.pendingDecisions.length > 0) {
        state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...penalizeEvent.pendingDecisions] };
      }
    }
  }

  // 6b. Dispatch STEAL_ACTION for shops that steal (triggers Black Favor condition)
  if (shopResult.isStealing) {
    const stealActionResult = dispatchEvent(state, EventType.STEAL_ACTION, {
      playerId,
      actionId: shopId,
    });
    state = stealActionResult.state;
    if (stealActionResult.log) log.push(...stealActionResult.log);
    if (stealActionResult.pendingDecisions && stealActionResult.pendingDecisions.length > 0) {
      state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...stealActionResult.pendingDecisions] };
    }
  }

  // 6c. Dispatch RESOURCE_STOLEN for shops that steal resources
  if (shopResult.resourcesStolen && shopResult.resourcesStolen.length > 0) {
    for (const steal of shopResult.resourcesStolen) {
      const stealEvent = dispatchEvent(state, EventType.RESOURCE_STOLEN, {
        playerId: steal.playerId,
        targetPlayerId: steal.targetPlayerId,
        resources: steal.resources,
        source: shopId,
      });
      state = stealEvent.state;
      if (stealEvent.log) log.push(...stealEvent.log);
      if (stealEvent.pendingDecisions && stealEvent.pendingDecisions.length > 0) {
        state = { ...state, decisionQueue: [...(state.decisionQueue || []), ...stealEvent.pendingDecisions] };
      }
    }
  }

  // 7. Mark purchase made this turn + consume shopDiscount effect if active
  state = { ...state, purchaseMadeThisTurn: true };
  const afterShopPlayer = getPlayer(state, playerId);
  if (afterShopPlayer?.effects?.includes('shopDiscount')) {
    state = {
      ...state,
      players: state.players.map(p => {
        if (p.id !== playerId) return p;
        const newEffects = [...(p.effects || [])];
        const idx = newEffects.indexOf('shopDiscount');
        if (idx >= 0) newEffects.splice(idx, 1);
        return { ...p, effects: newEffects };
      }),
    };
  }

  // 8. Dispatch SHOP_USED event
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

  // 2. Check one-per-turn limit
  if (state.purchaseMadeThisTurn) {
    return { state, log: [`You can only make one purchase (shop or power card) per turn`] };
  }

  // 2b. Check noShopThisTurn effect (from Hoard — blocks shops AND power cards)
  const cardBuyPlayer = getPlayer(state, playerId);
  if (cardBuyPlayer?.effects?.includes('noShopThisTurn')) {
    return { state, log: ['Cannot make purchases this turn (Hoard effect)'] };
  }

  // 3. Check god access
  if (!canAccessGod(state, playerId, godColor)) {
    return { state, log: [`Cannot buy ${card.name}: you haven't acted at the ${godColor} god this turn`] };
  }

  // 3. Check card is in market
  const market = (state.powerCardMarkets || {})[godColor] || [];
  if (!market.includes(cardId)) {
    return { state, log: [`${card.name} is not available in the market`] };
  }

  // 4. Check player has card slot (or handle discard-to-replace)
  const champion = state.champions[playerId];
  if (!champion) {
    return { state, log: [`Player ${playerId} has no champion`] };
  }
  const currentCards = champion.powerCards || [];
  if (currentCards.length >= champion.powerCardSlots) {
    if (decisions.discardCardId) {
      // Remove the old card and unregister its handlers
      const oldCard = powerCards[decisions.discardCardId];
      state = removePowerCard(state, playerId, decisions.discardCardId);
      state = removeHandler(state, `${decisions.discardCardId}_p${playerId}`);
      log.push(`Discarded ${oldCard?.name || decisions.discardCardId} to make room`);
    } else {
      // Ask which card to discard
      return {
        state,
        log,
        pendingDecision: {
          type: 'discardArtifact',
          playerId,
          title: `Replace an artifact with ${card.name}`,
          description: card.description,
          newCardId: cardId,
          _source: 'card',
          _playerId: playerId,
          _cardId: cardId,
          options: currentCards.map(id => {
            const c = powerCards[id];
            return {
              id,
              name: c?.name || id,
              description: c?.description || '',
              god: c?.god || '',
            };
          }),
        },
      };
    }
  }

  // 5. Calculate cost (with The Blessed discount and Haggle discount)
  let cost = { ...card.cost };

  // Apply Haggle shopDiscount effect (also applies to power cards)
  const buyPlayer = getPlayer(state, playerId);
  if (buyPlayer?.effects?.includes('shopDiscount')) {
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
    // Consume shopDiscount effect
    state = {
      ...state,
      players: state.players.map(p => {
        if (p.id !== playerId) return p;
        const newEffects = [...(p.effects || [])];
        const idx = newEffects.indexOf('shopDiscount');
        if (idx >= 0) newEffects.splice(idx, 1);
        return { ...p, effects: newEffects };
      }),
    };
    log.push('Haggle discount applied (-2 cost)');
  }

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

  // 7. Slot the card + mark power card bought this turn
  state = slotPowerCard(state, playerId, cardId);
  state = { ...state, purchaseMadeThisTurn: true };
  log.push(`Bought ${card.name}`);

  // 8. Remove from market and immediately replace from deck
  const newMarket = market.filter(id => id !== cardId);
  let newDeck = [...(state.powerCardDecks[godColor] || [])];
  if (newDeck.length > 0) {
    newMarket.push(newDeck.shift());
  }
  state = {
    ...state,
    powerCardMarkets: {
      ...state.powerCardMarkets,
      [godColor]: newMarket,
    },
    powerCardDecks: {
      ...state.powerCardDecks,
      [godColor]: newDeck,
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
    if (card.onPurchase.type === 'redistribute') {
      const player = getPlayer(state, playerId);
      const totalResources = Object.values(player.resources || {}).reduce((sum, v) => sum + Math.max(0, v), 0);
      if (totalResources > 0) {
        return {
          state,
          log,
          pendingDecision: {
            type: 'redistributeResources',
            title: "Alchemist's Trunk: Redistribute your resources",
            sourceId: 'alchemists_trunk',
            ownerId: playerId,
            playerId,
            totalResources,
            colors: state.gods || ['gold', 'black', 'green', 'yellow'],
          },
        };
      }
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
    const stealAmount = decision.effect?.glorySteal || decision.effect?.gloryLoss || 2;
    const target = getPlayer(state, targetId);
    const actualStolen = Math.min(stealAmount, Math.max(0, target?.glory || 0));
    if (actualStolen > 0) {
      state = removeGlory(state, targetId, actualStolen, 'voodoo_doll_victim');
      state = addGlory(state, decision.ownerId, actualStolen, 'voodoo_doll');
    }
    log.push(`Voodoo Doll: stole ${actualStolen} Favor from ${targetId}`);
    // Dispatch STEAL_ACTION for black glory condition
    if (decision.isStealing) {
      const stealResult = dispatchEvent(state, EventType.STEAL_ACTION, {
        playerId: decision.ownerId,
        actionId: 'voodoo_doll',
      });
      state = stealResult.state;
      if (stealResult.log) log.push(...stealResult.log);
    }
  } else if (decision.sourceId === 'chrono_compass' && answer.position) {
    const desiredPosition = answer.position - 1; // Convert 1-indexed to 0-indexed
    const turnOrder = [...(state.turnOrder || [])];
    const currentIdx = turnOrder.indexOf(decision.ownerId);
    if (currentIdx >= 0 && desiredPosition >= 0 && desiredPosition < turnOrder.length) {
      turnOrder.splice(currentIdx, 1);
      turnOrder.splice(desiredPosition, 0, decision.ownerId);
      state = { ...state, turnOrder };
      log.push(`Chrono Compass: moved to position ${answer.position} in turn order`);
    }
  } else if (decision.sourceId === 'prescient_passive' && answer.actionId) {
    state = {
      ...state,
      nullifiedSpaces: { ...state.nullifiedSpaces, [answer.actionId]: true },
    };
    log.push(`The Prescient: nullified ${answer.actionId}`);
  } else if (decision.sourceId === 'fortunate_starting' && answer.gemSelection) {
    // The Fortunate: grant 2 starting resources of chosen colors
    let newState = state;
    for (const [color, amount] of Object.entries(answer.gemSelection)) {
      if (amount > 0) {
        newState = addResources(newState, decision.playerId, { [color]: amount });
      }
    }
    state = newState;
    const totalGained = Object.values(answer.gemSelection).reduce((s, v) => s + v, 0);
    log.push(`The Fortunate: gained ${totalGained} starting resources`);
  } else if (decision.sourceId === 'golden_chalice') {
    // Golden Chalice: gain 1 of chosen non-gold resource
    // Answer may arrive as { gemSelection: { black: 1 } } (wrapped) or { black: 1 } (raw)
    const selection = answer?.gemSelection || answer;
    if (selection && typeof selection === 'object') {
      const chosenColor = Object.keys(selection)[0];
      if (chosenColor) {
        state = addResources(state, decision.ownerId || decision.playerId, { [chosenColor]: 1 });
        log.push(`Golden Chalice: +1 ${chosenColor}`);
      }
    }
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
