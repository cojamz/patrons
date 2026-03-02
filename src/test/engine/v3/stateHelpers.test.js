import { describe, it, expect } from 'vitest';
import {
  addGlory,
  removeGlory,
  addResources,
  removeResources,
  getPlayer,
  getOtherPlayers,
  hasModifier,
  slotPowerCard,
  removePowerCard,
  trackGodAccess,
  canAccessGod,
  placeWorker,
  createV3Player,
  createV3GameState,
  formatResources,
  createResult,
  createDecisionRequest,
} from '../../../engine/v3/stateHelpers.js';

// --- Test Helpers ---

function makeState(overrides = {}) {
  return createV3GameState({
    playerCount: 2,
    playerNames: ['Alice', 'Bob'],
    godSet: ['gold', 'black', 'green', 'yellow'],
    gameMode: 'standard',
    ...overrides,
  });
}

function stateWithChampions(state) {
  return {
    ...state,
    champions: {
      1: { id: 'prescient', name: 'The Prescient', powerCards: [], powerCardSlots: 4 },
      2: { id: 'ambitious', name: 'The Ambitious', powerCards: [], powerCardSlots: 5 },
    },
  };
}

// --- Glory ---

describe('addGlory', () => {
  it('increases player glory and tracks source', () => {
    const state = makeState();
    const result = addGlory(state, 1, 3, 'gold_condition');
    const player = getPlayer(result, 1);
    expect(player.glory).toBe(3);
    expect(player.glorySources.gold_condition).toBe(3);
  });

  it('accumulates glory from multiple sources', () => {
    let state = makeState();
    state = addGlory(state, 1, 2, 'action');
    state = addGlory(state, 1, 1, 'shop');
    state = addGlory(state, 1, 3, 'action');
    const player = getPlayer(state, 1);
    expect(player.glory).toBe(6);
    expect(player.glorySources.action).toBe(5);
    expect(player.glorySources.shop).toBe(1);
  });

  it('does not affect other players', () => {
    const state = makeState();
    const result = addGlory(state, 1, 5, 'test');
    expect(getPlayer(result, 2).glory).toBe(0);
  });
});

describe('removeGlory', () => {
  it('decreases player glory', () => {
    let state = makeState();
    state = addGlory(state, 1, 5, 'test');
    state = removeGlory(state, 1, 2, 'penalty');
    expect(getPlayer(state, 1).glory).toBe(3);
  });

  it('clamps glory at 0 (never negative)', () => {
    let state = makeState();
    state = addGlory(state, 1, 2, 'test');
    state = removeGlory(state, 1, 10, 'penalty');
    expect(getPlayer(state, 1).glory).toBe(0);
  });
});

// --- Resources ---

describe('addResources', () => {
  it('adds resources to a player', () => {
    const state = makeState();
    const result = addResources(state, 1, { gold: 2, black: 1 });
    const player = getPlayer(result, 1);
    expect(player.resources.gold).toBe(2);
    expect(player.resources.black).toBe(1);
  });

  it('tracks turn resource gains', () => {
    const state = makeState();
    const result = addResources(state, 1, { gold: 3 });
    expect(result.turnResourceGains[1]).toEqual({ gold: 3 });
  });

  it('accumulates turn resource gains across multiple calls', () => {
    let state = makeState();
    state = addResources(state, 1, { gold: 2 });
    state = addResources(state, 1, { gold: 1, black: 3 });
    expect(state.turnResourceGains[1]).toEqual({ gold: 3, black: 3 });
  });

  it('sets lastGain on the gaining player', () => {
    const state = makeState();
    const result = addResources(state, 1, { gold: 2, black: 1 });
    expect(getPlayer(result, 1).lastGain).toEqual({ gold: 2, black: 1 });
  });

  it('sets lastGain on other players too (for copy mechanics)', () => {
    const state = makeState();
    const result = addResources(state, 1, { gold: 2 });
    expect(getPlayer(result, 2).lastGain).toEqual({ gold: 2 });
  });

  it('does not modify original state', () => {
    const state = makeState();
    const original = getPlayer(state, 1).resources.gold;
    addResources(state, 1, { gold: 5 });
    expect(getPlayer(state, 1).resources.gold).toBe(original);
  });
});

describe('removeResources', () => {
  it('removes resources from a player', () => {
    let state = makeState();
    state = addResources(state, 1, { gold: 5, black: 3 });
    state = removeResources(state, 1, { gold: 2, black: 1 });
    const player = getPlayer(state, 1);
    expect(player.resources.gold).toBe(3);
    expect(player.resources.black).toBe(2);
  });

  it('clamps at 0 (never negative)', () => {
    let state = makeState();
    state = addResources(state, 1, { gold: 2 });
    state = removeResources(state, 1, { gold: 10 });
    expect(getPlayer(state, 1).resources.gold).toBe(0);
  });

  it('does not track negative gains in turnResourceGains', () => {
    let state = makeState();
    state = addResources(state, 1, { gold: 5 });
    state = removeResources(state, 1, { gold: 3 });
    // turnResourceGains should only reflect the add, not the remove
    expect(state.turnResourceGains[1]).toEqual({ gold: 5 });
  });
});

// --- Player Queries ---

describe('getPlayer', () => {
  it('returns the player with the given id', () => {
    const state = makeState();
    const player = getPlayer(state, 1);
    expect(player.name).toBe('Alice');
    expect(player.id).toBe(1);
  });

  it('returns undefined for nonexistent id', () => {
    const state = makeState();
    expect(getPlayer(state, 99)).toBeUndefined();
  });
});

describe('getOtherPlayers', () => {
  it('returns all players except the specified one', () => {
    const state = makeState();
    const others = getOtherPlayers(state, 1);
    expect(others).toHaveLength(1);
    expect(others[0].id).toBe(2);
  });
});

// --- Modifier System ---

describe('hasModifier', () => {
  it('returns true when player has a card with matching modifier', () => {
    let state = makeState();
    state = stateWithChampions(state);
    state = slotPowerCard(state, 1, 'gold_vault'); // has steal_immunity modifier
    expect(hasModifier(state, 1, 'steal_immunity')).toBe(true);
  });

  it('returns false when player has no matching modifier', () => {
    let state = makeState();
    state = stateWithChampions(state);
    state = slotPowerCard(state, 1, 'gold_vault');
    expect(hasModifier(state, 1, 'ignore_occupied')).toBe(false);
  });

  it('returns false when player has no power cards', () => {
    let state = makeState();
    state = stateWithChampions(state);
    expect(hasModifier(state, 1, 'steal_immunity')).toBe(false);
  });

  it('returns false when champion is not set', () => {
    const state = makeState();
    expect(hasModifier(state, 1, 'steal_immunity')).toBe(false);
  });

  it('works for all modifier types', () => {
    let state = makeState();
    state = stateWithChampions(state);
    state = slotPowerCard(state, 1, 'hourglass');
    expect(hasModifier(state, 1, 'ignore_occupied')).toBe(true);

    state = slotPowerCard(state, 1, 'obsidian_coin');
    expect(hasModifier(state, 1, 'wildcard_black')).toBe(true);
  });
});

// --- Power Card Management ---

describe('slotPowerCard', () => {
  it('adds a card to the champion power cards list', () => {
    let state = makeState();
    state = stateWithChampions(state);
    state = slotPowerCard(state, 1, 'golden_scepter');
    expect(state.champions[1].powerCards).toContain('golden_scepter');
  });

  it('allows multiple cards', () => {
    let state = makeState();
    state = stateWithChampions(state);
    state = slotPowerCard(state, 1, 'golden_scepter');
    state = slotPowerCard(state, 1, 'gold_vault');
    expect(state.champions[1].powerCards).toEqual(['golden_scepter', 'gold_vault']);
  });

  it('returns state unchanged if champion does not exist', () => {
    const state = makeState();
    const result = slotPowerCard(state, 99, 'golden_scepter');
    expect(result).toBe(state);
  });
});

describe('removePowerCard', () => {
  it('removes a card from the champion power cards list', () => {
    let state = makeState();
    state = stateWithChampions(state);
    state = slotPowerCard(state, 1, 'golden_scepter');
    state = slotPowerCard(state, 1, 'gold_vault');
    state = removePowerCard(state, 1, 'golden_scepter');
    expect(state.champions[1].powerCards).toEqual(['gold_vault']);
  });
});

// --- God Access Tracking ---

describe('trackGodAccess and canAccessGod', () => {
  it('tracks god access and reports it correctly', () => {
    let state = makeState();
    expect(canAccessGod(state, 1, 'gold')).toBe(false);
    state = trackGodAccess(state, 1, 'gold');
    expect(canAccessGod(state, 1, 'gold')).toBe(true);
  });

  it('does not duplicate god colors', () => {
    let state = makeState();
    state = trackGodAccess(state, 1, 'gold');
    state = trackGodAccess(state, 1, 'gold');
    expect(state.godsAccessedThisTurn).toEqual(['gold']);
  });

  it('tracks multiple gods', () => {
    let state = makeState();
    state = trackGodAccess(state, 1, 'gold');
    state = trackGodAccess(state, 1, 'black');
    expect(canAccessGod(state, 1, 'gold')).toBe(true);
    expect(canAccessGod(state, 1, 'black')).toBe(true);
    expect(canAccessGod(state, 1, 'green')).toBe(false);
  });
});

// --- Worker Placement ---

describe('placeWorker', () => {
  it('sets occupiedSpaces and decrements workersLeft', () => {
    const state = makeState();
    const result = placeWorker(state, 'gold_collectTribute', 1);
    expect(result.occupiedSpaces.gold_collectTribute).toBe(1);
    expect(getPlayer(result, 1).workersLeft).toBe(2); // was 3, now 2
  });

  it('sets workerPlacedThisTurn flag', () => {
    const state = makeState();
    const result = placeWorker(state, 'gold_collectTribute', 1);
    expect(result.workerPlacedThisTurn).toBe(true);
  });

  it('adds action to turnActionsThisTurn', () => {
    const state = makeState();
    const result = placeWorker(state, 'gold_collectTribute', 1);
    expect(result.turnActionsThisTurn).toContain('gold_collectTribute');
  });

  it('does not affect other players', () => {
    const state = makeState();
    const result = placeWorker(state, 'gold_collectTribute', 1);
    expect(getPlayer(result, 2).workersLeft).toBe(3);
  });
});

// --- Game Initialization ---

describe('createV3Player', () => {
  it('creates correct default player state', () => {
    const player = createV3Player(1, 'Alice', '🦊', false, null, ['gold', 'black', 'green', 'yellow']);
    expect(player.id).toBe(1);
    expect(player.name).toBe('Alice');
    expect(player.emoji).toBe('🦊');
    expect(player.isAI).toBe(false);
    expect(player.glory).toBe(0);
    expect(player.workersLeft).toBe(3);
    expect(player.resources).toEqual({ gold: 0, black: 0, green: 0, yellow: 0 });
    expect(player.effects).toEqual([]);
    expect(player.glorySources).toEqual({});
    expect(player.shopCostModifier).toBe(0);
    expect(player.lastGain).toEqual({});
    expect(player.extraTurns).toBe(0);
  });

  it('only creates resource keys for active colors', () => {
    const player = createV3Player(1, 'Test', '🦊', false, null, ['gold', 'green']);
    expect(Object.keys(player.resources)).toEqual(['gold', 'green']);
    expect(player.resources.black).toBeUndefined();
  });
});

describe('createV3GameState', () => {
  it('creates valid initial state with correct player count', () => {
    const state = makeState();
    expect(state.players).toHaveLength(2);
    expect(state.currentPlayer).toBe(1);
    expect(state.round).toBe(1);
    expect(state.phase).toBe('champion_draft');
    expect(state.gameStarted).toBe(true);
    expect(state.gameOver).toBe(false);
  });

  it('sets turn order correctly', () => {
    const state = makeState();
    expect(state.turnOrder).toEqual([1, 2]);
  });

  it('initializes empty collections', () => {
    const state = makeState();
    expect(state.occupiedSpaces).toEqual({});
    expect(state.champions).toEqual({});
    expect(state.eventHandlers).toEqual([]);
    expect(state.decisionQueue).toEqual([]);
    expect(state.turnResourceGains).toEqual({});
    expect(state.turnActionsThisTurn).toEqual([]);
    expect(state.godsAccessedThisTurn).toEqual([]);
  });

  it('uses provided god set', () => {
    const state = createV3GameState({
      playerCount: 2,
      godSet: ['gold', 'black'],
    });
    expect(state.gods).toEqual(['gold', 'black']);
    expect(state.players[0].resources).toEqual({ gold: 0, black: 0 });
  });

  it('supports 3 and 4 player counts', () => {
    const state3 = createV3GameState({ playerCount: 3 });
    expect(state3.players).toHaveLength(3);
    expect(state3.turnOrder).toEqual([1, 2, 3]);

    const state4 = createV3GameState({ playerCount: 4 });
    expect(state4.players).toHaveLength(4);
    expect(state4.turnOrder).toEqual([1, 2, 3, 4]);
  });

  it('uses default names when none provided', () => {
    const state = createV3GameState({ playerCount: 2 });
    expect(state.players[0].name).toBe('Player 1');
    expect(state.players[1].name).toBe('Player 2');
  });
});

// --- Utility ---

describe('formatResources', () => {
  it('formats resources as human-readable string', () => {
    expect(formatResources({ gold: 2, black: 1 })).toBe('2 gold, 1 black');
  });

  it('filters out zero-value resources', () => {
    expect(formatResources({ gold: 2, black: 0, green: 1 })).toBe('2 gold, 1 green');
  });

  it('returns empty string for all zeros', () => {
    expect(formatResources({ gold: 0, black: 0 })).toBe('');
  });
});

describe('createResult', () => {
  it('wraps state and log', () => {
    const state = makeState();
    const result = createResult(state, ['something happened']);
    expect(result.state).toBe(state);
    expect(result.log).toEqual(['something happened']);
  });

  it('wraps single log string as array', () => {
    const state = makeState();
    const result = createResult(state, 'single message');
    expect(result.log).toEqual(['single message']);
  });

  it('defaults to empty log', () => {
    const state = makeState();
    const result = createResult(state);
    expect(result.log).toEqual([]);
  });
});

describe('createDecisionRequest', () => {
  it('wraps state, log, and pendingDecision', () => {
    const state = makeState();
    const decision = { type: 'chooseResource', playerId: 1 };
    const result = createDecisionRequest(state, ['choose now'], decision);
    expect(result.state).toBe(state);
    expect(result.log).toEqual(['choose now']);
    expect(result.pendingDecision).toBe(decision);
  });
});
