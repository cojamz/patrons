import { describe, it, expect } from 'vitest';
import { simulateGame, randomDecisionFn } from '../../engine/runner.js';
import { allGameLayers } from '../../data/allGameLayers.js';

describe('simulateGame — basic completion', () => {
    it('can simulate a complete 2-player game', () => {
        const gameLayers = {
            red: allGameLayers.red,
            yellow: allGameLayers.yellow
        };

        const { finalState, gameLog, turns } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 200
        });

        expect(finalState).toBeDefined();
        expect(gameLog).toBeDefined();
        expect(turns).toBeGreaterThan(0);
    });

    it('game ends after round 3', () => {
        const gameLayers = {
            red: allGameLayers.red,
            yellow: allGameLayers.yellow
        };

        const { finalState } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 200
        });

        // Game should be over (either gameOver flag or reached round 3+)
        expect(finalState.gameOver === true || finalState.round >= 3).toBe(true);
    });

    it('all players have VP at end', () => {
        const gameLayers = {
            yellow: allGameLayers.yellow,
            red: allGameLayers.red
        };

        const { finalState } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 200
        });

        // At least one player should have VP (yellow auto VP or red auto VP)
        const totalVP = finalState.players.reduce((sum, p) => sum + p.victoryPoints, 0);
        expect(totalVP).toBeGreaterThan(0);
    });

    it('does not exceed maxTurns safety limit', () => {
        const gameLayers = {
            red: allGameLayers.red,
            yellow: allGameLayers.yellow
        };

        const { turns } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 50
        });

        expect(turns).toBeLessThanOrEqual(50);
    });
});

describe('simulateGame — player counts', () => {
    it('handles 3-player game', () => {
        const gameLayers = {
            red: allGameLayers.red,
            yellow: allGameLayers.yellow,
            blue: allGameLayers.blue
        };

        const { finalState } = simulateGame({
            playerCount: 3,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 300
        });

        expect(finalState.players).toHaveLength(3);
    });

    it('handles 4-player game', () => {
        const gameLayers = {
            red: allGameLayers.red,
            yellow: allGameLayers.yellow,
            blue: allGameLayers.blue,
            black: allGameLayers.black
        };

        const { finalState } = simulateGame({
            playerCount: 4,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 400
        });

        expect(finalState.players).toHaveLength(4);
    });
});

describe('simulateGame — game log', () => {
    it('produces log entries', () => {
        const gameLayers = {
            red: allGameLayers.red,
            yellow: allGameLayers.yellow
        };

        const { gameLog } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 200
        });

        expect(gameLog.length).toBeGreaterThan(0);
    });
});

describe('simulateGame — different layer combinations', () => {
    it('handles gold + white layers', () => {
        const gameLayers = {
            gold: allGameLayers.gold,
            white: allGameLayers.white
        };

        const { finalState } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 200
        });

        expect(finalState).toBeDefined();
        // White layer gives +5 VP at start
        expect(finalState.players.every(p => p.victoryPoints >= 0)).toBe(true);
    });

    it('handles black + silver layers', () => {
        const gameLayers = {
            black: allGameLayers.black,
            silver: allGameLayers.silver
        };

        const { finalState } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 200
        });

        expect(finalState).toBeDefined();
    });

    it('handles all 4 basic layers', () => {
        const gameLayers = {
            red: allGameLayers.red,
            yellow: allGameLayers.yellow,
            blue: allGameLayers.blue,
            black: allGameLayers.black
        };

        const { finalState } = simulateGame({
            playerCount: 2,
            gameLayers,
            gameMode: 'basic',
            maxTurns: 200
        });

        expect(finalState).toBeDefined();
        expect(finalState.gameOver === true || finalState.round >= 3).toBe(true);
    });
});

describe('randomDecisionFn', () => {
    it('handles gemSelection decisions', () => {
        const state = {
            gameLayers: { red: allGameLayers.red, blue: allGameLayers.blue },
            players: [{ id: 1, resources: { red: 3, blue: 2 } }]
        };

        const result = randomDecisionFn(state, 1, {
            type: 'gemSelection',
            maxGems: 3
        });

        expect(result.gemSelection).toBeDefined();
        const totalGems = Object.values(result.gemSelection).reduce((s, v) => s + v, 0);
        expect(totalGems).toBe(3);
    });

    it('handles targetPlayer decisions', () => {
        const state = {
            players: [
                { id: 1, name: 'P1' },
                { id: 2, name: 'P2' },
                { id: 3, name: 'P3' }
            ]
        };

        const result = randomDecisionFn(state, 1, {
            type: 'targetPlayer'
        });

        expect(result.targetPlayer).toBeDefined();
        expect(result.targetPlayer).not.toBe(1); // not self
    });

    it('handles actionChoice decisions', () => {
        const result = randomDecisionFn({}, 1, {
            type: 'actionChoice',
            options: [
                { label: 'Action A', value: 'gain3red' },
                { label: 'Action B', value: 'gain3blue' }
            ]
        });

        expect(result.actionChoice).toBeDefined();
        expect(['gain3red', 'gain3blue']).toContain(result.actionChoice);
    });

    it('handles unknown decision types gracefully', () => {
        const result = randomDecisionFn({}, 1, { type: 'unknownType' });
        expect(result).toEqual({});
    });
});
