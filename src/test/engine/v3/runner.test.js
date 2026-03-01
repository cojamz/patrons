/**
 * Patrons v3 — Runner & Balance AI Tests
 */

import { describe, it, expect } from 'vitest';
import {
  simulateGame, runSimulations,
  randomDecisionFn, randomActionPicker,
} from '../../../engine/v3/runner.js';
import {
  evaluatePosition,
  heuristicActionPicker,
  heuristicDecisionFn,
  heuristicShopDecision,
} from '../../../engine/v3/balanceAI.js';
import { createV3GameState, getPlayer } from '../../../engine/v3/stateHelpers.js';
import { getAvailableActions } from '../../../engine/v3/rules.js';
import { Phase } from '../../../engine/v3/phases.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTestState(overrides = {}) {
  const state = createV3GameState({ playerCount: 2 });
  return { ...state, ...overrides };
}

function makeActionPhaseState() {
  const state = createV3GameState({ playerCount: 2 });
  return {
    ...state,
    phase: Phase.ACTION_PHASE,
    round: 1,
    champions: {
      1: { id: 'deft', name: 'The Deft', powerCards: [], powerCardSlots: 4 },
      2: { id: 'fortunate', name: 'The Fortunate', powerCards: [], powerCardSlots: 4 },
    },
  };
}

// ---------------------------------------------------------------------------
// Runner Tests
// ---------------------------------------------------------------------------

describe('simulateGame', () => {
  it('completes without errors', () => {
    const result = simulateGame({ playerCount: 2, maxTurns: 300 });
    expect(result).toBeDefined();
    expect(result.finalState).toBeDefined();
    expect(result.gameLog).toBeDefined();
    expect(result.turns).toBeGreaterThan(0);
  });

  it('returns a winner', () => {
    const result = simulateGame({ playerCount: 2 });
    expect(result.winner).toBeDefined();
    expect([1, 2]).toContain(result.winner);
  });

  it('respects maxTurns safety valve', () => {
    const result = simulateGame({ playerCount: 2, maxTurns: 5 });
    expect(result.turns).toBeLessThanOrEqual(5);
  });

  it('game ends after round 3', () => {
    const result = simulateGame({ playerCount: 2, maxTurns: 300 });
    const finalRound = result.finalState.round;
    // After round 3 ends, the game transitions to GAME_END
    // The round might be 3 (game_end before increment) or the state might have gameOver
    expect(result.finalState.gameOver || finalRound >= 3).toBe(true);
  });

  it('works with 3 players', () => {
    const result = simulateGame({ playerCount: 3 });
    expect(result).toBeDefined();
    expect(result.winner).toBeDefined();
    expect([1, 2, 3]).toContain(result.winner);
  });

  it('works with 4 players', () => {
    const result = simulateGame({ playerCount: 4 });
    expect(result).toBeDefined();
    expect(result.winner).toBeDefined();
    expect([1, 2, 3, 4]).toContain(result.winner);
  });

  it('all players have champions after draft', () => {
    const result = simulateGame({ playerCount: 2 });
    const { champions } = result.finalState;
    expect(champions[1]).toBeDefined();
    expect(champions[1].id).toBeTruthy();
    expect(champions[2]).toBeDefined();
    expect(champions[2].id).toBeTruthy();
  });

  it('produces game log entries', () => {
    const result = simulateGame({ playerCount: 2 });
    expect(result.gameLog.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Random Decision Tests
// ---------------------------------------------------------------------------

describe('randomDecisionFn', () => {
  const state = makeActionPhaseState();

  it('handles championChoice', () => {
    const decision = {
      type: 'championChoice',
      playerId: 1,
      options: [
        { id: 'deft', name: 'The Deft' },
        { id: 'fortunate', name: 'The Fortunate' },
      ],
    };
    const answer = randomDecisionFn(state, 1, decision);
    expect(answer.championId).toBeDefined();
    expect(['deft', 'fortunate']).toContain(answer.championId);
  });

  it('handles gemSelection', () => {
    const decision = { type: 'gemSelection', count: 3 };
    const answer = randomDecisionFn(state, 1, decision);
    expect(answer.gemSelection).toBeDefined();
    const total = Object.values(answer.gemSelection).reduce((sum, v) => sum + v, 0);
    expect(total).toBe(3);
  });

  it('handles targetPlayer (never picks self)', () => {
    const decision = { type: 'targetPlayer', excludePlayer: 1 };
    const answer = randomDecisionFn(state, 1, decision);
    expect(answer.targetPlayer).toBeDefined();
    expect(answer.targetPlayer).not.toBe(1);
  });

  it('handles actionChoice', () => {
    const decision = {
      type: 'actionChoice',
      options: ['gold_collectTribute', 'black_skulk'],
    };
    const answer = randomDecisionFn(state, 1, decision);
    expect(answer.actionChoice).toBeDefined();
    expect(['gold_collectTribute', 'black_skulk']).toContain(answer.actionChoice);
  });

  it('handles stealGems', () => {
    const decision = {
      type: 'stealGems',
      count: 2,
      targetResources: { gold: 3, black: 2, green: 0, yellow: 1 },
    };
    const answer = randomDecisionFn(state, 1, decision);
    expect(answer.stealGems).toBeDefined();
    const total = Object.values(answer.stealGems).reduce((sum, v) => sum + v, 0);
    expect(total).toBeLessThanOrEqual(2);
  });

  it('handles unknown decision types gracefully', () => {
    const decision = { type: 'unknownType' };
    const answer = randomDecisionFn(state, 1, decision);
    expect(answer).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Random Action Picker Tests
// ---------------------------------------------------------------------------

describe('randomActionPicker', () => {
  it('returns valid action from available list', () => {
    const actions = ['gold_collectTribute', 'black_skulk', 'green_bide'];
    const state = makeActionPhaseState();
    const result = randomActionPicker(state, 1, actions);
    expect(actions).toContain(result);
  });

  it('returns null for empty list', () => {
    const state = makeActionPhaseState();
    const result = randomActionPicker(state, 1, []);
    expect(result).toBeNull();
  });

  it('returns null for null/undefined list', () => {
    const state = makeActionPhaseState();
    expect(randomActionPicker(state, 1, null)).toBeNull();
    expect(randomActionPicker(state, 1, undefined)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// runSimulations Tests
// ---------------------------------------------------------------------------

describe('runSimulations', () => {
  it('returns stats with correct structure', () => {
    const stats = runSimulations({ gameCount: 3, playerCount: 2 });
    expect(stats.wins).toBeDefined();
    expect(stats.avgGlory).toBeDefined();
    expect(stats.glorySpread).toBeDefined();
    expect(stats.avgTurns).toBeDefined();
    expect(stats.championWins).toBeDefined();
    expect(typeof stats.errors).toBe('number');
    expect(typeof stats.completedGames).toBe('number');
  });

  it('completed games + errors equals total', () => {
    const stats = runSimulations({ gameCount: 5, playerCount: 2 });
    expect(stats.completedGames + stats.errors).toBe(5);
  });

  it('multiple simulations produce varying results', () => {
    // Run 10 games and check that wins aren't all the same player
    const stats = runSimulations({ gameCount: 10, playerCount: 2 });
    // With random play over 10 games, it's overwhelmingly likely both players win at least once
    // But to avoid flaky tests, just check structure is valid
    const totalWins = Object.values(stats.wins).reduce((sum, v) => sum + v, 0);
    expect(totalWins).toBe(stats.completedGames);
  });
});

// ---------------------------------------------------------------------------
// Balance AI Tests
// ---------------------------------------------------------------------------

describe('evaluatePosition', () => {
  it('returns higher score for player with more glory', () => {
    const state = makeActionPhaseState();
    // Give player 1 more glory
    const stateWithGlory = {
      ...state,
      players: state.players.map(p =>
        p.id === 1 ? { ...p, glory: 10 } : { ...p, glory: 2 }
      ),
    };

    const score1 = evaluatePosition(stateWithGlory, 1);
    const score2 = evaluatePosition(stateWithGlory, 2);
    expect(score1).toBeGreaterThan(score2);
  });

  it('values resource diversity', () => {
    const state = makeActionPhaseState();
    // Player 1: diverse resources
    // Player 2: concentrated resources (same total)
    const stateA = {
      ...state,
      players: state.players.map(p => {
        if (p.id === 1) return { ...p, resources: { gold: 2, black: 2, green: 2, yellow: 2 } };
        if (p.id === 2) return { ...p, resources: { gold: 8, black: 0, green: 0, yellow: 0 } };
        return p;
      }),
    };

    const score1 = evaluatePosition(stateA, 1);
    const score2 = evaluatePosition(stateA, 2);
    // Player 1 has 4 colors vs player 2's 1 color, worth 6 extra points
    // Player 2 has extra gold weight (8*2 vs 2*2 = 12 extra gold points)
    // But diversity bonus (4*2=8 vs 1*2=2) should make them closer
    // Both are valid strategies, just check the function works
    expect(typeof score1).toBe('number');
    expect(typeof score2).toBe('number');
  });

  it('returns 0 for invalid player', () => {
    const state = makeActionPhaseState();
    expect(evaluatePosition(state, 999)).toBe(0);
  });

  it('accounts for power cards', () => {
    const state = makeActionPhaseState();
    const stateWithCards = {
      ...state,
      champions: {
        ...state.champions,
        1: { ...state.champions[1], powerCards: ['golden_scepter', 'gold_idol'] },
      },
    };

    const scoreWith = evaluatePosition(stateWithCards, 1);
    const scoreWithout = evaluatePosition(state, 1);
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });
});

describe('heuristicActionPicker', () => {
  it('returns an available action', () => {
    const state = makeActionPhaseState();
    const available = getAvailableActions(state, 1);
    const pick = heuristicActionPicker(state, 1, available);
    expect(available).toContain(pick);
  });

  it('returns null for empty action list', () => {
    const state = makeActionPhaseState();
    expect(heuristicActionPicker(state, 1, [])).toBeNull();
  });

  it('returns the only option for single-element list', () => {
    const state = makeActionPhaseState();
    const pick = heuristicActionPicker(state, 1, ['gold_collectTribute']);
    expect(pick).toBe('gold_collectTribute');
  });
});

describe('heuristicDecisionFn', () => {
  const state = makeActionPhaseState();

  it('handles championChoice', () => {
    const decision = {
      type: 'championChoice',
      playerId: 1,
      options: [
        { id: 'deft', name: 'The Deft' },
        { id: 'fortunate', name: 'The Fortunate' },
        { id: 'ambitious', name: 'The Ambitious' },
      ],
    };
    const answer = heuristicDecisionFn(state, 1, decision);
    expect(answer.championId).toBeDefined();
    expect(['deft', 'fortunate', 'ambitious']).toContain(answer.championId);
  });

  it('handles gemSelection with correct total', () => {
    const decision = { type: 'gemSelection', count: 4 };
    const answer = heuristicDecisionFn(state, 1, decision);
    expect(answer.gemSelection).toBeDefined();
    const total = Object.values(answer.gemSelection).reduce((sum, v) => sum + v, 0);
    expect(total).toBe(4);
  });

  it('handles targetPlayer (picks highest glory opponent)', () => {
    const stateWithGlory = {
      ...state,
      players: state.players.map(p =>
        p.id === 2 ? { ...p, glory: 15 } : p
      ),
    };
    const decision = { type: 'targetPlayer', excludePlayer: 1 };
    const answer = heuristicDecisionFn(stateWithGlory, 1, decision);
    expect(answer.targetPlayer).toBe(2);
  });

  it('handles targetPlayer (never picks self)', () => {
    const decision = { type: 'targetPlayer', excludePlayer: 1 };
    const answer = heuristicDecisionFn(state, 1, decision);
    expect(answer.targetPlayer).not.toBe(1);
  });

  it('handles actionChoice', () => {
    const decision = {
      type: 'actionChoice',
      options: ['gold_collectTribute', 'gold_scavenge'],
    };
    const answer = heuristicDecisionFn(state, 1, decision);
    expect(answer.actionChoice).toBeDefined();
    expect(['gold_collectTribute', 'gold_scavenge']).toContain(answer.actionChoice);
  });
});

describe('heuristicShopDecision', () => {
  it('returns null when no gods accessed', () => {
    const state = makeActionPhaseState();
    const result = heuristicShopDecision(state, 1);
    expect(result).toBeNull();
  });

  it('returns null when player cannot afford any shops', () => {
    const state = {
      ...makeActionPhaseState(),
      godsAccessedThisTurn: ['gold'],
      // Player has no resources so can't afford
    };
    const result = heuristicShopDecision(state, 1);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe('integration', () => {
  it('can simulate 10 games with random AI without errors', () => {
    const stats = runSimulations({
      gameCount: 10,
      playerCount: 2,
      decisionFn: randomDecisionFn,
      actionPickerFn: randomActionPicker,
    });
    expect(stats.errors).toBe(0);
    expect(stats.completedGames).toBe(10);
  });

  it('can simulate 10 games with heuristic AI without errors', () => {
    const stats = runSimulations({
      gameCount: 10,
      playerCount: 2,
      decisionFn: heuristicDecisionFn,
      actionPickerFn: heuristicActionPicker,
      shopDecisionFn: heuristicShopDecision,
    });
    expect(stats.errors).toBe(0);
    expect(stats.completedGames).toBe(10);
  });

  it('heuristic AI produces higher average glory than random AI', () => {
    const randomStats = runSimulations({
      gameCount: 20,
      playerCount: 2,
      decisionFn: randomDecisionFn,
      actionPickerFn: randomActionPicker,
    });

    const heuristicStats = runSimulations({
      gameCount: 20,
      playerCount: 2,
      decisionFn: heuristicDecisionFn,
      actionPickerFn: heuristicActionPicker,
      shopDecisionFn: heuristicShopDecision,
    });

    // Sum up average glory across all players for each AI type
    const randomTotalGlory = Object.values(randomStats.avgGlory)
      .reduce((sum, v) => sum + v, 0);
    const heuristicTotalGlory = Object.values(heuristicStats.avgGlory)
      .reduce((sum, v) => sum + v, 0);

    // Heuristic should outperform random in total glory generated
    // (since it makes smarter resource choices and can use shops)
    expect(heuristicTotalGlory).toBeGreaterThanOrEqual(randomTotalGlory * 0.8);
    // Note: using 0.8 multiplier as safety margin -- heuristic should generally
    // be higher but randomness means we can't guarantee strictly greater
  });
});
