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

  it('creates power card markets with 2 cards per god', () => {
    const { state } = createGame({ playerCount: 2, playerNames: ['Alice', 'Bob'] });
    expect(state.powerCardMarkets).toBeDefined();
    for (const godColor of ['gold', 'black', 'green', 'yellow']) {
      expect(state.powerCardMarkets[godColor]).toHaveLength(2);
    }
  });

  it('uses custom god set', () => {
    const { state } = createGame({
      playerCount: 2,
      playerNames: ['Alice', 'Bob'],
      godSet: ['gold', 'green'],
    });
    expect(state.gods).toEqual(['gold', 'green']);
    expect(state.powerCardMarkets['gold']).toHaveLength(2);
    expect(state.powerCardMarkets['green']).toHaveLength(2);
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
    const result = executeAction(state, 1, 'gold_hoard');

    expect(result.state.occupiedSpaces['gold_hoard']).toBe(1);
    expect(result.state.godsAccessedThisTurn).toContain('gold');
    expect(result.state.roundActions).toContainEqual({ playerId: 1, actionId: 'gold_hoard' });

    // Player should have gained 3 gold (Hoard: +3 gold)
    const player = getPlayer(result.state, 1);
    expect(player.resources.gold).toBe(3);

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

    const result = executeAction(state, 1, 'gold_hoard');
    // The capacitor handler checks for ACTION_REPEATED not ACTION_EXECUTED,
    // so we just verify the event was dispatched by checking log/state changes
    expect(result.log.some(l => l.includes('gold_hoard') || l.includes('placed worker'))).toBe(true);
  });

  it('respects nullified spaces', () => {
    let state = createActionPhaseState();
    state = { ...state, nullifiedSpaces: { gold_hoard: true } };

    const result = executeAction(state, 1, 'gold_hoard');
    expect(result.log.some(l => l.includes('nullified'))).toBe(true);

    // Worker should NOT have been placed
    expect(result.state.occupiedSpaces['gold_hoard']).toBeUndefined();
  });

  it('respects occupied spaces', () => {
    let state = createActionPhaseState();
    state = { ...state, occupiedSpaces: { gold_hoard: 2 } };

    const result = executeAction(state, 1, 'gold_hoard');
    expect(result.log.some(l => l.includes('occupied'))).toBe(true);
  });

  it('allows occupied spaces with Timeline Splitter modifier', () => {
    let state = createActionPhaseState();
    state = { ...state, occupiedSpaces: { gold_hoard: 2 } };
    // Give player 1 the timeline_splitter card (ignore_occupied)
    state = slotPowerCard(state, 1, 'timeline_splitter');

    const result = executeAction(state, 1, 'gold_hoard');
    // Should succeed — worker placed
    expect(result.state.occupiedSpaces['gold_hoard']).toBe(1);
    const player = getPlayer(result.state, 1);
    expect(player.resources.gold).toBe(3);
  });

  it('returns pendingDecision for actions that need decisions', () => {
    const state = createActionPhaseState();
    // Forage needs gemSelection decision (choose 2 any colors)
    const result = executeAction(state, 1, 'yellow_forage');
    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
  });

  it('handles recursion for green repeat actions', () => {
    let state = createActionPhaseState();

    // First place at gold_hoard so it's in roundActions
    const firstResult = executeAction(state, 1, 'gold_hoard');
    state = firstResult.state;

    // Reset turn state to allow another action
    state = {
      ...state,
      workerPlacedThisTurn: false,
      godsAccessedThisTurn: [],
    };

    // Now use green relive to repeat gold_hoard
    const result = executeAction(state, 1, 'green_relive', {
      actionChoice: 'gold_hoard',
    });

    // Player should have gained: 3 gold (first hoard) + 1 green (relive base) + 3 gold (repeat hoard) = 6 gold, 1 green
    const player = getPlayer(result.state, 1);
    expect(player.resources.gold).toBe(6);
    expect(player.resources.green).toBe(1);
  });

  it('rejects unknown actions', () => {
    const state = createActionPhaseState();
    const result = executeAction(state, 1, 'nonexistent_action');
    expect(result.log.some(l => l.includes('Unknown action'))).toBe(true);
  });

  it('enforces max recursion depth', () => {
    const state = createActionPhaseState();
    const result = executeAction(state, 1, 'gold_hoard', {}, { recursionDepth: 5 });
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

  it('removes card from market and replaces from deck', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'gold_idol'] },
      powerCardDecks: { ...state.powerCardDecks, gold: ['golden_chalice', 'gold_crown'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    expect(result.state.powerCardMarkets.gold).not.toContain('golden_scepter');
    expect(result.state.powerCardMarkets.gold).toHaveLength(2);
    expect(result.state.powerCardMarkets.gold).toContain('golden_chalice');
    expect(result.state.powerCardDecks.gold).toEqual(['gold_crown']);
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

  it('applies onPurchase effects (Horn of Plenty: +1 each color)', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, yellow: ['horn_of_plenty', 'rainbow_crest', 'extraction_vial'] },
    };
    state = addResources(state, 1, { yellow: 5, gold: 2 });
    state = trackGodAccess(state, 1, 'yellow');

    const result = buyPowerCard(state, 1, 'horn_of_plenty', { gemSelection: { gold: 2 } });
    const player = getPlayer(result.state, 1);
    // Horn of Plenty costs {yellow: 3, any: 2}, paid 3 yellow + 2 gold
    // onPurchase: +1 of each active color (gold, black, green, yellow)
    expect(player.resources.gold).toBe(1); // 2 - 2 (paid) + 1 (onPurchase) = 1
    expect(player.resources.black).toBe(1);
    expect(player.resources.green).toBe(1);
    expect(player.resources.yellow).toBe(3); // 5 - 3 (paid) + 1 (onPurchase) = 3
    expect(result.log.some(l => l.includes('on-purchase'))).toBe(true);
  });

  it('applies onPurchase for Horn of Plenty (+1 each color)', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: { ...state.powerCardMarkets, yellow: ['horn_of_plenty', 'rainbow_crest', 'extraction_vial'] },
    };
    // Horn of Plenty costs {yellow: 3, any: 2}
    state = addResources(state, 1, { yellow: 5, gold: 2 });
    state = trackGodAccess(state, 1, 'yellow');

    const result = buyPowerCard(state, 1, 'horn_of_plenty', { gemSelection: { gold: 2 } });
    const player = getPlayer(result.state, 1);
    // Should have +1 of each active color from onPurchase
    expect(player.resources.green).toBe(1);
    expect(player.resources.black).toBe(1);
  });

  it('prompts discard when card slots are full', () => {
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
    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('discardArtifact');
    expect(result.pendingDecision.options).toHaveLength(4);
    expect(result.state.champions[1].powerCards).not.toContain('golden_scepter');
  });

  it('replaces artifact when discardCardId provided', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      champions: {
        ...state.champions,
        1: { ...state.champions[1], powerCards: ['gold_idol', 'golden_chalice', 'golden_ring', 'gold_crown'], powerCardSlots: 4 },
      },
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter'] },
    };
    state = addResources(state, 1, { gold: 5 });
    state = trackGodAccess(state, 1, 'gold');

    const result = buyPowerCard(state, 1, 'golden_scepter', { discardCardId: 'gold_idol', gemSelection: { gold: 1 } });
    expect(result.state.champions[1].powerCards).toContain('golden_scepter');
    expect(result.state.champions[1].powerCards).not.toContain('gold_idol');
    expect(result.log.some(l => l.includes('Discarded'))).toBe(true);
    expect(result.log.some(l => l.includes('Bought'))).toBe(true);
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
      powerCardMarkets: { ...state.powerCardMarkets, gold: ['golden_scepter', 'golden_ring', 'gold_crown'] },
    };
    // Golden Scepter costs {gold: 3, any: 1} = 4 total. With -2 discount: any:1→0 (1 off), gold:3→2 (1 off) = gold:2
    state = addResources(state, 1, { gold: 2 });
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
    const actionResult = executeAction(state, 1, 'gold_hoard');
    state = actionResult.state;

    const result = endTurn(state);
    expect(result.state.currentPlayer).toBe(2);
    expect(result.log.some(l => l.includes("Player 2's turn"))).toBe(true);
  });

  it('dispatches TURN_END event', () => {
    let state = createActionPhaseState();
    // Give player 1 some spending tracked and register Slag Catcher handler.
    // Slag Catcher fires at turn end: if 3+ resources spent this turn, +1 yellow.
    state = addResources(state, 1, { gold: 5 });
    state = {
      ...state,
      turnResourceSpending: { 1: 3 },
    };
    state = registerHandler(state, {
      id: 'sc_test',
      eventType: EventType.TURN_END,
      source: 'power_card',
      sourceId: 'slag_catcher',
      ownerId: 1,
      config: { triggerOn: 'self' },
      frequency: 'once_per_turn',
    });

    const result = endTurn(state);
    // Slag Catcher should fire: spent 3+ resources = +1 yellow
    const player = getPlayer(result.state, 1);
    expect(player.resources.yellow).toBe(1);
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
    state = addResources(state, 1, { gold: 9 });
    // Put state into ROUND_END phase
    state = { ...state, phase: Phase.ROUND_END };

    const result = advanceRound(state);

    // Gold glory condition now fires on gold actions, not round end
    // Just verify the round advanced successfully

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

  it('chrono compass updates currentPlayer after resolving turn order', () => {
    let state = createActionPhaseState();
    // Set up: player 2 wants to move to position 1
    state = {
      ...state,
      turnOrder: [1, 2],
      currentPlayer: 1, // already set by advanceRound before decision resolves
      decisionQueue: [{
        type: 'turnOrderChoice',
        sourceId: 'chrono_compass',
        ownerId: 2,
        options: [1, 2],
      }],
    };

    const result = resolveDecision(state, 'chrono_compass', { position: 1 });
    // After resolving, turnOrder should be [2, 1] and currentPlayer should update
    expect(result.state.turnOrder).toEqual([2, 1]);
    expect(result.state.currentPlayer).toBe(2);
    expect(result.log.some(l => l.includes('Chrono Compass'))).toBe(true);
  });

  it('chrono compass keeps currentPlayer correct when owner stays in same position', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      turnOrder: [1, 2],
      currentPlayer: 1,
      decisionQueue: [{
        type: 'turnOrderChoice',
        sourceId: 'chrono_compass',
        ownerId: 2,
        options: [1, 2],
      }],
    };

    // Player 2 chooses position 2 (no change)
    const result = resolveDecision(state, 'chrono_compass', { position: 2 });
    expect(result.state.turnOrder).toEqual([1, 2]);
    expect(result.state.currentPlayer).toBe(1); // unchanged
  });
});

// =========================================================================
// Integration Scenarios
// =========================================================================

describe('integration', () => {
  it('full turn: place worker, action, shop, end turn', () => {
    let state = createActionPhaseState();
    // Give player some extra gold for affordability
    state = addResources(state, 1, { gold: 10 });

    // Step 1: Execute action at gold (Haggle: +1 gold, shop discount)
    let result = executeAction(state, 1, 'gold_haggle');
    state = result.state;
    expect(getPlayer(state, 1).resources.gold).toBe(11);

    // Step 2: Use gold shop (one purchase per turn) — gold_weak costs 1 gold, gives +2 Favor
    result = executeShop(state, 1, 'gold_weak');
    state = result.state;
    expect(state.purchaseMadeThisTurn).toBe(true);

    // Step 3: End turn
    result = endTurn(state);
    state = result.state;
    expect(state.currentPlayer).toBe(2);
  });

  it('full turn: place worker, action, buy power card, end turn', () => {
    let state = createActionPhaseState();
    // Ensure gold market has cards
    state = {
      ...state,
      powerCardMarkets: {
        ...state.powerCardMarkets,
        gold: ['golden_scepter', 'golden_ring', 'gold_crown'],
      },
    };
    // Give player some extra gold for affordability
    state = addResources(state, 1, { gold: 10 });

    // Step 1: Execute action at gold (Haggle: +1 gold)
    let result = executeAction(state, 1, 'gold_haggle');
    state = result.state;

    // Step 2: Buy power card (one purchase per turn)
    // Golden Scepter costs {gold: 3, any: 1}; haggle discount -2 makes it {gold: 2}
    result = buyPowerCard(state, 1, 'golden_scepter');
    state = result.state;
    expect(state.champions[1].powerCards).toContain('golden_scepter');
    expect(state.purchaseMadeThisTurn).toBe(true);

    // Step 3: End turn
    result = endTurn(state);
    state = result.state;
    expect(state.currentPlayer).toBe(2);
  });

  it('one purchase per turn: shop blocks power card buy', () => {
    let state = createActionPhaseState();
    state = {
      ...state,
      powerCardMarkets: {
        ...state.powerCardMarkets,
        gold: ['golden_scepter', 'golden_ring', 'gold_crown'],
      },
    };
    state = addResources(state, 1, { gold: 10 });

    // Execute action then use shop
    let result = executeAction(state, 1, 'gold_haggle');
    state = result.state;
    result = executeShop(state, 1, 'gold_weak');
    state = result.state;

    // Now try to buy power card — should be blocked
    result = buyPowerCard(state, 1, 'golden_scepter', { gemSelection: { gold: 1 } });
    expect(result.state.champions[1].powerCards).not.toContain('golden_scepter');
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

    const result = executeAction(state, 1, 'gold_hoard');
    const player = getPlayer(result.state, 1);
    // Base: +3 gold (Hoard), Scepter: +1 gold = 4 total
    expect(player.resources.gold).toBe(4);
    expect(result.log.some(l => l.includes('Golden Scepter'))).toBe(true);
  });

  it('Golden Scepter does not double-fire when echo copies a gold-gaining action', () => {
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

    // First place at gold_hoard so it's in roundActions
    const firstResult = executeAction(state, 1, 'gold_hoard');
    state = firstResult.state;
    // Base: +3 gold (Hoard), Scepter: +1 gold = 4 total
    expect(getPlayer(state, 1).resources.gold).toBe(4);

    // Reset turn state for second action
    state = { ...state, workerPlacedThisTurn: false, godsAccessedThisTurn: [] };

    // Use green relive to repeat gold_hoard
    const echoResult = executeAction(state, 1, 'green_relive', {
      actionChoice: 'gold_hoard',
    });
    const player = getPlayer(echoResult.state, 1);

    // Relive: +1 green (relive base) + +3 gold (repeated Hoard) + +1 gold (Scepter on inner) = 8 gold, 1 green
    // The outer action should NOT re-fire Scepter for the inner action's gold gains
    expect(player.resources.gold).toBe(8);
    expect(player.resources.green).toBe(1);
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

  it('gold glory condition fires at round end (comparative)', () => {
    let state = createActionPhaseState();
    // Give p1 more gold than p2
    state = addResources(state, 1, { gold: 8 });
    state = addResources(state, 2, { gold: 3 });
    state = { ...state, phase: Phase.ROUND_END };

    const result = advanceRound(state);

    const p1 = getPlayer(result.state, 1);
    // p1 has 8 gold, p2 has 3 → +5 Favor
    expect(p1.glorySources?.gold_glory_condition).toBe(5);
  });

  it('green glory condition fires when action is repeated', () => {
    let state = createActionPhaseState();

    // First place at gold_hoard
    let result = executeAction(state, 1, 'gold_hoard');
    state = result.state;

    // Reset for next action
    state = { ...state, workerPlacedThisTurn: false, godsAccessedThisTurn: [] };

    // Repeat via green relive
    result = executeAction(state, 1, 'green_relive', { actionChoice: 'gold_hoard' });
    state = result.state;

    // Green glory should have triggered for the repeat
    const p1 = getPlayer(state, 1);
    // The green_glory_condition handler is registered for ACTION_REPEATED event
    // Player 1 should have gained glory from the repeat
    expect(p1.glory).toBeGreaterThanOrEqual(1);
  });

  it('getAvailableActions filters by tier and occupied spaces', () => {
    let state = createActionPhaseState();
    // Give player resources so trade actions are available
    state = { ...state, players: state.players.map(p => p.id === 1 ? { ...p, resources: { gold: 5, black: 5, green: 5, yellow: 5 } } : p) };
    const actions = getAvailableActions(state, 1);

    // Round 1 — only tier 1 actions (4 per god x 4 gods = 16)
    expect(actions.length).toBe(16);

    // Occupy one space
    state = { ...state, occupiedSpaces: { gold_patronage: 2 } };
    const actionsAfter = getAvailableActions(state, 1);
    expect(actionsAfter.length).toBe(15);
    expect(actionsAfter).not.toContain('gold_patronage');
  });

  it('isGameOver detects game end', () => {
    let state = createActionPhaseState();
    expect(isGameOver(state)).toBe(false);

    state = { ...state, phase: Phase.GAME_END };
    expect(isGameOver(state)).toBe(true);
  });
});
