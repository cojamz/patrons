import { describe, it, expect } from 'vitest';
import { routeAction } from '../../../engine/v3/actions/index.js';

// --- Test Helpers ---

function makeState(overrides = {}) {
  return {
    players: [
      { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
      { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
      { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
    ],
    gods: ['gold', 'black', 'green', 'yellow'],
    round: 1,
    occupiedSpaces: {},
    roundActions: [],
    nullifiedSpaces: {},
    champions: {},
    ...overrides,
  };
}

function getPlayer(state, id) {
  return state.players.find(p => p.id === id);
}

const GODS = ['gold', 'black', 'green', 'yellow'];

// =========================================================================
// GOLD ACTIONS
// =========================================================================

describe('Gold Actions', () => {
  describe('patronage', () => {
    it('gives +2 gold and returns pendingDecision for target', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_patronage', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
      expect(result.pendingDecision.options).toContain('p2');
      expect(result.pendingDecision.options).toContain('p3');
      expect(result.pendingDecision.options).not.toContain('p1');
    });

    it('gives 1 gold to chosen target', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_patronage', GODS, { targetPlayer: 'p2', _continued: true });
      expect(getPlayer(result.state, 'p2').resources.gold).toBe(1);
      expect(result.pendingDecision).toBeUndefined();
    });

    it('full flow: +2 gold to self, +1 gold to target', () => {
      const state = makeState();
      // Simulate the continued call where state already has +2 gold applied
      const step1 = routeAction(state, 'p1', 'gold_patronage', GODS);
      const step2 = routeAction(step1.state, 'p1', 'gold_patronage', GODS, { targetPlayer: 'p2', _continued: true });
      expect(getPlayer(step2.state, 'p1').resources.gold).toBe(2);
      expect(getPlayer(step2.state, 'p2').resources.gold).toBe(1);
    });

    it('handles single-player game (no other players to gift)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_patronage', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
      expect(result.pendingDecision).toBeUndefined();
    });
  });

  describe('levy', () => {
    it('takes 1 gold from each other player', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 2, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_levy', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(2); // took 1 from each
      expect(getPlayer(result.state, 'p2').resources.gold).toBe(2);
      expect(getPlayer(result.state, 'p3').resources.gold).toBe(1);
      expect(result.isStealing).toBe(true);
      expect(result.penalizedPlayers).toContain('p2');
      expect(result.penalizedPlayers).toContain('p3');
      expect(result.resourcesStolen).toHaveLength(2);
    });

    it('skips players with no gold', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_levy', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
      expect(result.penalizedPlayers).toHaveLength(0);
    });

    it('respects Aegis (blocks stealing)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
        aegisHolder: 'p2',
      });
      const result = routeAction(state, 'p1', 'gold_levy', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
      expect(getPlayer(result.state, 'p2').resources.gold).toBe(3);
    });

    it('respects steal_immunity modifier', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
        aegisHolder: 'p2', // p2 has Aegis
      });
      const result = routeAction(state, 'p1', 'gold_levy', GODS);
      // p2 blocked by Aegis, p3 loses 1
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
      expect(getPlayer(result.state, 'p2').resources.gold).toBe(5);
      expect(getPlayer(result.state, 'p3').resources.gold).toBe(2);
    });
  });

  describe('hoard', () => {
    it('gives +3 gold and adds noShopThisTurn effect', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_hoard', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(3);
      expect(p1.effects).toContain('noShopThisTurn');
    });
  });

  describe('haggle', () => {
    it('gives +1 gold and adds shopDiscount effect', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_haggle', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(1);
      expect(p1.effects).toContain('shopDiscount');
    });
  });

  describe('austerity', () => {
    it('gives +1 gold per empty power card slot', () => {
      const state = makeState({
        champions: {
          p1: { id: 'champ1', powerCardSlots: 4, powerCards: ['golden_ring'] },
        },
      });
      const result = routeAction(state, 'p1', 'gold_austerity', GODS);
      // 4 slots - 1 used = 3 empty
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(3);
    });

    it('gives 0 gold when all slots are full', () => {
      const state = makeState({
        champions: {
          p1: { id: 'champ1', powerCardSlots: 2, powerCards: ['a', 'b'] },
        },
      });
      const result = routeAction(state, 'p1', 'gold_austerity', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
    });

    it('gives max gold when all slots empty', () => {
      const state = makeState({
        champions: {
          p1: { id: 'champ1', powerCardSlots: 4, powerCards: [] },
        },
      });
      const result = routeAction(state, 'p1', 'gold_austerity', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(4);
    });

    it('handles no champion gracefully', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_austerity', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
    });
  });

  describe('tariff', () => {
    it('gives +1 gold base plus +1 per god with a worker', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'black_skulk' },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_tariff', GODS);
      // 1 base + 2 gods (gold, black) = 3
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(3);
    });

    it('gives +1 gold when no workers placed on any god', () => {
      const state = makeState({ roundActions: [] });
      const result = routeAction(state, 'p1', 'gold_tariff', GODS);
      // 1 base + 0 gods = 1
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
    });

    it('counts distinct gods only (no double-count)', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'gold_hoard' },
          { playerId: 'p1', actionId: 'green_gather' },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_tariff', GODS);
      // 1 base + 2 gods (gold appears twice but counts once, green) = 3
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(3);
    });

    it('does not count other players workers', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p2', actionId: 'gold_patronage' },
          { playerId: 'p2', actionId: 'black_skulk' },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_tariff', GODS);
      // 1 base + 0 gods (p2's workers don't count) = 1
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
    });
  });

  describe('cashIn', () => {
    it('converts all gold to Favor 1:1', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 7, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_cashIn', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.glory).toBe(7);
      expect(p1.resources.gold).toBe(0);
    });

    it('does nothing with 0 gold', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_cashIn', GODS);
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
    });

    it('tracks glory source as cash_in', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_cashIn', GODS);
      expect(getPlayer(result.state, 'p1').glorySources.cash_in).toBe(5);
    });
  });
});

// =========================================================================
// BLACK ACTIONS
// =========================================================================

describe('Black Actions', () => {
  describe('skulk', () => {
    it('gives +3 black', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'black_skulk', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(3);
    });
  });

  describe('ransack', () => {
    it('returns pendingDecision for targetPlayer first', () => {
      // Targets must have resources to be valid steal targets
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_ransack', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('returns pendingDecision for stealGems after target chosen', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_ransack', GODS, { targetPlayer: 'p2' });
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('stealGems');
      expect(result.pendingDecision.count).toBe(2);
    });

    it('steals 2 resources from target with full decisions', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_ransack', GODS, {
        targetPlayer: 'p2',
        stealGems: { gold: 1, black: 1 },
      });
      const p1 = getPlayer(result.state, 'p1');
      const p2 = getPlayer(result.state, 'p2');
      expect(p1.resources.gold).toBe(1);
      expect(p1.resources.black).toBe(1);
      expect(p2.resources.gold).toBe(2);
      expect(p2.resources.black).toBe(1);
      expect(result.isStealing).toBe(true);
      expect(result.penalizedPlayers).toContain('p2');
      expect(result.resourcesStolen).toHaveLength(1);
    });

    it('consumes action when no valid targets (immune or empty)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
        aegisHolder: 'p2',
      });
      const result = routeAction(state, 'p1', 'black_ransack', GODS);
      // No abort — worker is consumed even when no valid targets
      expect(result.abort).toBeUndefined();
      expect(result.log.length).toBeGreaterThan(0);
    });

    it('handles target with 0 resources', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_ransack', GODS, { targetPlayer: 'p2' });
      // Target has 0 resources, should report that
      expect(result.pendingDecision).toBeUndefined();
    });

    it('steals 1 when target only has 1 resource total', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 1, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_ransack', GODS, { targetPlayer: 'p2' });
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.count).toBe(1);
    });

    it('blocks steal when target is protected by Aegis', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
        aegisHolder: 'p2',
      });
      const result = routeAction(state, 'p1', 'black_ransack', GODS, {
        targetPlayer: 'p2',
        stealGems: { gold: 1, black: 1 },
      });
      // Steal blocked
      expect(getPlayer(result.state, 'p2').resources.gold).toBe(3);
      expect(getPlayer(result.state, 'p2').resources.black).toBe(2);
    });
  });

  describe('pickpocket', () => {
    it('gives +1 black and returns pendingDecision for target', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('steals 2 Favor from target', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS, { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
      expect(getPlayer(result.state, 'p1').glory).toBe(2);
      expect(getPlayer(result.state, 'p2').glory).toBe(3);
      expect(result.isStealing).toBe(true);
      expect(result.gloryStolen).toHaveLength(1);
      expect(result.gloryStolen[0].amount).toBe(2);
    });

    it('steals only available Favor when target has less than 2', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 1, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS, { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(1);
      expect(getPlayer(result.state, 'p2').glory).toBe(0);
    });

    it('steals 0 when target has 0 Favor', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS, { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
      expect(result.penalizedPlayers).toHaveLength(0);
    });

    it('respects glory_reduction_immunity modifier', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
        champions: {
          p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
        },
      });
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS, { targetPlayer: 'p2' });
      // Still gains +1 black
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
      // But Favor steal is blocked by glory_reduction_immunity
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
    });

    it('excludes immune targets from target options', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
        champions: {
          p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
        },
      });
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS);
      // p2 has glory_reduction_immunity, so no valid targets
      expect(result.pendingDecision).toBeUndefined();
      // Still gets +1 black even without valid targets
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
    });
  });

  describe('tribute', () => {
    it('each opponent gives 1 of their most abundant resource', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 1, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 5, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_tribute', GODS);
      // p2 gives 1 gold (most abundant), p3 gives 1 black
      expect(getPlayer(result.state, 'p2').resources.gold).toBe(2);
      expect(getPlayer(result.state, 'p3').resources.black).toBe(4);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
    });

    it('opponent with no resources loses 1 Favor instead', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_tribute', GODS);
      expect(getPlayer(result.state, 'p2').glory).toBe(4);
      expect(getPlayer(result.state, 'p1').glory).toBe(1);
    });

    it('respects glory_reduction_immunity for Favor penalty', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
        champions: {
          p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
        },
      });
      const result = routeAction(state, 'p1', 'black_tribute', GODS);
      // p2 has no resources but is immune to glory reduction
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
    });
  });

  describe('plunder', () => {
    it('returns pendingDecision for targetPlayer first', () => {
      // Targets must have resources to be valid steal targets
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 3, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_plunder', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('returns pendingDecision for chooseColor after target chosen', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 4, black: 6, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_plunder', GODS, { targetPlayer: 'p2' });
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('chooseColor');
      expect(result.pendingDecision.options).toContain('gold');
      expect(result.pendingDecision.options).toContain('black');
      // green has 0, not enough (need >= 2)
      expect(result.pendingDecision.options).not.toContain('green');
    });

    it('steals half of chosen color (rounded down)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 7, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_plunder', GODS, {
        targetPlayer: 'p2',
        chooseColor: 'black',
      });
      // half of 7 = 3 (floor)
      expect(getPlayer(result.state, 'p1').resources.black).toBe(3);
      expect(getPlayer(result.state, 'p2').resources.black).toBe(4);
      expect(result.isStealing).toBe(true);
      expect(result.penalizedPlayers).toContain('p2');
    });

    it('consumes action when no valid targets (immune or empty)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
        aegisHolder: 'p2',
      });
      const result = routeAction(state, 'p1', 'black_plunder', GODS);
      // No abort — worker is consumed even when no valid targets
      expect(result.abort).toBeUndefined();
      expect(result.log.length).toBeGreaterThan(0);
    });

    it('handles target with no color having 2+ resources', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 1, black: 1, green: 1, yellow: 1 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_plunder', GODS, { targetPlayer: 'p2' });
      // All colors have only 1, need >= 2 to plunder
      expect(result.pendingDecision).toBeUndefined();
    });
  });

  describe('dread', () => {
    it('gives +2 black and opponents lose Favor equal to power card count', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 10, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 6, glorySources: {}, effects: [], lastGain: {} },
        ],
        champions: {
          p2: { id: 'champ', powerCards: ['golden_ring', 'golden_scepter'], powerCardSlots: 4 },
          p3: { id: 'champ2', powerCards: ['flux_capacitor'], powerCardSlots: 4 },
        },
      });
      const result = routeAction(state, 'p1', 'black_dread', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(2);
      expect(getPlayer(result.state, 'p2').glory).toBe(8); // lost 2 (2 cards)
      expect(getPlayer(result.state, 'p3').glory).toBe(5); // lost 1 (1 card)
      expect(result.penalizedPlayers).toContain('p2');
      expect(result.penalizedPlayers).toContain('p3');
    });

    it('does not penalize opponents with 0 power cards', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_dread', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(2);
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
      expect(result.penalizedPlayers).toHaveLength(0);
    });

    it('does not affect the acting player', () => {
      const state = makeState({
        champions: {
          p1: { id: 'champ', powerCards: ['a', 'b', 'c'], powerCardSlots: 4 },
        },
      });
      const result = routeAction(state, 'p1', 'black_dread', GODS);
      expect(getPlayer(result.state, 'p1').glory).toBe(0); // unaffected
    });
  });

  describe('annihilate', () => {
    it('spends all black, others lose that much Favor', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 5, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 10, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 8, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_annihilate', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(0);
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
      expect(getPlayer(result.state, 'p3').glory).toBe(3);
      expect(result.penalizedPlayers).toContain('p2');
      expect(result.penalizedPlayers).toContain('p3');
    });

    it('does nothing with 0 black', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'black_annihilate', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(0);
      expect(getPlayer(result.state, 'p2').glory).toBe(0);
    });

    it('allows Favor to go negative', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 5, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 2, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_annihilate', GODS);
      expect(getPlayer(result.state, 'p2').glory).toBe(-3);
    });

    it('respects glory_reduction_immunity', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 5, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 10, glorySources: {}, effects: [], lastGain: {} },
        ],
        champions: {
          p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
        },
      });
      const result = routeAction(state, 'p1', 'black_annihilate', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(0); // spent
      expect(getPlayer(result.state, 'p2').glory).toBe(10); // immune
    });
  });
});

// =========================================================================
// GREEN ACTIONS
// =========================================================================

describe('Green Actions', () => {
  describe('gather', () => {
    it('gives +3 green', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'green_gather', GODS);
      expect(getPlayer(result.state, 'p1').resources.green).toBe(3);
    });
  });

  describe('relive', () => {
    it('returns pendingDecision when no actionChoice', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_relive', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
      // Should still gain +1 green
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('returns executeAction when actionChoice provided', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_relive', GODS, { actionChoice: 'gold_patronage' });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_patronage');
      expect(result.executeAction.recursionDepth).toBe(1);
    });

    it('only shows Tier 1 actions', () => {
      const state = makeState({
        round: 2,
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },  // T1
          { playerId: 'p1', actionId: 'gold_austerity' },  // T2
        ],
      });
      const result = routeAction(state, 'p1', 'green_relive', GODS);
      expect(result.pendingDecision.options).toContain('gold_patronage');
      expect(result.pendingDecision.options).not.toContain('gold_austerity');
    });

    it('excludes repeat actions from repeatable options', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'green_relive' },
          { playerId: 'p1', actionId: 'green_echo' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_relive', GODS);
      expect(result.pendingDecision.options).toContain('gold_patronage');
      expect(result.pendingDecision.options).not.toContain('green_relive');
      expect(result.pendingDecision.options).not.toContain('green_echo');
    });

    it('aborts when no T1 actions to repeat', () => {
      const state = makeState({ roundActions: [] });
      const result = routeAction(state, 'p1', 'green_relive', GODS);
      expect(result.abort).toBe(true);
    });
  });

  describe('echo', () => {
    it('returns pendingDecision for other players T1 actions', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p2', actionId: 'gold_patronage' },
          { playerId: 'p2', actionId: 'black_skulk' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_echo', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
      expect(result.pendingDecision.options).toContain('gold_patronage');
      expect(result.pendingDecision.options).toContain('black_skulk');
      // Should gain +1 green
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('returns executeAction when actionChoice provided', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p2', actionId: 'gold_patronage' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_echo', GODS, { actionChoice: 'gold_patronage' });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_patronage');
      expect(result.executeAction.recursionDepth).toBe(1);
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('aborts when no other players T1 actions exist', () => {
      const state = makeState({ roundActions: [] });
      const result = routeAction(state, 'p1', 'green_echo', GODS);
      expect(result.abort).toBe(true);
    });

    it('excludes own actions from options', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p2', actionId: 'black_skulk' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_echo', GODS);
      expect(result.pendingDecision.options).not.toContain('gold_patronage');
      expect(result.pendingDecision.options).toContain('black_skulk');
    });

    it('excludes repeat-excluded actions from options', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p2', actionId: 'green_relive' },
          { playerId: 'p2', actionId: 'gold_patronage' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_echo', GODS);
      expect(result.pendingDecision.options).not.toContain('green_relive');
      expect(result.pendingDecision.options).toContain('gold_patronage');
    });
  });

  describe('recall', () => {
    it('returns pendingDecision for unoccupied T1 actions', () => {
      const state = makeState({
        round: 1,
        occupiedSpaces: { gold_patronage: true },
      });
      const result = routeAction(state, 'p1', 'green_recall', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
      // gold_patronage is occupied, should not be in options
      expect(result.pendingDecision.options).not.toContain('gold_patronage');
      // Should gain +1 green
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('returns executeAction when actionChoice provided', () => {
      const state = makeState({ round: 1 });
      const result = routeAction(state, 'p1', 'green_recall', GODS, { actionChoice: 'gold_patronage' });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_patronage');
    });

    it('aborts when all T1 actions occupied', () => {
      // Occupy all T1 action spaces
      const state = makeState({
        round: 1,
        occupiedSpaces: {
          gold_patronage: true, gold_levy: true, gold_hoard: true, gold_haggle: true,
          black_skulk: true, black_ransack: true, black_pickpocket: true, black_tribute: true,
          green_gather: true, green_relive: true, green_echo: true, green_recall: true,
          yellow_harvest: true, yellow_forage: true, yellow_transmute: true, yellow_siphon: true,
        },
      });
      const result = routeAction(state, 'p1', 'green_recall', GODS);
      // green repeat actions are excluded from recall, so if all non-repeat T1s are occupied, abort
      expect(result.abort).toBe(true);
    });
  });

  describe('rewind', () => {
    it('returns pendingDecision for other players T2 actions', () => {
      const state = makeState({
        round: 2,
        roundActions: [
          { playerId: 'p2', actionId: 'gold_austerity' }, // T2
        ],
      });
      const result = routeAction(state, 'p1', 'green_rewind', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
      expect(result.pendingDecision.options).toContain('gold_austerity');
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('returns executeAction when actionChoice provided', () => {
      const state = makeState({
        round: 2,
        roundActions: [
          { playerId: 'p2', actionId: 'gold_austerity' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_rewind', GODS, { actionChoice: 'gold_austerity' });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_austerity');
      expect(result.executeAction.recursionDepth).toBe(1);
    });

    it('aborts when no other players T2 actions exist', () => {
      const state = makeState({
        round: 2,
        roundActions: [],
      });
      const result = routeAction(state, 'p1', 'green_rewind', GODS);
      expect(result.abort).toBe(true);
    });

    it('excludes own actions', () => {
      const state = makeState({
        round: 2,
        roundActions: [
          { playerId: 'p1', actionId: 'gold_austerity' },
          { playerId: 'p2', actionId: 'gold_tariff' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_rewind', GODS);
      expect(result.pendingDecision.options).not.toContain('gold_austerity');
      expect(result.pendingDecision.options).toContain('gold_tariff');
    });
  });

  describe('foresight', () => {
    it('returns pendingDecision for unoccupied T2 actions', () => {
      const state = makeState({
        round: 2,
        occupiedSpaces: { gold_austerity: true },
      });
      const result = routeAction(state, 'p1', 'green_foresight', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
      expect(result.pendingDecision.options).not.toContain('gold_austerity');
      // gold_tariff should be available (unoccupied T2)
      expect(result.pendingDecision.options).toContain('gold_tariff');
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('returns executeAction when actionChoice provided', () => {
      const state = makeState({ round: 2 });
      const result = routeAction(state, 'p1', 'green_foresight', GODS, { actionChoice: 'gold_tariff' });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_tariff');
    });

    it('aborts when all T2 actions occupied', () => {
      const state = makeState({
        round: 2,
        occupiedSpaces: {
          gold_austerity: true, gold_tariff: true,
          black_plunder: true, black_dread: true,
          green_rewind: true, green_foresight: true,
          yellow_distill: true, yellow_attune: true,
        },
      });
      const result = routeAction(state, 'p1', 'green_foresight', GODS);
      expect(result.abort).toBe(true);
    });
  });

  describe('eternity', () => {
    it('replays all placed actions from this round', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'black_skulk' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_eternity', GODS);
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_patronage');
      expect(result.executeAction.chainedActions).toHaveLength(1);
      expect(result.executeAction.chainedActions[0].actionId).toBe('black_skulk');
    });

    it('excludes eternity itself from replay', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'green_eternity' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_eternity', GODS);
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_patronage');
      expect(result.executeAction.chainedActions).toHaveLength(0);
    });

    it('excludes repeat-excluded actions from replay', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'green_relive' },
          { playerId: 'p1', actionId: 'green_echo' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_eternity', GODS);
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_patronage');
      // relive and echo are repeat-excluded
      expect(result.executeAction.chainedActions).toHaveLength(0);
    });

    it('handles no actions to replay', () => {
      const state = makeState({ roundActions: [] });
      const result = routeAction(state, 'p1', 'green_eternity', GODS);
      expect(result.executeAction).toBeUndefined();
    });

    it('deduplicates actions (same action placed twice)', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'black_skulk' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_eternity', GODS);
      expect(result.executeAction.actionId).toBe('gold_patronage');
      expect(result.executeAction.chainedActions).toHaveLength(1);
      expect(result.executeAction.chainedActions[0].actionId).toBe('black_skulk');
    });

    it('does not replay other players actions', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p2', actionId: 'gold_patronage' },
          { playerId: 'p1', actionId: 'black_skulk' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_eternity', GODS);
      expect(result.executeAction.actionId).toBe('black_skulk');
      expect(result.executeAction.chainedActions).toHaveLength(0);
    });
  });
});

// =========================================================================
// YELLOW ACTIONS
// =========================================================================

describe('Yellow Actions', () => {
  describe('harvest', () => {
    it('gives +2 yellow', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_harvest', GODS);
      expect(getPlayer(result.state, 'p1').resources.yellow).toBe(2);
    });
  });

  describe('forage', () => {
    it('returns pendingDecision when no gemSelection', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_forage', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('gemSelection');
      expect(result.pendingDecision.count).toBe(2);
    });

    it('gains 2 resources of chosen colors', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_forage', GODS, {
        gemSelection: { gold: 1, green: 1 },
      });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(1);
      expect(p1.resources.green).toBe(1);
    });

    it('works with all one color', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_forage', GODS, {
        gemSelection: { yellow: 2 },
      });
      expect(getPlayer(result.state, 'p1').resources.yellow).toBe(2);
    });

    it('rejects invalid count (not exactly 2)', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_forage', GODS, {
        gemSelection: { gold: 3 },
      });
      // Invalid selection should not add resources
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
    });
  });

  describe('transmute', () => {
    it('gives +1 yellow and returns pendingDecision for spend step', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_transmute', GODS);
      expect(getPlayer(result.state, 'p1').resources.yellow).toBe(1);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('gemSelection');
      expect(result.pendingDecision.count).toBe(2);
      expect(result.pendingDecision.mode).toBe('spend');
    });

    it('returns pendingDecision for gain step after spend step', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 2, green: 0, yellow: 1 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_transmute', GODS, {
        gemSelection: { gold: 2 },
        _continued: true,
      });
      // Should have spent 2 gold
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision._resolveField).toBe('gemSelectionGain');
    });

    it('completes full transmute cycle (multi-step)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      // Step 1: initial call gives +1 yellow, returns pendingDecision for spend
      const step1 = routeAction(state, 'p1', 'yellow_transmute', GODS);
      expect(step1.pendingDecision).toBeDefined();
      expect(step1.pendingDecision.mode).toBe('spend');

      // Step 2: provide spend selection, resources are removed, returns pendingDecision for gain
      const step2 = routeAction(step1.state, 'p1', 'yellow_transmute', GODS, {
        gemSelection: { gold: 2 },
        _continued: true,
      });
      expect(step2.pendingDecision).toBeDefined();
      expect(step2.pendingDecision._resolveField).toBe('gemSelectionGain');
      expect(getPlayer(step2.state, 'p1').resources.gold).toBe(1); // 3 - 2 spent

      // Step 3: provide gain selection, resources are added
      const step3 = routeAction(step2.state, 'p1', 'yellow_transmute', GODS, {
        gemSelection: { gold: 2 },
        gemSelectionGain: { black: 1, green: 1 },
        _continued: true,
      });
      const p1 = getPlayer(step3.state, 'p1');
      expect(p1.resources.gold).toBe(1); // unchanged from step2
      expect(p1.resources.black).toBe(1);
      expect(p1.resources.green).toBe(1);
      expect(p1.resources.yellow).toBe(1); // +1 yellow from step 1 (step 2/3 use _continued so don't add again)
    });

    it('handles not enough resources to transmute', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_transmute', GODS);
      // After getting +1 yellow, player has only 1 resource total (need 2)
      expect(result.pendingDecision).toBeUndefined();
      // Still gets +1 yellow
      expect(getPlayer(result.state, 'p1').resources.yellow).toBe(1);
    });
  });

  describe('siphon', () => {
    it('returns pendingDecision for targetPlayer first', () => {
      // Targets must have resources to be valid steal targets
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_siphon', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('returns pendingDecision for stealGems after target chosen', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_siphon', GODS, { targetPlayer: 'p2' });
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('stealGems');
      expect(result.pendingDecision.count).toBe(2);
    });

    it('steals 2 resources and gives target +1 yellow', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_siphon', GODS, {
        targetPlayer: 'p2',
        stealGems: { gold: 1, black: 1 },
      });
      const p1 = getPlayer(result.state, 'p1');
      const p2 = getPlayer(result.state, 'p2');
      expect(p1.resources.gold).toBe(1);
      expect(p1.resources.black).toBe(1);
      expect(p2.resources.gold).toBe(2);
      expect(p2.resources.black).toBe(1);
      // Compensation: target gets +1 yellow
      expect(p2.resources.yellow).toBe(1);
      expect(result.isStealing).toBe(true);
      expect(result.penalizedPlayers).toContain('p2');
    });

    it('filters out targets with 0 resources', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_siphon', GODS);
      // No valid targets (P2 has 0 resources) — action consumed, no abort
      expect(result.pendingDecision).toBeUndefined();
      expect(result.abort).toBeUndefined();
      expect(result.log.length).toBeGreaterThan(0);
    });

    it('consumes action when no valid targets (immune or empty)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
        aegisHolder: 'p2',
      });
      const result = routeAction(state, 'p1', 'yellow_siphon', GODS);
      // No abort — worker is consumed even when no valid targets
      expect(result.abort).toBeUndefined();
      expect(result.log.length).toBeGreaterThan(0);
    });
  });

  describe('distill', () => {
    it('returns pendingDecision for chooseColor (spend) first', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_distill', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('chooseColor');
      expect(result.pendingDecision.options).toContain('gold');
      expect(result.pendingDecision.options).toContain('black');
      expect(result.pendingDecision.options).not.toContain('green'); // 0 resources
    });

    it('returns pendingDecision for chooseColorGain (gain) second', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_distill', GODS, { chooseColor: 'gold' });
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision._resolveField).toBe('chooseColorGain');
      expect(result.pendingDecision.options).not.toContain('gold'); // can't gain same color
    });

    it('spends all of one color and gains amount + 3 of another', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_distill', GODS, {
        chooseColor: 'gold',
        chooseColorGain: 'black',
      });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(0);
      expect(p1.resources.black).toBe(6); // 3 + 3
    });

    it('applies +3 bonus (not x2) correctly', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_distill', GODS, {
        chooseColor: 'gold',
        chooseColorGain: 'green',
      });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(0);
      expect(p1.resources.green).toBe(8); // 5 + 3, not 5 * 2 = 10
    });

    it('handles no resources to spend', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_distill', GODS);
      // No colors with > 0 resources
      expect(result.pendingDecision).toBeUndefined();
    });
  });

  describe('attune', () => {
    it('gives +1 yellow and +1 of each zero color', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_attune', GODS);
      const p1 = getPlayer(result.state, 'p1');
      // Gets +1 yellow first, then checks zeros: gold=0, black=0, green=0, yellow=1(now)
      expect(p1.resources.yellow).toBe(1); // +1 from attune, yellow no longer 0 so no bonus
      expect(p1.resources.gold).toBe(1);  // was 0, gains 1
      expect(p1.resources.black).toBe(1); // was 0, gains 1
      expect(p1.resources.green).toBe(1); // was 0, gains 1
    });

    it('gains nothing extra when all colors already owned', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 2, green: 1, yellow: 1 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_attune', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.yellow).toBe(2); // +1 from attune
      expect(p1.resources.gold).toBe(3); // unchanged
      expect(p1.resources.black).toBe(2); // unchanged
      expect(p1.resources.green).toBe(1); // unchanged
    });

    it('only gives +1 for colors at exactly 0', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 5, black: 0, green: 3, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_attune', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(5); // had gold, unchanged
      expect(p1.resources.black).toBe(1); // was 0, gains 1
      expect(p1.resources.green).toBe(3); // had green, unchanged
      expect(p1.resources.yellow).toBe(1); // +1 from attune, then yellow no longer 0
    });
  });

  describe('flourish', () => {
    it('gains 2 of each active color', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_flourish', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(2);
      expect(p1.resources.black).toBe(2);
      expect(p1.resources.green).toBe(2);
      expect(p1.resources.yellow).toBe(2);
    });

    it('respects active gods (not all 4)', () => {
      const state = makeState({ gods: ['gold', 'green'] });
      const result = routeAction(state, 'p1', 'yellow_flourish', ['gold', 'green']);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(2);
      expect(p1.resources.green).toBe(2);
      expect(p1.resources.black).toBe(0);
      expect(p1.resources.yellow).toBe(0);
    });
  });
});

// =========================================================================
// ROUTING
// =========================================================================

describe('routeAction', () => {
  it('returns error for unknown action', () => {
    const state = makeState();
    const result = routeAction(state, 'p1', 'nonexistent_action', GODS);
    expect(result.log[0]).toContain('Unknown action');
  });

  it('respects max recursion depth', () => {
    const state = makeState();
    const result = routeAction(state, 'p1', 'gold_patronage', GODS, {}, 5);
    expect(result.log[0]).toContain('Max recursion depth');
    // State unchanged at max depth
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });
});

// =========================================================================
// DOUBLE NEXT GAIN (doubleNextGain effect)
// =========================================================================

describe('doubleNextGain effect', () => {
  it('doubles gold action gain and is consumed', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: ['doubleNextGain'], workersLeft: 4, lastGain: {}, extraTurns: 0 },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
      ],
    });
    // gold_patronage normally gives +2 gold, should give +4
    const result = routeAction(state, 'p1', 'gold_patronage', GODS);
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(4);
    expect(getPlayer(result.state, 'p1').effects).not.toContain('doubleNextGain');
  });

  it('doubles green action gain and is consumed', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: ['doubleNextGain'], workersLeft: 4, lastGain: {}, extraTurns: 0 },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
      ],
    });
    // green_gather normally gives +3 green, should give +6
    const result = routeAction(state, 'p1', 'green_gather', GODS);
    expect(getPlayer(result.state, 'p1').resources.green).toBe(6);
    expect(getPlayer(result.state, 'p1').effects).not.toContain('doubleNextGain');
  });

  it('doubles black action gain and is consumed', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: ['doubleNextGain'], workersLeft: 4, lastGain: {}, extraTurns: 0 },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
      ],
    });
    // black_skulk normally gives +3 black, should give +6
    const result = routeAction(state, 'p1', 'black_skulk', GODS);
    expect(getPlayer(result.state, 'p1').resources.black).toBe(6);
    expect(getPlayer(result.state, 'p1').effects).not.toContain('doubleNextGain');
  });

  it('doubles yellow action gain and is consumed', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: ['doubleNextGain'], workersLeft: 4, lastGain: {}, extraTurns: 0 },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
      ],
    });
    // yellow_harvest normally gives +2 yellow, should give +4
    const result = routeAction(state, 'p1', 'yellow_harvest', GODS);
    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(4);
    expect(getPlayer(result.state, 'p1').effects).not.toContain('doubleNextGain');
  });

  it('does not double when effect is not present', () => {
    const state = makeState();
    const result = routeAction(state, 'p1', 'gold_patronage', GODS);
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
  });
});
