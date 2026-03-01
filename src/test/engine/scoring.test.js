import { describe, it, expect } from 'vitest';
import {
    calculateYellowAutoVP,
    calculateGoldAutoVP,
    calculateSilverAutoVP,
    calculatePurpleWorkerVP,
    calculateRoundEndScoring
} from '../../engine/scoring.js';
import { createPlayer } from '../../engine/stateHelpers.js';
import { allGameLayers } from '../../data/allGameLayers.js';

function createTestState(options = {}) {
    const playerCount = options.playerCount || 2;
    const players = [];
    for (let i = 0; i < playerCount; i++) {
        const p = createPlayer(i + 1, `Player ${i + 1}`, '🦊');
        if (options.playerResources?.[i]) {
            p.resources = { ...p.resources, ...options.playerResources[i] };
        }
        if (options.playerVP?.[i] !== undefined) {
            p.victoryPoints = options.playerVP[i];
        }
        players.push(p);
    }

    return {
        players,
        gameLayers: options.gameLayers || {},
        automaticVPs: options.automaticVPs || {},
        round: options.round || 1,
        playersOutOfWorkers: options.playersOutOfWorkers || []
    };
}

describe('calculateYellowAutoVP', () => {
    it('returns 0 when yellow layer is not active', () => {
        const state = createTestState({
            gameLayers: { red: allGameLayers.red },
            playerResources: [{ red: 5, blue: 3 }]
        });
        const result = calculateYellowAutoVP(state, 1);
        expect(result.vp).toBe(0);
    });

    it('counts different colors owned', () => {
        const state = createTestState({
            gameLayers: { yellow: allGameLayers.yellow },
            playerResources: [{ red: 2, blue: 1, yellow: 3, gold: 0 }]
        });
        const result = calculateYellowAutoVP(state, 1);
        expect(result.vp).toBe(3); // red, blue, yellow
    });

    it('returns 0 when player has no resources', () => {
        const state = createTestState({
            gameLayers: { yellow: allGameLayers.yellow }
        });
        const result = calculateYellowAutoVP(state, 1);
        expect(result.vp).toBe(0);
    });

    it('counts all 8 colors when all are owned', () => {
        const state = createTestState({
            gameLayers: { yellow: allGameLayers.yellow },
            playerResources: [{
                red: 1, yellow: 1, blue: 1, purple: 1,
                gold: 1, white: 1, black: 1, silver: 1
            }]
        });
        const result = calculateYellowAutoVP(state, 1);
        expect(result.vp).toBe(8);
    });

    it('includes description when VP > 0', () => {
        const state = createTestState({
            gameLayers: { yellow: allGameLayers.yellow },
            playerResources: [{ red: 1, blue: 1 }]
        });
        const result = calculateYellowAutoVP(state, 1);
        expect(result.description).toContain('2');
        expect(result.description).toContain('different color');
    });
});

describe('calculateGoldAutoVP', () => {
    it('returns 0 when gold layer is not active', () => {
        const state = createTestState({
            gameLayers: { red: allGameLayers.red },
            playerResources: [{ gold: 5 }]
        });
        const result = calculateGoldAutoVP(state, 1);
        expect(result.vp).toBe(0);
    });

    it('returns VP equal to gold owned', () => {
        const state = createTestState({
            gameLayers: { gold: allGameLayers.gold },
            playerResources: [{ gold: 7 }]
        });
        const result = calculateGoldAutoVP(state, 1);
        expect(result.vp).toBe(7);
    });

    it('returns 0 when player has no gold', () => {
        const state = createTestState({
            gameLayers: { gold: allGameLayers.gold }
        });
        const result = calculateGoldAutoVP(state, 1);
        expect(result.vp).toBe(0);
    });
});

describe('calculateSilverAutoVP', () => {
    it('returns empty when silver layer is not active', () => {
        const state = createTestState({
            gameLayers: { red: allGameLayers.red },
            playerVP: [10, 5]
        });
        const result = calculateSilverAutoVP(state);
        expect(result).toHaveLength(0);
    });

    it('gives +3 silver to leader and +2 VP to others', () => {
        const state = createTestState({
            gameLayers: { silver: allGameLayers.silver },
            playerVP: [10, 5]
        });
        const result = calculateSilverAutoVP(state);

        expect(result).toHaveLength(2);

        // Player 1 is leader (10 VP) → gets silver
        const leaderUpdate = result.find(u => u.playerId === 1);
        expect(leaderUpdate.type).toBe('silver');
        expect(leaderUpdate.amount).toBe(3);

        // Player 2 is not leader → gets VP
        const otherUpdate = result.find(u => u.playerId === 2);
        expect(otherUpdate.type).toBe('vp');
        expect(otherUpdate.amount).toBe(2);
    });

    it('handles tied leaders (both get silver)', () => {
        const state = createTestState({
            gameLayers: { silver: allGameLayers.silver },
            playerVP: [10, 10]
        });
        const result = calculateSilverAutoVP(state);

        // Both are leaders → both get silver
        result.forEach(update => {
            expect(update.type).toBe('silver');
            expect(update.amount).toBe(3);
        });
    });

    it('handles 3+ players correctly', () => {
        const state = createTestState({
            playerCount: 3,
            gameLayers: { silver: allGameLayers.silver },
            playerVP: [5, 10, 3]
        });
        const result = calculateSilverAutoVP(state);

        expect(result).toHaveLength(3);

        // Player 2 is leader
        const p2 = result.find(u => u.playerId === 2);
        expect(p2.type).toBe('silver');

        // Others get VP
        const p1 = result.find(u => u.playerId === 1);
        const p3 = result.find(u => u.playerId === 3);
        expect(p1.type).toBe('vp');
        expect(p3.type).toBe('vp');
    });
});

describe('calculatePurpleWorkerVP', () => {
    it('returns empty when purple auto VP is not active', () => {
        const state = createTestState({ automaticVPs: {} });
        const result = calculatePurpleWorkerVP(state, [1, 2]);
        expect(result).toHaveLength(0);
    });

    it('gives +4 VP to first player out of workers', () => {
        const state = createTestState({
            automaticVPs: { purple: true }
        });
        // Set all workers to 0 so "allOut" is true
        state.players.forEach(p => { p.workersLeft = 0; });

        const result = calculatePurpleWorkerVP(state, [1, 2]);

        const firstUpdate = result.find(u => u.playerId === 1);
        expect(firstUpdate).toBeDefined();
        expect(firstUpdate.vp).toBe(4);
        expect(firstUpdate.reason).toContain('first');
    });

    it('gives +4 VP to last player out of workers', () => {
        const state = createTestState({
            automaticVPs: { purple: true }
        });
        state.players.forEach(p => { p.workersLeft = 0; });

        const result = calculatePurpleWorkerVP(state, [1, 2]);

        const lastUpdate = result.find(u => u.playerId === 2);
        expect(lastUpdate).toBeDefined();
        expect(lastUpdate.vp).toBe(4);
        expect(lastUpdate.reason).toContain('last');
    });

    it('does not double-count in 2-player when same player is first and last', () => {
        const state = createTestState({
            automaticVPs: { purple: true }
        });
        state.players.forEach(p => { p.workersLeft = 0; });

        // Only one player in the list — they are both first and last
        const result = calculatePurpleWorkerVP(state, [1]);

        // Should only get one award, not two
        expect(result).toHaveLength(1);
        expect(result[0].playerId).toBe(1);
    });
});

describe('calculateRoundEndScoring — integration', () => {
    it('applies yellow + gold auto VP together', () => {
        const state = createTestState({
            gameLayers: {
                yellow: allGameLayers.yellow,
                gold: allGameLayers.gold
            },
            playerResources: [
                { red: 1, blue: 1, gold: 3 },  // 3 colors (yellow VP) + 3 gold (gold VP)
                { gold: 1 }                      // 1 color + 1 gold
            ]
        });

        const result = calculateRoundEndScoring(state);

        const p1 = result.state.players.find(p => p.id === 1);
        const p2 = result.state.players.find(p => p.id === 2);

        expect(p1.victoryPoints).toBe(6); // 3 colors + 3 gold
        expect(p2.victoryPoints).toBe(2); // 1 color + 1 gold
    });

    it('applies silver auto VP', () => {
        const state = createTestState({
            gameLayers: { silver: allGameLayers.silver },
            playerVP: [10, 5]
        });

        const result = calculateRoundEndScoring(state);

        // Leader (P1, 10 VP) gets +3 silver
        const p1 = result.state.players.find(p => p.id === 1);
        expect(p1.resources.silver).toBe(3);

        // Non-leader (P2, 5 VP) gets +2 VP
        const p2 = result.state.players.find(p => p.id === 2);
        expect(p2.victoryPoints).toBe(7); // 5 + 2
    });

    it('returns log messages', () => {
        const state = createTestState({
            gameLayers: { yellow: allGameLayers.yellow },
            playerResources: [{ red: 1, blue: 1 }]
        });

        const result = calculateRoundEndScoring(state);
        expect(result.log.length).toBeGreaterThan(0);
    });

    it('returns empty log when no auto VP applies', () => {
        const state = createTestState({
            gameLayers: { red: allGameLayers.red }
        });

        const result = calculateRoundEndScoring(state);
        expect(result.log).toHaveLength(0);
    });
});
