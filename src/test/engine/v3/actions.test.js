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
  describe('collect_tribute', () => {
    it('gives +2 gold', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_collectTribute', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
      expect(result.log.length).toBeGreaterThan(0);
    });
  });

  describe('scavenge', () => {
    it('gives +1 gold', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_scavenge', GODS);
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
    });
  });

  describe('barter', () => {
    it('returns pendingDecision when no gemSelection provided', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_barter', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('gemSelection');
      expect(result.pendingDecision.count).toBe(2);
    });

    it('trades 2 resources for 2 gold with decisions', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 3, green: 2, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_barter', GODS, { gemSelection: { black: 1, green: 1 } });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(2);
      expect(p1.resources.black).toBe(2);
      expect(p1.resources.green).toBe(1);
      expect(result.pendingDecision).toBeUndefined();
    });
  });

  describe('appraise', () => {
    it('returns pendingDecision when no gemSelection provided', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_appraise', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('gemSelection');
      expect(result.pendingDecision.count).toBe(1);
    });

    it('trades 1 resource for 1 gold', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_appraise', GODS, { gemSelection: { black: 1 } });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(1);
      expect(p1.resources.black).toBe(1);
    });
  });

  describe('meditate_on_wealth', () => {
    it('gives +3 gold and adds skip to skippedTurns', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_meditateOnWealth', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(3);
      expect(result.state.skippedTurns['p1']).toBe(1);
    });
  });

  describe('broker_deal', () => {
    it('returns pendingDecision when no gemSelection provided', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_brokerDeal', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.count).toBe(3);
    });

    it('trades 3 resources for 3 gold', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 2, green: 2, yellow: 1 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_brokerDeal', GODS, { gemSelection: { black: 1, green: 1, yellow: 1 } });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(3);
      expect(p1.resources.black).toBe(1);
      expect(p1.resources.green).toBe(1);
      expect(p1.resources.yellow).toBe(0);
    });
  });

  describe('cash_in', () => {
    it('gives Glory equal to gold owned', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 7, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'gold_cashIn', GODS);
      expect(getPlayer(result.state, 'p1').glory).toBe(7);
    });

    it('gives 0 Glory when no gold owned', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'gold_cashIn', GODS);
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
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

  describe('lurk', () => {
    it('gives +2 black', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'black_lurk', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(2);
    });
  });

  describe('pickpocket', () => {
    it('returns pendingDecision when no targetPlayer', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
      // Should still gain +1 black
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
    });

    it('steals 1 Glory from target', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_pickpocket', GODS, { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
      expect(getPlayer(result.state, 'p1').glory).toBe(1);
      expect(getPlayer(result.state, 'p2').glory).toBe(4);
    });

    it('respects glory_steal_immunity modifier', () => {
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
      // But steal is blocked
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
    });
  });

  describe('ransack', () => {
    it('returns pendingDecision for targetPlayer first', () => {
      const state = makeState();
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
    });

    it('respects steal_immunity modifier', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
        champions: {
          p2: { id: 'test', powerCards: ['gold_vault'], powerCardSlots: 4 },
        },
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

  describe('hex', () => {
    it('all other players lose 2 Glory', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 3, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_hex', GODS);
      expect(getPlayer(result.state, 'p1').glory).toBe(0); // unaffected
      expect(getPlayer(result.state, 'p2').glory).toBe(3);
      expect(getPlayer(result.state, 'p3').glory).toBe(1);
    });

    it('does not go below 0 Glory', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 1, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_hex', GODS);
      expect(getPlayer(result.state, 'p2').glory).toBe(0);
    });
  });

  describe('ruin', () => {
    it('gives +2 black and all other players -4 Glory', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 10, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 6, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'black_ruin', GODS);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(2);
      expect(getPlayer(result.state, 'p2').glory).toBe(6);
      expect(getPlayer(result.state, 'p3').glory).toBe(2);
    });
  });
});

// =========================================================================
// GREEN ACTIONS
// =========================================================================

describe('Green Actions', () => {
  describe('bide', () => {
    it('gives +3 green', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'green_bide', GODS);
      expect(getPlayer(result.state, 'p1').resources.green).toBe(3);
    });
  });

  describe('meditate', () => {
    it('gives +2 green', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'green_meditate', GODS);
      expect(getPlayer(result.state, 'p1').resources.green).toBe(2);
    });
  });

  describe('relive', () => {
    it('returns pendingDecision when no actionChoice', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_collectTribute' },
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
          { playerId: 'p1', actionId: 'gold_collectTribute' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_relive', GODS, { actionChoice: 'gold_collectTribute' });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_collectTribute');
      expect(result.executeAction.recursionDepth).toBe(1);
    });

    it('excludes repeat actions from repeatable options', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_collectTribute' },
          { playerId: 'p1', actionId: 'green_relive' },
          { playerId: 'p1', actionId: 'green_echo' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_relive', GODS);
      expect(result.pendingDecision.options).toContain('gold_collectTribute');
      expect(result.pendingDecision.options).not.toContain('green_relive');
      expect(result.pendingDecision.options).not.toContain('green_echo');
    });
  });

  describe('echo', () => {
    it('copies the last action any player took', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p2', actionId: 'gold_collectTribute' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_echo', GODS);
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_collectTribute');
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('handles no previous actions', () => {
      const state = makeState({ roundActions: [] });
      const result = routeAction(state, 'p1', 'green_echo', GODS);
      expect(result.executeAction).toBeUndefined();
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });
  });

  describe('loop', () => {
    it('returns pendingDecision for 1 Tier 2 action choice', () => {
      const state = makeState({
        round: 2,
        roundActions: [
          { playerId: 'p1', actionId: 'green_accelerate' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_loop', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
      expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    });

    it('returns executeAction for chosen Tier 2 action', () => {
      const state = makeState({
        round: 2,
        roundActions: [
          { playerId: 'p1', actionId: 'green_accelerate' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_loop', GODS, {
        actionChoice: 'green_accelerate',
      });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('green_accelerate');
      expect(result.executeAction.chainedActions).toBeUndefined();
    });
  });

  describe('accelerate', () => {
    it('gives +2 green and extra turn', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'green_accelerate', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.green).toBe(2);
      expect(p1.extraTurns).toBe(1);
    });
  });

  describe('unravel', () => {
    it('returns pendingDecision for 1 Tier 3 action choice', () => {
      const state = makeState({
        round: 3,
        roundActions: [
          { playerId: 'p1', actionId: 'gold_cashIn' },
        ],
      });
      const result = routeAction(state, 'p1', 'green_unravel', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
    });
  });
});

// =========================================================================
// YELLOW ACTIONS
// =========================================================================

describe('Yellow Actions', () => {
  describe('forage', () => {
    it('returns pendingDecision when no gemSelection', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_forage', GODS);
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.count).toBe(3);
    });

    it('gains 3 resources of chosen colors', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_forage', GODS, {
        gemSelection: { gold: 1, green: 2 },
      });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(1);
      expect(p1.resources.green).toBe(2);
    });

    it('works with all one color', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_forage', GODS, {
        gemSelection: { yellow: 3 },
      });
      expect(getPlayer(result.state, 'p1').resources.yellow).toBe(3);
    });
  });

  describe('gather', () => {
    it('gains 2 resources of chosen colors', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_gather', GODS, {
        gemSelection: { black: 1, yellow: 1 },
      });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.black).toBe(1);
      expect(p1.resources.yellow).toBe(1);
    });
  });

  describe('bless', () => {
    it('gives +2 yellow', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_bless', GODS);
      expect(getPlayer(result.state, 'p1').resources.yellow).toBe(2);
    });
  });

  describe('trade', () => {
    it('gives +1 yellow and returns pendingDecision for redistribution', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 2, black: 1, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_trade', GODS);
      // Gets +1 yellow first, so total = 2 + 1 + 1 = 4
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.count).toBe(4);
    });

    it('redistributes all resources with decisions', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 2, black: 1, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state, 'p1', 'yellow_trade', GODS, {
        gemSelection: { green: 4 },
      });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.green).toBe(4);
      expect(p1.resources.gold).toBe(0);
      expect(p1.resources.black).toBe(0);
    });
  });

  describe('harvest', () => {
    it('gains 4 resources of chosen colors', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_harvest', GODS, {
        gemSelection: { gold: 1, black: 1, green: 1, yellow: 1 },
      });
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(1);
      expect(p1.resources.black).toBe(1);
      expect(p1.resources.green).toBe(1);
      expect(p1.resources.yellow).toBe(1);
    });
  });

  describe('commune', () => {
    it('gives +2 yellow and copies previous player last gain', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: { gold: 2 } },
          { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      // p1 is index 0, previous is p3 (wraps around to end)... but p3 has no lastGain.
      // Let's test with p2 as the player (previous would be p1 at index 0):
      // Actually, let's adjust: player p2 (index 1), previous is p1 (index 0)
      const state2 = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: { black: 3 } },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = routeAction(state2, 'p2', 'yellow_commune', GODS);
      const p2 = getPlayer(result.state, 'p2');
      expect(p2.resources.yellow).toBe(2);
      expect(p2.resources.black).toBe(3); // copied p1's lastGain
    });
  });

  describe('flourish', () => {
    it('gains 3 of each active color', () => {
      const state = makeState();
      const result = routeAction(state, 'p1', 'yellow_flourish', GODS);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(3);
      expect(p1.resources.black).toBe(3);
      expect(p1.resources.green).toBe(3);
      expect(p1.resources.yellow).toBe(3);
    });

    it('respects active gods (not all 4)', () => {
      const state = makeState({ gods: ['gold', 'green'] });
      const result = routeAction(state, 'p1', 'yellow_flourish', ['gold', 'green']);
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.resources.gold).toBe(3);
      expect(p1.resources.green).toBe(3);
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
    const result = routeAction(state, 'p1', 'gold_collectTribute', GODS, {}, 5);
    expect(result.log[0]).toContain('Max recursion depth');
    // State unchanged at max depth
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });
});

// =========================================================================
// DOUBLE NEXT GAIN (yellow_weak shop integration)
// =========================================================================

describe('doubleNextGain effect', () => {
  it('doubles gold action gain and is consumed', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: ['doubleNextGain'], workersLeft: 4, lastGain: {}, extraTurns: 0 },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], workersLeft: 4, lastGain: {}, extraTurns: 0 },
      ],
    });
    // gold_collectTribute normally gives +2 gold, should give +4
    const result = routeAction(state, 'p1', 'gold_collectTribute', GODS);
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
    // green_bide normally gives +3 green, should give +6
    const result = routeAction(state, 'p1', 'green_bide', GODS);
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

  it('does not double when effect is not present', () => {
    const state = makeState();
    const result = routeAction(state, 'p1', 'gold_collectTribute', GODS);
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
  });
});
