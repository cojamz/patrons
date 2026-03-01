import { describe, it, expect } from 'vitest';
import { executeBasicGain, basicGains, isBasicGain } from '../../engine/actions/basicActions.js';
import { createPlayer, addEffect, emptyResources } from '../../engine/stateHelpers.js';
import { allGameLayers } from '../../data/allGameLayers.js';

// Helper: create a minimal game state with specified layers
function createTestState(options = {}) {
    const playerCount = options.playerCount || 2;
    const players = [];
    for (let i = 0; i < playerCount; i++) {
        const p = createPlayer(i + 1, `Player ${i + 1}`, '🦊');
        if (options.playerResources?.[i]) {
            p.resources = { ...p.resources, ...options.playerResources[i] };
        }
        if (options.playerEffects?.[i]) {
            p.effects = [...options.playerEffects[i]];
        }
        players.push(p);
    }

    return {
        currentPlayer: 1,
        turnDirection: 1,
        gameMode: 'basic',
        players,
        occupiedSpaces: options.occupiedSpaces || {},
        round: options.round || 1,
        turnOrder: players.map(p => p.id),
        workerPlacedThisTurn: false,
        workersToPlace: 1,
        gameLayers: options.gameLayers || { red: allGameLayers.red, yellow: allGameLayers.yellow, blue: allGameLayers.blue, black: allGameLayers.black },
        automaticVPs: {},
        closedShops: {},
        skippedTurns: {},
        playersOutOfWorkers: [],
        roundActions: [],
        gameOver: false
    };
}

describe('basicActions — isBasicGain', () => {
    it('identifies all 14 basic gain actions', () => {
        const expected = [
            'gain3red', 'gain2red', 'gain3blue', 'gain2blue',
            'gain3purple', 'gain2purple', 'gain2gold', 'gain1gold',
            'gain3white', 'gain2white', 'gain3black', 'gain2black',
            'gain3silver', 'gain2silver'
        ];
        expected.forEach(id => expect(isBasicGain(id)).toBe(true));
    });

    it('returns false for non-basic actions', () => {
        expect(isBasicGain('redRepeatAction')).toBe(false);
        expect(isBasicGain('steal2Gems')).toBe(false);
        expect(isBasicGain('unknownAction')).toBe(false);
    });
});

describe('basicActions — executeBasicGain', () => {
    it('gain3red gives 3 red', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain3red', state.gameLayers);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(3);
        expect(result.log.length).toBeGreaterThan(0);
    });

    it('gain2blue gives 2 blue', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain2blue', state.gameLayers);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.blue).toBe(2);
    });

    it('gain2gold gives 2 gold', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain2gold', state.gameLayers);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.gold).toBe(2);
    });

    it('gain1gold gives 1 gold', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain1gold', state.gameLayers);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.gold).toBe(1);
    });

    it('each basic action gives correct amounts', () => {
        Object.entries(basicGains).forEach(([actionId, gains]) => {
            const state = createTestState();
            const result = executeBasicGain(state, 1, actionId, state.gameLayers);
            const player = result.state.players.find(p => p.id === 1);

            Object.entries(gains).forEach(([color, amount]) => {
                expect(player.resources[color]).toBe(amount);
            });
        });
    });

    it('stacks with existing resources', () => {
        const state = createTestState({
            playerResources: [{ red: 5 }]
        });
        const result = executeBasicGain(state, 1, 'gain3red', state.gameLayers);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(8);
    });

    it('doubling effect doubles the gain and is consumed', () => {
        const state = createTestState({
            playerEffects: [['Next gain will be doubled']]
        });
        const result = executeBasicGain(state, 1, 'gain3red', state.gameLayers);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(6); // 3 * 2
        expect(player.effects).not.toContain('Next gain will be doubled');
        expect(result.log.some(l => l.includes('DOUBLED'))).toBe(true);
    });

    it('red basic gain awards +1 VP at recursionDepth 0', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain3red', state.gameLayers, 0);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.victoryPoints).toBe(1);
        expect(player.vpSources.redAction).toBe(1);
    });

    it('red basic gain does NOT award VP at recursionDepth > 0', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain3red', state.gameLayers, 1);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.victoryPoints).toBe(0);
    });

    it('non-red basic gain does NOT award auto VP', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain3blue', state.gameLayers, 0);

        const player = result.state.players.find(p => p.id === 1);
        expect(player.victoryPoints).toBe(0);
    });

    it('sets lastGain on other players', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'gain3red', state.gameLayers);

        const otherPlayer = result.state.players.find(p => p.id === 2);
        expect(otherPlayer.lastGain).toEqual({ red: 3 });
    });

    it('returns null for unknown action', () => {
        const state = createTestState();
        const result = executeBasicGain(state, 1, 'unknownAction', state.gameLayers);
        expect(result).toBeNull();
    });

    it('does not mutate original state', () => {
        const state = createTestState();
        const originalResources = { ...state.players[0].resources };
        executeBasicGain(state, 1, 'gain3red', state.gameLayers);

        // Original state unchanged
        expect(state.players[0].resources).toEqual(originalResources);
    });
});
