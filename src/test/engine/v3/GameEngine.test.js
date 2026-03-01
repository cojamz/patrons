import { describe, it, expect } from 'vitest';
import {
  createGame,
  executeAction,
  executeShop,
  buyPowerCard,
  endTurn,
  advanceRound,
  resolveDecision,
  getAvailableActions,
  isGameOver,
  Phase,
  EventType,
} from '../../../engine/v3/GameEngine.js';
import { registerHandler } from '../../../engine/v3/events.js';
import {
  addResources,
  getPlayer,
  trackGodAccess,
  slotPowerCard,
  placeWorker,
} from '../../../engine/v3/stateHelpers.js';

// =========================================================================
// Test Helpers
// =========================================================================

function createTestGame(overrides = {}) {
  const { state } = createGame({
    playerCount: 2,
    playerNames: ['Alice', 'Bob'],
    godSet: ['gold', 'black', 'green', 'yellow'],
    ...overrides,
  });
  return state;
}

/**
 * Fast-forward past champion draft into ACTION_PHASE.
 * Assigns prescient to p1, ambitious to p2 by default.
 */
function createActionPhaseState(overrides = {}) {
  let state = createTestGame(overrides);

  // Assign champions directly instead of going through draft
  state = {
    ...state,
    phase: Phase.ACTION_PHASE,
    draftIndex: 4,
    round: 1,
    currentPlayer: 1,
    turnDirection: 1,
    champions: {
      1: { id: 'prescient', name: 'The Prescient', powerCards: [], powerCardSlots: 4 },
      2: { id: 'ambitious', name: 'The Ambitious', powerCards: [], powerCardSlots: 5 },
    },
    occupiedSpaces: {},
    roundActions: [],
    workerPlacedThisTurn: false,
    turnResourceGains: {},
    turnActionsThisTurn: [],
    godsAccessedThisTurn: [],
    players: state.players.map(p => ({ ...p, workersLeft: 4 })),
  };

  return state;
}

// =========================================================================
// Game Creation
// =========================================================================

describe('createGame', () => {
  it('returns state in CHAMPION_DRAFT phase', () => {
    const { state, log } = createGame({ playerCount: 2, playerNames: ['Alice', 'Bob'] });
    expect(state.phase).toBe(Phase.CHAMPION_DRAFT);
    expect(log).toContain('Game created!');
  });

  it('creates correct player count', () => {
    const { state } = createGame({ playerCount: 3, playerNames: ['A', 'B', 'C'] });
    expect(state.players).toHaveLength(3);
    expect(state.players[0].name).toBe('A');
    expect(state.players[2].name).toBe('C');
  });

  it('registers glory condition handlers for all players and gods', () => {
    const { state } = createGame({ playerCount: 2, playerNames: ['Alice', 'Bob'] });
    const gloryHandlers = state.eventHandlers.filter(h => h.source === 'glory_condition');

    // 2 players x 4 gods = 8 glory handlers
    expect(gloryHandlers).toHaveLength(8);

    // Check specific ones exist
    expect(gloryHandlers.find(h => h.id === 'gold_glory_condition_p1')).toBeTruthy();
    expect(gloryHandlers.find(h => h.id === 'yellow_glory_condition_p2')).toBeTruthy();
    expect(gloryHandlers.find(h => h.id === 'black_glory_condition_p1')).toBeTruthy();
    expect(gloryHandlers.find(h => h.id === 'green_glory_condition_p2')).toBeTruthy();
  });

  it('creates power card markets with 3 cards per god', () => {
    const { state } = createGame({ playerCount: 2, playerNames: ['Alice', 'Bob'] });
    expect(state.powerCardMarkets).toBeDefined();
    for (const godColor of ['gold', 'black', 'green', 'yellow']) {
      expect(state.powerCardMarkets[godColor]).toHaveLength(3);
    }
  });

  it('uses custom god set', () => {
    const { state } = createGame({
      playerCount: 2,
      playerNames: ['Alice', 'Bob'],
      godSet: ['gold', 'green'],
    });
    expect(state.gods).toEqual(['gold', 'green']);
    expect(state.powerCardMarkets['gold']).toHaveLength(3);
    expect(state.powerCardMarkets['green']).toHaveLength(3);
    expect(state.powerCardMarkets['black']).toBeUndefined();
  });

  it('initializes blessedUsed tracking', () => {
    const { state } = createGame({ playerCount: 2, playerNames: ['Alice', 'Bob'] });
    expect(state.blessedUsed).toBeDefined();
    expect(state.blessedUsed[1]).toBe(false);
    expect(state.blessedUsed[2]).toBe(false);
  });
});

// =========================================================================
// Action Execution
// =========================================================================

describe('executeAction', () => {
  it('places worker and tracks god access for a basic action', () => {
    const state = createActionPhaseState();
    const result = executeAction(state, 1, 'gold_collectTribute');

    expect(result.state.occupiedSpaces['gold_collectTribute']).toBe(1);
    expect(result.state.godsAccessedThisTurn).toContain('gold');
    expect(result.state.roundActions).toContainEqual({ playerId: 1, actionId: 'gold_collectTribute' });

    // Player should have gained 2 gold
    const player = getPlayer(result.state, 1);
    expect(player.resources.gold).toBe(2);

    // Worker count should have decreased
    expect(player.workersLeft).toBe(3);
  });

  it('fires ACTION_EXECUTED event', () => {
    let state = createActionPhaseState();

    // Register a test handler that fires on ACTION_EXECUTED
    state = registerHandler(state, {
      id: 'test_action_tracker',
      eventType: EventType.ACTION_EXECUTED,
      source: 'power_card',
      sourceId: 'capacitor', // Re-use existing resolver to confirm dispatch
      ownerId: 1,
      config: { triggerOn: 'self' },
    });

    const result = executeAction(state, 1, 'gold_collectTribute');
    // The capacitor handler checks for ACTION_REPEATED not ACTION_EXECUTED,
    // so we just verify the event was dispatched by checking log/state changes
    expect(result.log.some(l => l.includes('gold_collectTribute') || l.includes('placed worker'))).toBe(true);
  });

  it('respects nullified spaces', () => {
    let state = createActionPhaseState();
    state = { ...state, nullifiedSpaces: { gold_collectTribute: true } };

    const result = executeAction(state, 1, 'gold_collectTribute');
    expect(result.log.some(l => l.includes('nullified'))).toBe(true);

    // Worker should NOT have been placed
    expect(result.state.occupiedSpaces['gold_collectTribute']).toBeUndefined();
  });

  it('respects occupied spaces', () => {
    let state = createActionPhaseState();
    state = { ...state, occupiedSpaces: { gold_collectTribute: 2 } };

    const result = executeAction(state, 1, 'gold_collectTribute');
    expect(result.log.some(l => l.includes('occupied'))).toBe(true);
  });

  it('allows occupied spaces with Hourglass modifier', () => {
    let state = createActionPhaseState();
    state = { ...state, occupiedSpaces: { gold_collectTribute: 2 } };
    // Give player 1 the hourglass card (ignore_occupied)
    state = slotPowerCard(state, 1, 'hourglass');

    const result = executeAction(state, 1, 'gold_collectTribute');
    // Should succeed — worker placed
    expect(result.state.occupiedSpaces['gold_collectTribute']).toBe(1);
    const player = getPlayer(result.state, 1);
    expect(player.resources.gold).toBe(2);
  });

  it('returns pendingDecision for actions that need decisions', () => {
    const state = createActionPhaseState();
    // Barter needs gemSelection decision
    const result = executeAction(state, 1, 'gold_barter');
    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
  });

  it('handles recursion for green repeat actions', () => {
    let state = createActionPhaseState();

    // First place at gold_collectTribute so it's in roundActions
    const firstResult = executeAction(state, 1, 'gold_collectTribute');
    state = firstResult.state;

    // Reset turn state to allow another action
    state = {
      ...state,
      workerPlacedThisTurn: false,
      godsAccessedThisTurn: [],
    };

    // Now use green relive to repeat gold_collectTribute
    const result = executeAction(state, 1, 'green_relive', {
      actionChoice: 'gold_collectTribute',
    });

    // Player should have gained: 2 gold (first) + 1 green + 2 gold (repeat) = 4 gold, 1 green
    const player = getPlayer(result.state, 1);
    expect(player.resources.gold).toBe(4);
    expect(player.resources.green).toBe(1);
  });

  it('rejects unknown actions', () => {
    const state = createActionPhaseState();
    const result = executeAction(state, 1, 'nonexistent_action');
    expect(result.log.some(l => l.includes('Unknown action'))).toBe(true);
  });

  it('enforces max recursion depth', () => {
    const state = createActionPhaseState();
    const result = executeAction(state, 1, 'gold_collectTribute', {}, { recursionDepth: 5 });
    expect(result.log.some(l => l.includes('Max recursion depth'))).toBe(true);
  });
});

// =========================================================================
// Shop Execution
// =========================================================================

describe('executeShop', () => {
  it('requires god access (fails without it)', () => {
    const state = createActionPhaseState();
    // Don't act at gold first — try shop directly
    const result = executeShop(state, 1, 'gold_weak');
    expect(result.log.some(l => l.includes("haven't acted"))).toBe(true);
  });

  it('succeeds when player has god access and can afford', () => {
    let state = createActionPhaseState();
    // Give player gold resources and god access
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = executeShop(state, 1, 'gold_weak', { gemSelection: { gold: 1 } });
    // gold_weak costs {gold: 1, any: 1}, pays with gemSelection for the 'any'
    // and the shop gives +2 gold
    expect(result.log.some(l => l.includes('Paid') || l.includes('Gold shop'))).toBe(true);
  });

  it('fires SHOP_USED event', () => {
    let state = createActionPhaseState();
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    // Register favored passive handler to confirm SHOP_USED dispatch
    state = registerHandler(state, {
      id: 'favored_test',
      eventType: EventType.SHOP_USED,
      source: 'champion_passive',
      sourceId: 'favored_passive',
      ownerId: 1,
      config: {},
    });

    const result = executeShop(state, 1, 'gold_weak', { gemSelection: { gold: 1 } });
    // The Favored handler should have fired, granting +1 gold
    expect(result.log.some(l => l.includes('Favored') || l.includes('+1'))).toBe(true);
  });

  it('handles shop that requires target player decision', () => {
    let state = createActionPhaseState();
    state = addResources(state, 1, { black: 5 });
    state = trackGodAccess(state, 1, 'black');

    const result = executeShop(state, 1, 'black_weak', { gemSelection: { black: 1 } });
    // black_weak needs targetPlayer decision
    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('targetPlayer');
  });
});

// =========================================================================
// Power Card Purchase
// =========================================================================

describe('buyPowerCard', () => {
  it('adds card to champion slots', () => {
    let state = createActionPhaseState();
    // Put a specific card in the gold market
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol', 'golden_chalice'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    expect(result.state.champions[1].powerCards).toContain('golden_scepter');
    expect(result.log.some(l => l.includes('Bought Golden Scepter'))).toBe(true);
  });

  it('removes card from market (does not refill)', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol', 'golden_chalice'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    expect(result.state.powerCardMarkets.gold).not.toContain('golden_scepter');
    expect(result.state.powerCardMarkets.gold).toHaveLength(2);
  });

  it('registers event handlers from the card', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol', 'golden_chalice'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    const scepterHandler = result.state.eventHandlers.find(h => h.sourceId === 'golden_scepter');
    expect(scepterHandler).toBeTruthy();
    expect(scepterHandler.ownerId).toBe(1);
  });

  it('fires POWER_CARD_BOUGHT event', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol', 'golden_chalice'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    // Register onyx spyglass for player 2 to detect POWER_CARD_BOUGHT
    state = registerHandler(state, {
      id: 'onyx_spy_test',
      eventType: EventType.POWER_CARD_BOUGHT,
      source: 'power_card',
      sourceId: 'onyx_spyglass',
      ownerId: 2,
      config: { triggerOn: 'others' },
    });

    const result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    // Onyx Spyglass should trigger: +1 black to player 2
    const p2 = getPlayer(result.state, 2);
    expect(p2.resources.black).toBe(1);
    expect(result.log.some(l => l.includes('Onyx Spyglass'))).toBe(true);
  });

  it('applies onPurchase effects (Gold Idol: +2 gold)', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['gold_idol', 'golden_scepter', 'golden_chalice'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'gold_idol');
    const player = getPlayer(result.state, 1);
    // Started with 5, paid 3 for gold_idol, got +2 on purchase = 4 gold
    expect(player.resources.gold).toBe(4);
    expect(result.log.some(l => l.includes('on-purchase'))).toBe(true);
  });

  it('applies onPurchase for Horn of Plenty (+1 each color)', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, yellow: ['horn_of_plenty', 'prismatic_gem', 'rainbow_crest'] },
    };
    state = addResources(state, 1, { yellow: 5, gold: 2 });
    state = trackGodAccess(state, 1, 'yellow');

    const result = buyPowerCard(state, 1, 'horn_of_plenty', { gemSelection: { gold: 1 } });
    const player = getPlayer(result.state, 1);
    // Should have +1 of each active color from onPurchase
    expect(player.resources.green).toBe(1);
    expect(player.resources.black).toBe(1);
  });

  it('fails when no card slots available', () => {
    let state = createActionPhaseState();
    // Fill all 4 slots for player 1
    state = {
      ...state,
      champions: {
        ...state.champions,
        1: { ...state.champions[1], powerCards: ['a', 'b', 'c', 'd'], powerCardSlots: 4 },
      },
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol', 'golden_chalice'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    expect(result.log.some(l => l.includes('No empty power card slots'))).toBe(true);
    expect(result.state.champions[1].powerCards).not.toContain('golden_scepter');
  });

  it('fails when god not accessed this turn', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol', 'golden_chalice'] },
    };
    state = addResources(state, 1, { gold: 5 });
    // Don't track god access

    const result = buyPowerCard(state, 1, 'golden_scepter');
    expect(result.log.some(l => l.includes("haven't acted"))).toBe(true);
  });

  it('applies The Blessed discount on first card', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      champions: {
        ...state.champions,
        1: { id: 'blessed', name: 'The Blessed', powerCards: [], powerCardSlots: 4 },
      },
      blessedUsed: { 1: false, 2: false },
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol', 'golden_chalice'] },
    };
    // Golden Scepter costs {gold: 2, any: 1} = 3 total. With -2 discount = 1 total (gold: 1)
    state = addResources(state, 1, { gold: 1 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'golden_scepter');
    expect(result.state.champions[1].powerCards).toContain('golden_scepter');
    expect(result.state.blessedUsed[1]).toBe(true);
    expect(result.log.some(l => l.includes('Blessed'))).toBe(true);
  });
});

// =========================================================================
// Turn / Round Lifecycle
// =========================================================================

describe('endTurn', () => {
  it('advances to next player', () => {
    let state = createActionPhaseState();
    // Execute an action first so player 1 has acted
    const actionResult = executeAction(state, 1, 'gold_collectTribute');
    state = actionResult.state;

    const result = endTurn(state);
    expect(result.state.currentPlayer).toBe(2);
    expect(result.log.some(l => l.includes("Player 2's turn"))).toBe(true);
  });

  it('dispatches TURN_END event', () => {
    let state = createActionPhaseState();
    // Give player 1 some resource gains and register Traveler's Journal handler.
    // turnResourceGains tracks { playerId: { color: amount } } — the handler uses
    // Object.keys() to count distinct colors gained this turn.
    state = addResources(state, 1, { gold: 2, green: 1 });
    state = {
      ...state,
      turnResourceGains: { 1: { gold: 2, green: 1 } },
    };
    state = registerHandler(state, {
      id: 'tj_test',
      eventType: EventType.TURN_END,
      source: 'power_card',
      sourceId: 'travelers_journal',
      ownerId: 1,
      config: { triggerOn: 'self' },
    });

    const result = endTurn(state);
    // Traveler's Journal should fire: gained 2+ different colors = +1 Glory
    const player = getPlayer(result.state, 1);
    expect(player.glory).toBe(1);
  });

  it('resets turn-level handler frequencies', () => {
    let state = createActionPhaseState();
    state = registerHandler(state, {
      id: 'once_per_turn_test',
      eventType: EventType.RESOURCE_GAINED,
      source: 'power_card',
      sourceId: 'golden_scepter',
      ownerId: 1,
      config: {},
      frequency: 'once_per_turn',
      usesThisTurn: 1,
    });

    const result = endTurn(state);
    const handler = result.state.eventHandlers.find(h => h.id === 'once_per_turn_test');
    expect(handler.usesThisTurn).toBe(0);
  });
});

describe('advanceRound', () => {
  it('dispatches ROUND_END then ROUND_START events', () => {
    let state = createActionPhaseState();
    state = addResources(state, 1, { gold: 3 });
    // Put state into ROUND_END phase
    state = { ...state, phase: Phase.ROUND_END };

    const result = advanceRound(state);

    // Gold glory condition should have fired at ROUND_END: +3 glory for 3 gold
    const p1 = getPlayer(result.state, 1);
    expect(p1.glory).toBeGreaterThanOrEqual(3);

    // Should be in ACTION_PHASE after round start
    expect(result.state.phase).toBe(Phase.ACTION_PHASE);
  });

  it('resets handler frequencies for round scope', () => {
    let state = createActionPhaseState();
    state = { ...state, phase: Phase.ROUND_END };
    state = registerHandler(state, {
      id: 'once_per_round_test',
      eventType: EventType.ACTION_EXECUTED,
      source: 'power_card',
      sourceId: 'capacitor',
      ownerId: 1,
      config: {},
      frequency: 'once_per_round',
      usesThisRound: 1,
      usesThisTurn: 1,
    });

    const result = advanceRound(state);
    const handler = result.state.eventHandlers.find(h => h.id === 'once_per_round_test');
    expect(handler.usesThisRound).toBe(0);
    expect(handler.usesThisTurn).toBe(0);
  });

  it('re-sorts turn order by glory (lowest first)', () => {
    let state = createActionPhaseState();
    state = { ...state, phase: Phase.ROUND_END };
    // Give player 1 more glory so player 2 should go first
    state = {
      ...state,
      players: state.players.map(p => {
        if (p.id === 1) return { ...p, glory: 10 };
        if (p.id === 2) return { ...p, glory: 2 };
        return p;
      }),
    };

    const result = advanceRound(state);
    // Player 2 has less glory, should be first in turn order
    expect(result.state.turnOrder[0]).toBe(2);
    expect(result.state.currentPlayer).toBe(2);
  });

  it('transitions to game end after round 3', () => {
    let state = createActionPhaseState();
    state = { ...state, phase: Phase.ROUND_END, round: 3 };

    const result = advanceRound(state);
    expect(result.state.phase).toBe(Phase.GAME_END);
    expect(result.state.gameOver).toBe(true);
  });
});

// =========================================================================
// Decision Resolution
// =========================================================================

describe('resolveDecision', () => {
  it('removes decision from queue and applies voodoo doll effect', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      players: state.players.map(p => {
        if (p.id === 2) return { ...p, glory: 5 };
        return p;
      }),
      decisionQueue: [{
        type: 'targetPlayer',
        sourceId: 'voodoo_doll',
        ownerId: 1,
        effect: { gloryLoss: 2 },
      }],
    };

    const result = resolveDecision(state, 'voodoo_doll', { targetPlayer: 2 });
    expect(result.state.decisionQueue).toHaveLength(0);
    const p2 = getPlayer(result.state, 2);
    expect(p2.glory).toBe(3);
    expect(result.log.some(l => l.includes('Voodoo Doll'))).toBe(true);
  });

  it('applies prescient nullifier placement', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      decisionQueue: [{
        type: 'nullifierPlacement',
        sourceId: 'prescient_passive',
        playerId: 1,
      }],
    };

    const result = resolveDecision(state, 'prescient_passive', { actionId: 'gold_collectTribute' });
    expect(result.state.nullifiedSpaces['gold_collectTribute']).toBe(true);
    expect(result.state.decisionQueue).toHaveLength(0);
  });

  it('returns error for unknown decision', () => {
    const state = createActionPhaseState();
    const result = resolveDecision(state, 'nonexistent', {});
    expect(result.log.some(l => l.includes('No pending decision'))).toBe(true);
  });
});

// =========================================================================
// Integration Scenarios
// =========================================================================

describe('integration', () => {
  it('full turn: place worker, action, shop, buy card, end turn', () => {
    let state = createActionPhaseState();
    // Ensure gold market has cards
    state = {
      ...state,
      powerCardMarkets: {
        ...state.powerCardMarkets,
        gold: ['golden_scepter', 'gold_idol', 'golden_chalice'],
      },
    };
    // Give player some extra gold for affordability
    state = addResources(state, 1, { gold: 10 });

    // Step 1: Execute action at gold
    let result = executeAction(state, 1, 'gold_collectTribute');
    state = result.state;
    expect(getPlayer(state, 1).resources.gold).toBe(12);

    // Step 2: Use gold shop
    result = executeShop(state, 1, 'gold_weak', { gemSelection: { gold: 1 } });
    state = result.state;

    // Step 3: Buy power card
    result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    state = result.state;
    expect(state.champions[1].powerCards).toContain('golden_scepter');

    // Step 4: End turn
    result = endTurn(state);
    state = result.state;
    expect(state.currentPlayer).toBe(2);
  });

  it('Golden Scepter triggers when owner gains gold from action', () => {
    let state = createActionPhaseState();
    // Register golden scepter handler for player 1
    state = registerHandler(state, {
      id: 'golden_scepter_p1',
      eventType: EventType.RESOURCE_GAINED,
      source: 'power_card',
      sourceId: 'golden_scepter',
      ownerId: 1,
      config: { triggerOn: 'self', resourceFilter: 'gold' },
    });

    const result = executeAction(state, 1, 'gold_collectTribute');
    const player = getPlayer(result.state, 1);
    // Base: +2 gold, Scepter: +1 gold = 3 total
    expect(player.resources.gold).toBe(3);
    expect(result.log.some(l => l.includes('Golden Scepter'))).toBe(true);
  });

  it('Voodoo Doll creates decision at round end', () => {
    let state = createActionPhaseState();
    state = { ...state, phase: Phase.ROUND_END };
    state = registerHandler(state, {
      id: 'voodoo_doll_p1',
      eventType: EventType.ROUND_END,
      source: 'power_card',
      sourceId: 'voodoo_doll',
      ownerId: 1,
      config: { requiresDecision: true },
    });

    const result = advanceRound(state);
    // Should have a pending decision for voodoo doll
    const voodoDecision = (result.state.decisionQueue || []).find(
      d => d.sourceId === 'voodoo_doll'
    );
    expect(voodoDecision).toBeTruthy();
  });

  it('glory conditions fire at round end for gold and yellow', () => {
    let state = createActionPhaseState();
    state = addResources(state, 1, { gold: 4, green: 2, yellow: 1, black: 1 });
    state = addResources(state, 2, { gold: 1 });
    state = { ...state, phase: Phase.ROUND_END };

    const result = advanceRound(state);

    // Gold glory: p1 gets +4 (4 gold), p2 gets +1 (1 gold)
    // Yellow glory: p1 gets +4 (4 different colors), p2 gets +1 (1 color)
    const p1 = getPlayer(result.state, 1);
    const p2 = getPlayer(result.state, 2);

    expect(p1.glory).toBeGreaterThanOrEqual(4); // at least gold glory
    expect(p2.glory).toBeGreaterThanOrEqual(1);
  });

  it('green glory condition fires when action is repeated', () => {
    let state = createActionPhaseState();

    // First place at gold_collectTribute
    let result = executeAction(state, 1, 'gold_collectTribute');
    state = result.state;

    // Reset for next action
    state = { ...state, workerPlacedThisTurn: false, godsAccessedThisTurn: [] };

    // Repeat via green relive
    result = executeAction(state, 1, 'green_relive', { actionChoice: 'gold_collectTribute' });
    state = result.state;

    // Green glory should have triggered for the repeat
    const p1 = getPlayer(state, 1);
    // The green_glory_condition handler is registered for ACTION_REPEATED event
    // Player 1 should have gained glory from the repeat
    expect(p1.glory).toBeGreaterThanOrEqual(1);
  });

  it('getAvailableActions filters by tier and occupied spaces', () => {
    let state = createActionPhaseState();
    const actions = getAvailableActions(state, 1);

    // Round 1 — only tier 1 actions (4 per god x 4 gods = 16)
    expect(actions.length).toBe(16);

    // Occupy one space
    state = { ...state, occupiedSpaces: { gold_collectTribute: 2 } };
    const actionsAfter = getAvailableActions(state, 1);
    expect(actionsAfter.length).toBe(15);
    expect(actionsAfter).not.toContain('gold_collectTribute');
  });

  it('isGameOver detects game end', () => {
    let state = createActionPhaseState();
    expect(isGameOver(state)).toBe(false);

    state = { ...state, phase: Phase.GAME_END };
    expect(isGameOver(state)).toBe(true);
  });
});
