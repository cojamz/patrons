import { describe, it, expect } from 'vitest';
import { resolveShop, canAffordShop, payShopCost } from '../../../engine/v3/shops/shopResolver.js';

// --- Test Helpers ---

function makeState(overrides = {}) {
  return {
    players: [
      { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], shopCostModifier: 0, lastGain: {}, extraTurns: 0 },
      { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], shopCostModifier: 0, lastGain: {}, extraTurns: 0 },
      { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], shopCostModifier: 0, lastGain: {}, extraTurns: 0 },
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

// =========================================================================
// COST VALIDATION
// =========================================================================

describe('canAffordShop', () => {
  it('returns true when player can afford', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], shopCostModifier: 0, lastGain: {} },
      ],
    });
    // gold_weak costs { gold: 1, any: 1 }
    expect(canAffordShop(state, 'p1', 'gold_weak')).toBe(true);
  });

  it('returns false when player cannot afford', () => {
    const state = makeState();
    // p1 has 0 resources, cannot afford gold_weak
    expect(canAffordShop(state, 'p1', 'gold_weak')).toBe(false);
  });

  it('returns false for unknown shop', () => {
    const state = makeState();
    expect(canAffordShop(state, 'p1', 'fake_shop')).toBe(false);
  });
});

describe('payShopCost', () => {
  it('deducts cost from player resources', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 3, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], shopCostModifier: 0, lastGain: {} },
      ],
    });
    // gold_vp costs { gold: 3 } — no 'any'
    const result = payShopCost(state, 'p1', 'gold_vp');
    expect(result.canAfford).toBe(true);
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });

  it('needs gemSelection for any cost', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 2, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], shopCostModifier: 0, lastGain: {} },
      ],
    });
    // gold_weak costs { gold: 1, any: 1 }
    const result = payShopCost(state, 'p1', 'gold_weak');
    expect(result.pendingDecision).toBeDefined();
    expect(result.pendingDecision.type).toBe('gemSelection');
  });

  it('deducts with gemSelection for any cost', () => {
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 2, black: 2, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], shopCostModifier: 0, lastGain: {} },
      ],
    });
    const result = payShopCost(state, 'p1', 'gold_weak', { gemSelection: { black: 1 } });
    expect(result.canAfford).toBe(true);
    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBe(1); // 2 - 1 (gold part of cost)
    expect(p1.resources.black).toBe(1); // 2 - 1 (any part)
  });
});

// =========================================================================
// GOLD SHOPS
// =========================================================================

describe('Gold Shops', () => {
  describe('gold_weak', () => {
    it('gives +2 gold', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_weak');
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
    });
  });

  describe('gold_strong', () => {
    it('doubles your gold', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = resolveShop(state, 'p1', 'gold_strong');
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(10);
    });

    it('doubles zero gold to zero', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_strong');
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
    });
  });

  describe('gold_vp', () => {
    it('gives +4 Glory', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(4);
    });
  });
});

// =========================================================================
// BLACK SHOPS
// =========================================================================

describe('Black Shops', () => {
  describe('black_weak', () => {
    it('needs targetPlayer decision', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_weak');
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('steals 1 Glory from target', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(1);
      expect(getPlayer(result.state, 'p2').glory).toBe(4);
    });

    it('respects glory_steal_immunity', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
        ],
        champions: {
          p2: { id: 'test', powerCards: ['black_tomeOfDeeds'], powerCardSlots: 4 },
        },
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
    });
  });

  describe('black_strong', () => {
    it('steals 3 Glory from target', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 8, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = resolveShop(state, 'p1', 'black_strong', { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(3);
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
    });
  });

  describe('black_vp', () => {
    it('steals 2 Glory from each other player', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], lastGain: {} },
          { id: 'p3', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 3, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = resolveShop(state, 'p1', 'black_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(4); // 2 from p2 + 2 from p3
      expect(getPlayer(result.state, 'p2').glory).toBe(3);
      expect(getPlayer(result.state, 'p3').glory).toBe(1);
    });
  });
});

// =========================================================================
// GREEN SHOPS
// =========================================================================

describe('Green Shops', () => {
  describe('green_weak', () => {
    it('needs actionChoice for Tier 1 action', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_collectTribute' },
        ],
      });
      const result = resolveShop(state, 'p1', 'green_weak');
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('actionChoice');
    });

    it('only allows Tier 1 actions', () => {
      const state = makeState({
        round: 2,
        roundActions: [
          { playerId: 'p1', actionId: 'gold_collectTribute' },
          { playerId: 'p1', actionId: 'gold_meditateOnWealth' },
        ],
      });
      const result = resolveShop(state, 'p1', 'green_weak');
      // Tier 2 actions should not be in options
      expect(result.pendingDecision.options).toContain('gold_collectTribute');
      expect(result.pendingDecision.options).not.toContain('gold_meditateOnWealth');
    });

    it('returns executeAction for valid Tier 1 choice', () => {
      const state = makeState({
        roundActions: [
          { playerId: 'p1', actionId: 'gold_collectTribute' },
        ],
      });
      const result = resolveShop(state, 'p1', 'green_weak', { actionChoice: 'gold_collectTribute' });
      expect(result.executeAction).toBeDefined();
      expect(result.executeAction.actionId).toBe('gold_collectTribute');
    });
  });

  describe('green_vp', () => {
    it('gives +4 Glory and extra turn', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(4);
      expect(getPlayer(result.state, 'p1').extraTurns).toBe(1);
    });
  });
});

// =========================================================================
// YELLOW SHOPS
// =========================================================================

describe('Yellow Shops', () => {
  describe('yellow_weak', () => {
    it('adds doubleNextGain effect', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_weak');
      expect(getPlayer(result.state, 'p1').effects).toContain('doubleNextGain');
    });
  });

  describe('yellow_strong', () => {
    it('triggers Yellow Glory condition (distinct colors owned)', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 1, green: 0, yellow: 2 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = resolveShop(state, 'p1', 'yellow_strong');
      // gold, black, yellow = 3 distinct colors
      expect(getPlayer(result.state, 'p1').glory).toBe(3);
    });

    it('gives 0 Glory when no resources', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_strong');
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
    });
  });

  describe('yellow_vp', () => {
    it('calculates complete sets correctly', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 2, green: 5, yellow: 2 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = resolveShop(state, 'p1', 'yellow_vp');
      // min(3, 2, 5, 2) = 2 complete sets
      expect(getPlayer(result.state, 'p1').glory).toBe(2);
    });

    it('gives 0 Glory when missing a color', () => {
      const state = makeState({
        players: [
          { id: 'p1', resources: { gold: 3, black: 0, green: 5, yellow: 2 }, glory: 0, glorySources: {}, effects: [], lastGain: {} },
        ],
      });
      const result = resolveShop(state, 'p1', 'yellow_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
    });
  });
});

// =========================================================================
// UNKNOWN SHOP
// =========================================================================

describe('resolveShop', () => {
  it('returns error for unknown shop', () => {
    const state = makeState();
    const result = resolveShop(state, 'p1', 'fake_shop');
    expect(result.log[0]).toContain('Unknown shop');
  });
});
