import { describe, it, expect } from 'vitest';
import { resolveShop, canAffordShop, payShopCost } from '../../../engine/v3/shops/shopResolver.js';

// --- Test Helpers ---

function makePlayer(id, overrides = {}) {
  return {
    id,
    resources: { gold: 0, black: 0, green: 0, yellow: 0 },
    glory: 0,
    glorySources: {},
    effects: [],
    permanentBuffs: [],
    shopCostModifier: 0,
    lastGain: {},
    ...overrides,
  };
}

function makeState(overrides = {}) {
  return {
    players: [
      makePlayer('p1'),
      makePlayer('p2'),
      makePlayer('p3'),
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
  it('returns true when player can afford gold_weak (1 gold)', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 1, black: 0, green: 0, yellow: 0 } })],
    });
    expect(canAffordShop(state, 'p1', 'gold_weak')).toBe(true);
  });

  it('returns false when player cannot afford gold_weak (0 gold)', () => {
    const state = makeState();
    expect(canAffordShop(state, 'p1', 'gold_weak')).toBe(false);
  });

  it('returns true for gold_strong when player has 3 gold', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 3, black: 0, green: 0, yellow: 0 } })],
    });
    expect(canAffordShop(state, 'p1', 'gold_strong')).toBe(true);
  });

  it('returns false for gold_strong when player has only 2 gold', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 2, black: 0, green: 0, yellow: 0 } })],
    });
    expect(canAffordShop(state, 'p1', 'gold_strong')).toBe(false);
  });

  it('returns true for black_vp when player has 5 black', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 0, black: 5, green: 0, yellow: 0 } })],
    });
    expect(canAffordShop(state, 'p1', 'black_vp')).toBe(true);
  });

  it('returns true for yellow_strong when player has 2 yellow', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 0, black: 0, green: 0, yellow: 2 } })],
    });
    expect(canAffordShop(state, 'p1', 'yellow_strong')).toBe(true);
  });

  it('returns false for unknown shop', () => {
    const state = makeState();
    expect(canAffordShop(state, 'p1', 'fake_shop')).toBe(false);
  });
});

describe('payShopCost', () => {
  it('deducts 1 gold for gold_weak', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 3, black: 0, green: 0, yellow: 0 } })],
    });
    const result = payShopCost(state, 'p1', 'gold_weak');
    expect(result.canAfford).toBe(true);
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
  });

  it('deducts 3 gold for gold_strong', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 5, black: 0, green: 0, yellow: 0 } })],
    });
    const result = payShopCost(state, 'p1', 'gold_strong');
    expect(result.canAfford).toBe(true);
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
  });

  it('deducts 4 gold for gold_vp', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 4, black: 0, green: 0, yellow: 0 } })],
    });
    const result = payShopCost(state, 'p1', 'gold_vp');
    expect(result.canAfford).toBe(true);
    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });

  it('deducts 1 black for black_weak', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 0, black: 2, green: 0, yellow: 0 } })],
    });
    const result = payShopCost(state, 'p1', 'black_weak');
    expect(result.canAfford).toBe(true);
    expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
  });

  it('deducts 5 green for green_vp', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 0, black: 0, green: 5, yellow: 0 } })],
    });
    const result = payShopCost(state, 'p1', 'green_vp');
    expect(result.canAfford).toBe(true);
    expect(getPlayer(result.state, 'p1').resources.green).toBe(0);
  });

  it('deducts 2 yellow for yellow_strong', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 0, black: 0, green: 0, yellow: 4 } })],
    });
    const result = payShopCost(state, 'p1', 'yellow_strong');
    expect(result.canAfford).toBe(true);
    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(2);
  });

  it('returns canAfford false when player lacks resources', () => {
    const state = makeState();
    const result = payShopCost(state, 'p1', 'gold_strong');
    expect(result.canAfford).toBe(false);
  });

  it('returns canAfford false for unknown shop', () => {
    const state = makeState();
    const result = payShopCost(state, 'p1', 'fake_shop');
    expect(result.canAfford).toBe(false);
  });
});

// =========================================================================
// GOLD SHOPS
// =========================================================================

describe('Gold Shops', () => {
  describe('gold_weak: 1 gold -> +2 Favor', () => {
    it('gives +2 Favor', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_weak');
      expect(getPlayer(result.state, 'p1').glory).toBe(2);
    });

    it('tracks glory source as gold_weak_shop', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_weak');
      expect(getPlayer(result.state, 'p1').glorySources.gold_weak_shop).toBe(2);
    });

    it('adds to existing Favor', () => {
      const state = makeState({
        players: [makePlayer('p1', { glory: 3, glorySources: { other: 3 } })],
      });
      const result = resolveShop(state, 'p1', 'gold_weak');
      expect(getPlayer(result.state, 'p1').glory).toBe(5);
    });

    it('produces a log message', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_weak');
      expect(result.log.length).toBeGreaterThan(0);
      expect(result.log[0]).toContain('Favor');
    });
  });

  describe('gold_strong: 3 gold -> gain Aegis token', () => {
    it('sets aegisHolder to the purchasing player', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_strong');
      expect(result.state.aegisHolder).toBe('p1');
    });

    it('transfers Aegis from previous holder', () => {
      const state = makeState({ aegisHolder: 'p2' });
      const result = resolveShop(state, 'p1', 'gold_strong');
      expect(result.state.aegisHolder).toBe('p1');
    });

    it('log mentions taking Aegis from previous holder', () => {
      const state = makeState({ aegisHolder: 'p2' });
      const result = resolveShop(state, 'p1', 'gold_strong');
      expect(result.log[0]).toContain('taken from');
    });

    it('log does not mention taking when no previous holder', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'gold_strong');
      expect(result.log[0]).not.toContain('taken from');
    });

    it('is a no-op transfer when same player buys again', () => {
      const state = makeState({ aegisHolder: 'p1' });
      const result = resolveShop(state, 'p1', 'gold_strong');
      expect(result.state.aegisHolder).toBe('p1');
      expect(result.log[0]).not.toContain('taken from');
    });
  });

  describe('gold_vp: 4 gold -> +1 Favor per gold above richest opponent', () => {
    it('gives Favor based on gold advantage (8 gold vs opponent 3 -> +5 Favor)', () => {
      const state = makeState({
        players: [
          makePlayer('p1', { resources: { gold: 8, black: 0, green: 0, yellow: 0 } }),
          makePlayer('p2', { resources: { gold: 3, black: 0, green: 0, yellow: 0 } }),
        ],
      });
      const result = resolveShop(state, 'p1', 'gold_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(5);
    });

    it('gives 0 Favor when opponent has equal gold', () => {
      const state = makeState({
        players: [
          makePlayer('p1', { resources: { gold: 5, black: 0, green: 0, yellow: 0 } }),
          makePlayer('p2', { resources: { gold: 5, black: 0, green: 0, yellow: 0 } }),
        ],
      });
      const result = resolveShop(state, 'p1', 'gold_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
    });

    it('gives 0 Favor when opponent has more gold', () => {
      const state = makeState({
        players: [
          makePlayer('p1', { resources: { gold: 3, black: 0, green: 0, yellow: 0 } }),
          makePlayer('p2', { resources: { gold: 7, black: 0, green: 0, yellow: 0 } }),
        ],
      });
      const result = resolveShop(state, 'p1', 'gold_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
    });

    it('compares against the richest opponent in multiplayer', () => {
      const state = makeState({
        players: [
          makePlayer('p1', { resources: { gold: 10, black: 0, green: 0, yellow: 0 } }),
          makePlayer('p2', { resources: { gold: 2, black: 0, green: 0, yellow: 0 } }),
          makePlayer('p3', { resources: { gold: 6, black: 0, green: 0, yellow: 0 } }),
        ],
      });
      const result = resolveShop(state, 'p1', 'gold_vp');
      // 10 - 6 (richest opponent) = 4
      expect(getPlayer(result.state, 'p1').glory).toBe(4);
    });

    it('tracks glory source as gold_vp_shop', () => {
      const state = makeState({
        players: [
          makePlayer('p1', { resources: { gold: 7, black: 0, green: 0, yellow: 0 } }),
          makePlayer('p2', { resources: { gold: 2, black: 0, green: 0, yellow: 0 } }),
        ],
      });
      const result = resolveShop(state, 'p1', 'gold_vp');
      expect(getPlayer(result.state, 'p1').glorySources.gold_vp_shop).toBe(5);
    });
  });
});

// =========================================================================
// BLACK SHOPS
// =========================================================================

describe('Black Shops', () => {
  describe('black_weak: 1 black -> steal 1 Favor from a player', () => {
    it('returns pendingDecision for targetPlayer when no target provided', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_weak');
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('targetPlayer');
    });

    it('excludes the acting player from target options', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_weak');
      expect(result.pendingDecision.options).not.toContain('p1');
      expect(result.pendingDecision.options).toContain('p2');
      expect(result.pendingDecision.options).toContain('p3');
    });

    it('steals 1 Favor from target and gives to player', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 5, glorySources: {} }),
          makePlayer('p3'),
        ],
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(1);
      expect(getPlayer(result.state, 'p2').glory).toBe(4);
    });

    it('returns isStealing flag', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 5 }),
        ],
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(result.isStealing).toBe(true);
    });

    it('returns gloryStolen array with details', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 5 }),
        ],
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(result.gloryStolen).toBeDefined();
      expect(result.gloryStolen.length).toBe(1);
      expect(result.gloryStolen[0]).toEqual({
        playerId: 'p1',
        targetPlayerId: 'p2',
        amount: 1,
      });
    });

    it('steals 1 from target with 0 Favor (target goes negative)', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 0 }),
        ],
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(1);
      expect(getPlayer(result.state, 'p2').glory).toBe(-1);
    });

    it('respects glory_reduction_immunity on target (blocks steal)', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 5 }),
        ],
        champions: {
          p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
        },
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
      expect(getPlayer(result.state, 'p2').glory).toBe(5);
    });

    it('excludes immune players from target options', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 5 }),
          makePlayer('p3', { glory: 3 }),
        ],
        champions: {
          p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
        },
      });
      const result = resolveShop(state, 'p1', 'black_weak');
      expect(result.pendingDecision.options).not.toContain('p2');
      expect(result.pendingDecision.options).toContain('p3');
    });

    it('returns no valid targets when all opponents are immune', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 5 }),
        ],
        champions: {
          p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
        },
      });
      const result = resolveShop(state, 'p1', 'black_weak');
      expect(result.pendingDecision).toBeUndefined();
      expect(result.log[0]).toContain('no valid targets');
    });

    it('tracks glory sources for both stealer and victim', () => {
      const state = makeState({
        players: [
          makePlayer('p1'),
          makePlayer('p2', { glory: 5 }),
        ],
      });
      const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
      expect(getPlayer(result.state, 'p1').glorySources.black_weak_shop).toBe(1);
      expect(getPlayer(result.state, 'p2').glorySources.black_weak_shop_victim).toBe(-1);
    });
  });

  describe('black_strong: 3 black -> doubleNextTheft effect', () => {
    it('adds doubleNextTheft effect to player', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_strong');
      expect(getPlayer(result.state, 'p1').effects).toContain('doubleNextTheft');
    });

    it('does not affect other players', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_strong');
      expect(getPlayer(result.state, 'p2').effects).not.toContain('doubleNextTheft');
    });

    it('produces a log message about doubled theft', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_strong');
      expect(result.log[0]).toContain('doubled');
    });

    it('stacks if bought multiple times', () => {
      const state = makeState({
        players: [makePlayer('p1', { effects: ['doubleNextTheft'] })],
      });
      const result = resolveShop(state, 'p1', 'black_strong');
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.effects.filter(e => e === 'doubleNextTheft').length).toBe(2);
    });
  });

  describe('black_vp: 5 black -> permanently +1 Favor per steal', () => {
    it('adds extra_steal_favor to permanentBuffs', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_vp');
      expect(getPlayer(result.state, 'p1').permanentBuffs).toContain('extra_steal_favor');
    });

    it('does not affect other players', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_vp');
      expect(getPlayer(result.state, 'p2').permanentBuffs).not.toContain('extra_steal_favor');
    });

    it('stacks with existing permanentBuffs', () => {
      const state = makeState({
        players: [makePlayer('p1', { permanentBuffs: ['extra_steal_favor'] })],
      });
      const result = resolveShop(state, 'p1', 'black_vp');
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.permanentBuffs.filter(b => b === 'extra_steal_favor').length).toBe(2);
    });

    it('produces a log message about permanent bonus', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'black_vp');
      expect(result.log[0]).toContain('permanently');
    });
  });
});

// =========================================================================
// GREEN SHOPS
// =========================================================================

describe('Green Shops', () => {
  describe('green_weak: 1 green -> extra turn with no shopping', () => {
    it('grants extra turn and noShopNextTurn effect to player', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_weak');
      expect(getPlayer(result.state, 'p1').effects).toContain('noShopNextTurn');
      expect(getPlayer(result.state, 'p1').extraTurns).toBe(1);
    });

    it('does not affect other players', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_weak');
      expect(getPlayer(result.state, 'p2').effects).not.toContain('noShopNextTurn');
      expect(getPlayer(result.state, 'p2').extraTurns || 0).toBe(0);
    });

    it('produces a log message about placing next worker', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_weak');
      expect(result.log[0]).toContain('next worker');
    });
  });

  describe('green_strong: 3 green -> repeatHappensTwice effect', () => {
    it('adds repeatHappensTwice effect to player', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_strong');
      expect(getPlayer(result.state, 'p1').effects).toContain('repeatHappensTwice');
    });

    it('does not affect other players', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_strong');
      expect(getPlayer(result.state, 'p2').effects).not.toContain('repeatHappensTwice');
    });

    it('produces a log message about doubled repeat', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_strong');
      expect(result.log[0]).toContain('twice');
    });

    it('stacks if bought multiple times', () => {
      const state = makeState({
        players: [makePlayer('p1', { effects: ['repeatHappensTwice'] })],
      });
      const result = resolveShop(state, 'p1', 'green_strong');
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.effects.filter(e => e === 'repeatHappensTwice').length).toBe(2);
    });
  });

  describe('green_vp: 5 green -> permanently +1 Favor per repeat', () => {
    it('adds extra_repeat_favor to permanentBuffs', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_vp');
      expect(getPlayer(result.state, 'p1').permanentBuffs).toContain('extra_repeat_favor');
    });

    it('does not affect other players', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_vp');
      expect(getPlayer(result.state, 'p2').permanentBuffs).not.toContain('extra_repeat_favor');
    });

    it('stacks with existing permanentBuffs', () => {
      const state = makeState({
        players: [makePlayer('p1', { permanentBuffs: ['extra_repeat_favor'] })],
      });
      const result = resolveShop(state, 'p1', 'green_vp');
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.permanentBuffs.filter(b => b === 'extra_repeat_favor').length).toBe(2);
    });

    it('produces a log message about permanent bonus', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'green_vp');
      expect(result.log[0]).toContain('permanently');
    });
  });
});

// =========================================================================
// YELLOW SHOPS
// =========================================================================

describe('Yellow Shops', () => {
  describe('yellow_weak: 1 yellow -> gain 2 any colors', () => {
    it('returns pendingDecision for gemSelection when no selection provided', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_weak');
      expect(result.pendingDecision).toBeDefined();
      expect(result.pendingDecision.type).toBe('gemSelection');
      expect(result.pendingDecision.count).toBe(2);
    });

    it('gains selected resources (2 gold)', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_weak', { gemSelection: { gold: 2 } });
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
    });

    it('gains split resources (1 gold, 1 black)', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_weak', { gemSelection: { gold: 1, black: 1 } });
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
    });

    it('rejects invalid selection (not exactly 2)', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_weak', { gemSelection: { gold: 3 } });
      expect(result.log[0]).toContain('Invalid');
    });

    it('rejects selection of 1 (too few)', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_weak', { gemSelection: { gold: 1 } });
      expect(result.log[0]).toContain('Invalid');
    });

    it('adds to existing resources', () => {
      const state = makeState({
        players: [makePlayer('p1', { resources: { gold: 3, black: 2, green: 0, yellow: 0 } })],
      });
      const result = resolveShop(state, 'p1', 'yellow_weak', { gemSelection: { gold: 1, black: 1 } });
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(4);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(3);
    });

    it('respects doubleNextGain effect', () => {
      const state = makeState({
        players: [makePlayer('p1', { effects: ['doubleNextGain'] })],
      });
      const result = resolveShop(state, 'p1', 'yellow_weak', { gemSelection: { gold: 1, black: 1 } });
      expect(getPlayer(result.state, 'p1').resources.gold).toBe(2);
      expect(getPlayer(result.state, 'p1').resources.black).toBe(2);
    });

    it('consumes doubleNextGain effect after use', () => {
      const state = makeState({
        players: [makePlayer('p1', { effects: ['doubleNextGain'] })],
      });
      const result = resolveShop(state, 'p1', 'yellow_weak', { gemSelection: { gold: 1, black: 1 } });
      expect(getPlayer(result.state, 'p1').effects).not.toContain('doubleNextGain');
    });
  });

  describe('yellow_strong: 2 yellow -> doubleNextGain effect', () => {
    it('adds doubleNextGain effect to player', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_strong');
      expect(getPlayer(result.state, 'p1').effects).toContain('doubleNextGain');
    });

    it('does not affect other players', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_strong');
      expect(getPlayer(result.state, 'p2').effects).not.toContain('doubleNextGain');
    });

    it('produces a log message about doubled gain', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_strong');
      expect(result.log[0]).toContain('doubled');
    });
  });

  describe('yellow_vp: 4 yellow -> spend all non-yellow, +1 Favor per spent', () => {
    it('spends all non-yellow resources and gains Favor', () => {
      const state = makeState({
        players: [makePlayer('p1', { resources: { gold: 3, black: 2, green: 1, yellow: 5 } })],
      });
      const result = resolveShop(state, 'p1', 'yellow_vp');
      const p1 = getPlayer(result.state, 'p1');
      // Spends 3 gold + 2 black + 1 green = 6 total -> +6 Favor
      expect(p1.glory).toBe(6);
      expect(p1.resources.gold).toBe(0);
      expect(p1.resources.black).toBe(0);
      expect(p1.resources.green).toBe(0);
      expect(p1.resources.yellow).toBe(5); // yellow untouched
    });

    it('gives 0 Favor when player has no non-yellow resources', () => {
      const state = makeState({
        players: [makePlayer('p1', { resources: { gold: 0, black: 0, green: 0, yellow: 3 } })],
      });
      const result = resolveShop(state, 'p1', 'yellow_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
    });

    it('gives 0 Favor when all resources are 0', () => {
      const state = makeState();
      const result = resolveShop(state, 'p1', 'yellow_vp');
      expect(getPlayer(result.state, 'p1').glory).toBe(0);
    });

    it('only considers active god colors (not yellow)', () => {
      const state = makeState({
        players: [makePlayer('p1', { resources: { gold: 2, black: 0, green: 0, yellow: 4 } })],
        gods: ['gold', 'yellow'], // only gold and yellow active
      });
      const result = resolveShop(state, 'p1', 'yellow_vp');
      const p1 = getPlayer(result.state, 'p1');
      expect(p1.glory).toBe(2); // only gold spent
      expect(p1.resources.gold).toBe(0);
      expect(p1.resources.yellow).toBe(4);
    });

    it('tracks glory source as yellow_vp_shop', () => {
      const state = makeState({
        players: [makePlayer('p1', { resources: { gold: 3, black: 2, green: 0, yellow: 0 } })],
      });
      const result = resolveShop(state, 'p1', 'yellow_vp');
      expect(getPlayer(result.state, 'p1').glorySources.yellow_vp_shop).toBe(5);
    });

    it('produces a log message with spent resources', () => {
      const state = makeState({
        players: [makePlayer('p1', { resources: { gold: 2, black: 1, green: 0, yellow: 0 } })],
      });
      const result = resolveShop(state, 'p1', 'yellow_vp');
      expect(result.log[0]).toContain('Favor');
    });
  });
});

// =========================================================================
// UNKNOWN SHOP / EDGE CASES
// =========================================================================

describe('resolveShop', () => {
  it('returns error log for unknown shop', () => {
    const state = makeState();
    const result = resolveShop(state, 'p1', 'fake_shop');
    expect(result.log[0]).toContain('Unknown shop');
  });

  it('does not mutate original state', () => {
    const state = makeState({
      players: [makePlayer('p1', { resources: { gold: 5, black: 0, green: 0, yellow: 0 } })],
    });
    const originalGlory = getPlayer(state, 'p1').glory;
    resolveShop(state, 'p1', 'gold_weak');
    expect(getPlayer(state, 'p1').glory).toBe(originalGlory);
  });
});

// =========================================================================
// CROSS-CUTTING CONCERNS
// =========================================================================

describe('doubleNextGain interaction with shops', () => {
  it('does not double Favor gains (only resource gains)', () => {
    // gold_weak gives +2 Favor, not resources — doubleNextGain should not apply
    const state = makeState({
      players: [makePlayer('p1', { effects: ['doubleNextGain'] })],
    });
    const result = resolveShop(state, 'p1', 'gold_weak');
    // gold_weak uses addGlory not addResources, so doubleNextGain stays untouched
    expect(getPlayer(result.state, 'p1').glory).toBe(2);
    // Effect should still be present since it wasn't consumed
    expect(getPlayer(result.state, 'p1').effects).toContain('doubleNextGain');
  });
});

describe('glory_reduction_immunity interaction', () => {
  it('removeGlory is blocked by immunity (used internally by shops)', () => {
    // If p2 has immunity and someone resolves black_weak targeting p2
    const state = makeState({
      players: [
        makePlayer('p1'),
        makePlayer('p2', { glory: 10 }),
      ],
      champions: {
        p2: { id: 'test', powerCards: ['tome_of_deeds'], powerCardSlots: 4 },
      },
    });
    const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
    expect(getPlayer(result.state, 'p2').glory).toBe(10);
    expect(result.log[0]).toContain('blocked');
  });
});

describe('doubleNextTheft — black strong shop effect', () => {
  it('black_weak shop steals 2 Favor instead of 1 when doubleNextTheft active', () => {
    const state = makeState({
      players: [
        makePlayer('p1', { effects: ['doubleNextTheft'] }),
        makePlayer('p2', { glory: 10 }),
      ],
    });
    const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
    expect(getPlayer(result.state, 'p1').glory).toBe(2); // stole 2
    expect(getPlayer(result.state, 'p2').glory).toBe(8); // lost 2
    expect(result.log.join(' ')).toContain('doubled');
  });

  it('doubleNextTheft is consumed after use in black_weak shop', () => {
    const state = makeState({
      players: [
        makePlayer('p1', { effects: ['doubleNextTheft'] }),
        makePlayer('p2', { glory: 10 }),
      ],
    });
    const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
    expect(getPlayer(result.state, 'p1').effects).not.toContain('doubleNextTheft');
  });

  it('black_weak shop steals 1 Favor normally without doubleNextTheft', () => {
    const state = makeState({
      players: [
        makePlayer('p1'),
        makePlayer('p2', { glory: 10 }),
      ],
    });
    const result = resolveShop(state, 'p1', 'black_weak', { targetPlayer: 'p2' });
    expect(getPlayer(result.state, 'p1').glory).toBe(1);
    expect(getPlayer(result.state, 'p2').glory).toBe(9);
  });
});
