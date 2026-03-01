import { describe, it, expect } from 'vitest';
import { executeAction } from '../../engine/GameEngine.js';
import { createPlayer, emptyResources } from '../../engine/stateHelpers.js';
import { allGameLayers } from '../../data/allGameLayers.js';

// Reusable test state factory
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
        if (options.playerEffects?.[i]) {
            p.effects = [...options.playerEffects[i]];
        }
        players.push(p);
    }

    return {
        currentPlayer: options.currentPlayer || 1,
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

describe('Yellow Actions', () => {
    it('gain3yellow returns pendingDecision when no decisions provided', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'gain3yellow');

        expect(result.pendingDecision).toBeDefined();
        expect(result.pendingDecision.type).toBe('gemSelection');
        expect(result.pendingDecision.maxGems).toBe(3);
    });

    it('gain3yellow with gemSelection gives resources', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'gain3yellow', { gemSelection: { red: 1, blue: 1, yellow: 1 } });

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(1);
        expect(player.resources.blue).toBe(1);
        expect(player.resources.yellow).toBe(1);
        expect(result.pendingDecision).toBeUndefined();
    });

    it('gain2yellow with gemSelection gives 2 resources', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'gain2yellow', { gemSelection: { red: 2 } });

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(2);
    });

    it('yellowHybrid1 gives +2 yellow with no decisions needed', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'yellowHybrid1');

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.yellow).toBe(2);
        expect(result.pendingDecision).toBeUndefined();
    });
});

describe('Gold Actions', () => {
    it('convert1AnyTo1Gold needs gemSelection', () => {
        const state = createTestState({
            playerResources: [{ red: 5 }]
        });
        const result = executeAction(state, 1, 'convert1AnyTo1Gold');

        expect(result.pendingDecision).toBeDefined();
        expect(result.pendingDecision.type).toBe('gemSelection');
    });

    it('convert1AnyTo1Gold with gemSelection trades 1 resource for 1 gold', () => {
        const state = createTestState({
            playerResources: [{ red: 5 }]
        });
        const result = executeAction(state, 1, 'convert1AnyTo1Gold', { gemSelection: { red: 1 } });

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(4);
        expect(player.resources.gold).toBe(1);
    });
});

describe('White Actions', () => {
    it('gain3vp adds 3 VP', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'gain3vp');

        const player = result.state.players.find(p => p.id === 1);
        expect(player.victoryPoints).toBe(3);
    });

    it('gain2vp adds 2 VP', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'gain2vp');

        const player = result.state.players.find(p => p.id === 1);
        expect(player.victoryPoints).toBe(2);
    });

    it('spend1AnyFor2VP needs gemSelection', () => {
        const state = createTestState({
            playerResources: [{ red: 3 }]
        });
        const result = executeAction(state, 1, 'spend1AnyFor2VP');

        expect(result.pendingDecision).toBeDefined();
        expect(result.pendingDecision.type).toBe('gemSelection');
    });

    it('spend1AnyFor2VP with gemSelection trades resource for VP', () => {
        const state = createTestState({
            playerResources: [{ red: 3 }]
        });
        const result = executeAction(state, 1, 'spend1AnyFor2VP', { gemSelection: { red: 1 } });

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(2);
        expect(player.victoryPoints).toBe(2);
    });
});

describe('Black Actions', () => {
    it('blackSteal1VP needs targetPlayer decision', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'blackSteal1VP');

        expect(result.pendingDecision).toBeDefined();
        expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('blackSteal1VP steals 1 VP from target', () => {
        const state = createTestState({
            playerVP: [0, 5]
        });
        const result = executeAction(state, 1, 'blackSteal1VP', { targetPlayer: 2 });

        const p1 = result.state.players.find(p => p.id === 1);
        const p2 = result.state.players.find(p => p.id === 2);
        expect(p1.victoryPoints).toBe(2); // gained 1 stolen + 1 stealing bonus
        expect(p1.resources.black).toBe(1); // gained 1 black
        expect(p2.victoryPoints).toBe(4); // lost 1
    });

    it('blackAllLose2VP makes all others lose 2 VP', () => {
        const state = createTestState({
            playerCount: 3,
            playerVP: [0, 5, 5]
        });
        const result = executeAction(state, 1, 'blackAllLose2VP');

        const p2 = result.state.players.find(p => p.id === 2);
        const p3 = result.state.players.find(p => p.id === 3);
        expect(p2.victoryPoints).toBe(3);
        expect(p3.victoryPoints).toBe(3);
    });

    it('blackAllLose4VP makes all others lose 4 VP and gives +2 black', () => {
        const state = createTestState({
            playerCount: 3,
            playerVP: [0, 10, 10]
        });
        const result = executeAction(state, 1, 'blackAllLose4VP');

        const p1 = result.state.players.find(p => p.id === 1);
        const p2 = result.state.players.find(p => p.id === 2);
        expect(p1.resources.black).toBe(2);
        expect(p2.victoryPoints).toBe(6);
    });
});

describe('Silver Actions', () => {
    it('silver4Others1 gives +4 silver to player and +1 to others', () => {
        const state = createTestState({ playerCount: 3 });
        const result = executeAction(state, 1, 'silver4Others1');

        const p1 = result.state.players.find(p => p.id === 1);
        const p2 = result.state.players.find(p => p.id === 2);
        const p3 = result.state.players.find(p => p.id === 3);
        expect(p1.resources.silver).toBe(4);
        expect(p2.resources.silver).toBe(1);
        expect(p3.resources.silver).toBe(1);
    });

    it('silver2VPBoth needs targetPlayer', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'silver2VPBoth');

        expect(result.pendingDecision).toBeDefined();
        expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('silver2VPBoth gives +2 VP to both', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'silver2VPBoth', { targetPlayer: 2 });

        const p1 = result.state.players.find(p => p.id === 1);
        const p2 = result.state.players.find(p => p.id === 2);
        expect(p1.victoryPoints).toBe(2);
        expect(p2.victoryPoints).toBe(2);
    });
});

describe('Red Actions', () => {
    it('redRepeatAction needs actionChoice when player has workers on actions', () => {
        const state = createTestState({
            occupiedSpaces: { gain3blue: 1, redRepeatAction: 1 }
        });
        const result = executeAction(state, 1, 'redRepeatAction');

        expect(result.pendingDecision).toBeDefined();
        expect(result.pendingDecision.type).toBe('actionChoice');
    });

    it('redRepeatAction with choice executes the chosen action', () => {
        const state = createTestState({
            occupiedSpaces: { gain3blue: 1, redRepeatAction: 1 }
        });
        const result = executeAction(state, 1, 'redRepeatAction', { actionChoice: 'gain3blue' });

        const player = result.state.players.find(p => p.id === 1);
        // Gets +1 red from the red action + 3 blue from repeating gain3blue
        expect(player.resources.red).toBe(1);
        expect(player.resources.blue).toBe(3);
        expect(player.victoryPoints).toBeGreaterThan(0); // Red auto VP
    });

    it('redRepeatAction with no valid workers just gives resources', () => {
        const state = createTestState({
            occupiedSpaces: { redRepeatAction: 1 } // only the action itself
        });
        const result = executeAction(state, 1, 'redRepeatAction');

        // No pendingDecision since no repeatable actions
        expect(result.pendingDecision).toBeUndefined();
        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(1);
    });

    it('redVPFocus gives VP based on red worker count', () => {
        const state = createTestState({
            round: 2,
            occupiedSpaces: { gain3red: 1, redVPFocus: 1 }
        });
        const result = executeAction(state, 1, 'redVPFocus');

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.red).toBe(1);
        // 1 VP base (for using red action) + 2 red workers (gain3red + redVPFocus)
        expect(player.victoryPoints).toBe(3);
    });
});

describe('Purple Actions', () => {
    it('gain4purpleSkip gives 4 purple and adds skip turn', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'gain4purpleSkip');

        const player = result.state.players.find(p => p.id === 1);
        expect(player.resources.purple).toBe(4);
        expect(result.state.skippedTurns[1]).toBe(1);
    });

    it('playTwoWorkers sets workersToPlace to 2', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'playTwoWorkers');

        expect(result.state.workersToPlace).toBe(3); // 1 existing + 2 more
    });
});

describe('Decision request shapes', () => {
    it('gemSelection decision has correct shape', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'gain3yellow');

        expect(result.pendingDecision).toMatchObject({
            type: 'gemSelection',
            maxGems: 3
        });
    });

    it('targetPlayer decision has correct shape', () => {
        const state = createTestState();
        const result = executeAction(state, 1, 'blackSteal1VP');

        expect(result.pendingDecision).toMatchObject({
            type: 'targetPlayer'
        });
    });

    it('actionChoice decision has options array', () => {
        const state = createTestState({
            occupiedSpaces: { gain3blue: 1, redRepeatAction: 1 }
        });
        const result = executeAction(state, 1, 'redRepeatAction');

        expect(result.pendingDecision.type).toBe('actionChoice');
        expect(result.pendingDecision.options).toBeDefined();
        expect(Array.isArray(result.pendingDecision.options)).toBe(true);
        expect(result.pendingDecision.options.length).toBeGreaterThan(0);
    });
});

describe('Recursion depth', () => {
    it('stops at max recursion depth', () => {
        const state = createTestState({
            occupiedSpaces: { gain3blue: 1, redRepeatAction: 1 }
        });
        // Force high recursion depth
        const result = executeAction(state, 1, 'redRepeatAction', { actionChoice: 'gain3blue' }, 6);

        // Should bail out safely
        expect(result.state).toBeDefined();
        expect(result.log).toBeDefined();
    });
});
