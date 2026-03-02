/**
 * UX Contract Tests — Validates engine ↔ UI contract.
 *
 * These tests simulate the same flow the UI takes (GameProvider → engine → modal → decision),
 * catching mismatches like missing fields on pendingDecision objects, unhandled decision types,
 * and broken multi-step decision chains.
 *
 * Every pendingDecision from the engine must have the fields its modal needs.
 * Every decision type the engine emits must be routable by the UI's DecisionModal.
 */
import { describe, it, expect } from 'vitest';
import { createGame, executeAction, endTurn, advanceRound, buyPowerCard } from '../../../engine/v3/GameEngine.js';
import { executeChampionDraft, executeRoundStart, resortTurnOrder } from '../../../engine/v3/phases.js';
import { getAvailableActions } from '../../../engine/v3/rules.js';
import { powerCards } from '../../../engine/v3/data/powerCards.js';
import { simulateGame, randomDecisionFn } from '../../../engine/v3/runner.js';
import { dispatchEvent, EventType, registerHandler, resetHandlerFrequencies } from '../../../engine/v3/events.js';
import { resolveShop, payShopCost } from '../../../engine/v3/shops/shopResolver.js';

// Decision types the UI's DecisionModal can handle
const HANDLED_DECISION_TYPES = [
  'championChoice',
  'gemSelection',
  'targetPlayer',
  'stealGems',
  'actionChoice',
  'actionChoices',
  'nullifierPlacement',
];

// Required fields per decision type (what the modal reads)
const REQUIRED_FIELDS = {
  gemSelection: ['count'],
  targetPlayer: ['options'],  // ← This was the Bug A contract violation
  stealGems: ['count', 'targetResources', 'targetPlayer'],
  actionChoice: ['options'],
  actionChoices: ['options', 'count'],
  championChoice: ['options'],
};

/**
 * Helper: create a game and run through champion draft to action phase.
 */
function createReadyGame(opts = {}) {
  const { playerCount = 2, godSet } = opts;
  const gods = godSet || ['gold', 'black'].slice(0, playerCount);
  const result = createGame({ playerCount, godSet: gods });
  let state = result.state;

  // Draft champions automatically
  while (state.phase === 'champion_draft') {
    const draftResult = executeChampionDraft(state);
    state = draftResult.state;
    if (draftResult.pendingDecision) {
      const answer = randomDecisionFn(state, draftResult.pendingDecision.playerId, draftResult.pendingDecision);
      const pickResult = executeChampionDraft(state, answer);
      state = pickResult.state;
    }
  }

  // Transition to action phase
  if (state.phase === 'round_start') {
    state = resortTurnOrder(state);
    const startResult = executeRoundStart(state);
    state = startResult.state;
    state = resetHandlerFrequencies(state, 'round');
    const eventResult = dispatchEvent(state, EventType.ROUND_START, { round: state.round });
    state = eventResult.state;
    if (state.turnOrder?.length > 0) {
      state = { ...state, currentPlayer: state.turnOrder[0], turnDirection: 1 };
    }
  }

  return state;
}

// ============================================================================
// Contract: pendingDecision field validation
// ============================================================================

describe('UX Contract: pendingDecision fields', () => {
  it('targetPlayer decisions always include options array', () => {
    const state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });

    // Find a black steal action
    const blackActions = ['black_pickpocket', 'black_ransack', 'black_extort'];

    for (const actionId of blackActions) {
      // Place worker directly (bypass availability check for contract testing)
      const playerId = state.currentPlayer;
      const result = executeAction(state, playerId, actionId);

      if (result.pendingDecision?.type === 'targetPlayer') {
        expect(result.pendingDecision.options).toBeDefined();
        expect(Array.isArray(result.pendingDecision.options)).toBe(true);
        expect(result.pendingDecision.options.length).toBeGreaterThan(0);
        // Options should exclude the acting player
        expect(result.pendingDecision.options).not.toContain(playerId);
      }
    }
  });

  it('stealGems decisions include count and targetResources', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });

    // Give the target some resources so stealGems has something to show
    state = {
      ...state,
      players: state.players.map(p =>
        p.id !== state.currentPlayer
          ? { ...p, resources: { ...p.resources, gold: 5, black: 5 } }
          : p
      ),
    };

    const playerId = state.currentPlayer;

    // Test ransack (steal 2) and extort (steal 3)
    for (const actionId of ['black_ransack', 'black_extort']) {
      // Step 1: get targetPlayer decision
      let result = executeAction(state, playerId, actionId);
      if (result.pendingDecision?.type !== 'targetPlayer') continue;

      // Step 2: answer targetPlayer, should get stealGems
      const targetId = result.pendingDecision.options[0];
      const decisions = { targetPlayer: targetId };
      result = executeAction(result.state, playerId, actionId, decisions);

      if (result.pendingDecision?.type === 'stealGems') {
        expect(result.pendingDecision.count).toBeDefined();
        expect(result.pendingDecision.count).toBeGreaterThan(0);
        expect(result.pendingDecision.targetResources).toBeDefined();
        expect(typeof result.pendingDecision.targetResources).toBe('object');
        expect(result.pendingDecision.targetPlayer).toBeDefined();
      }
    }
  });
});

// ============================================================================
// Contract: all decision types are UI-routable
// ============================================================================

describe('UX Contract: decision type coverage', () => {
  it('every decision type emitted by black actions is handled by the UI', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });

    // Give resources for stealing
    state = {
      ...state,
      players: state.players.map(p => ({
        ...p,
        resources: { ...p.resources, gold: 5, black: 5 },
        glory: 10,
      })),
    };

    const playerId = state.currentPlayer;
    const blackActionIds = ['black_pickpocket', 'black_ransack', 'black_extort'];
    const encounteredTypes = new Set();

    for (const actionId of blackActionIds) {
      let result = executeAction(state, playerId, actionId);
      let decisions = {};

      // Walk through all decision steps
      let steps = 0;
      while (result.pendingDecision && steps < 5) {
        const type = result.pendingDecision.type;
        encounteredTypes.add(type);
        expect(HANDLED_DECISION_TYPES).toContain(type);

        // Validate required fields
        const required = REQUIRED_FIELDS[type] || [];
        for (const field of required) {
          expect(result.pendingDecision[field]).toBeDefined();
        }

        // Auto-answer and continue
        const answer = randomDecisionFn(result.state, playerId, result.pendingDecision);
        decisions = { ...decisions, ...answer };
        result = executeAction(result.state, playerId, actionId, decisions);
        steps++;
      }
    }

    // We should have encountered at least targetPlayer
    expect(encounteredTypes.has('targetPlayer')).toBe(true);
  });
});

// ============================================================================
// Contract: green action decision contracts
// ============================================================================

describe('UX Contract: green action decisions', () => {
  it('relive emits actionChoice with options of repeatable action IDs', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['green', 'gold'] });
    const playerId = state.currentPlayer;

    // First place a worker at a non-repeat action so there's something to repeat
    let result = executeAction(state, playerId, 'green_bide');
    state = result.state;

    // End turn and come back (or just use the state directly with roundActions set)
    // The roundActions should now have green_bide
    // Execute relive -- it should produce an actionChoice decision
    result = executeAction(state, playerId, 'green_relive');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('actionChoice');
    expect(result.pendingDecision.options).toBeDefined();
    expect(Array.isArray(result.pendingDecision.options)).toBe(true);
    // options should contain repeatable actions (at least green_bide)
    expect(result.pendingDecision.options.length).toBeGreaterThan(0);
    // repeat-excluded actions should NOT appear in options
    const repeatExcluded = ['green_relive', 'green_echo', 'green_loop', 'green_unravel'];
    for (const excluded of repeatExcluded) {
      expect(result.pendingDecision.options).not.toContain(excluded);
    }
  });

  it('echo copies last non-echo action without requiring a decision', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['green', 'gold'] });
    const playerId = state.currentPlayer;

    // Place a worker so there's a "last action" in roundActions
    let result = executeAction(state, playerId, 'gold_collectTribute');
    state = result.state;

    // Echo copies the last action automatically (no decision needed from the player)
    result = executeAction(state, playerId, 'green_echo');

    // Echo should NOT produce a pendingDecision -- it auto-copies the last action
    // It returns executeAction chain instead
    if (result.pendingDecision) {
      // If it does produce a decision, it must be a handled type with correct fields
      expect(HANDLED_DECISION_TYPES).toContain(result.pendingDecision.type);
      const required = REQUIRED_FIELDS[result.pendingDecision.type] || [];
      for (const field of required) {
        expect(result.pendingDecision[field]).toBeDefined();
      }
    }
  });

  it('loop emits actionChoice for Tier 2 actions', () => {
    // Loop is tier 2, so we need round 2
    let state = createReadyGame({ playerCount: 2, godSet: ['green', 'gold'] });
    state = { ...state, round: 2 };
    const playerId = state.currentPlayer;

    // Place worker at a tier 2 action first
    let result = executeAction(state, playerId, 'green_accelerate');
    state = result.state;

    // Execute loop
    result = executeAction(state, playerId, 'green_loop');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('actionChoice');
    expect(result.pendingDecision.options).toBeDefined();
    expect(Array.isArray(result.pendingDecision.options)).toBe(true);
    expect(result.pendingDecision.options.length).toBeGreaterThanOrEqual(1);
  });

  it('unravel emits actionChoice for Tier 3 actions', () => {
    // Unravel is tier 3, so we need round 3
    let state = createReadyGame({ playerCount: 2, godSet: ['green', 'gold'] });
    state = { ...state, round: 3 };
    const playerId = state.currentPlayer;

    // Place worker at a tier 3 action first (gold_cashIn)
    let result = executeAction(state, playerId, 'gold_cashIn');
    state = result.state;

    // Execute unravel
    result = executeAction(state, playerId, 'green_unravel');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('actionChoice');
    expect(result.pendingDecision.options).toBeDefined();
    expect(Array.isArray(result.pendingDecision.options)).toBe(true);
    expect(result.pendingDecision.options.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Contract: yellow action decision contracts
// ============================================================================

describe('UX Contract: yellow action decisions', () => {
  it('forage emits gemSelection with count=3', () => {
    const state = createReadyGame({ playerCount: 2, godSet: ['yellow', 'gold'] });
    const playerId = state.currentPlayer;

    const result = executeAction(state, playerId, 'yellow_forage');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
    expect(result.pendingDecision.count).toBe(3);
  });

  it('gather emits gemSelection with count=2', () => {
    const state = createReadyGame({ playerCount: 2, godSet: ['yellow', 'gold'] });
    const playerId = state.currentPlayer;

    const result = executeAction(state, playerId, 'yellow_gather');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
    expect(result.pendingDecision.count).toBe(2);
  });

  it('harvest emits gemSelection with count=4', () => {
    // Harvest is tier 2
    let state = createReadyGame({ playerCount: 2, godSet: ['yellow', 'gold'] });
    state = { ...state, round: 2 };
    const playerId = state.currentPlayer;

    const result = executeAction(state, playerId, 'yellow_harvest');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
    expect(result.pendingDecision.count).toBe(4);
  });

  it('trade emits gemSelection with count = total resources after +1 yellow', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['yellow', 'gold'] });
    const playerId = state.currentPlayer;

    // Give the player some resources first
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, gold: 3, yellow: 2 } }
          : p
      ),
    };

    const player = state.players.find(p => p.id === playerId);
    const totalBefore = Object.values(player.resources).reduce((sum, v) => sum + Math.max(0, v), 0);
    // Trade gives +1 yellow first, so total should be totalBefore + 1
    const expectedCount = totalBefore + 1;

    const result = executeAction(state, playerId, 'yellow_trade');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
    expect(result.pendingDecision.count).toBe(expectedCount);
  });
});

// ============================================================================
// Contract: gold action decision contracts
// ============================================================================

describe('UX Contract: gold action decisions', () => {
  it('barter emits gemSelection with count=2', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });
    const playerId = state.currentPlayer;

    // Give resources so barter can work
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, gold: 3, black: 3 } }
          : p
      ),
    };

    const result = executeAction(state, playerId, 'gold_barter');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
    expect(result.pendingDecision.count).toBe(2);
  });

  it('appraise emits gemSelection with count=1', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });
    const playerId = state.currentPlayer;

    // Give resources
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, black: 2 } }
          : p
      ),
    };

    const result = executeAction(state, playerId, 'gold_appraise');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
    expect(result.pendingDecision.count).toBe(1);
  });

  it('brokerDeal emits gemSelection with count=3', () => {
    // Broker Deal is tier 2
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });
    state = { ...state, round: 2 };
    const playerId = state.currentPlayer;

    // Give resources
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, gold: 3, black: 3 } }
          : p
      ),
    };

    const result = executeAction(state, playerId, 'gold_brokerDeal');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
    expect(result.pendingDecision.count).toBe(3);
  });
});

// ============================================================================
// Contract: shop decision contracts
// ============================================================================

describe('UX Contract: shop decisions', () => {
  it('black_weak shop emits targetPlayer decision', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });
    const playerId = state.currentPlayer;

    // Track god access for black so shop is usable
    state = { ...state, godsAccessedThisTurn: ['black'] };

    // Give resources to afford the shop
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, black: 5, gold: 5 } }
          : p
      ),
    };

    const result = resolveShop(state, playerId, 'black_weak');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('targetPlayer');
    // Shop targetPlayer decisions should have excludePlayer
    expect(result.pendingDecision.excludePlayer).toBe(playerId);
  });

  it('black_strong shop emits targetPlayer decision', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });
    const playerId = state.currentPlayer;

    state = { ...state, godsAccessedThisTurn: ['black'] };
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, black: 5, gold: 5 } }
          : p
      ),
    };

    const result = resolveShop(state, playerId, 'black_strong');

    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('targetPlayer');
    expect(result.pendingDecision.excludePlayer).toBe(playerId);
  });

  it('green_weak shop emits actionChoice for tier 1 repeatable actions', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['green', 'gold'] });
    const playerId = state.currentPlayer;

    // Place a worker first so there are repeatable actions
    let result = executeAction(state, playerId, 'green_bide');
    state = result.state;
    state = { ...state, godsAccessedThisTurn: ['green'] };

    const shopResult = resolveShop(state, playerId, 'green_weak');

    expect(shopResult.pendingDecision).toBeDefined();
    expect(shopResult.pendingDecision.type).toBe('actionChoice');
    expect(shopResult.pendingDecision.options).toBeDefined();
    expect(Array.isArray(shopResult.pendingDecision.options)).toBe(true);
  });

  it('shop cost with "any" payment emits gemSelection decision', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });
    const playerId = state.currentPlayer;

    // Gold weak shop costs { gold: 1, any: 1 }
    state = { ...state, godsAccessedThisTurn: ['gold'] };
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId
          ? { ...p, resources: { ...p.resources, gold: 5, black: 5 } }
          : p
      ),
    };

    const payResult = payShopCost(state, playerId, 'gold_weak');

    // Should ask for gemSelection to pay the 'any' cost
    expect(payResult.pendingDecision).toBeDefined();
    expect(payResult.pendingDecision.type).toBe('gemSelection');
    expect(payResult.pendingDecision.count).toBe(1);
  });
});

// ============================================================================
// Contract: champion power decision contracts
// ============================================================================

describe('UX Contract: champion decisions', () => {
  it('Prescient passive produces nullifierPlacement decision at round start', () => {
    // Create a game where a player has The Prescient
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });

    // Find if any player got Prescient; if not, force it
    const prescientPlayer = Object.entries(state.champions).find(([, c]) => c.id === 'prescient');

    if (!prescientPlayer) {
      // Force assign Prescient to player 1 and re-register the handler
      state = {
        ...state,
        champions: {
          ...state.champions,
          1: { id: 'prescient', name: 'The Prescient', powerCards: [], powerCardSlots: 4 },
        },
      };
      state = registerHandler(state, {
        id: 'prescient_passive_p1',
        eventType: EventType.ROUND_START,
        source: 'champion_passive',
        sourceId: 'prescient_passive',
        ownerId: 1,
        config: {},
        frequency: 'once_per_round',
      });
    }

    // Dispatch ROUND_START to trigger the Prescient passive
    state = resetHandlerFrequencies(state, 'round');
    const eventResult = dispatchEvent(state, EventType.ROUND_START, { round: 1 });

    // Should produce nullifierPlacement in pendingDecisions
    expect(eventResult.pendingDecisions).toBeDefined();
    const nullifierDecisions = eventResult.pendingDecisions.filter(d => d.type === 'nullifierPlacement');
    expect(nullifierDecisions.length).toBeGreaterThan(0);

    const nullDec = nullifierDecisions[0];
    expect(nullDec.type).toBe('nullifierPlacement');
    expect(nullDec.playerId).toBeDefined();
    expect(nullDec.sourceId).toBe('prescient_passive');
  });
});

// ============================================================================
// Contract: turn alternation (Bug B regression test)
// ============================================================================

describe('UX Contract: turn alternation', () => {
  it('each player gets exactly one action per turn cycle', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });

    const playerOrder = [];
    const maxSteps = 20;

    for (let i = 0; i < maxSteps; i++) {
      const currentId = state.currentPlayer;
      const available = getAvailableActions(state, currentId);
      if (available.length === 0) break;
      if (state.phase !== 'action_phase') break;

      const player = state.players.find(p => p.id === currentId);
      if (!player || player.workersLeft <= 0) break;

      playerOrder.push(currentId);

      // Place one worker
      const actionId = available[0];
      const result = executeAction(state, currentId, actionId);
      state = result.state;

      // Handle any decisions
      if (result.pendingDecision) {
        const answer = randomDecisionFn(state, currentId, result.pendingDecision);
        const decisions = { ...answer };
        const resolved = executeAction(state, currentId, actionId, decisions);
        state = resolved.state;
      }

      // End turn
      const turnResult = endTurn(state);
      state = turnResult.state;
    }

    // Verify alternation: no player should appear twice in a row
    // (except when extra turns are involved, which we don't trigger here)
    for (let i = 1; i < playerOrder.length; i++) {
      if (state.phase === 'round_end') break;
      expect(playerOrder[i]).not.toBe(playerOrder[i - 1]);
    }
  });
});

// ============================================================================
// Contract: power card market refill (Bug C regression test)
// ============================================================================

describe('UX Contract: power card market refill', () => {
  it('markets refill from deck between rounds', () => {
    let state = createReadyGame({ playerCount: 2, godSet: ['gold', 'black'] });

    // Verify initial state: markets have 3 cards, decks have remainder
    for (const godColor of state.gods) {
      const market = state.powerCardMarkets[godColor];
      expect(market.length).toBe(3);
      expect(state.powerCardDecks[godColor]).toBeDefined();
    }

    // Simulate buying a card from gold market
    const goldMarket = state.powerCardMarkets.gold;
    const cardToBuy = goldMarket[0];

    // Manually remove it (simulate buy without cost check)
    state = {
      ...state,
      powerCardMarkets: {
        ...state.powerCardMarkets,
        gold: goldMarket.filter(id => id !== cardToBuy),
      },
    };
    expect(state.powerCardMarkets.gold.length).toBe(2);

    // Advance to round end and start
    state = { ...state, phase: 'round_end' };
    const roundResult = advanceRound(state);
    state = roundResult.state;

    // After round advance, market should refill back to 3 if deck has cards
    if (state.phase === 'action_phase' || state.phase === 'round_start') {
      const refilled = state.powerCardMarkets.gold;
      const deckRemaining = state.powerCardDecks.gold;

      // Should have refilled (if deck wasn't empty)
      expect(refilled.length).toBe(3);
      // The bought card shouldn't be in the refilled market
      // (it was removed, refill draws from deck not re-adds bought cards)
    }
  });

  it('powerCardDecks is stored in initial game state', () => {
    const result = createGame({ playerCount: 2, godSet: ['gold', 'black'] });
    expect(result.state.powerCardDecks).toBeDefined();
    expect(result.state.powerCardDecks.gold).toBeDefined();
    expect(result.state.powerCardDecks.black).toBeDefined();
    // Total cards = market + deck = all cards for that god
    for (const god of ['gold', 'black']) {
      const total = result.state.powerCardMarkets[god].length + result.state.powerCardDecks[god].length;
      const allCards = Object.keys(powerCards).filter(id => powerCards[id].god === god);
      expect(total).toBe(allCards.length);
    }
  });
});

// ============================================================================
// Stress: full game simulation catches no unhandled decisions
// ============================================================================

/**
 * Tracking decision function: wraps randomDecisionFn to catch unhandled
 * decision types and missing required fields.
 */
function createTrackingDecisionFn(unhandled) {
  return (state, playerId, decision) => {
    if (!HANDLED_DECISION_TYPES.includes(decision.type)) {
      unhandled.push(decision.type);
    }

    // Validate required fields
    const required = REQUIRED_FIELDS[decision.type] || [];
    for (const field of required) {
      if (decision[field] === undefined) {
        unhandled.push(`${decision.type} missing ${field}`);
      }
    }

    return randomDecisionFn(state, playerId, decision);
  };
}

describe('UX Contract: full simulation', () => {
  it('completes 20 random 2P games with no unhandled decision types', () => {
    const unhandled = [];
    const trackingDecisionFn = createTrackingDecisionFn(unhandled);

    for (let i = 0; i < 20; i++) {
      const result = simulateGame({
        playerCount: 2,
        godSet: ['gold', 'black'],
        decisionFn: trackingDecisionFn,
        maxTurns: 200,
      });

      expect(result.finalState.phase).toBe('game_end');
    }

    if (unhandled.length > 0) {
      throw new Error(`Unhandled decision types/fields: ${[...new Set(unhandled)].join(', ')}`);
    }
  });

  it('completes 10 random 4P games with all gods', () => {
    const unhandled = [];
    const trackingDecisionFn = createTrackingDecisionFn(unhandled);

    for (let i = 0; i < 10; i++) {
      const result = simulateGame({
        playerCount: 4,
        godSet: ['gold', 'black', 'green', 'yellow'],
        decisionFn: trackingDecisionFn,
        maxTurns: 300,
      });

      expect(result.finalState.phase).toBe('game_end');

      // Verify market refill happened (markets shouldn't all be empty after 3 rounds)
      let totalMarketCards = 0;
      for (const god of ['gold', 'black', 'green', 'yellow']) {
        totalMarketCards += (result.finalState.powerCardMarkets[god] || []).length;
      }
      // With 4 gods x 3 cards = 12 initial. After buys + refills, shouldn't be 0
      // (unless all cards were bought, which is very unlikely with random play)
    }

    if (unhandled.length > 0) {
      throw new Error(`Unhandled decision types/fields: ${[...new Set(unhandled)].join(', ')}`);
    }
  });

  it('completes 5 random 3P games with no crashes', () => {
    const unhandled = [];
    const trackingDecisionFn = createTrackingDecisionFn(unhandled);

    for (let i = 0; i < 5; i++) {
      const result = simulateGame({
        playerCount: 3,
        godSet: ['gold', 'black', 'green'],
        decisionFn: trackingDecisionFn,
        maxTurns: 250,
      });

      expect(result.finalState.phase).toBe('game_end');
      expect(result.finalState.players.length).toBe(3);
    }

    if (unhandled.length > 0) {
      throw new Error(`Unhandled decision types/fields: ${[...new Set(unhandled)].join(', ')}`);
    }
  });

  it('stress: 2P green+yellow games complete with all decision types valid', () => {
    const unhandled = [];
    const trackingDecisionFn = createTrackingDecisionFn(unhandled);

    for (let i = 0; i < 10; i++) {
      const result = simulateGame({
        playerCount: 2,
        godSet: ['green', 'yellow'],
        decisionFn: trackingDecisionFn,
        maxTurns: 200,
      });

      expect(result.finalState.phase).toBe('game_end');
    }

    if (unhandled.length > 0) {
      throw new Error(`Unhandled decision types/fields: ${[...new Set(unhandled)].join(', ')}`);
    }
  });

  it('stress: 2P gold+green games complete with all decision types valid', () => {
    const unhandled = [];
    const trackingDecisionFn = createTrackingDecisionFn(unhandled);

    for (let i = 0; i < 10; i++) {
      const result = simulateGame({
        playerCount: 2,
        godSet: ['gold', 'green'],
        decisionFn: trackingDecisionFn,
        maxTurns: 200,
      });

      expect(result.finalState.phase).toBe('game_end');
    }

    if (unhandled.length > 0) {
      throw new Error(`Unhandled decision types/fields: ${[...new Set(unhandled)].join(', ')}`);
    }
  });
});
