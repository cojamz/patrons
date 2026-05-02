#!/usr/bin/env node
/**
 * Patrons v3 — Agency Test (Fixed)
 *
 * Tests whether skill (MCTS) beats randomness.
 * Player IDs are numeric (1, 2), not "player_0"/"player_1".
 */

import { simulateGame, randomDecisionFn, randomActionPicker } from '../src/engine/v3/runner.js';
import { createMCTSPlayer, MCTS_PRESETS } from '../src/engine/v3/balanceAI.js';
import { getPlayer } from '../src/engine/v3/stateHelpers.js';

const GAME_COUNT = 50;
const mctsPlayer = createMCTSPlayer(MCTS_PRESETS.fast);

const results = { mctsWins: 0, randomWins: 0, mctsGlory: [], randomGlory: [], errors: 0 };

console.log(`Running ${GAME_COUNT} games: MCTS vs Random...`);

for (let i = 0; i < GAME_COUNT; i++) {
  try {
    // Alternate who goes first to control for turn order
    const mctsIsP1 = i % 2 === 0;
    const mctsId = mctsIsP1 ? 1 : 2;
    const randomId = mctsIsP1 ? 2 : 1;

    const result = simulateGame({
      playerCount: 2,
      playerNames: mctsIsP1 ? ['MCTS', 'Random'] : ['Random', 'MCTS'],
      godSet: ['gold', 'black', 'green', 'yellow'],
      decisionFn: (state, playerId, pd) => {
        return playerId === mctsId
          ? mctsPlayer.decisionFn(state, playerId, pd)
          : randomDecisionFn(state, playerId, pd);
      },
      actionPickerFn: (state, playerId, actions) => {
        return playerId === mctsId
          ? mctsPlayer.actionPicker(state, playerId, actions)
          : randomActionPicker(state, playerId, actions);
      },
      shopDecisionFn: (state, playerId) => {
        return playerId === mctsId
          ? mctsPlayer.shopDecision(state, playerId)
          : null;
      },
      cardDecisionFn: (state, playerId) => {
        return playerId === mctsId
          ? mctsPlayer.cardDecision(state, playerId)
          : null;
      },
      maxTurns: 300,
    });

    const mctsGlory = getPlayer(result.finalState, mctsId)?.glory || 0;
    const randomGlory = getPlayer(result.finalState, randomId)?.glory || 0;

    results.mctsGlory.push(mctsGlory);
    results.randomGlory.push(randomGlory);

    if (result.winner === mctsId) results.mctsWins++;
    else results.randomWins++;

    if ((i + 1) % 10 === 0) {
      console.log(`  [${i + 1}/${GAME_COUNT}] MCTS: ${results.mctsWins} wins, Random: ${results.randomWins} wins`);
    }
  } catch (e) {
    results.errors++;
    console.error(`  Game ${i + 1} error: ${e.message}`);
  }
}

const total = GAME_COUNT - results.errors;
const avgMCTS = results.mctsGlory.reduce((a, b) => a + b, 0) / total;
const avgRandom = results.randomGlory.reduce((a, b) => a + b, 0) / total;
const gaps = results.mctsGlory.map((m, i) => m - results.randomGlory[i]);
const avgGap = gaps.reduce((a, b) => a + b, 0) / total;
const sorted = [...gaps].sort((a, b) => a - b);
const medGap = sorted[Math.floor(sorted.length / 2)];

console.log('\n══════════════════════════════════════════════');
console.log('  AGENCY TEST RESULTS');
console.log('══════════════════════════════════════════════');
console.log(`  Games: ${total} (${results.errors} errors)`);
console.log(`  MCTS wins:   ${results.mctsWins} (${(results.mctsWins / total * 100).toFixed(1)}%)`);
console.log(`  Random wins: ${results.randomWins} (${(results.randomWins / total * 100).toFixed(1)}%)`);
console.log(`  `);
console.log(`  Avg MCTS glory:   ${avgMCTS.toFixed(1)}`);
console.log(`  Avg Random glory: ${avgRandom.toFixed(1)}`);
console.log(`  Glory gap:        ${avgGap.toFixed(1)} avg, ${medGap.toFixed(1)} median`);
console.log(`  `);

// Also show the glory distributions
const mctsMin = Math.min(...results.mctsGlory);
const mctsMax = Math.max(...results.mctsGlory);
const randMin = Math.min(...results.randomGlory);
const randMax = Math.max(...results.randomGlory);
console.log(`  MCTS glory range:   ${mctsMin} - ${mctsMax}`);
console.log(`  Random glory range: ${randMin} - ${randMax}`);

const winRate = results.mctsWins / total;
console.log(`  `);
if (winRate > 0.75) {
  console.log(`  ✓ STRONG AGENCY: Skill clearly matters (${(winRate * 100).toFixed(1)}%)`);
} else if (winRate > 0.55) {
  console.log(`  ~ MODERATE AGENCY: Skill helps but luck plays a role (${(winRate * 100).toFixed(1)}%)`);
} else if (winRate > 0.45) {
  console.log(`  ✗ WEAK AGENCY: Decisions barely matter (${(winRate * 100).toFixed(1)}%)`);
} else {
  console.log(`  ✗ INVERTED: Random beats MCTS?! Something is wrong. (${(winRate * 100).toFixed(1)}%)`);
}

// Show per-game results for the first 10
console.log(`\n  Sample games (first 10):`);
for (let i = 0; i < Math.min(10, total); i++) {
  const m = results.mctsGlory[i];
  const r = results.randomGlory[i];
  const who = m > r ? 'MCTS' : m < r ? 'RAND' : 'TIE ';
  console.log(`    Game ${(i + 1).toString().padStart(2)}: MCTS=${m.toString().padStart(3)} Random=${r.toString().padStart(3)} gap=${(m - r).toString().padStart(4)} → ${who}`);
}
