#!/usr/bin/env node
/**
 * Patrons v3 — Balance Testing CLI
 *
 * Runs simulated games with heuristic AI and reports balance metrics.
 *
 * Usage:
 *   node src/engine/v3/balance-test.mjs [--games=500] [--players=3] [--verbose]
 *   npm run balance
 *   npm run balance -- --games=1000 --players=4 --verbose
 */

import { simulateGame } from './runner.js';
import { createMCTSPlayer, MCTS_PRESETS } from './balanceAI.js';
import { powerCards } from './data/powerCards.js';

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultVal;
};

const GAME_COUNT = parseInt(getArg('games', '500'));
const PLAYER_COUNT = parseInt(getArg('players', '3'));
const VERBOSE = args.includes('--verbose');
const STRENGTH = getArg('strength', 'fast'); // fast|standard|strong

// Create MCTS player with chosen strength
const preset = MCTS_PRESETS[STRENGTH] || MCTS_PRESETS.fast;
const mctsPlayer = createMCTSPlayer(preset);

// ---------------------------------------------------------------------------
// Stats Accumulators
// ---------------------------------------------------------------------------

const stats = {
  championWins: {},
  championGlory: {},
  championGames: {},
  seatWins: {},
  glorySources: {},
  cardPurchases: {},
  totalGlorySpread: 0,
  completedGames: 0,
  errors: 0,
  totalTurns: 0,
  // Gold economy tracking
  goldPerRound: { 1: 0, 2: 0, 3: 0 },
  goldRoundSamples: { 1: 0, 2: 0, 3: 0 },
  avgFinalGold: 0,
  totalFinalGold: 0,
  goldActionCounts: {},
};

// ---------------------------------------------------------------------------
// Run Simulations
// ---------------------------------------------------------------------------

console.log(`\nRunning ${GAME_COUNT} games with ${PLAYER_COUNT} players (MCTS ${STRENGTH})...\n`);
const startTime = Date.now();

for (let i = 0; i < GAME_COUNT; i++) {
  try {
    const result = simulateGame({
      playerCount: PLAYER_COUNT,
      decisionFn: mctsPlayer.decisionFn,
      actionPickerFn: mctsPlayer.actionPicker,
      shopDecisionFn: mctsPlayer.shopDecision,
      cardDecisionFn: mctsPlayer.cardDecision,
      verbose: VERBOSE,
    });

    const { finalState, winner, turns } = result;
    stats.completedGames++;
    stats.totalTurns += turns;

    // Track champion wins + glory per player
    for (const player of finalState.players) {
      const champId = finalState.champions?.[player.id]?.id || 'unknown';

      stats.championGames[champId] = (stats.championGames[champId] || 0) + 1;
      stats.championGlory[champId] = (stats.championGlory[champId] || 0) + (player.glory || 0);

      if (player.id === winner) {
        stats.championWins[champId] = (stats.championWins[champId] || 0) + 1;
      }

      // Track glory sources
      const sources = player.glorySources || {};
      for (const [source, amount] of Object.entries(sources)) {
        if (amount > 0) {
          stats.glorySources[source] = (stats.glorySources[source] || 0) + amount;
        }
      }

      // Track cards purchased
      const cards = finalState.champions?.[player.id]?.powerCards || [];
      for (const cardId of cards) {
        stats.cardPurchases[cardId] = (stats.cardPurchases[cardId] || 0) + 1;
      }

      // Track final gold
      stats.totalFinalGold += (player.resources?.gold || 0);
    }

    // Track action usage (what actions were placed)
    for (const entry of (finalState.roundActions || [])) {
      const aid = entry.actionId;
      stats.goldActionCounts[aid] = (stats.goldActionCounts[aid] || 0) + 1;
    }

    // Track seat position wins (based on initial turn order index)
    const playerIndex = finalState.players.findIndex(p => p.id === winner);
    const seatLabel = `P${playerIndex + 1}`;
    stats.seatWins[seatLabel] = (stats.seatWins[seatLabel] || 0) + 1;

    // Track glory spread (1st - last)
    const glories = finalState.players.map(p => p.glory || 0);
    stats.totalGlorySpread += Math.max(...glories) - Math.min(...glories);

    if (VERBOSE) {
      const winnerGlory = finalState.players.find(p => p.id === winner)?.glory || 0;
      const champId = finalState.champions?.[winner]?.id || '?';
      console.log(`  Game ${i + 1}: Winner=${champId} (${winnerGlory} glory, ${turns} turns)`);
    }
  } catch (e) {
    stats.errors++;
    if (VERBOSE) {
      console.error(`  Game ${i + 1} ERROR: ${e.message}`);
    }
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const avgTurns = stats.completedGames > 0
  ? (stats.totalTurns / stats.completedGames).toFixed(1)
  : 0;

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const SEP = '='.repeat(62);

console.log(`\n${SEP}`);
console.log(`  BALANCE REPORT`);
console.log(`  ${stats.completedGames} games completed, ${stats.errors} errors, ${elapsed}s`);
console.log(`  Avg ${avgTurns} turns/game, ${PLAYER_COUNT} players`);
console.log(`${SEP}\n`);

// --- Champion Win Rates ---
console.log('CHAMPION WIN RATES');
console.log('-'.repeat(50));
const champEntries = Object.entries(stats.championWins)
  .sort((a, b) => b[1] - a[1]);

for (const [champId, wins] of champEntries) {
  const games = stats.championGames[champId] || 1;
  const rate = ((wins / games) * 100).toFixed(1);
  const avgGlory = ((stats.championGlory[champId] || 0) / games).toFixed(1);
  console.log(`  ${champId.padEnd(16)} ${rate.padStart(5)}% win rate  (${String(wins).padStart(3)}/${String(games).padStart(3)} games, avg ${avgGlory} glory)`);
}

// Show champions that never won
const neverWon = Object.keys(stats.championGames)
  .filter(id => !stats.championWins[id]);
if (neverWon.length > 0) {
  for (const champId of neverWon) {
    const games = stats.championGames[champId];
    const avgGlory = ((stats.championGlory[champId] || 0) / games).toFixed(1);
    console.log(`  ${champId.padEnd(16)}   0.0% win rate  (  0/${String(games).padStart(3)} games, avg ${avgGlory} glory)`);
  }
}

// --- Seat Position Win Rates ---
console.log('\nSEAT POSITION WIN RATES');
console.log('-'.repeat(50));
for (let i = 0; i < PLAYER_COUNT; i++) {
  const label = `P${i + 1}`;
  const wins = stats.seatWins[label] || 0;
  const rate = ((wins / stats.completedGames) * 100).toFixed(1);
  const bar = '#'.repeat(Math.round(rate / 2));
  console.log(`  ${label}: ${rate.padStart(5)}% (${String(wins).padStart(4)} wins)  ${bar}`);
}

// --- Glory Source Breakdown ---
console.log('\nGLORY SOURCE BREAKDOWN (top 15)');
console.log('-'.repeat(50));
const sourceEntries = Object.entries(stats.glorySources)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);
for (const [source, total] of sourceEntries) {
  const avg = (total / stats.completedGames).toFixed(1);
  console.log(`  ${source.padEnd(32)} avg ${avg.padStart(5)}/game`);
}

// --- Card Purchase Frequency ---
console.log('\nCARD PURCHASE FREQUENCY');
console.log('-'.repeat(50));
const cardEntries = Object.entries(stats.cardPurchases)
  .sort((a, b) => b[1] - a[1]);
const totalPlayerGames = stats.completedGames * PLAYER_COUNT;

for (const [cardId, count] of cardEntries) {
  const rate = ((count / totalPlayerGames) * 100).toFixed(1);
  const card = powerCards[cardId];
  const name = card?.name || cardId;
  console.log(`  ${name.padEnd(25)} ${String(count).padStart(4)} purchases (${rate.padStart(4)}% of player-games)`);
}

// Find dead cards (in active gods' markets but never purchased)
const activeGods = ['gold', 'black', 'green', 'yellow'];
const allActiveCardIds = Object.keys(powerCards)
  .filter(id => activeGods.includes(powerCards[id]?.god));
const unpurchased = allActiveCardIds.filter(id => !stats.cardPurchases[id]);
if (unpurchased.length > 0) {
  console.log(`\n  DEAD CARDS (never purchased):`);
  for (const id of unpurchased) {
    const card = powerCards[id];
    console.log(`    - ${card?.name || id} (${card?.god || '?'})`);
  }
}

// --- Glory Spread ---
const avgSpread = stats.completedGames > 0
  ? (stats.totalGlorySpread / stats.completedGames).toFixed(1)
  : 0;
console.log(`\nGLORY SPREAD`);
console.log('-'.repeat(50));
console.log(`  Avg gap (1st - last): ${avgSpread} glory`);

// --- Gold Economy ---
const avgFinalGold = stats.completedGames > 0
  ? (stats.totalFinalGold / (stats.completedGames * PLAYER_COUNT)).toFixed(1)
  : 0;
console.log(`\nGOLD ECONOMY`);
console.log('-'.repeat(50));
console.log(`  Avg final gold per player: ${avgFinalGold}`);

// Show gold-related action frequency
const goldActions = Object.entries(stats.goldActionCounts)
  .filter(([id]) => id.startsWith('gold_'))
  .sort((a, b) => b[1] - a[1]);
if (goldActions.length > 0) {
  console.log(`\n  Gold action placements:`);
  for (const [actionId, count] of goldActions) {
    const avg = (count / stats.completedGames).toFixed(1);
    console.log(`    ${actionId.padEnd(30)} avg ${avg.padStart(5)}/game`);
  }
}

// Show ALL action frequency (top 20)
console.log(`\nACTION USAGE (top 20)`);
console.log('-'.repeat(50));
const allActions = Object.entries(stats.goldActionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);
for (const [actionId, count] of allActions) {
  const avg = (count / stats.completedGames).toFixed(1);
  console.log(`  ${actionId.padEnd(30)} avg ${avg.padStart(5)}/game`);
}

console.log(`\n${SEP}\n`);
