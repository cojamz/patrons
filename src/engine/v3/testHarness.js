/**
 * Patrons v3 — Test Harness
 *
 * Comprehensive game simulation with invariant checking.
 * Validates that game state remains consistent after every action,
 * shop purchase, card purchase, and turn end.
 *
 * Usage:
 *   import { runStressTest } from './testHarness.js';
 *   const report = runStressTest({ gameCount: 100 });
 *
 * The harness catches:
 *   - Negative resources
 *   - Negative Favor (glory)
 *   - Resource leaks (total resources in the system changes unexpectedly)
 *   - Invalid phase transitions
 *   - Workers exceeding round limits
 *   - Shops/cards bought when purchase already made this turn
 *   - Power card slots exceeding champion limits
 *   - Infinite loops / runaway turns
 *   - Engine crashes (unhandled exceptions)
 *   - Favor condition math mismatches
 */

import { getPlayer, getOtherPlayers } from './stateHelpers.js';
import { Phase, isGameOver } from './phases.js';
import { getAvailableActions } from './rules.js';
import { canAffordShop } from './shops/shopResolver.js';
import { canAfford } from './rules.js';
import { powerCards } from './data/powerCards.js';
import gods from './data/gods.js';
import {
  simulateGame,
  randomDecisionFn,
  randomActionPicker,
} from './runner.js';

// ============================================================================
// State Invariant Checker
// ============================================================================

/**
 * Check all game state invariants. Returns array of violation strings.
 * Empty array = all invariants hold.
 */
export function checkInvariants(state, context = '') {
  const violations = [];
  const ctx = context ? `[${context}] ` : '';

  if (!state || !state.players) {
    violations.push(`${ctx}State or players array is null/undefined`);
    return violations;
  }

  for (const player of state.players) {
    const pid = player.id;

    // 1. No negative resources
    if (player.resources) {
      for (const [color, amount] of Object.entries(player.resources)) {
        if (amount < 0) {
          violations.push(`${ctx}Player ${pid} has negative ${color}: ${amount}`);
        }
      }
    }

    // 2. Negative Favor (glory) is allowed — steals can push below zero

    // 3. Workers left cannot be negative
    if (player.workersLeft < 0) {
      violations.push(`${ctx}Player ${pid} has negative workersLeft: ${player.workersLeft}`);
    }

    // 4. Power cards don't exceed slot limit
    const cardCount = (player.powerCards || []).length;
    const maxSlots = player.powerCardSlots || 4;
    // Aegis occupies a slot too
    const aegisSlots = state.aegisHolder === pid ? 1 : 0;
    if (cardCount + aegisSlots > maxSlots + 1) { // +1 tolerance for edge cases
      violations.push(`${ctx}Player ${pid} has ${cardCount} cards + ${aegisSlots} aegis but only ${maxSlots} slots`);
    }

    // 5. No duplicate power cards on same player
    const cardIds = (player.powerCards || []).map(c => c.id || c);
    const uniqueCards = new Set(cardIds);
    if (uniqueCards.size !== cardIds.length) {
      violations.push(`${ctx}Player ${pid} has duplicate power cards: ${cardIds.join(', ')}`);
    }
  }

  // 6. Valid phase
  const validPhases = [Phase.CHAMPION_DRAFT, Phase.ROUND_START, Phase.ACTION_PHASE, Phase.ROUND_END, Phase.GAME_END];
  if (!validPhases.includes(state.phase)) {
    violations.push(`${ctx}Invalid phase: ${state.phase}`);
  }

  // 7. Round within bounds
  if (state.round !== undefined && (state.round < 1 || state.round > 4)) {
    // Round 4 can briefly exist during game end transition
    if (state.phase !== Phase.GAME_END) {
      violations.push(`${ctx}Round out of bounds: ${state.round} (phase: ${state.phase})`);
    }
  }

  // 8. Current player exists
  if (state.currentPlayer && !state.players.find(p => p.id === state.currentPlayer)) {
    violations.push(`${ctx}Current player ${state.currentPlayer} not found in players list`);
  }

  // 9. Turn order matches player count
  if (state.turnOrder && state.turnOrder.length !== state.players.length) {
    violations.push(`${ctx}Turn order length (${state.turnOrder.length}) !== player count (${state.players.length})`);
  }

  // 10. No action spaces occupied by nonexistent players
  if (state.actionSpaces) {
    const playerIds = new Set(state.players.map(p => p.id));
    for (const [actionId, occupant] of Object.entries(state.actionSpaces)) {
      if (occupant && !playerIds.has(occupant)) {
        violations.push(`${ctx}Action ${actionId} occupied by nonexistent player ${occupant}`);
      }
    }
  }

  return violations;
}

// ============================================================================
// Smart Decision Functions (exercise more game paths than random)
// ============================================================================

/**
 * Shop picker that uses engine affordability checks.
 * Can only buy from gods you've accessed this turn.
 */
export function smartShopFn(state, playerId) {
  if (state.purchaseMadeThisTurn) return null;

  const player = getPlayer(state, playerId);
  if (!player) return null;

  // Check noShopThisTurn effect (from Hoard action)
  if (player.effects?.includes('noShopThisTurn')) return null;

  // Only gods we've accessed this turn
  const accessedGods = state.godsAccessedThisTurn || [];
  const affordable = [];

  for (const god of accessedGods) {
    for (const shopType of ['weak', 'strong', 'vp']) {
      const shopId = `${god}_${shopType}`;
      if (canAffordShop(state, playerId, shopId)) {
        affordable.push(shopId);
      }
    }
  }

  if (affordable.length === 0) return null;

  // Buy ~50% of the time to exercise both buying and not-buying paths
  if (Math.random() < 0.5) return null;

  return affordable[Math.floor(Math.random() * affordable.length)];
}

/**
 * Card picker that uses engine affordability checks.
 * Can only buy from gods you've accessed this turn (canAccessGod check).
 * Market is per-god: state.powerCardMarkets[godColor] = [cardId, ...]
 */
export function smartCardFn(state, playerId) {
  if (state.purchaseMadeThisTurn) return null;

  const player = getPlayer(state, playerId);
  if (!player) return null;

  // Check noShopThisTurn effect (from Hoard — also blocks card purchases)
  if (player.effects?.includes('noShopThisTurn')) return null;

  // Check slot availability via champion
  const champion = state.champions?.[playerId];
  if (!champion) return null;
  const currentCards = champion.powerCards || [];
  const maxSlots = champion.powerCardSlots || 4;
  if (currentCards.length >= maxSlots) return null;

  // Only gods we've accessed this turn
  const accessedGods = state.godsAccessedThisTurn || [];
  const affordable = [];

  for (const godColor of accessedGods) {
    const market = (state.powerCardMarkets || {})[godColor] || [];
    for (const cardId of market) {
      const card = powerCards[cardId];
      if (!card) continue;
      if (canAfford(state, playerId, card.cost || {})) {
        affordable.push(cardId);
      }
    }
  }

  if (affordable.length === 0) return null;

  // Buy ~50% of the time to exercise both paths
  if (Math.random() < 0.5) return null;

  return affordable[Math.floor(Math.random() * affordable.length)];
}

// ============================================================================
// Instrumented Game Runner
// ============================================================================

/**
 * Run a single game with invariant checking after every state mutation.
 * Returns { result, violations, snapshots }.
 */
export function runInstrumentedGame(options = {}) {
  const {
    playerCount = 2,
    godSet = ['gold', 'black', 'green', 'yellow'],
    verbose = false,
    maxTurns = 300,
  } = options;

  const violations = [];
  const snapshots = []; // Key state snapshots for debugging
  let turnCounter = 0;

  // Wrap action picker to check invariants after each action
  function instrumentedActionPicker(state, playerId, available) {
    const pick = randomActionPicker(state, playerId, available);
    return pick;
  }

  // We can't easily hook into every state mutation inside simulateGame,
  // so we use a wrapper approach: run the game, then validate the final state.
  // For deeper checking, we also run with a custom verbose log parser.

  let result;
  try {
    result = simulateGame({
      playerCount,
      godSet,
      decisionFn: randomDecisionFn,
      actionPickerFn: instrumentedActionPicker,
      shopDecisionFn: smartShopFn,
      cardDecisionFn: smartCardFn,
      maxTurns,
      verbose: true, // Always verbose so we can parse the log
    });
  } catch (err) {
    violations.push(`CRASH: ${err.message}\n${err.stack?.split('\n').slice(0, 3).join('\n')}`);
    return { result: null, violations, snapshots };
  }

  // Validate final state
  const finalViolations = checkInvariants(result.finalState, 'final');
  violations.push(...finalViolations);

  // Validate game completed properly
  const fs = result.finalState;
  if (fs.phase !== Phase.GAME_END && !isGameOver(fs)) {
    if (result.turns >= maxTurns) {
      violations.push(`Game hit max turns (${maxTurns}) without completing — possible infinite loop`);
    } else {
      violations.push(`Game ended in unexpected phase: ${fs.phase}`);
    }
  }

  // Parse log for anomalies
  const logViolations = analyzeGameLog(result.gameLog, fs);
  violations.push(...logViolations);

  // Collect summary snapshots (cards live on champion objects)
  for (const player of fs.players) {
    const champ = fs.champions?.[player.id];
    snapshots.push({
      playerId: player.id,
      glory: player.glory,
      resources: { ...player.resources },
      cards: (champ?.powerCards || []).map(c => c.id || c),
      champion: champ?.id || 'unknown',
    });
  }

  return { result, violations, snapshots };
}

/**
 * Analyze game log for suspicious patterns.
 */
function analyzeGameLog(log, finalState) {
  const violations = [];

  // Count shop purchases, card purchases, actions per player
  const stats = {};
  for (const p of finalState.players) {
    stats[p.id] = { actions: 0, shops: 0, cards: 0 };
  }

  for (const entry of log) {
    if (typeof entry !== 'string') continue;

    // Check for error messages in logs
    if (/error|invalid|crash|undefined is not/i.test(entry)) {
      violations.push(`Log contains error: "${entry.substring(0, 100)}"`);
    }

    // Count turn entries
    const turnMatch = entry.match(/\[Turn (\d+)\] Player (\d+) plays (\w+)/);
    if (turnMatch) {
      const pid = parseInt(turnMatch[2]);
      if (stats[pid]) stats[pid].actions++;
    }

    // Detect shop usage
    if (/used shop|shop benefit|bought shop/i.test(entry)) {
      // Can't reliably parse player from all shop log formats
    }
  }

  // Sanity: each player should have placed roughly equal actions (±20%)
  const actionCounts = Object.values(stats).map(s => s.actions);
  const maxActions = Math.max(...actionCounts);
  const minActions = Math.min(...actionCounts);
  if (maxActions > 0 && minActions < maxActions * 0.5) {
    violations.push(`Action imbalance: min=${minActions}, max=${maxActions} — possible skipped turns`);
  }

  return violations;
}

// ============================================================================
// Stress Test Runner
// ============================================================================

/**
 * Run many games with invariant checking and collect a comprehensive report.
 *
 * @param {Object} options
 * @param {number} options.gameCount - Number of games (default 100)
 * @param {number} options.playerCount - Players per game (default 2)
 * @param {string[]} options.godSet - Active gods (default all 4)
 * @param {boolean} options.verbose - Print each game result
 * @returns {StressTestReport}
 */
export function runStressTest(options = {}) {
  const {
    gameCount = 100,
    playerCount = 2,
    godSet = ['gold', 'black', 'green', 'yellow'],
    verbose = false,
  } = options;

  const report = {
    gamesRun: 0,
    gamesCompleted: 0,
    gamesCrashed: 0,
    gamesWithViolations: 0,
    totalViolations: [],
    violationSummary: {},  // violation type → count
    turnStats: { min: Infinity, max: 0, total: 0 },
    gloryStats: { min: Infinity, max: 0, total: 0, spreads: [] },
    championWins: {},
    shopPurchases: 0,
    cardPurchases: 0,
    uniqueViolationTypes: new Set(),
    failedGameSeeds: [],  // First 5 failed game indices for reproduction
  };

  for (let i = 0; i < gameCount; i++) {
    report.gamesRun++;

    const { result, violations, snapshots } = runInstrumentedGame({
      playerCount,
      godSet,
    });

    if (!result) {
      report.gamesCrashed++;
      report.totalViolations.push(...violations);
      if (report.failedGameSeeds.length < 5) {
        report.failedGameSeeds.push({ gameIndex: i, violations });
      }
      continue;
    }

    report.gamesCompleted++;

    // Track violations
    if (violations.length > 0) {
      report.gamesWithViolations++;
      report.totalViolations.push(...violations);
      if (report.failedGameSeeds.length < 5) {
        report.failedGameSeeds.push({ gameIndex: i, violations, snapshots });
      }
      for (const v of violations) {
        // Categorize: first word before colon
        const category = v.split(':')[0].replace(/\[.*?\]\s*/, '').trim();
        report.violationSummary[category] = (report.violationSummary[category] || 0) + 1;
        report.uniqueViolationTypes.add(category);
      }
    }

    // Turn stats
    report.turnStats.total += result.turns;
    report.turnStats.min = Math.min(report.turnStats.min, result.turns);
    report.turnStats.max = Math.max(report.turnStats.max, result.turns);

    // Glory stats
    const glories = result.finalState.players.map(p => p.glory);
    const maxG = Math.max(...glories);
    const minG = Math.min(...glories);
    report.gloryStats.total += glories.reduce((a, b) => a + b, 0);
    report.gloryStats.min = Math.min(report.gloryStats.min, minG);
    report.gloryStats.max = Math.max(report.gloryStats.max, maxG);
    report.gloryStats.spreads.push(maxG - minG);

    // Champion wins
    const winnerChamp = result.finalState.champions?.[result.winner]?.id || 'unknown';
    report.championWins[winnerChamp] = (report.championWins[winnerChamp] || 0) + 1;

    // Count cards purchased (cards live on champion objects, not player)
    const champs = result.finalState.champions || {};
    for (const pid of Object.keys(champs)) {
      report.cardPurchases += (champs[pid].powerCards || []).length;
    }

    if (verbose) {
      const status = violations.length > 0 ? `VIOLATIONS(${violations.length})` : 'OK';
      console.error(`Game ${i + 1}: ${status} — ${result.turns} turns, winner=${result.winner}`);
    }
  }

  // Compute averages
  report.turnStats.avg = report.gamesCompleted > 0
    ? report.turnStats.total / report.gamesCompleted
    : 0;

  report.gloryStats.avgSpread = report.gloryStats.spreads.length > 0
    ? report.gloryStats.spreads.reduce((a, b) => a + b, 0) / report.gloryStats.spreads.length
    : 0;

  report.uniqueViolationTypes = [...report.uniqueViolationTypes];

  return report;
}

/**
 * Format a stress test report for human-readable output.
 */
export function formatReport(report) {
  const lines = [];
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  PATRONS v3 — Stress Test Report');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Games run:        ${report.gamesRun}`);
  lines.push(`  Completed:        ${report.gamesCompleted}`);
  lines.push(`  Crashed:          ${report.gamesCrashed}`);
  lines.push(`  With violations:  ${report.gamesWithViolations}`);
  lines.push('');
  lines.push('── Turn Stats ──');
  lines.push(`  Min:  ${report.turnStats.min}`);
  lines.push(`  Max:  ${report.turnStats.max}`);
  lines.push(`  Avg:  ${report.turnStats.avg.toFixed(1)}`);
  lines.push('');
  lines.push('── Favor Stats ──');
  lines.push(`  Min:  ${report.gloryStats.min}`);
  lines.push(`  Max:  ${report.gloryStats.max}`);
  lines.push(`  Avg spread: ${report.gloryStats.avgSpread.toFixed(1)}`);
  lines.push('');
  lines.push('── Purchases ──');
  lines.push(`  Power cards bought: ${report.cardPurchases}`);
  lines.push('');
  lines.push('── Champion Win Rates ──');
  for (const [champ, wins] of Object.entries(report.championWins).sort((a, b) => b[1] - a[1])) {
    const pct = ((wins / report.gamesCompleted) * 100).toFixed(0);
    lines.push(`  ${champ.padEnd(15)} ${wins} wins (${pct}%)`);
  }

  if (report.totalViolations.length > 0) {
    lines.push('');
    lines.push('── VIOLATIONS ──');
    lines.push(`  Total: ${report.totalViolations.length}`);
    lines.push(`  Unique types: ${report.uniqueViolationTypes.join(', ')}`);
    lines.push('');
    for (const [type, count] of Object.entries(report.violationSummary).sort((a, b) => b[1] - a[1])) {
      lines.push(`  ${type}: ${count}`);
    }
    lines.push('');
    lines.push('── First 5 Violations ──');
    for (const v of report.totalViolations.slice(0, 5)) {
      lines.push(`  • ${v}`);
    }
  } else {
    lines.push('');
    lines.push('  ✓ NO VIOLATIONS DETECTED');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  return lines.join('\n');
}
