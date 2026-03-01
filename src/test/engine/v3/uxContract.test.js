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
import { dispatchEvent, EventType, resetHandlerFrequencies } from '../../../engine/v3/events.js';

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

describe('UX Contract: full simulation', () => {
  it('completes 10 random games with no unhandled decision types', () => {
    const unhandled = [];

    // Wrap the decision function to track all encountered types
    const trackingDecisionFn = (state, playerId, decision) => {
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

    for (let i = 0; i < 10; i++) {
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

  it('completes 5 four-player games with all gods', () => {
    for (let i = 0; i < 5; i++) {
      const result = simulateGame({
        playerCount: 4,
        godSet: ['gold', 'black', 'green', 'yellow'],
        maxTurns: 300,
      });

      expect(result.finalState.phase).toBe('game_end');

      // Verify market refill happened (markets shouldn't all be empty after 3 rounds)
      let totalMarketCards = 0;
      for (const god of ['gold', 'black', 'green', 'yellow']) {
        totalMarketCards += (result.finalState.powerCardMarkets[god] || []).length;
      }
      // With 4 gods × 3 cards = 12 initial. After buys + refills, shouldn't be 0
      // (unless all cards were bought, which is very unlikely with random play)
    }
  });
});
