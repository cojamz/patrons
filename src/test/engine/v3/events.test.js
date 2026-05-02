import { describe, it, expect } from 'vitest';
import {
  EventType,
  dispatchEvent,
  registerHandler,
  removeHandler,
  resetHandlerFrequencies,
} from '../../../engine/v3/events.js';
import { HANDLER_RESOLVERS } from '../../../engine/v3/handlers/index.js';

// --- Test Helpers ---

function makeState(overrides = {}) {
  return {
    players: [
      { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
    ],
    eventHandlers: [],
    gods: ['gold', 'black', 'green', 'yellow'],
    champions: {},
    ...overrides,
  };
}

function makeHandler(overrides = {}) {
  return {
    id: 'h1',
    eventType: EventType.RESOURCE_GAINED,
    source: 'power_card',
    sourceId: 'golden_scepter',
    ownerId: 'p1',
    config: {},
    usesThisRound: 0,
    usesThisTurn: 0,
    ...overrides,
  };
}

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

// =========================================================================
// Core dispatch behavior
// =========================================================================

describe('dispatchEvent', () => {
  it('returns unchanged state when there are no handlers', () => {
    const state = makeState();
    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, { playerId: 'p1', resources: { gold: 2 } });

    expect(result.state).toEqual(state);
    expect(result.log).toEqual([]);
    expect(result.pendingDecisions).toEqual([]);
  });

  it('fires handler on matching eventType', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'ring_h',
      eventType: EventType.TURN_START,
      sourceId: 'golden_ring',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.TURN_START, { playerId: 'p1' });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBe(1);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it('does NOT fire handler when eventType does not match', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'ring_h',
      eventType: EventType.TURN_START,
      sourceId: 'golden_ring',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_END, { playerId: 'p1' });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBe(0);
  });

  it('skips handlers with unknown sourceId gracefully', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'unknown_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'nonexistent_card',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 1 },
      source: 'action',
    });

    // Should not crash, just return state unchanged
    expect(result.log).toEqual([]);
  });
});

// =========================================================================
// triggerOn filtering
// =========================================================================

describe('triggerOn filtering', () => {
  it("'self' only fires for owner's events", () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'ring_h',
      eventType: EventType.TURN_START,
      sourceId: 'golden_ring',
      ownerId: 'p1',
      config: { triggerOn: 'self' },
    }));

    // p1's turn => should fire
    const result1 = dispatchEvent(state, EventType.TURN_START, { playerId: 'p1' });
    expect(getPlayer(result1.state, 'p1').resources.gold).toBe(1);

    // p2's turn => should NOT fire
    const result2 = dispatchEvent(state, EventType.TURN_START, { playerId: 'p2' });
    expect(getPlayer(result2.state, 'p1').resources.gold).toBe(0);
  });

  it("'others' only fires for non-owner events", () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'spy_h',
      eventType: EventType.POWER_CARD_BOUGHT,
      sourceId: 'onyx_spyglass',
      ownerId: 'p1',
      config: { triggerOn: 'others' },
    }));

    // p2 buys a card => should fire for p1 (owner gets +1 black)
    const result1 = dispatchEvent(state, EventType.POWER_CARD_BOUGHT, { playerId: 'p2' });
    expect(getPlayer(result1.state, 'p1').resources.black).toBe(1);

    // p1 buys a card => should NOT fire (owner is buying)
    const result2 = dispatchEvent(state, EventType.POWER_CARD_BOUGHT, { playerId: 'p1' });
    expect(getPlayer(result2.state, 'p1').resources.black).toBe(0);
  });
});

// =========================================================================
// Frequency limits
// =========================================================================

describe('frequency limits', () => {
  it('once_per_round handler fires once then stops', () => {
    let state = makeState({ round: 1 });
    state = registerHandler(state, makeHandler({
      id: 'deft_h',
      eventType: EventType.ROUND_START,
      sourceId: 'deft_passive',
      ownerId: 'p1',
      source: 'champion_passive',
      frequency: 'once_per_round',
    }));

    // First fire: should grant extraTurns
    const result1 = dispatchEvent(state, EventType.ROUND_START, { round: 1 });
    const p1After = getPlayer(result1.state, 'p1');
    expect(p1After.extraTurns).toBe(1);

    // Second fire on same state: handler already used
    const result2 = dispatchEvent(result1.state, EventType.ROUND_START, { round: 1 });
    const p1Second = getPlayer(result2.state, 'p1');
    expect(p1Second.extraTurns).toBe(1);
  });

  it('once_per_turn handler fires once then stops', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'ring_h',
      eventType: EventType.TURN_START,
      sourceId: 'golden_ring',
      ownerId: 'p1',
      frequency: 'once_per_turn',
    }));

    const result1 = dispatchEvent(state, EventType.TURN_START, { playerId: 'p1' });
    expect(getPlayer(result1.state, 'p1').resources.gold).toBe(1);

    // Second fire: should not add more
    const result2 = dispatchEvent(result1.state, EventType.TURN_START, { playerId: 'p1' });
    expect(getPlayer(result2.state, 'p1').resources.gold).toBe(1);
  });
});

// =========================================================================
// resetHandlerFrequencies
// =========================================================================

describe('resetHandlerFrequencies', () => {
  it('resets round and turn counts for round scope', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'h1',
      usesThisRound: 3,
      usesThisTurn: 2,
    }));

    const reset = resetHandlerFrequencies(state, 'round');
    const handler = reset.eventHandlers[0];
    expect(handler.usesThisRound).toBe(0);
    expect(handler.usesThisTurn).toBe(0);
  });

  it('resets only turn counts for turn scope', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'h1',
      usesThisRound: 3,
      usesThisTurn: 2,
    }));

    const reset = resetHandlerFrequencies(state, 'turn');
    const handler = reset.eventHandlers[0];
    expect(handler.usesThisRound).toBe(3); // preserved
    expect(handler.usesThisTurn).toBe(0);   // reset
  });

  it('allows once_per_turn handler to fire again after reset', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'ring_h',
      eventType: EventType.TURN_START,
      sourceId: 'golden_ring',
      ownerId: 'p1',
      frequency: 'once_per_turn',
    }));

    // First fire
    const result1 = dispatchEvent(state, EventType.TURN_START, { playerId: 'p1' });
    expect(getPlayer(result1.state, 'p1').resources.gold).toBe(1);

    // Reset turn frequencies
    const resetState = resetHandlerFrequencies(result1.state, 'turn');

    // Second fire after reset: should work again
    const result2 = dispatchEvent(resetState, EventType.TURN_START, { playerId: 'p1' });
    expect(getPlayer(result2.state, 'p1').resources.gold).toBe(2);
  });
});

// =========================================================================
// Cascade depth limit
// =========================================================================

describe('cascade depth limit', () => {
  it('prevents infinite recursion with Golden Scepter', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'scepter_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'golden_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 2 },
      source: 'action',
    });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBeGreaterThan(5);
    expect(p1.resources.gold).toBeLessThan(100);
  });
});

// =========================================================================
// skipHandlerIds
// =========================================================================

describe('skipHandlerIds', () => {
  it('prevents specified handler from firing', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'scepter_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'golden_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(
      state,
      EventType.RESOURCE_GAINED,
      { playerId: 'p1', resources: { gold: 2 }, source: 'action' },
      { skipHandlerIds: ['scepter_h'] }
    );

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBe(0);
  });
});

// =========================================================================
// registerHandler and removeHandler
// =========================================================================

describe('registerHandler', () => {
  it('adds handler to state.eventHandlers', () => {
    const state = makeState();
    const handler = makeHandler({ id: 'test_h' });
    const newState = registerHandler(state, handler);

    expect(newState.eventHandlers.length).toBe(1);
    expect(newState.eventHandlers[0].id).toBe('test_h');
  });

  it('initializes frequency counters to 0', () => {
    const state = makeState();
    const handler = { id: 'test_h', eventType: EventType.ROUND_START, source: 'power_card', sourceId: 'golden_ring', ownerId: 'p1', config: {} };
    const newState = registerHandler(state, handler);

    expect(newState.eventHandlers[0].usesThisRound).toBe(0);
    expect(newState.eventHandlers[0].usesThisTurn).toBe(0);
  });
});

describe('removeHandler', () => {
  it('removes handler from state.eventHandlers', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({ id: 'h1' }));
    state = registerHandler(state, makeHandler({ id: 'h2', sourceId: 'golden_ring' }));

    const newState = removeHandler(state, 'h1');
    expect(newState.eventHandlers.length).toBe(1);
    expect(newState.eventHandlers[0].id).toBe('h2');
  });
});

// =========================================================================
// Handler priority ordering
// =========================================================================

describe('handler priority ordering', () => {
  it('fires power_card before glory_condition', () => {
    let state = makeState();

    // Register handlers in reverse priority order to prove sorting works
    state = registerHandler(state, makeHandler({
      id: 'glory_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));
    state = registerHandler(state, makeHandler({
      id: 'card_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'resonance_crystal',
      ownerId: 'p1',
      source: 'power_card',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p1',
      repeatedActionId: 'gold_gain2gold',
    });

    const p1 = getPlayer(result.state, 'p1');
    // Resonance Crystal gives +1 gold (non-green repeated action)
    expect(p1.resources.gold).toBe(1);
    // Green glory condition gives +1 Favor
    expect(p1.glory).toBe(1);

    // Verify log order: resonance crystal (power_card) first, then green glory (glory_condition)
    const crystalLogIdx = result.log.findIndex(l => l.includes('Resonance Crystal'));
    const gloryLogIdx = result.log.findIndex(l => l.includes('Green Favor'));
    expect(crystalLogIdx).toBeLessThan(gloryLogIdx);
  });
});

// =========================================================================
// GOLD HANDLER RESOLVERS
// =========================================================================

describe('Golden Scepter', () => {
  it('gives +1 gold on resource gain with gold from action source', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'scepter_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'golden_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 2 },
      source: 'action',
    });

    const p1 = getPlayer(result.state, 'p1');
    // Scepter fires => +1 gold, then sub-event dispatched with skipHandlerIds containing scepter_h
    // So exactly +1 gold from scepter
    expect(p1.resources.gold).toBe(1);
    expect(result.log).toContain('Golden Scepter: +1 gold');
  });

  it('does not fire when resources do not include gold', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'scepter_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'golden_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { black: 2 },
      source: 'action',
    });

    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });

  it('does not fire when source is not action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'scepter_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'golden_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 2 },
      source: 'shop',
    });

    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });
});

describe('Rainbow Scepter', () => {
  it('gives +1 of lowest non-gold color when gaining gold from action', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 3, black: 5, green: 2, yellow: 1 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'rainbow_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'rainbow_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 1 },
      source: 'action',
    });

    // Now returns a pending decision for color choice
    expect(result.pendingDecisions.length).toBe(1);
    expect(result.pendingDecisions[0].type).toBe('gemSelection');
    expect(result.pendingDecisions[0].sourceId).toBe('rainbow_scepter');
    expect(result.pendingDecisions[0].count).toBe(1);
    expect(result.pendingDecisions[0].colors).not.toContain('gold');
    expect(result.log[0]).toContain('Rainbow Scepter');
  });

  it('does not fire when no gold is gained', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'rainbow_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'rainbow_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { black: 2 },
      source: 'action',
    });

    expect(getPlayer(result.state, 'p1')).toEqual(getPlayer(state, 'p1'));
  });

  it('does not fire when source is not action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'rainbow_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'rainbow_scepter',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 1 },
      source: 'power_card',
    });

    expect(result.log).toEqual([]);
  });
});

describe('Golden Ring', () => {
  it('gives +1 gold at start of owner turn', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'ring_h',
      eventType: EventType.TURN_START,
      sourceId: 'golden_ring',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.TURN_START, { playerId: 'p1' });

    expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
    expect(result.log).toContain('Golden Ring: +1 gold (start of turn)');
  });

  it('does NOT fire on other player turn', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'ring_h',
      eventType: EventType.TURN_START,
      sourceId: 'golden_ring',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.TURN_START, { playerId: 'p2' });

    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });
});

describe('Gold Crown', () => {
  it('gives +1 Favor per 2 gold at game end', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 7, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'crown_h',
      eventType: EventType.GAME_END,
      sourceId: 'gold_crown',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.GAME_END, {});

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(3); // floor(7/2) = 3
    expect(p1.glorySources.gold_crown).toBe(3);
    expect(result.log[0]).toContain('Gold Crown');
  });

  it('gives 0 Favor when player has less than 2 gold', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 1, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'crown_h',
      eventType: EventType.GAME_END,
      sourceId: 'gold_crown',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.GAME_END, {});

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
  });
});

describe('Golden Scope', () => {
  it('stealer loses 1 Favor when stealing from owner', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'scope_h',
      eventType: EventType.RESOURCE_STOLEN,
      sourceId: 'golden_scope',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_STOLEN, {
      playerId: 'p2',
      targetPlayerId: 'p1',
      resources: { gold: 1 },
    });

    const p2 = getPlayer(result.state, 'p2');
    expect(p2.glory).toBe(4); // lost 1 Favor
    expect(result.log[0]).toContain('Golden Scope');
  });

  it('does not fire when someone else is the target', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'scope_h',
      eventType: EventType.RESOURCE_STOLEN,
      sourceId: 'golden_scope',
      ownerId: 'p1',
    }));

    // p1 steals from p2 — scope owner is p1 but target is p2, so shouldn't fire
    const result = dispatchEvent(state, EventType.RESOURCE_STOLEN, {
      playerId: 'p1',
      targetPlayerId: 'p2',
      resources: { gold: 1 },
    });

    expect(getPlayer(result.state, 'p2').glory).toBe(5); // unchanged
  });
});

describe('Golden Idol', () => {
  it('gives +1 extra Favor when gaining Favor from gold source', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'idol_h',
      eventType: EventType.GLORY_GAINED,
      sourceId: 'golden_idol',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.GLORY_GAINED, {
      playerId: 'p1',
      amount: 2,
      source: 'gold_glory_condition',
    });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(1);
    expect(p1.glorySources.golden_idol).toBe(1);
    expect(result.log).toContain('Golden Idol: +1 extra Favor (from gold source)');
  });

  it('does not fire for non-gold glory sources', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'idol_h',
      eventType: EventType.GLORY_GAINED,
      sourceId: 'golden_idol',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.GLORY_GAINED, {
      playerId: 'p1',
      amount: 2,
      source: 'green_glory_condition',
    });

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
  });

  it('does not fire for other players gaining glory', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'idol_h',
      eventType: EventType.GLORY_GAINED,
      sourceId: 'golden_idol',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.GLORY_GAINED, {
      playerId: 'p2',
      amount: 2,
      source: 'gold_glory_condition',
    });

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
  });
});

describe('Gold Glory Condition', () => {
  it('gives Favor equal to gold above richest opponent at round end', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 8, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'gold_glory_h',
      eventType: EventType.ROUND_END,
      sourceId: 'gold_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ROUND_END, {});

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(5); // 8 - 3 = 5
    expect(p1.glorySources.gold_glory_condition).toBe(5);
    expect(result.log[0]).toContain('Gold Favor');
  });

  it('gives 0 Favor when opponent has equal or more gold', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'gold_glory_h',
      eventType: EventType.ROUND_END,
      sourceId: 'gold_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ROUND_END, {});

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
    expect(result.log).toEqual([]);
  });
});

// =========================================================================
// BLACK HANDLER RESOLVERS
// =========================================================================

describe("Thieves' Gloves", () => {
  it('gives +1 of lowest resource when owner steals', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 3, black: 5, green: 1, yellow: 2 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'gloves_h',
      eventType: EventType.RESOURCE_STOLEN,
      sourceId: 'thieves_gloves',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_STOLEN, {
      playerId: 'p1',
      targetPlayerId: 'p2',
      resources: { gold: 1 },
    });

    const p1 = getPlayer(result.state, 'p1');
    // Lowest is green (1), so +1 green
    expect(p1.resources.green).toBe(2);
    expect(result.log[0]).toContain("Thieves' Gloves");
    expect(result.log[0]).toContain('green');
  });

  it('does not fire when another player steals', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'gloves_h',
      eventType: EventType.RESOURCE_STOLEN,
      sourceId: 'thieves_gloves',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_STOLEN, {
      playerId: 'p2',
      targetPlayerId: 'p1',
      resources: { gold: 1 },
    });

    // p1 should not get bonus resource since p2 stole, not p1
    expect(getPlayer(result.state, 'p1').resources).toEqual({ gold: 0, black: 0, green: 0, yellow: 0 });
  });
});

describe('Onyx Spyglass', () => {
  it('gives +1 black when another player buys a power card', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'spyglass_h',
      eventType: EventType.POWER_CARD_BOUGHT,
      sourceId: 'onyx_spyglass',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.POWER_CARD_BOUGHT, { playerId: 'p2' });

    expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
    expect(result.log).toContain('Onyx Spyglass: +1 black (another player bought a power card)');
  });

  it('does NOT fire when owner buys a power card', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'spyglass_h',
      eventType: EventType.POWER_CARD_BOUGHT,
      sourceId: 'onyx_spyglass',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.POWER_CARD_BOUGHT, { playerId: 'p1' });

    expect(getPlayer(result.state, 'p1').resources.black).toBe(0);
  });
});

describe('Voodoo Doll', () => {
  it('returns pendingDecision at round end to steal 2 Favor', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'voodoo_h',
      eventType: EventType.ROUND_END,
      sourceId: 'voodoo_doll',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_END, {});

    expect(result.pendingDecisions.length).toBe(1);
    expect(result.pendingDecisions[0].type).toBe('targetPlayer');
    expect(result.pendingDecisions[0].ownerId).toBe('p1');
    expect(result.pendingDecisions[0].excludePlayer).toBe('p1');
    expect(result.pendingDecisions[0].effect.glorySteal).toBe(2);
    expect(result.pendingDecisions[0].isStealing).toBe(true);
    expect(result.pendingDecisions[0].options).toContain('p2');
  });

  it('reports no valid targets when all have glory_reduction_immunity', () => {
    // To simulate all targets being immune, we need state.champions set up
    // with power cards that have glory_reduction_immunity modifier.
    // Since hasModifier checks state.champions[playerId].powerCards against actual card defs,
    // and we don't have real card defs with that modifier easily, we test the simpler case:
    // a single-player game (no valid targets since owner is excluded).
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'voodoo_h',
      eventType: EventType.ROUND_END,
      sourceId: 'voodoo_doll',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_END, {});

    expect(result.pendingDecisions).toEqual([]);
    expect(result.log[0]).toContain('no valid targets');
  });
});

describe('Skeleton Key', () => {
  it('steals 1 resource from another player on same god when doing non-black action', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 3, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
      roundActions: [
        { playerId: 'p2', actionId: 'gold_gain2gold' },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'skeleton_h',
      eventType: EventType.ACTION_EXECUTED,
      sourceId: 'skeleton_key',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_EXECUTED, {
      playerId: 'p1',
      actionId: 'gold_convert2AnyTo2Gold',
    });

    const p1 = getPlayer(result.state, 'p1');
    const p2 = getPlayer(result.state, 'p2');
    // p2 had 3 gold (most abundant), skeleton key steals 1 gold
    expect(p1.resources.gold).toBe(1);
    expect(p2.resources.gold).toBe(2);
    expect(result.log[0]).toContain('Skeleton Key');
  });

  it('does not fire on black god actions', () => {
    let state = makeState({
      roundActions: [
        { playerId: 'p2', actionId: 'black_gain3black' },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'skeleton_h',
      eventType: EventType.ACTION_EXECUTED,
      sourceId: 'skeleton_key',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_EXECUTED, {
      playerId: 'p1',
      actionId: 'black_steal2Any',
    });

    expect(result.log).toEqual([]);
  });

  it('does not fire when no other players have workers on that god', () => {
    let state = makeState({
      roundActions: [],
    });
    state = registerHandler(state, makeHandler({
      id: 'skeleton_h',
      eventType: EventType.ACTION_EXECUTED,
      sourceId: 'skeleton_key',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_EXECUTED, {
      playerId: 'p1',
      actionId: 'gold_gain2gold',
    });

    expect(result.log).toEqual([]);
  });

  it('does not fire for other player actions', () => {
    let state = makeState({
      roundActions: [
        { playerId: 'p1', actionId: 'gold_gain2gold' },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'skeleton_h',
      eventType: EventType.ACTION_EXECUTED,
      sourceId: 'skeleton_key',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_EXECUTED, {
      playerId: 'p2',
      actionId: 'gold_gain2gold',
    });

    expect(result.log).toEqual([]);
  });
});

describe('Poisoned Blade', () => {
  it('steals 1 extra Favor when owner steals glory', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'blade_h',
      eventType: EventType.GLORY_STOLEN,
      sourceId: 'poisoned_blade',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.GLORY_STOLEN, {
      playerId: 'p1',
      targetPlayerId: 'p2',
      amount: 2,
    });

    const p1 = getPlayer(result.state, 'p1');
    const p2 = getPlayer(result.state, 'p2');
    expect(p1.glory).toBe(1);  // gained 1 extra
    expect(p2.glory).toBe(4);  // lost 1 extra
    expect(result.log).toContain('Poisoned Blade: stole 1 extra Favor');
  });

  it('does not fire when another player steals glory', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'blade_h',
      eventType: EventType.GLORY_STOLEN,
      sourceId: 'poisoned_blade',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.GLORY_STOLEN, {
      playerId: 'p2',
      targetPlayerId: 'p1',
      amount: 2,
    });

    // p1 should not get the bonus (p2 is the stealer, not p1)
    expect(getPlayer(result.state, 'p1').glory).toBe(5);
  });
});

describe('Black Glory Condition', () => {
  it('gives +1 Favor when owner performs a steal action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'black_glory_h',
      eventType: EventType.STEAL_ACTION,
      sourceId: 'black_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.STEAL_ACTION, { playerId: 'p1' });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(1);
    expect(p1.glorySources.black_glory_condition).toBe(1);
  });

  it('gives +2 Favor with extra_steal_favor permanent buff', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: ['extra_steal_favor'] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'black_glory_h',
      eventType: EventType.STEAL_ACTION,
      sourceId: 'black_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.STEAL_ACTION, { playerId: 'p1' });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(2);
    expect(result.log[0]).toContain('+2 Favor');
    expect(result.log[0]).toContain('permanent buff');
  });

  it('does not fire for other player steal actions', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'black_glory_h',
      eventType: EventType.STEAL_ACTION,
      sourceId: 'black_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.STEAL_ACTION, { playerId: 'p2' });

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
  });
});

// =========================================================================
// GREEN HANDLER RESOLVERS
// =========================================================================

describe('Flux Capacitor', () => {
  it('gives +1 green from green god action that gains green', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'flux_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'flux_capacitor',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { green: 2 },
      source: 'action',
      godColor: 'green',
    });

    expect(getPlayer(result.state, 'p1').resources.green).toBe(1);
    expect(result.log).toContain('Flux Capacitor: +1 green (green god action)');
  });

  it('does not fire for non-green god actions', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'flux_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'flux_capacitor',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { green: 2 },
      source: 'action',
      godColor: 'gold',
    });

    expect(getPlayer(result.state, 'p1').resources.green).toBe(0);
  });

  it('does not fire when no green is gained', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'flux_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'flux_capacitor',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 2 },
      source: 'action',
      godColor: 'green',
    });

    expect(getPlayer(result.state, 'p1').resources.green).toBe(0);
  });

  it('does not fire from non-action sources', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'flux_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'flux_capacitor',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { green: 2 },
      source: 'shop',
      godColor: 'green',
    });

    expect(getPlayer(result.state, 'p1').resources.green).toBe(0);
  });
});

describe('Resonance Crystal', () => {
  it('gives +1 of god color when repeating a non-green god action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'crystal_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'resonance_crystal',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p1',
      repeatedActionId: 'gold_gain2gold',
    });

    expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
    expect(result.log[0]).toContain('Resonance Crystal');
    expect(result.log[0]).toContain('gold');
  });

  it('does not fire for green god repeated actions', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'crystal_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'resonance_crystal',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p1',
      repeatedActionId: 'green_gain3green',
    });

    expect(getPlayer(result.state, 'p1').resources.green).toBe(0);
  });

  it('does not fire for other players repeating actions', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'crystal_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'resonance_crystal',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p2',
      repeatedActionId: 'gold_gain2gold',
    });

    expect(getPlayer(result.state, 'p1').resources.gold).toBe(0);
  });

  it('gives black when repeating a black god action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'crystal_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'resonance_crystal',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p1',
      repeatedActionId: 'black_steal2Any',
    });

    expect(getPlayer(result.state, 'p1').resources.black).toBe(1);
  });
});

describe('Temporal Patent', () => {
  it('target player loses 2 Favor when their action is repeated by owner', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 5, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'patent_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'temporal_patent',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p1',
      repeatedActionId: 'gold_gain2gold',
      originalPlayerId: 'p2',
    });

    expect(getPlayer(result.state, 'p2').glory).toBe(3); // lost 2
    expect(result.log[0]).toContain('Temporal Patent');
    expect(result.log[0]).toContain('p2');
  });

  it('does not fire when repeating own action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'patent_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'temporal_patent',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p1',
      repeatedActionId: 'gold_gain2gold',
      originalPlayerId: 'p1',
    });

    expect(result.log).toEqual([]);
  });

  it('does not fire when another player repeats an action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'patent_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'temporal_patent',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p2',
      repeatedActionId: 'gold_gain2gold',
      originalPlayerId: 'p1',
    });

    expect(result.log).toEqual([]);
  });
});

describe('Diadem of Expertise', () => {
  it('gives +1 extra Favor on repeat action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'diadem_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'diadem_of_expertise',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p1',
      repeatedActionId: 'gold_gain2gold',
    });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(1);
    expect(p1.glorySources.diadem_of_expertise).toBe(1);
    expect(result.log).toContain('Diadem of Expertise: +1 extra Favor (double trigger)');
  });

  it('does not fire for other players', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'diadem_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'diadem_of_expertise',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, {
      playerId: 'p2',
      repeatedActionId: 'gold_gain2gold',
    });

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
  });
});

describe('Chrono Compass', () => {
  it('returns pending decision for turn order choice at round start', () => {
    let state = makeState({
      turnOrder: ['p1', 'p2'],
    });
    state = registerHandler(state, makeHandler({
      id: 'chrono_h',
      eventType: EventType.ROUND_START,
      sourceId: 'chrono_compass',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_START, {});

    expect(result.pendingDecisions.length).toBe(1);
    expect(result.pendingDecisions[0].type).toBe('turnOrderChoice');
    expect(result.pendingDecisions[0].ownerId).toBe('p1');
    expect(result.pendingDecisions[0].options).toEqual([1, 2]);
    expect(result.pendingDecisions[0].sourceId).toBe('chrono_compass');
  });
});

describe('Green Glory Condition', () => {
  it('gives +1 Favor on ACTION_REPEATED', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'green_glory_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p1' });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(1);
    expect(p1.glorySources.green_glory_condition).toBe(1);
  });

  it('gives +1 Favor on ACTION_COPIED', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'green_glory_h',
      eventType: EventType.ACTION_COPIED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ACTION_COPIED, { playerId: 'p1' });

    expect(getPlayer(result.state, 'p1').glory).toBe(1);
  });

  it('gives +2 Favor with extra_repeat_favor permanent buff', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: ['extra_repeat_favor'] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'green_glory_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p1' });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(2);
    expect(result.log[0]).toContain('+2 Favor');
    expect(result.log[0]).toContain('VP shop');
  });

  it('does not fire for other players', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'green_glory_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p2' });

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
  });

  it('fires independently for each ACTION_REPEATED dispatch (no frequency limit)', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'green_glory_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    // First repeat
    let result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p1' });
    state = result.state;
    expect(getPlayer(state, 'p1').glory).toBe(1);

    // Second repeat — should fire again, no frequency limit
    result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p1' });
    state = result.state;
    expect(getPlayer(state, 'p1').glory).toBe(2);

    // Third repeat
    result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p1' });
    state = result.state;
    expect(getPlayer(state, 'p1').glory).toBe(3);
  });

  it('stacks VP shop buff — multiple purchases scale favor per repeat', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: ['extra_repeat_favor', 'extra_repeat_favor'] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'green_glory_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p1' });
    // Base 1 + 2 buffs = +3 per repeat
    expect(getPlayer(result.state, 'p1').glory).toBe(3);
    expect(result.log[0]).toContain('+3 Favor');
    expect(result.log[0]).toContain('+2 from VP shop');
  });
});

// =========================================================================
// YELLOW HANDLER RESOLVERS
// =========================================================================

describe('Rainbow Crest', () => {
  it('returns pendingDecision for player to choose resource when gaining 2+ colors', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 3, black: 5, green: 2, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'crest_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'rainbow_crest',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 1, green: 1 },
      source: 'action',
    });

    // Rainbow Crest now returns a pending decision instead of auto-picking
    expect(result.pendingDecisions.length).toBe(1);
    expect(result.pendingDecisions[0].type).toBe('gemSelection');
    expect(result.pendingDecisions[0].sourceId).toBe('rainbow_crest');
    expect(result.pendingDecisions[0].count).toBe(1);
    expect(result.log[0]).toContain('Rainbow Crest');
  });

  it('does not fire when gaining only 1 color', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'crest_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'rainbow_crest',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 3 },
      source: 'action',
    });

    expect(getPlayer(result.state, 'p1').resources).toEqual({ gold: 0, black: 0, green: 0, yellow: 0 });
  });

  it('does not fire for other players gaining resources', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'crest_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'rainbow_crest',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p2',
      resources: { gold: 1, green: 1 },
      source: 'action',
    });

    expect(getPlayer(result.state, 'p1').resources).toEqual({ gold: 0, black: 0, green: 0, yellow: 0 });
  });
});

describe('Extraction Vial', () => {
  it('gives +1 yellow from non-yellow god action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'vial_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'extraction_vial',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 2 },
      source: 'action',
      godColor: 'gold',
    });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(1);
    expect(result.log[0]).toContain('Extraction Vial');
    expect(result.log[0]).toContain('gold god action');
  });

  it('does not fire for yellow god actions', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'vial_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'extraction_vial',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { yellow: 2 },
      source: 'action',
      godColor: 'yellow',
    });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(0);
  });

  it('does not fire for non-action sources', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'vial_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'extraction_vial',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 2 },
      source: 'shop',
      godColor: 'gold',
    });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(0);
  });

  it('does not fire for other players', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'vial_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'extraction_vial',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p2',
      resources: { gold: 2 },
      source: 'action',
      godColor: 'gold',
    });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(0);
  });
});

describe('Slag Catcher', () => {
  it('gives +1 yellow if player spent 3+ resources this turn', () => {
    let state = makeState({
      turnResourceSpending: { p1: 4 },
    });
    state = registerHandler(state, makeHandler({
      id: 'slag_h',
      eventType: EventType.TURN_END,
      sourceId: 'slag_catcher',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.TURN_END, { playerId: 'p1' });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(1);
    expect(result.log).toContain('Slag Catcher: +1 yellow (spent 3+ resources this turn)');
  });

  it('does not fire if player spent less than 3 resources', () => {
    let state = makeState({
      turnResourceSpending: { p1: 2 },
    });
    state = registerHandler(state, makeHandler({
      id: 'slag_h',
      eventType: EventType.TURN_END,
      sourceId: 'slag_catcher',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.TURN_END, { playerId: 'p1' });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(0);
  });

  it('does not fire for other players', () => {
    let state = makeState({
      turnResourceSpending: { p2: 5 },
    });
    state = registerHandler(state, makeHandler({
      id: 'slag_h',
      eventType: EventType.TURN_END,
      sourceId: 'slag_catcher',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.TURN_END, { playerId: 'p2' });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(0);
  });
});

describe("Alchemist's Trunk", () => {
  it('returns pending decision for redistribution when player has resources', () => {
    let state = makeState({
      players: [
        { id: 'p1', resources: { gold: 3, black: 2, green: 0, yellow: 1 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    state = registerHandler(state, makeHandler({
      id: 'trunk_h',
      eventType: EventType.ROUND_START,
      sourceId: 'alchemists_trunk',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_START, {});

    expect(result.pendingDecisions.length).toBe(1);
    expect(result.pendingDecisions[0].type).toBe('redistributeResources');
    expect(result.pendingDecisions[0].ownerId).toBe('p1');
    expect(result.pendingDecisions[0].totalResources).toBe(6);
    expect(result.pendingDecisions[0].sourceId).toBe('alchemists_trunk');
  });

  it('does not return decision when player has 0 resources', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'trunk_h',
      eventType: EventType.ROUND_START,
      sourceId: 'alchemists_trunk',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_START, {});

    expect(result.pendingDecisions).toEqual([]);
    expect(result.log[0]).toContain('no resources to redistribute');
  });
});

describe('Horn of Plenty', () => {
  it('gives +1 of each active color at round start', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'horn_h',
      eventType: EventType.ROUND_START,
      sourceId: 'horn_of_plenty',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_START, {});

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBe(1);
    expect(p1.resources.black).toBe(1);
    expect(p1.resources.green).toBe(1);
    expect(p1.resources.yellow).toBe(1);
    expect(result.log[0]).toContain('Horn of Plenty');
  });

  it('respects custom active gods list', () => {
    let state = makeState({
      gods: ['gold', 'green'],
    });
    state = registerHandler(state, makeHandler({
      id: 'horn_h',
      eventType: EventType.ROUND_START,
      sourceId: 'horn_of_plenty',
      ownerId: 'p1',
    }));

    const result = dispatchEvent(state, EventType.ROUND_START, {});

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBe(1);
    expect(p1.resources.green).toBe(1);
    expect(p1.resources.black).toBe(0);
    expect(p1.resources.yellow).toBe(0);
  });
});

describe('Yellow Glory Condition', () => {
  it('gives Favor equal to new colors gained', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'yellow_glory_h',
      eventType: EventType.NEW_COLOR_GAINED,
      sourceId: 'yellow_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.NEW_COLOR_GAINED, {
      playerId: 'p1',
      newColorsCount: 2,
    });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.glory).toBe(2);
    expect(p1.glorySources.yellow_glory_condition).toBe(2);
    expect(result.log[0]).toContain('Yellow Favor');
    expect(result.log[0]).toContain('+2 Favor');
    expect(result.log[0]).toContain('2 new colors');
  });

  it('defaults to 1 new color when newColorsCount not specified', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'yellow_glory_h',
      eventType: EventType.NEW_COLOR_GAINED,
      sourceId: 'yellow_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.NEW_COLOR_GAINED, {
      playerId: 'p1',
    });

    expect(getPlayer(result.state, 'p1').glory).toBe(1);
  });

  it('does not fire for other players gaining new colors', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'yellow_glory_h',
      eventType: EventType.NEW_COLOR_GAINED,
      sourceId: 'yellow_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.NEW_COLOR_GAINED, {
      playerId: 'p2',
      newColorsCount: 3,
    });

    expect(getPlayer(result.state, 'p1').glory).toBe(0);
  });
});

// =========================================================================
// HANDLER_RESOLVERS registry
// =========================================================================

describe('HANDLER_RESOLVERS registry', () => {
  it('contains all gold handler keys', () => {
    expect(HANDLER_RESOLVERS).toHaveProperty('golden_scepter');
    expect(HANDLER_RESOLVERS).toHaveProperty('rainbow_scepter');
    expect(HANDLER_RESOLVERS).toHaveProperty('golden_ring');
    expect(HANDLER_RESOLVERS).toHaveProperty('gold_crown');
    expect(HANDLER_RESOLVERS).toHaveProperty('golden_scope');
    expect(HANDLER_RESOLVERS).toHaveProperty('golden_idol');
    expect(HANDLER_RESOLVERS).toHaveProperty('gold_glory_condition');
  });

  it('contains all black handler keys', () => {
    expect(HANDLER_RESOLVERS).toHaveProperty('thieves_gloves');
    expect(HANDLER_RESOLVERS).toHaveProperty('onyx_spyglass');
    expect(HANDLER_RESOLVERS).toHaveProperty('voodoo_doll');
    expect(HANDLER_RESOLVERS).toHaveProperty('skeleton_key');
    expect(HANDLER_RESOLVERS).toHaveProperty('poisoned_blade');
    expect(HANDLER_RESOLVERS).toHaveProperty('black_glory_condition');
  });

  it('contains all green handler keys', () => {
    expect(HANDLER_RESOLVERS).toHaveProperty('flux_capacitor');
    expect(HANDLER_RESOLVERS).toHaveProperty('resonance_crystal');
    expect(HANDLER_RESOLVERS).toHaveProperty('temporal_patent');
    expect(HANDLER_RESOLVERS).toHaveProperty('diadem_of_expertise');
    expect(HANDLER_RESOLVERS).toHaveProperty('chrono_compass');
    expect(HANDLER_RESOLVERS).toHaveProperty('green_glory_condition');
  });

  it('contains all yellow handler keys', () => {
    expect(HANDLER_RESOLVERS).toHaveProperty('rainbow_crest');
    expect(HANDLER_RESOLVERS).toHaveProperty('extraction_vial');
    expect(HANDLER_RESOLVERS).toHaveProperty('slag_catcher');
    expect(HANDLER_RESOLVERS).toHaveProperty('alchemists_trunk');
    expect(HANDLER_RESOLVERS).toHaveProperty('horn_of_plenty');
    expect(HANDLER_RESOLVERS).toHaveProperty('yellow_glory_condition');
  });

  it('contains champion handler keys', () => {
    expect(HANDLER_RESOLVERS).toHaveProperty('prescient_passive');
    expect(HANDLER_RESOLVERS).toHaveProperty('favored_passive');
    expect(HANDLER_RESOLVERS).toHaveProperty('deft_passive');
  });

  it('all resolvers are functions', () => {
    for (const [key, resolver] of Object.entries(HANDLER_RESOLVERS)) {
      expect(typeof resolver).toBe('function');
    }
  });
});

// =========================================================================
// Direct resolver unit tests (bypass dispatch)
// =========================================================================

describe('Direct resolver calls', () => {
  it('goldenScepterResolver adds gold and produces log', () => {
    const resolver = HANDLER_RESOLVERS.golden_scepter;
    const state = makeState();
    const handler = { id: 'h1', sourceId: 'golden_scepter', ownerId: 'p1', config: {} };
    const eventData = { playerId: 'p1', resources: { gold: 2 }, source: 'action' };

    const result = resolver(state, handler, eventData, { skipHandlerIds: [], maxDepth: 3, currentDepth: 1 });

    expect(getPlayer(result.state, 'p1').resources.gold).toBe(1);
    expect(result.log).toContain('Golden Scepter: +1 gold');
  });

  it('goldCrownResolver computes floor division correctly', () => {
    const resolver = HANDLER_RESOLVERS.gold_crown;
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 11, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
    });
    const handler = { id: 'h1', sourceId: 'gold_crown', ownerId: 'p1', config: {} };

    const result = resolver(state, handler, {}, {});

    expect(getPlayer(result.state, 'p1').glory).toBe(5); // floor(11/2) = 5
  });

  it('skeletonKeyResolver skips aegis holder', () => {
    const resolver = HANDLER_RESOLVERS.skeleton_key;
    const state = makeState({
      players: [
        { id: 'p1', resources: { gold: 0, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
        { id: 'p2', resources: { gold: 5, black: 0, green: 0, yellow: 0 }, glory: 0, glorySources: {}, effects: [], permanentBuffs: [] },
      ],
      roundActions: [{ playerId: 'p2', actionId: 'gold_gain2gold' }],
      aegisHolder: 'p2',
    });
    const handler = { id: 'h1', sourceId: 'skeleton_key', ownerId: 'p1', config: {} };
    const eventData = { playerId: 'p1', actionId: 'gold_convert2AnyTo2Gold' };

    const result = resolver(state, handler, eventData, {});

    // p2 is aegis holder, so skeleton key should not steal
    expect(getPlayer(result.state, 'p2').resources.gold).toBe(5);
    expect(result.log).toEqual([]);
  });

  it('hornOfPlentyResolver gives all active colors', () => {
    const resolver = HANDLER_RESOLVERS.horn_of_plenty;
    const state = makeState({ gods: ['gold', 'black', 'green'] });
    const handler = { id: 'h1', sourceId: 'horn_of_plenty', ownerId: 'p1', config: {} };

    const result = resolver(state, handler, {}, {});

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.gold).toBe(1);
    expect(p1.resources.black).toBe(1);
    expect(p1.resources.green).toBe(1);
    expect(p1.resources.yellow).toBe(0);
  });
});

// =========================================================================
// Combination / integration scenarios
// =========================================================================

describe('Multi-handler interactions', () => {
  it('Golden Scepter + Rainbow Scepter both fire on gold gain from action', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'gold_scepter_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'golden_scepter',
      ownerId: 'p1',
      source: 'power_card',
    }));
    state = registerHandler(state, makeHandler({
      id: 'rainbow_scepter_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'rainbow_scepter',
      ownerId: 'p1',
      source: 'power_card',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { gold: 2 },
      source: 'action',
    });

    const p1 = getPlayer(result.state, 'p1');
    // Golden Scepter: +1 gold
    expect(p1.resources.gold).toBeGreaterThanOrEqual(1);
    // Rainbow Scepter: +1 of lowest non-gold
    // Both should have log entries
    expect(result.log.some(l => l.includes('Golden Scepter'))).toBe(true);
    expect(result.log.some(l => l.includes('Rainbow Scepter'))).toBe(true);
  });

  it('Green glory condition + Diadem of Expertise stack on repeat', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'diadem_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'diadem_of_expertise',
      ownerId: 'p1',
      source: 'power_card',
    }));
    state = registerHandler(state, makeHandler({
      id: 'green_glory_h',
      eventType: EventType.ACTION_REPEATED,
      sourceId: 'green_glory_condition',
      ownerId: 'p1',
      source: 'glory_condition',
    }));

    const result = dispatchEvent(state, EventType.ACTION_REPEATED, { playerId: 'p1' });

    const p1 = getPlayer(result.state, 'p1');
    // Diadem: +1 Favor, Green Glory: +1 Favor = 2 total
    expect(p1.glory).toBe(2);
  });

  it('Extraction Vial + Flux Capacitor both fire on green god action gaining green', () => {
    let state = makeState();
    // Extraction Vial: +1 yellow from non-yellow god action
    state = registerHandler(state, makeHandler({
      id: 'vial_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'extraction_vial',
      ownerId: 'p1',
      source: 'power_card',
    }));
    // Flux Capacitor: +1 green from green god action
    state = registerHandler(state, makeHandler({
      id: 'flux_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'flux_capacitor',
      ownerId: 'p1',
      source: 'power_card',
    }));

    // Green god action gaining green: both should fire
    // Flux Capacitor fires because godColor=green and resource includes green
    // Extraction Vial fires because godColor=green which is non-yellow
    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { green: 2 },
      source: 'action',
      godColor: 'green',
    });

    const p1 = getPlayer(result.state, 'p1');
    expect(p1.resources.green).toBe(1);  // Flux Capacitor: +1 green
    expect(p1.resources.yellow).toBe(1); // Extraction Vial: +1 yellow (green is non-yellow)
    expect(result.log.some(l => l.includes('Flux Capacitor'))).toBe(true);
    expect(result.log.some(l => l.includes('Extraction Vial'))).toBe(true);
  });

  it('Extraction Vial fires on green god action (non-yellow)', () => {
    let state = makeState();
    state = registerHandler(state, makeHandler({
      id: 'vial_h',
      eventType: EventType.RESOURCE_GAINED,
      sourceId: 'extraction_vial',
      ownerId: 'p1',
      source: 'power_card',
    }));

    const result = dispatchEvent(state, EventType.RESOURCE_GAINED, {
      playerId: 'p1',
      resources: { green: 2 },
      source: 'action',
      godColor: 'green',
    });

    expect(getPlayer(result.state, 'p1').resources.yellow).toBe(1);
  });
});
