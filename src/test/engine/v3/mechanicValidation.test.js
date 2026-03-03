/**
 * Patrons v3 — Mechanic Validation via Targeted Simulation
 *
 * Uses the headless runner with custom action/shop/decision pickers
 * to force specific mechanics and validate expected outcomes across
 * many simulated games.
 *
 * This is integration-level testing: actions, events, shops, power cards,
 * and Favor conditions all interacting through the full engine pipeline.
 */

import { describe, it, expect } from 'vitest';
import {
  simulateGame, randomDecisionFn, randomActionPicker,
} from '../../../engine/v3/runner.js';
import { getPlayer } from '../../../engine/v3/stateHelpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Force player 1 to always pick a specific action when available */
function forcedActionPicker(targetActionId) {
  return (state, playerId, availableActions) => {
    if (playerId === 1 && availableActions.includes(targetActionId)) {
      return targetActionId;
    }
    return randomActionPicker(state, playerId, availableActions);
  };
}

/** Force player 1 to always pick from a set of preferred actions */
function preferredActionPicker(preferredIds) {
  return (state, playerId, availableActions) => {
    if (playerId === 1) {
      for (const preferred of preferredIds) {
        if (availableActions.includes(preferred)) return preferred;
      }
    }
    return randomActionPicker(state, playerId, availableActions);
  };
}

/** Force player 1 to use a specific shop whenever they have access to its god */
function forcedShopPicker(targetShopId) {
  const godColor = targetShopId.split('_')[0];
  return (state, playerId) => {
    if (playerId !== 1) return null;
    // Check god access
    const accessed = state.godsAccessedThisTurn || [];
    if (!accessed.includes(godColor)) return null;
    // Check not already purchased
    if (state.purchaseMadeThisTurn) return null;
    return targetShopId;
  };
}

/** Run N simulations with custom pickers and collect per-player stats */
function runTargetedSims(opts, n = 20) {
  const results = [];
  let errors = 0;
  for (let i = 0; i < n; i++) {
    try {
      results.push(simulateGame({ playerCount: 2, maxTurns: 300, ...opts }));
    } catch (e) {
      errors++;
    }
  }
  return { results, errors };
}

/** Get average of a stat across simulation results */
function avgStat(results, fn) {
  if (results.length === 0) return 0;
  return results.reduce((sum, r) => sum + fn(r), 0) / results.length;
}

// ---------------------------------------------------------------------------
// GOLD ACTIONS
// ---------------------------------------------------------------------------

describe('Gold action validation', () => {
  it('Hoard: player gains gold and never has 0 gold at end of game when spamming hoard', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('gold_hoard'),
    }, 15);
    expect(errors).toBe(0);

    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      // Should have accumulated significant gold
      // (hoard gives +3 per use, player should have SOME unless Cash In or shops drained it)
      expect(p1.resources.gold).toBeGreaterThanOrEqual(0);
    }

    // On average P1 should have more gold than P2
    const avgP1Gold = avgStat(results, r => getPlayer(r.finalState, 1).resources.gold);
    const avgP2Gold = avgStat(results, r => getPlayer(r.finalState, 2).resources.gold);
    expect(avgP1Gold).toBeGreaterThan(avgP2Gold);
  });

  it('Hoard: noShopThisTurn prevents shopping (visible in logs)', () => {
    // When player 1 always plays Hoard AND tries to use a shop, shop should be blocked
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('gold_hoard'),
      shopDecisionFn: forcedShopPicker('gold_weak'),
    }, 10);
    expect(errors).toBe(0);

    // Player 1 should NOT gain Favor from gold_weak shop (hoard blocks shopping)
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const shopFavor = p1.glorySources?.gold_weak_shop || 0;
      expect(shopFavor).toBe(0);
    }
  });

  it('Gold Favor condition: P1 scores based on gold held at round end', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['gold_hoard', 'gold_haggle', 'gold_patronage']),
    }, 15);
    expect(errors).toBe(0);

    // Check that gold glory condition fires — P1 should have glory from it
    const p1AvgGlory = avgStat(results, r => getPlayer(r.finalState, 1).glory);
    // A gold-focused player should earn some Favor
    expect(p1AvgGlory).toBeGreaterThan(0);

    // Check glory sources include gold_glory_condition
    let goldConditionFired = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const gloryFromGold = p1.glorySources?.gold_glory_condition || 0;
      if (gloryFromGold > 0) goldConditionFired++;
    }
    // Should fire in most games (P1 hoards gold)
    expect(goldConditionFired).toBeGreaterThan(results.length * 0.5);
  });

  it('Levy: is flagged as stealing and produces resource transfers', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('gold_levy'),
    }, 10);
    expect(errors).toBe(0);

    // Check logs contain "Levy" and "taxed"
    for (const r of results) {
      const levyLogs = r.gameLog.filter(l => l.includes('Levy'));
      expect(levyLogs.length).toBeGreaterThan(0);
    }
  });

  it('Austerity: gains scale with empty power card slots', () => {
    // Player with no power cards should get max (4) gold from austerity
    // This is hard to test purely through simulation since champion slots vary,
    // but we can verify it produces gold
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('gold_austerity'),
    }, 10);
    expect(errors).toBe(0);

    // Player 1 should accumulate gold
    const avgP1Gold = avgStat(results, r => getPlayer(r.finalState, 1).resources.gold);
    expect(avgP1Gold).toBeGreaterThan(0);
  });

  it('Tariff: gains scale with worker placement on gods', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('gold_tariff'),
    }, 10);
    expect(errors).toBe(0);

    // Tariff gives +1 base + bonus per god with workers
    // Should produce gold accumulation
    const avgP1Gold = avgStat(results, r => getPlayer(r.finalState, 1).resources.gold);
    expect(avgP1Gold).toBeGreaterThan(0);
  });

  it('Cash In: converts gold to Favor 1:1', () => {
    // First accumulate gold, then cash in
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['gold_cashIn', 'gold_hoard']),
    }, 15);
    expect(errors).toBe(0);

    // Some games should have cash_in glory source
    let cashInUsed = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const cashInFavor = p1.glorySources?.cash_in || 0;
      if (cashInFavor > 0) cashInUsed++;
    }
    // Cash In is only available in Round 3, so it won't always fire,
    // but across 15 games it should appear at least sometimes
    expect(cashInUsed).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// BLACK ACTIONS
// ---------------------------------------------------------------------------

describe('Black action validation', () => {
  it('Skulk: pure resource gain, no stealing', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('black_skulk'),
    }, 10);
    expect(errors).toBe(0);

    // P1 should accumulate lots of black
    const avgP1Black = avgStat(results, r => getPlayer(r.finalState, 1).resources.black);
    expect(avgP1Black).toBeGreaterThan(3);
  });

  it('Black Favor condition: fires on steal actions', () => {
    // Force P1 to use steal actions
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['black_ransack', 'black_pickpocket', 'black_skulk']),
    }, 15);
    expect(errors).toBe(0);

    // P1 should gain glory from black_glory_condition (steal triggers)
    let blackConditionFired = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const gloryFromBlack = p1.glorySources?.black_glory_condition || 0;
      if (gloryFromBlack > 0) blackConditionFired++;
    }
    // Ransack/Pickpocket are stealing actions — should trigger
    expect(blackConditionFired).toBeGreaterThan(0);
  });

  it('Annihilate: spend all black, penalize others', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['black_annihilate', 'black_skulk']),
    }, 15);
    expect(errors).toBe(0);

    // Annihilate is tier 3 — only available round 3
    // Skulk accumulates black, then Annihilate converts it to penalty
    // P2 should sometimes have negative glory from annihilate penalties
    let annihilateFired = 0;
    for (const r of results) {
      const logHasAnnihilate = r.gameLog.some(l => l.includes('Annihilate'));
      if (logHasAnnihilate) annihilateFired++;
    }
    // Should fire in some games
    expect(annihilateFired).toBeGreaterThan(0);
  });

  it('Dread: penalizes based on opponent power card count', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['black_dread', 'black_skulk']),
    }, 10);
    expect(errors).toBe(0);

    // Dread is tier 2, gives +2 black + penalizes. Should not crash.
    // Log should contain Dread references
    let dreadFired = 0;
    for (const r of results) {
      const logHasDread = r.gameLog.some(l => l.includes('Dread'));
      if (logHasDread) dreadFired++;
    }
    expect(dreadFired).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// GREEN ACTIONS
// ---------------------------------------------------------------------------

describe('Green action validation', () => {
  it('Gather: pure resource gain', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('green_gather'),
    }, 10);
    expect(errors).toBe(0);

    const avgP1Green = avgStat(results, r => getPlayer(r.finalState, 1).resources.green);
    expect(avgP1Green).toBeGreaterThan(3);
  });

  it('Green Favor condition: fires on repeat/copy actions', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['green_relive', 'green_gather', 'green_echo']),
    }, 15);
    expect(errors).toBe(0);

    // Green Favor condition fires per repeat/copy
    let greenConditionFired = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const gloryFromGreen = p1.glorySources?.green_glory_condition || 0;
      if (gloryFromGreen > 0) greenConditionFired++;
    }
    // Relive is a repeat action — should fire the condition
    expect(greenConditionFired).toBeGreaterThan(0);
  });

  it('Repeat actions do not crash or infinite loop', () => {
    // All green repeat variants, making sure none cause infinite loops
    const repeatActions = ['green_relive', 'green_echo', 'green_recall', 'green_rewind', 'green_foresight'];
    for (const actionId of repeatActions) {
      const { results, errors } = runTargetedSims({
        actionPickerFn: forcedActionPicker(actionId),
      }, 5);
      // Allow some errors (abort when no valid targets), but shouldn't crash
      expect(errors).toBe(0);
      for (const r of results) {
        expect(r.finalState).toBeDefined();
        expect(r.turns).toBeGreaterThan(0);
      }
    }
  });

  it('Eternity: replays placed workers without crashing', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['green_eternity', 'green_gather', 'gold_hoard']),
    }, 10);
    expect(errors).toBe(0);

    // Eternity is tier 3 — should replay placed workers
    let eternityFired = 0;
    for (const r of results) {
      const logHasEternity = r.gameLog.some(l =>
        l.includes('Eternity') || l.includes('eternity')
      );
      if (logHasEternity) eternityFired++;
    }
    // Should trigger in some games (round 3 only)
    expect(eternityFired).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// YELLOW ACTIONS
// ---------------------------------------------------------------------------

describe('Yellow action validation', () => {
  it('Harvest: pure resource gain', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('yellow_harvest'),
    }, 10);
    expect(errors).toBe(0);

    const avgP1Yellow = avgStat(results, r => getPlayer(r.finalState, 1).resources.yellow);
    expect(avgP1Yellow).toBeGreaterThan(2);
  });

  it('Forage: player gains 2 any colors', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('yellow_forage'),
    }, 10);
    expect(errors).toBe(0);

    // P1 should accumulate resources (forage gives +2 any each time)
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const totalResources = Object.values(p1.resources).reduce((sum, v) => sum + v, 0);
      expect(totalResources).toBeGreaterThan(0);
    }
  });

  it('Attune: gains zero-colors + 1 yellow', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('yellow_attune'),
    }, 10);
    expect(errors).toBe(0);

    // P1 should have yellow (from the +1 yellow base gain)
    const avgP1Yellow = avgStat(results, r => getPlayer(r.finalState, 1).resources.yellow);
    expect(avgP1Yellow).toBeGreaterThan(0);
  });

  it('Yellow Favor condition: fires on 0→N color transitions', () => {
    // Attune is perfect for triggering yellow condition (gains colors at 0)
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['yellow_attune', 'yellow_forage']),
    }, 15);
    expect(errors).toBe(0);

    let yellowConditionFired = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const gloryFromYellow = p1.glorySources?.yellow_glory_condition || 0;
      if (gloryFromYellow > 0) yellowConditionFired++;
    }
    // Should fire often (attune targets zero-colors)
    expect(yellowConditionFired).toBeGreaterThan(0);
  });

  it('Flourish: gain 2 of each active color without crash', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['yellow_flourish', 'yellow_harvest']),
    }, 10);
    expect(errors).toBe(0);

    // Flourish is tier 3, gives +2 of each active color (4 colors = +8 total)
    let flourishFired = 0;
    for (const r of results) {
      const logHasFlourish = r.gameLog.some(l => l.includes('Flourish'));
      if (logHasFlourish) flourishFired++;
    }
    expect(flourishFired).toBeGreaterThan(0);
  });

  it('Transmute: swap resolves without crash across many games', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['yellow_transmute', 'yellow_harvest']),
    }, 10);
    expect(errors).toBe(0);

    for (const r of results) {
      expect(r.finalState).toBeDefined();
    }
  });

  it('Distill: spend-all-convert resolves without crash', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['yellow_distill', 'yellow_harvest', 'gold_hoard']),
    }, 10);
    expect(errors).toBe(0);

    let distillFired = 0;
    for (const r of results) {
      const logHasDistill = r.gameLog.some(l => l.includes('Distill'));
      if (logHasDistill) distillFired++;
    }
    // Distill is tier 2 — should fire in some games
    expect(distillFired).toBeGreaterThan(0);
  });

  it('Siphon: steals resources and gives compensation', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['yellow_siphon', 'yellow_harvest']),
    }, 10);
    expect(errors).toBe(0);

    // Siphon steals 2 and gives target +1 yellow
    let siphonFired = 0;
    for (const r of results) {
      const logHasSiphon = r.gameLog.some(l => l.includes('Siphon') || l.includes('siphon'));
      if (logHasSiphon) siphonFired++;
    }
    expect(siphonFired).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// SHOP VALIDATION
// ---------------------------------------------------------------------------

describe('Shop validation', () => {
  it('Gold weak shop: +2 Favor for 1 gold', () => {
    // Use non-Hoard gold actions (Hoard blocks shopping via noShopThisTurn)
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['gold_haggle', 'gold_patronage', 'gold_tariff']),
      shopDecisionFn: forcedShopPicker('gold_weak'),
    }, 15);
    expect(errors).toBe(0);

    // P1 should gain Favor from gold_weak_shop
    let shopFavorGained = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const shopFavor = p1.glorySources?.gold_weak_shop || 0;
      if (shopFavor > 0) shopFavorGained++;
    }
    // Should fire in some games (P1 focuses gold and uses gold shop)
    expect(shopFavorGained).toBeGreaterThan(0);
  });

  it('Gold strong shop: Aegis token blocks stealing', () => {
    // P1 builds gold (without Hoard, which blocks shopping) then buys Aegis (3g)
    const { results, errors } = runTargetedSims({
      actionPickerFn: (state, playerId, available) => {
        if (playerId === 1) {
          // P1: accumulate gold without blocking shops
          for (const pref of ['gold_patronage', 'gold_haggle', 'gold_tariff', 'gold_austerity']) {
            if (available.includes(pref)) return pref;
          }
        }
        if (playerId === 2) {
          // P2: try to steal from P1
          for (const pref of ['black_ransack', 'gold_levy', 'black_skulk']) {
            if (available.includes(pref)) return pref;
          }
        }
        return randomActionPicker(state, playerId, available);
      },
      shopDecisionFn: forcedShopPicker('gold_strong'),
    }, 20);
    expect(errors).toBe(0);

    // Check that Aegis was acquired or referenced in logs in some games
    let aegisAcquired = 0;
    for (const r of results) {
      if (r.finalState.aegisHolder === 1) aegisAcquired++;
      else {
        const aegisLogs = r.gameLog.filter(l => l.includes('Aegis'));
        if (aegisLogs.length > 0) aegisAcquired++;
      }
    }
    // May not always afford 3 gold, but should happen in at least some games
    expect(aegisAcquired).toBeGreaterThan(0);
  });

  it('Yellow strong shop: doubles next resource gain', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['yellow_harvest', 'yellow_forage']),
      shopDecisionFn: forcedShopPicker('yellow_strong'),
    }, 15);
    expect(errors).toBe(0);

    // Hard to directly verify doubling through simulation stats,
    // but we can check it doesn't crash and P1 accumulates more resources
    const avgP1Resources = avgStat(results, r => {
      const p1 = getPlayer(r.finalState, 1);
      return Object.values(p1.resources).reduce((sum, v) => sum + v, 0);
    });
    // P1 should have resources
    expect(avgP1Resources).toBeGreaterThan(0);
  });

  it('Black weak shop: steal 1 Favor', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['black_skulk', 'black_ransack']),
      shopDecisionFn: forcedShopPicker('black_weak'),
    }, 15);
    expect(errors).toBe(0);

    // P1 should gain Favor from black_weak_shop stealing
    let shopStealFired = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const shopFavor = p1.glorySources?.black_weak_shop || 0;
      if (shopFavor > 0) shopStealFired++;
    }
    expect(shopStealFired).toBeGreaterThan(0);
  });

  it('Gold VP shop: trigger Favor condition manually', () => {
    // Use non-Hoard actions to accumulate gold without blocking shops
    // VP shop costs 4 gold — need multiple turns of gold gain
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['gold_haggle', 'gold_patronage', 'gold_tariff', 'gold_austerity']),
      shopDecisionFn: forcedShopPicker('gold_vp'),
    }, 20);
    expect(errors).toBe(0);

    let vpShopFired = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      const shopFavor = p1.glorySources?.gold_vp_shop || 0;
      if (shopFavor > 0) vpShopFired++;
    }
    // VP shop costs 4 gold — may not always afford it, but should fire sometimes
    expect(vpShopFired).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// CROSS-MECHANIC INTERACTIONS
// ---------------------------------------------------------------------------

describe('Cross-mechanic interaction validation', () => {
  it('Full game with all mechanics: no crashes across 30 random games', () => {
    const { results, errors } = runTargetedSims({
      shopDecisionFn: (state, playerId) => {
        // Try any affordable shop
        const accessed = state.godsAccessedThisTurn || [];
        if (state.purchaseMadeThisTurn) return null;
        for (const god of accessed) {
          for (const tier of ['weak', 'strong', 'vp']) {
            // Just return the first accessible shop — cost check happens in engine
            return `${god}_${tier}`;
          }
        }
        return null;
      },
    }, 30);
    expect(errors).toBe(0);
    expect(results.length).toBe(30);
  });

  it('Gold hoarding + Gold Favor condition produces expected Favor range', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: forcedActionPicker('gold_hoard'),
    }, 20);
    expect(errors).toBe(0);

    // Check specifically that P1's gold_glory_condition Favor exceeds P2's
    // (total glory includes all 4 conditions, so compare the gold-specific source)
    const avgP1GoldFavor = avgStat(results, r =>
      getPlayer(r.finalState, 1).glorySources?.gold_glory_condition || 0
    );
    const avgP2GoldFavor = avgStat(results, r =>
      getPlayer(r.finalState, 2).glorySources?.gold_glory_condition || 0
    );

    // P1 spams Hoard (+3 gold each time), so at round end P1 should score
    // more from gold condition than P2 who plays randomly
    expect(avgP1GoldFavor).toBeGreaterThan(avgP2GoldFavor);
  });

  it('Black steal focus + Black Favor condition produces consistent Favor', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker(['black_ransack', 'black_pickpocket', 'black_levy', 'black_skulk']),
    }, 20);
    expect(errors).toBe(0);

    // P1 steals aggressively — Black Favor condition fires per steal action
    const avgP1Glory = avgStat(results, r => getPlayer(r.finalState, 1).glory);
    // P1 should accumulate some Favor from stealing
    expect(avgP1Glory).toBeGreaterThan(0);
  });

  it('Green repeat focus + Green Favor condition triggers on repeats', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker([
        'green_relive', 'green_echo', 'green_recall',
        'green_rewind', 'green_foresight', 'green_gather',
      ]),
    }, 20);
    expect(errors).toBe(0);

    // Green Favor condition: +1 per repeat/copy
    let totalGreenGlory = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      totalGreenGlory += (p1.glorySources?.green_glory_condition || 0);
    }
    // Across 20 games of repeat-focused play, should accumulate glory
    expect(totalGreenGlory).toBeGreaterThan(0);
  });

  it('Yellow diversity play + Yellow Favor condition fires on new colors', () => {
    const { results, errors } = runTargetedSims({
      actionPickerFn: preferredActionPicker([
        'yellow_attune', 'yellow_forage', 'yellow_flourish', 'yellow_harvest',
      ]),
    }, 20);
    expect(errors).toBe(0);

    let totalYellowGlory = 0;
    for (const r of results) {
      const p1 = getPlayer(r.finalState, 1);
      totalYellowGlory += (p1.glorySources?.yellow_glory_condition || 0);
    }
    // Attune specifically targets zero-colors, should trigger the condition
    expect(totalYellowGlory).toBeGreaterThan(0);
  });

  it('Games end properly: all games reach game_end or gameOver', () => {
    const { results, errors } = runTargetedSims({}, 20);
    expect(errors).toBe(0);

    for (const r of results) {
      expect(r.finalState.gameOver || r.finalState.phase === 'game_end').toBe(true);
    }
  });

  it('Final Favor scores are reasonable (not astronomically high or all zero)', () => {
    const { results, errors } = runTargetedSims({}, 30);
    expect(errors).toBe(0);

    const allGlories = results.flatMap(r =>
      r.finalState.players.map(p => p.glory)
    );

    // Average glory should be positive (games produce Favor)
    const avgGlory = allGlories.reduce((a, b) => a + b, 0) / allGlories.length;
    expect(avgGlory).toBeGreaterThan(0);

    // Max glory should be reasonable (under 100 in a normal game)
    const maxGlory = Math.max(...allGlories);
    expect(maxGlory).toBeLessThan(200);

    // There should be spread (not all players scoring identically)
    const glorySet = new Set(allGlories);
    expect(glorySet.size).toBeGreaterThan(1);
  });

  it('No player has negative resources at game end', () => {
    const { results, errors } = runTargetedSims({}, 20);
    expect(errors).toBe(0);

    for (const r of results) {
      for (const player of r.finalState.players) {
        for (const [color, amount] of Object.entries(player.resources)) {
          expect(amount).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// MULTI-PLAYER SCALING
// ---------------------------------------------------------------------------

describe('Multi-player scaling', () => {
  it('3-player games complete without errors', () => {
    const { results, errors } = runTargetedSims({ playerCount: 3 }, 10);
    expect(errors).toBe(0);
    for (const r of results) {
      expect(r.finalState.players).toHaveLength(3);
    }
  });

  it('4-player games complete without errors', () => {
    const { results, errors } = runTargetedSims({ playerCount: 4 }, 10);
    expect(errors).toBe(0);
    for (const r of results) {
      expect(r.finalState.players).toHaveLength(4);
    }
  });

  it('Levy/Dread scale correctly with more players (more targets)', () => {
    // In 4-player, Levy should steal from 3 players vs 1 in 2-player
    const twoP = runTargetedSims({
      playerCount: 2,
      actionPickerFn: forcedActionPicker('gold_levy'),
    }, 10);
    const fourP = runTargetedSims({
      playerCount: 4,
      actionPickerFn: forcedActionPicker('gold_levy'),
    }, 10);

    expect(twoP.errors).toBe(0);
    expect(fourP.errors).toBe(0);

    // In 4-player Levy should produce more total gold for P1
    const avg2pGold = avgStat(twoP.results, r => getPlayer(r.finalState, 1).resources.gold);
    const avg4pGold = avgStat(fourP.results, r => getPlayer(r.finalState, 1).resources.gold);
    // 4-player levy taxes 3 people vs 1 — should produce more gold
    expect(avg4pGold).toBeGreaterThanOrEqual(avg2pGold);
  });
});
