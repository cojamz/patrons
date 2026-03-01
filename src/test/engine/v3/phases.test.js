import { describe, it, expect } from 'vitest';
import {
  Phase,
  ACTIONS_PER_ROUND,
  executeChampionDraft,
  executeRoundStart,
  executeRoundEnd,
  advanceTurn,
  isGameOver,
  resortTurnOrder,
} from '../../../engine/v3/phases.js';
import { createV3GameState, addGlory } from '../../../engine/v3/stateHelpers.js';

// --- Test Helpers ---

function makeState(overrides = {}) {
  return createV3GameState({
    playerCount: 3,
    playerNames: ['Alice', 'Bob', 'Charlie'],
    godSet: ['gold', 'black', 'green', 'yellow'],
    gameMode: 'standard',
    ...overrides,
  });
}

function stateInActionPhase(playerCount = 3) {
  let state = makeState({ playerCount });
  // Skip draft: assign champions directly
  const championIds = ['prescient', 'ambitious', 'fortunate', 'blessed'];
  const champions = {};
  for (let i = 1; i <= playerCount; i++) {
    champions[i] = { id: championIds[i - 1], powerCards: [], powerCardSlots: 4 };
  }
  state = {
    ...state,
    champions,
    phase: Phase.ROUND_START,
  };
  const result = executeRoundStart(state);
  return result.state;
}

// --- Phase Constants ---

describe('Phase constants', () => {
  it('defines all phase values', () => {
    expect(Phase.CHAMPION_DRAFT).toBe('champion_draft');
    expect(Phase.ROUND_START).toBe('round_start');
    expect(Phase.ACTION_PHASE).toBe('action_phase');
    expect(Phase.ROUND_END).toBe('round_end');
    expect(Phase.GAME_END).toBe('game_end');
  });
});

describe('ACTIONS_PER_ROUND', () => {
  it('defines correct worker counts', () => {
    expect(ACTIONS_PER_ROUND).toEqual([4, 5, 6]);
  });
});

// --- Champion Draft ---

describe('executeChampionDraft', () => {
  it('returns pendingDecision when no choice made', () => {
    const state = makeState();
    const result = executeChampionDraft(state);
    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('championChoice');
    expect(result.pendingDecision.playerId).toBe(1); // first drafter
    expect(result.pendingDecision.options.length).toBeGreaterThan(0);
  });

  it('assigns champion when choice provided', () => {
    const state = makeState();
    const result = executeChampionDraft(state, { championId: 'prescient' });
    expect(result.state.champions[1]).toBeDefined();
    expect(result.state.champions[1].id).toBe('prescient');
    expect(result.state.champions[1].powerCards).toEqual([]);
    expect(result.state.draftIndex).toBe(1);
  });

  it('follows draft order (1 champion per player)', () => {
    let state = makeState({ playerCount: 2 });

    // Draft order for 2 players: [1, 2] — each player picks exactly 1 champion
    // Player 1 picks first
    let result = executeChampionDraft(state);
    expect(result.pendingDecision.playerId).toBe(1);

    result = executeChampionDraft(state, { championId: 'prescient' });
    state = result.state;

    // Player 2 picks second
    result = executeChampionDraft(state);
    expect(result.pendingDecision.playerId).toBe(2);

    result = executeChampionDraft(state, { championId: 'ambitious' });
    state = result.state;

    // Draft is complete — transitions to ROUND_START
    expect(state.phase).toBe(Phase.ROUND_START);
  });

  it('excludes already-taken champions from options', () => {
    let state = makeState({ playerCount: 2 });
    let result = executeChampionDraft(state, { championId: 'prescient' });
    state = result.state;

    result = executeChampionDraft(state);
    const optionIds = result.pendingDecision.options.map(o => o.id);
    expect(optionIds).not.toContain('prescient');
  });

  it('transitions to ROUND_START after all players pick', () => {
    let state = makeState({ playerCount: 2 });
    // Draft order for 2: [1, 2] — each player picks exactly 1 champion
    const picks = ['prescient', 'ambitious'];
    for (const pick of picks) {
      const result = executeChampionDraft(state, { championId: pick });
      state = result.state;
    }
    expect(state.phase).toBe(Phase.ROUND_START);
  });

  it('logs champion draft completion', () => {
    let state = makeState({ playerCount: 2 });
    const picks = ['prescient', 'ambitious'];
    let lastResult;
    for (const pick of picks) {
      lastResult = executeChampionDraft(state, { championId: pick });
      state = lastResult.state;
    }
    expect(lastResult.log.some(l => l.includes('draft complete'))).toBe(true);
  });
});

// --- Round Start ---

describe('executeRoundStart', () => {
  it('resets occupiedSpaces and sets worker counts', () => {
    let state = makeState();
    state = { ...state, phase: Phase.ROUND_START, round: 1 };
    const result = executeRoundStart(state);
    expect(result.state.occupiedSpaces).toEqual({});
    expect(result.state.players[0].workersLeft).toBe(4); // Round 1: 4 workers
    expect(result.state.players[1].workersLeft).toBe(4);
  });

  it('transitions to ACTION_PHASE', () => {
    let state = makeState();
    state = { ...state, phase: Phase.ROUND_START, round: 1 };
    const result = executeRoundStart(state);
    expect(result.state.phase).toBe(Phase.ACTION_PHASE);
  });

  it('sets correct workers for round 2', () => {
    let state = makeState();
    state = { ...state, phase: Phase.ROUND_START, round: 2 };
    const result = executeRoundStart(state);
    expect(result.state.players[0].workersLeft).toBe(5);
  });

  it('sets correct workers for round 3', () => {
    let state = makeState();
    state = { ...state, phase: Phase.ROUND_START, round: 3 };
    const result = executeRoundStart(state);
    expect(result.state.players[0].workersLeft).toBe(6);
  });

  it('resets per-round state', () => {
    let state = makeState();
    state = {
      ...state,
      phase: Phase.ROUND_START,
      round: 1,
      occupiedSpaces: { gold_collectTribute: 1 },
      skippedTurns: { 1: 1 },
      playersOutOfWorkers: [1],
    };
    const result = executeRoundStart(state);
    expect(result.state.occupiedSpaces).toEqual({});
    expect(result.state.skippedTurns).toEqual({});
    expect(result.state.playersOutOfWorkers).toEqual([]);
  });

  it('resets extraTurns on all players', () => {
    let state = makeState();
    state = {
      ...state,
      phase: Phase.ROUND_START,
      round: 1,
      players: state.players.map(p => ({ ...p, extraTurns: 2 })),
    };
    const result = executeRoundStart(state);
    result.state.players.forEach(p => {
      expect(p.extraTurns).toBe(0);
    });
  });

  it('logs the round start', () => {
    let state = makeState();
    state = { ...state, phase: Phase.ROUND_START, round: 2 };
    const result = executeRoundStart(state);
    expect(result.log.some(l => l.includes('Round 2'))).toBe(true);
  });
});

// --- Turn Advancement ---

describe('advanceTurn', () => {
  it('progresses through turnOrder correctly', () => {
    const state = stateInActionPhase(3);
    expect(state.currentPlayer).toBe(1);

    const next = advanceTurn(state);
    expect(next.currentPlayer).toBe(2);

    const next2 = advanceTurn(next);
    expect(next2.currentPlayer).toBe(3);
  });

  it('handles snake draft reversal at end of turn order', () => {
    let state = stateInActionPhase(3);
    // Go through all players: 1 -> 2 -> 3 -> 3 (reversed) -> 2 -> 1
    state = advanceTurn(state);  // -> 2
    state = advanceTurn(state);  // -> 3
    state = advanceTurn(state);  // -> 3 (reversal, stays at end)
    expect(state.currentPlayer).toBe(3);
    // After reversal going backward
    state = advanceTurn(state);  // -> 2
    expect(state.currentPlayer).toBe(2);
    state = advanceTurn(state);  // -> 1
    expect(state.currentPlayer).toBe(1);
  });

  it('handles extraTurns by staying on current player', () => {
    let state = stateInActionPhase(2);
    state = {
      ...state,
      players: state.players.map(p =>
        p.id === 1 ? { ...p, extraTurns: 1 } : p
      ),
    };
    const next = advanceTurn(state);
    expect(next.currentPlayer).toBe(1);
    // Extra turn should be consumed
    const player = next.players.find(p => p.id === 1);
    expect(player.extraTurns).toBe(0);
  });

  it('handles skippedTurns by skipping the player', () => {
    let state = stateInActionPhase(3);
    state = {
      ...state,
      skippedTurns: { 2: 1 },
    };
    const next = advanceTurn(state);
    // Should skip player 2, go to player 3
    expect(next.currentPlayer).toBe(3);
  });

  it('transitions to ROUND_END when all out of workers', () => {
    let state = stateInActionPhase(2);
    state = {
      ...state,
      players: state.players.map(p => ({ ...p, workersLeft: 0 })),
    };
    const next = advanceTurn(state);
    expect(next.phase).toBe(Phase.ROUND_END);
  });

  it('resets per-turn state', () => {
    let state = stateInActionPhase(2);
    state = {
      ...state,
      workerPlacedThisTurn: true,
      turnResourceGains: { 1: { gold: 3 } },
      godsAccessedThisTurn: ['gold'],
      turnActionsThisTurn: ['gold_collectTribute'],
    };
    const next = advanceTurn(state);
    expect(next.workerPlacedThisTurn).toBe(false);
    expect(next.turnResourceGains).toEqual({});
    expect(next.godsAccessedThisTurn).toEqual([]);
    expect(next.turnActionsThisTurn).toEqual([]);
  });
});

// --- Round End ---

describe('executeRoundEnd', () => {
  it('advances to next round when round < 3', () => {
    let state = stateInActionPhase(2);
    state = { ...state, phase: Phase.ROUND_END, round: 1 };
    const result = executeRoundEnd(state);
    expect(result.state.round).toBe(2);
    expect(result.state.phase).toBe(Phase.ROUND_START);
  });

  it('transitions to GAME_END after round 3', () => {
    let state = stateInActionPhase(2);
    state = { ...state, phase: Phase.ROUND_END, round: 3 };
    const result = executeRoundEnd(state);
    expect(result.state.phase).toBe(Phase.GAME_END);
    expect(result.state.gameOver).toBe(true);
  });

  it('logs round end', () => {
    let state = stateInActionPhase(2);
    state = { ...state, phase: Phase.ROUND_END, round: 1 };
    const result = executeRoundEnd(state);
    expect(result.log.some(l => l.includes('Round 1 ends'))).toBe(true);
  });

  it('logs game over at end of round 3', () => {
    let state = stateInActionPhase(2);
    state = { ...state, phase: Phase.ROUND_END, round: 3 };
    const result = executeRoundEnd(state);
    expect(result.log.some(l => l.includes('Game over'))).toBe(true);
  });
});

// --- Game Over ---

describe('isGameOver', () => {
  it('returns false during normal play', () => {
    const state = stateInActionPhase(2);
    expect(isGameOver(state)).toBe(false);
  });

  it('returns true when phase is GAME_END', () => {
    const state = { ...stateInActionPhase(2), phase: Phase.GAME_END };
    expect(isGameOver(state)).toBe(true);
  });

  it('returns true when round exceeds 3', () => {
    const state = { ...stateInActionPhase(2), round: 4 };
    expect(isGameOver(state)).toBe(true);
  });
});

// --- Turn Order ---

describe('resortTurnOrder', () => {
  it('sorts players by glory (lowest first)', () => {
    let state = makeState({ playerCount: 3 });
    state = addGlory(state, 1, 10, 'test');
    state = addGlory(state, 2, 3, 'test');
    state = addGlory(state, 3, 7, 'test');
    const sorted = resortTurnOrder(state);
    expect(sorted.turnOrder).toEqual([2, 3, 1]);
  });

  it('preserves order for equal glory', () => {
    let state = makeState({ playerCount: 3 });
    // All players start at 0 glory — original order preserved
    const sorted = resortTurnOrder(state);
    expect(sorted.turnOrder).toEqual([1, 2, 3]);
  });
});
