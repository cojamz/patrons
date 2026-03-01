import { describe, it, expect } from 'vitest';
import { endTurn } from '../../engine/GameEngine.js';
import { createPlayer } from '../../engine/stateHelpers.js';
import { allGameLayers } from '../../data/allGameLayers.js';

function createTestState(options = {}) {
    const playerCount = options.playerCount || 2;
    const players = [];
    for (let i = 0; i < playerCount; i++) {
        const p = createPlayer(i + 1, `Player ${i + 1}`, '🦊');
        p.workersLeft = options.workersLeft?.[i] ?? 3;
        if (options.playerVP?.[i] !== undefined) {
            p.victoryPoints = options.playerVP[i];
        }
        players.push(p);
    }

    return {
        currentPlayer: options.currentPlayer || 1,
        turnDirection: options.turnDirection || 1,
        gameMode: 'basic',
        players,
        occupiedSpaces: options.occupiedSpaces || {},
        round: options.round || 1,
        turnOrder: options.turnOrder || players.map(p => p.id),
        workerPlacedThisTurn: false,
        workersToPlace: 1,
        gameLayers: options.gameLayers || { red: allGameLayers.red, yellow: allGameLayers.yellow },
        automaticVPs: options.automaticVPs || {},
        closedShops: {},
        skippedTurns: options.skippedTurns || {},
        playersOutOfWorkers: options.playersOutOfWorkers || [],
        roundActions: [],
        gameOver: false
    };
}

describe('endTurn — basic turn progression', () => {
    it('advances to the next player in turn order', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 1,
            turnDirection: 1
        });

        const result = endTurn(state);
        expect(result.state.currentPlayer).toBe(2);
    });

    it('continues forward through turn order', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 2,
            turnDirection: 1
        });

        const result = endTurn(state);
        expect(result.state.currentPlayer).toBe(3);
    });
});

describe('endTurn — snake draft reversal', () => {
    it('reverses direction at the end of turn order', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 3,
            turnDirection: 1
        });

        const result = endTurn(state);
        // At boundary: same player stays, direction flips
        expect(result.state.currentPlayer).toBe(3);
        expect(result.state.turnDirection).toBe(-1);
    });

    it('reverses direction at the start of turn order (going backward)', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 1,
            turnDirection: -1
        });

        const result = endTurn(state);
        // At boundary: same player stays, direction flips
        expect(result.state.currentPlayer).toBe(1);
        expect(result.state.turnDirection).toBe(1);
    });

    it('goes backward through turn order', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 3,
            turnDirection: -1
        });

        const result = endTurn(state);
        expect(result.state.currentPlayer).toBe(2);
    });
});

describe('endTurn — skip turns', () => {
    it('skips a player with skipped turns', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 1,
            turnDirection: 1,
            skippedTurns: { 2: 1 }
        });

        const result = endTurn(state);
        expect(result.state.currentPlayer).toBe(3);
        // Skip counter decremented
        expect(result.state.skippedTurns[2]).toBe(0);
    });

    it('logs skip message', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 1,
            turnDirection: 1,
            skippedTurns: { 2: 1 }
        });

        const result = endTurn(state);
        expect(result.log.some(l => l.includes('Turn skipped'))).toBe(true);
    });
});

describe('endTurn — workers exhausted', () => {
    it('skips players with 0 workers', () => {
        const state = createTestState({
            playerCount: 3,
            turnOrder: [1, 2, 3],
            currentPlayer: 1,
            turnDirection: 1,
            workersLeft: [3, 0, 3]
        });

        const result = endTurn(state);
        expect(result.state.currentPlayer).toBe(3);
    });

    it('tracks player running out of workers', () => {
        const state = createTestState({
            playerCount: 2,
            turnOrder: [1, 2],
            currentPlayer: 1,
            workersLeft: [0, 3]
        });

        const result = endTurn(state);
        expect(result.state.playersOutOfWorkers).toContain(1);
    });

    it('signals round advance when all workers exhausted', () => {
        const state = createTestState({
            playerCount: 2,
            turnOrder: [1, 2],
            currentPlayer: 1,
            round: 1,
            workersLeft: [0, 0]
        });

        const result = endTurn(state);
        expect(result.needsRoundAdvance).toBe(true);
    });

    it('signals game over when all workers exhausted in round 3', () => {
        const state = createTestState({
            playerCount: 2,
            turnOrder: [1, 2],
            currentPlayer: 1,
            round: 3,
            workersLeft: [0, 0]
        });

        const result = endTurn(state);
        expect(result.state.gameOver).toBe(true);
    });
});

describe('endTurn — state reset', () => {
    it('resets workerPlacedThisTurn', () => {
        const state = createTestState();
        state.workerPlacedThisTurn = true;

        const result = endTurn(state);
        expect(result.state.workerPlacedThisTurn).toBe(false);
    });

    it('resets workersToPlace to 1', () => {
        const state = createTestState();
        state.workersToPlace = 3;

        const result = endTurn(state);
        expect(result.state.workersToPlace).toBe(1);
    });

    it('resets shopUsedAfterWorkers', () => {
        const state = createTestState();
        state.shopUsedAfterWorkers = true;

        const result = endTurn(state);
        expect(result.state.shopUsedAfterWorkers).toBe(false);
    });

    it('resets vpShopUsed', () => {
        const state = createTestState();
        state.vpShopUsed = true;

        const result = endTurn(state);
        expect(result.state.vpShopUsed).toBe(false);
    });
});

describe('endTurn — immutability', () => {
    it('does not mutate original state', () => {
        const state = createTestState();
        const originalPlayer = state.currentPlayer;

        endTurn(state);

        expect(state.currentPlayer).toBe(originalPlayer);
    });
});
