import { describe, it, expect } from 'vitest';
import { advanceRound, createGame } from '../../engine/GameEngine.js';
import { createPlayer } from '../../engine/stateHelpers.js';
import { allGameLayers } from '../../data/allGameLayers.js';

function createTestState(options = {}) {
    const playerCount = options.playerCount || 2;
    const players = [];
    for (let i = 0; i < playerCount; i++) {
        const p = createPlayer(i + 1, `Player ${i + 1}`, '🦊');
        p.workersLeft = 0; // round just ended
        if (options.playerVP?.[i] !== undefined) {
            p.victoryPoints = options.playerVP[i];
        }
        if (options.playerResources?.[i]) {
            p.resources = { ...p.resources, ...options.playerResources[i] };
        }
        if (options.shopCostModifier?.[i] !== undefined) {
            p.shopCostModifier = options.shopCostModifier[i];
        }
        players.push(p);
    }

    const gameLayers = options.gameLayers || {
        red: allGameLayers.red,
        yellow: allGameLayers.yellow,
        blue: allGameLayers.blue,
        black: allGameLayers.black
    };

    const closedShops = {};
    Object.keys(gameLayers).forEach(color => {
        closedShops[`${color}2`] = true;
        closedShops[`${color}3`] = true;
    });
    // In round 2, R2 shops should be open
    if (options.round >= 2) {
        Object.keys(gameLayers).forEach(color => {
            delete closedShops[`${color}2`];
        });
    }

    return {
        currentPlayer: 1,
        turnDirection: 1,
        gameMode: 'basic',
        players,
        occupiedSpaces: options.occupiedSpaces || { gain3red: 1, gain3blue: 2 },
        round: options.round || 1,
        turnOrder: players.map(p => p.id),
        workerPlacedThisTurn: false,
        workersToPlace: 1,
        gameLayers,
        automaticVPs: options.automaticVPs || {},
        closedShops,
        skippedTurns: {},
        playersOutOfWorkers: [],
        waitingForOthers: {},
        roundActions: [],
        gameOver: false
    };
}

describe('advanceRound — round progression', () => {
    it('advances from round 1 to round 2', () => {
        const state = createTestState({ round: 1 });
        const result = advanceRound(state);

        expect(result.state.round).toBe(2);
    });

    it('advances from round 2 to round 3', () => {
        const state = createTestState({ round: 2 });
        const result = advanceRound(state);

        expect(result.state.round).toBe(3);
    });

    it('cannot advance past round 3', () => {
        const state = createTestState({ round: 3 });
        const result = advanceRound(state);

        expect(result.state.gameOver).toBe(true);
    });
});

describe('advanceRound — worker reset', () => {
    it('gives 5 workers in round 2', () => {
        const state = createTestState({ round: 1 });
        const result = advanceRound(state);

        result.state.players.forEach(player => {
            expect(player.workersLeft).toBe(5);
        });
    });

    it('gives 6 workers in round 3', () => {
        const state = createTestState({ round: 2 });
        const result = advanceRound(state);

        result.state.players.forEach(player => {
            expect(player.workersLeft).toBe(6);
        });
    });
});

describe('advanceRound — occupied spaces reset', () => {
    it('clears all occupied spaces', () => {
        const state = createTestState({
            occupiedSpaces: { gain3red: 1, gain3blue: 2, gain2red: 1 }
        });
        const result = advanceRound(state);

        expect(Object.keys(result.state.occupiedSpaces)).toHaveLength(0);
    });
});

describe('advanceRound — turn order re-sort by VP', () => {
    it('sorts players by VP (lowest first)', () => {
        const state = createTestState({
            playerCount: 3,
            playerVP: [10, 5, 15]
        });
        const result = advanceRound(state);

        expect(result.state.turnOrder).toEqual([2, 1, 3]);
        expect(result.state.currentPlayer).toBe(2); // lowest VP goes first
    });

    it('first player in turn order is set as current', () => {
        const state = createTestState({
            playerVP: [10, 5]
        });
        const result = advanceRound(state);

        expect(result.state.currentPlayer).toBe(result.state.turnOrder[0]);
    });

    it('resets turn direction to forward', () => {
        const state = createTestState();
        state.turnDirection = -1;
        const result = advanceRound(state);

        expect(result.state.turnDirection).toBe(1);
    });
});

describe('advanceRound — shop opening', () => {
    it('opens R2 shops when advancing to round 2', () => {
        const state = createTestState({ round: 1 });
        const result = advanceRound(state);

        // R2 shops should now be open (not in closedShops)
        Object.keys(state.gameLayers).forEach(color => {
            expect(result.state.closedShops[`${color}2`]).toBeUndefined();
        });
    });

    it('opens R3 shops when advancing to round 3', () => {
        const state = createTestState({ round: 2 });
        const result = advanceRound(state);

        Object.keys(state.gameLayers).forEach(color => {
            expect(result.state.closedShops[`${color}3`]).toBeUndefined();
        });
    });

    it('R3 shops stay closed when advancing to round 2', () => {
        const state = createTestState({ round: 1 });
        const result = advanceRound(state);

        Object.keys(state.gameLayers).forEach(color => {
            expect(result.state.closedShops[`${color}3`]).toBe(true);
        });
    });
});

describe('advanceRound — shop cost modifier reset', () => {
    it('resets all player shopCostModifiers to 0', () => {
        const state = createTestState({
            shopCostModifier: [-2, 1]
        });
        const result = advanceRound(state);

        result.state.players.forEach(player => {
            expect(player.shopCostModifier).toBe(0);
        });
    });
});

describe('advanceRound — state resets', () => {
    it('resets playersOutOfWorkers', () => {
        const state = createTestState();
        state.playersOutOfWorkers = [1, 2];
        const result = advanceRound(state);

        expect(result.state.playersOutOfWorkers).toEqual([]);
    });

    it('resets skippedTurns', () => {
        const state = createTestState();
        state.skippedTurns = { 1: 1, 2: 0 };
        const result = advanceRound(state);

        expect(result.state.skippedTurns).toEqual({});
    });

    it('resets roundActions', () => {
        const state = createTestState();
        state.roundActions = ['action1', 'action2'];
        const result = advanceRound(state);

        expect(result.state.roundActions).toEqual([]);
    });

    it('resets workerPlacedThisTurn', () => {
        const state = createTestState();
        state.workerPlacedThisTurn = true;
        const result = advanceRound(state);

        expect(result.state.workerPlacedThisTurn).toBe(false);
    });
});

describe('advanceRound — auto VP', () => {
    it('calculates yellow auto VP (color diversity)', () => {
        const state = createTestState({
            gameLayers: { yellow: allGameLayers.yellow, red: allGameLayers.red },
            playerResources: [
                { red: 2, blue: 1, yellow: 3 }, // 3 different colors
                { red: 5 }                        // 1 color
            ]
        });
        const result = advanceRound(state);

        const p1 = result.state.players.find(p => p.id === 1);
        const p2 = result.state.players.find(p => p.id === 2);
        expect(p1.victoryPoints).toBeGreaterThanOrEqual(3); // 3 colors
        expect(p2.victoryPoints).toBeGreaterThanOrEqual(1); // 1 color
    });

    it('calculates gold auto VP (per gold)', () => {
        const state = createTestState({
            gameLayers: { gold: allGameLayers.gold, red: allGameLayers.red },
            playerResources: [
                { gold: 4 },
                { gold: 0 }
            ]
        });
        const result = advanceRound(state);

        const p1 = result.state.players.find(p => p.id === 1);
        const p2 = result.state.players.find(p => p.id === 2);
        expect(p1.victoryPoints).toBeGreaterThanOrEqual(4); // 4 gold
        expect(p2.victoryPoints).toBe(0);
    });
});

describe('advanceRound — log messages', () => {
    it('includes round start message', () => {
        const state = createTestState({ round: 1 });
        const result = advanceRound(state);

        expect(result.log.some(l => l.includes('Round 2 started'))).toBe(true);
    });
});

describe('createGame', () => {
    it('creates a game with correct number of players', () => {
        const state = createGame({ playerCount: 3 });

        expect(state.players).toHaveLength(3);
    });

    it('creates players with correct initial workers (4)', () => {
        const state = createGame({ playerCount: 2 });

        state.players.forEach(p => {
            expect(p.workersLeft).toBe(4);
        });
    });

    it('starts at round 1', () => {
        const state = createGame({ playerCount: 2 });
        expect(state.round).toBe(1);
    });

    it('creates empty occupied spaces', () => {
        const state = createGame({ playerCount: 2 });
        expect(Object.keys(state.occupiedSpaces)).toHaveLength(0);
    });

    it('sets up closed shops for R2 and R3', () => {
        const gameLayers = { red: allGameLayers.red, yellow: allGameLayers.yellow };
        const state = createGame({ playerCount: 2, gameLayers });

        expect(state.closedShops['red2']).toBe(true);
        expect(state.closedShops['red3']).toBe(true);
        expect(state.closedShops['yellow2']).toBe(true);
        expect(state.closedShops['yellow3']).toBe(true);
    });

    it('gives +5 VP to all players when white layer is active', () => {
        const gameLayers = { white: allGameLayers.white, red: allGameLayers.red };
        const state = createGame({ playerCount: 2, gameLayers });

        state.players.forEach(p => {
            expect(p.victoryPoints).toBe(5);
            expect(p.vpSources.whiteStart).toBe(5);
        });
    });

    it('does not give +5 VP when white is not active', () => {
        const gameLayers = { red: allGameLayers.red, yellow: allGameLayers.yellow };
        const state = createGame({ playerCount: 2, gameLayers });

        state.players.forEach(p => {
            expect(p.victoryPoints).toBe(0);
        });
    });

    it('uses provided player names', () => {
        const state = createGame({
            playerCount: 2,
            playerNames: ['Alice', 'Bob']
        });

        expect(state.players[0].name).toBe('Alice');
        expect(state.players[1].name).toBe('Bob');
    });

    it('auto-generates names when not provided', () => {
        const state = createGame({ playerCount: 2 });

        expect(state.players[0].name).toMatch(/Player/);
        expect(state.players[1].name).toMatch(/Player/);
    });
});
