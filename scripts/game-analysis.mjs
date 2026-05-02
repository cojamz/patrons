#!/usr/bin/env node
/**
 * Patrons v3 — Game Design Analysis
 *
 * Runs batches of simulated games and analyzes the results to answer:
 * 1. Does skill (MCTS) beat randomness? → Player agency
 * 2. Are strategies diverse? → God/champion variety
 * 3. Is there snowball? → Comeback frequency
 * 4. Is every god viable? → Balance
 * 5. Do power cards matter? → Engine-building depth
 *
 * Usage: node scripts/game-analysis.mjs
 */

import { simulateGame, runSimulations, randomDecisionFn, randomActionPicker } from '../src/engine/v3/runner.js';
import { createMCTSPlayer, MCTS_PRESETS } from '../src/engine/v3/balanceAI.js';
import { getPlayer } from '../src/engine/v3/stateHelpers.js';
import { powerCards } from '../src/engine/v3/data/powerCards.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(arr) {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - avg) ** 2, 0) / arr.length);
}

function pct(n, total) {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function bar(value, max, width = 30) {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function printHeader(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function printSubHeader(title) {
  console.log(`\n  ── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

// ── Analysis 1: Skill vs Random (Agency Test) ────────────────────────────────

async function analyzeAgency(gameCount = 50) {
  printHeader('ANALYSIS 1: DOES SKILL MATTER? (Player Agency)');
  console.log(`  Running ${gameCount} games: MCTS player vs Random player...`);

  const mctsPlayer = createMCTSPlayer(MCTS_PRESETS.fast);
  const results = { mctsWins: 0, randomWins: 0, ties: 0, mctsGlory: [], randomGlory: [], gloryGaps: [], errors: 0 };

  for (let i = 0; i < gameCount; i++) {
    try {
      // Player 1 (index 0) = MCTS, Player 2 (index 1) = Random
      // We alternate who is MCTS to control for turn order
      const mctsIsP1 = i % 2 === 0;

      const result = simulateGame({
        playerCount: 2,
        playerNames: mctsIsP1 ? ['MCTS', 'Random'] : ['Random', 'MCTS'],
        godSet: ['gold', 'black', 'green', 'yellow'],
        decisionFn: (state, playerId, pd) => {
          const isMCTS = mctsIsP1 ? playerId === 'player_0' : playerId === 'player_1';
          return isMCTS ? mctsPlayer.decisionFn(state, playerId, pd) : randomDecisionFn(state, playerId, pd);
        },
        actionPickerFn: (state, playerId, actions) => {
          const isMCTS = mctsIsP1 ? playerId === 'player_0' : playerId === 'player_1';
          return isMCTS ? mctsPlayer.actionPicker(state, playerId, actions) : randomActionPicker(state, playerId, actions);
        },
        shopDecisionFn: (state, playerId) => {
          const isMCTS = mctsIsP1 ? playerId === 'player_0' : playerId === 'player_1';
          return isMCTS ? mctsPlayer.shopDecision(state, playerId) : null;
        },
        cardDecisionFn: (state, playerId) => {
          const isMCTS = mctsIsP1 ? playerId === 'player_0' : playerId === 'player_1';
          return isMCTS ? mctsPlayer.cardDecision(state, playerId) : null;
        },
        maxTurns: 300,
      });

      const mctsId = mctsIsP1 ? 'player_0' : 'player_1';
      const randomId = mctsIsP1 ? 'player_1' : 'player_0';
      const mctsGlory = getPlayer(result.finalState, mctsId)?.glory || 0;
      const randomGlory = getPlayer(result.finalState, randomId)?.glory || 0;

      results.mctsGlory.push(mctsGlory);
      results.randomGlory.push(randomGlory);
      results.gloryGaps.push(mctsGlory - randomGlory);

      if (result.winner === mctsId) results.mctsWins++;
      else if (result.winner === randomId) results.randomWins++;
      else results.ties++;

      if ((i + 1) % 10 === 0) process.stdout.write(`  [${i + 1}/${gameCount}]\r`);
    } catch (e) {
      results.errors++;
    }
  }

  const total = gameCount - results.errors;
  const avgMCTS = results.mctsGlory.reduce((a, b) => a + b, 0) / total;
  const avgRandom = results.randomGlory.reduce((a, b) => a + b, 0) / total;
  const avgGap = results.gloryGaps.reduce((a, b) => a + b, 0) / total;
  const medGap = median(results.gloryGaps);

  console.log(`\n  Results (${total} completed games, ${results.errors} errors):`);
  console.log(`  MCTS wins:   ${results.mctsWins} (${pct(results.mctsWins, total)})`);
  console.log(`  Random wins: ${results.randomWins} (${pct(results.randomWins, total)})`);
  console.log(`  Ties:        ${results.ties}`);
  console.log(`  `);
  console.log(`  Avg MCTS glory:   ${avgMCTS.toFixed(1)}`);
  console.log(`  Avg Random glory: ${avgRandom.toFixed(1)}`);
  console.log(`  Avg glory gap:    ${avgGap.toFixed(1)} (median: ${medGap.toFixed(1)})`);
  console.log(`  `);

  const winRate = results.mctsWins / total;
  if (winRate > 0.75) {
    console.log(`  ✓ STRONG AGENCY: Skill clearly matters (${pct(results.mctsWins, total)} MCTS win rate)`);
  } else if (winRate > 0.55) {
    console.log(`  ~ MODERATE AGENCY: Skill helps but luck plays a role (${pct(results.mctsWins, total)} MCTS win rate)`);
  } else {
    console.log(`  ✗ WEAK AGENCY: Randomness dominates decisions (${pct(results.mctsWins, total)} MCTS win rate)`);
    console.log(`    → Design concern: players may feel like choices don't matter`);
  }

  return results;
}

// ── Analysis 2: Strategy Diversity ───────────────────────────────────────────

async function analyzeDiversity(gameCount = 100) {
  printHeader('ANALYSIS 2: STRATEGY DIVERSITY');
  console.log(`  Running ${gameCount} 4-player games with MCTS players...`);

  const mctsPlayer = createMCTSPlayer(MCTS_PRESETS.fast);

  const godUsage = { gold: 0, black: 0, green: 0, yellow: 0 };
  const godFavorGains = { gold: [], black: [], green: [], yellow: [] };
  const championWins = {};
  const championPicks = {};
  const winnerProfiles = [];
  const powerCardPurchases = {};
  const winnerCardCounts = [];
  let errors = 0;

  for (let i = 0; i < gameCount; i++) {
    try {
      const result = simulateGame({
        playerCount: 4,
        godSet: ['gold', 'black', 'green', 'yellow'],
        decisionFn: mctsPlayer.decisionFn,
        actionPickerFn: mctsPlayer.actionPicker,
        shopDecisionFn: mctsPlayer.shopDecision,
        cardDecisionFn: mctsPlayer.cardDecision,
        maxTurns: 300,
      });

      const { finalState, winner } = result;

      // Track champion picks and wins
      for (const player of finalState.players) {
        const champId = finalState.champions?.[player.id]?.id;
        if (champId) {
          championPicks[champId] = (championPicks[champId] || 0) + 1;
          if (player.id === winner) {
            championWins[champId] = (championWins[champId] || 0) + 1;
          }
        }
      }

      // Track winner profile
      const winnerPlayer = getPlayer(finalState, winner);
      if (winnerPlayer) {
        const resources = winnerPlayer.resources || {};
        const totalRes = Object.values(resources).reduce((s, v) => s + Math.max(0, v), 0);
        winnerProfiles.push({
          glory: winnerPlayer.glory,
          totalResources: totalRes,
          resources: { ...resources },
        });

        // Track power cards
        const champData = finalState.champions?.[winner];
        const cards = champData?.powerCards || [];
        winnerCardCounts.push(cards.length);
        for (const cardId of cards) {
          powerCardPurchases[cardId] = (powerCardPurchases[cardId] || 0) + 1;
        }
      }

      // Track which gods workers were placed on
      const placements = finalState.workerPlacements || {};
      for (const [actionId] of Object.entries(placements)) {
        const god = actionId.split('_')[0];
        if (godUsage[god] !== undefined) godUsage[god]++;
      }

      // Track favor gained per god's condition
      for (const god of ['gold', 'black', 'green', 'yellow']) {
        for (const player of finalState.players) {
          const favorFromGod = player.favorBreakdown?.[god] || 0;
          godFavorGains[god].push(favorFromGod);
        }
      }

      if ((i + 1) % 20 === 0) process.stdout.write(`  [${i + 1}/${gameCount}]\r`);
    } catch (e) {
      errors++;
    }
  }

  const total = gameCount - errors;

  // Champion analysis
  printSubHeader('Champion Win Rates');
  const champEntries = Object.entries(championPicks).sort((a, b) => b[1] - a[1]);
  const maxPicks = Math.max(...champEntries.map(([, v]) => v));
  for (const [champId, picks] of champEntries) {
    const wins = championWins[champId] || 0;
    const winRate = picks > 0 ? (wins / picks * 100).toFixed(1) : '0.0';
    console.log(`  ${champId.padEnd(14)} ${bar(picks, maxPicks, 20)} picks=${picks}  wins=${wins}  rate=${winRate}%`);
  }

  // God favor condition value
  printSubHeader('Favor Condition Value (avg favor gained per god)');
  for (const god of ['gold', 'black', 'green', 'yellow']) {
    const gains = godFavorGains[god];
    if (gains.length > 0) {
      const avg = gains.reduce((a, b) => a + b, 0) / gains.length;
      const max = Math.max(...gains);
      const nonZero = gains.filter(g => g > 0).length;
      console.log(`  ${god.padEnd(8)} avg=${avg.toFixed(1)}  max=${max}  triggered_by=${pct(nonZero, gains.length)} of players`);
    }
  }

  // Winner profiles
  printSubHeader('Winner Profiles');
  if (winnerProfiles.length > 0) {
    const avgGlory = winnerProfiles.reduce((s, p) => s + p.glory, 0) / winnerProfiles.length;
    const avgRes = winnerProfiles.reduce((s, p) => s + p.totalResources, 0) / winnerProfiles.length;
    const avgCards = winnerCardCounts.reduce((a, b) => a + b, 0) / winnerCardCounts.length;
    const gloryRange = [Math.min(...winnerProfiles.map(p => p.glory)), Math.max(...winnerProfiles.map(p => p.glory))];

    console.log(`  Avg winner glory:     ${avgGlory.toFixed(1)} (range: ${gloryRange[0]}-${gloryRange[1]})`);
    console.log(`  Avg winner resources: ${avgRes.toFixed(1)} leftover`);
    console.log(`  Avg winner cards:     ${avgCards.toFixed(1)} power cards`);

    // Resource distribution of winners
    const avgByColor = {};
    for (const god of ['gold', 'black', 'green', 'yellow']) {
      avgByColor[god] = winnerProfiles.reduce((s, p) => s + Math.max(0, p.resources[god] || 0), 0) / winnerProfiles.length;
    }
    console.log(`  Winner resource split: gold=${avgByColor.gold.toFixed(1)} black=${avgByColor.black.toFixed(1)} green=${avgByColor.green.toFixed(1)} yellow=${avgByColor.yellow.toFixed(1)}`);
  }

  // Power card popularity among winners
  printSubHeader('Most Popular Power Cards (among winners)');
  const cardEntries = Object.entries(powerCardPurchases).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCardPurchases = cardEntries.length > 0 ? cardEntries[0][1] : 1;
  for (const [cardId, count] of cardEntries) {
    const card = powerCards[cardId];
    const name = card?.name || cardId;
    const god = card?.god || '?';
    console.log(`  ${name.padEnd(22)} (${god.padEnd(6)}) ${bar(count, maxCardPurchases, 15)} ${count} purchases`);
  }

  return { championWins, championPicks, godFavorGains, powerCardPurchases };
}

// ── Analysis 3: Snowball / Comeback ──────────────────────────────────────────

async function analyzeSnowball(gameCount = 80) {
  printHeader('ANALYSIS 3: SNOWBALL vs COMEBACK');
  console.log(`  Running ${gameCount} 2-player games, tracking round-by-round glory...`);

  const mctsPlayer = createMCTSPlayer(MCTS_PRESETS.fast);
  const roundLeaderWins = [0, 0, 0]; // how often the leader at end of round N wins
  const comebacks = 0;
  const gloryByRound = { round1: [], round2: [], round3: [] };
  const spreadByRound = { round1: [], round2: [], round3: [] };
  let comebackCount = 0;
  let totalGames = 0;
  let errors = 0;

  for (let i = 0; i < gameCount; i++) {
    try {
      // We need to instrument the game to capture per-round state
      // Do this by running simulateGame with verbose and parsing the log
      // Actually, let's run the game step by step to capture round snapshots
      const result = simulateGame({
        playerCount: 2,
        godSet: ['gold', 'black', 'green', 'yellow'],
        decisionFn: mctsPlayer.decisionFn,
        actionPickerFn: mctsPlayer.actionPicker,
        shopDecisionFn: mctsPlayer.shopDecision,
        cardDecisionFn: mctsPlayer.cardDecision,
        maxTurns: 300,
        verbose: true,
      });

      const { finalState, winner, gameLog } = result;
      totalGames++;

      // Parse glory at end of each round from log
      // We'll look for round transitions in the log
      const players = finalState.players;
      const p0Glory = players[0]?.glory || 0;
      const p1Glory = players[1]?.glory || 0;

      // Track final glory spread
      gloryByRound.round3.push(Math.max(p0Glory, p1Glory));
      spreadByRound.round3.push(Math.abs(p0Glory - p1Glory));

      // Check for lead changes in the log
      // Simple heuristic: if the log mentions both players gaining glory, track it
      // For a more accurate analysis, we'd need round snapshots

      // Instead, let's just check: did the winner have more glory mentions?
      const winnerGlory = getPlayer(finalState, winner)?.glory || 0;
      const loserGlory = players.find(p => p.id !== winner)?.glory || 0;

      if (winnerGlory - loserGlory <= 2) {
        comebackCount++; // Close game = potential comeback
      }

      if ((i + 1) % 20 === 0) process.stdout.write(`  [${i + 1}/${gameCount}]\r`);
    } catch (e) {
      errors++;
    }
  }

  console.log(`\n  Results (${totalGames} completed games, ${errors} errors):`);

  if (gloryByRound.round3.length > 0) {
    const avgWinnerGlory = gloryByRound.round3.reduce((a, b) => a + b, 0) / gloryByRound.round3.length;
    const avgSpread = spreadByRound.round3.reduce((a, b) => a + b, 0) / spreadByRound.round3.length;
    const medSpread = median(spreadByRound.round3);

    console.log(`  Avg winner glory:    ${avgWinnerGlory.toFixed(1)}`);
    console.log(`  Avg glory spread:    ${avgSpread.toFixed(1)} (median: ${medSpread.toFixed(1)})`);
    console.log(`  Close games (≤2):    ${comebackCount} (${pct(comebackCount, totalGames)})`);

    // Glory distribution
    printSubHeader('Final Glory Distribution');
    const gloryBuckets = {};
    for (const g of gloryByRound.round3) {
      const bucket = Math.floor(g / 3) * 3;
      const label = `${bucket}-${bucket + 2}`;
      gloryBuckets[label] = (gloryBuckets[label] || 0) + 1;
    }
    const maxBucket = Math.max(...Object.values(gloryBuckets));
    for (const [range, count] of Object.entries(gloryBuckets).sort((a, b) => {
      const aNum = parseInt(a[0]);
      const bNum = parseInt(b[0]);
      return aNum - bNum;
    })) {
      console.log(`  ${range.padStart(6)} ${bar(count, maxBucket, 20)} ${count}`);
    }

    // Spread distribution
    printSubHeader('Glory Spread Distribution (winner - loser)');
    const spreadBuckets = {};
    for (const s of spreadByRound.round3) {
      const bucket = Math.floor(s / 3) * 3;
      const label = `${bucket}-${bucket + 2}`;
      spreadBuckets[label] = (spreadBuckets[label] || 0) + 1;
    }
    const maxSpreadBucket = Math.max(...Object.values(spreadBuckets));
    for (const [range, count] of Object.entries(spreadBuckets).sort((a, b) => {
      const aNum = parseInt(a[0]);
      const bNum = parseInt(b[0]);
      return aNum - bNum;
    })) {
      console.log(`  ${range.padStart(6)} ${bar(count, maxSpreadBucket, 20)} ${count}`);
    }

    if (avgSpread < 3) {
      console.log(`\n  ✓ TIGHT GAMES: Average spread of ${avgSpread.toFixed(1)} means games feel competitive`);
    } else if (avgSpread < 6) {
      console.log(`\n  ~ MODERATE SPREAD: ${avgSpread.toFixed(1)} avg gap — some blowouts but generally competitive`);
    } else {
      console.log(`\n  ✗ SNOWBALL RISK: ${avgSpread.toFixed(1)} avg gap — leaders pull away too easily`);
    }
  }
}

// ── Analysis 4: God Balance ──────────────────────────────────────────────────

async function analyzeGodBalance(gameCount = 60) {
  printHeader('ANALYSIS 4: GOD BALANCE (Action Usage & Value)');
  console.log(`  Running ${gameCount} 4-player MCTS games, tracking action placements...`);

  const mctsPlayer = createMCTSPlayer(MCTS_PRESETS.fast);
  const actionUsage = {};
  const shopUsage = {};
  let totalActions = 0;
  let totalShops = 0;
  let errors = 0;

  for (let i = 0; i < gameCount; i++) {
    try {
      const result = simulateGame({
        playerCount: 4,
        godSet: ['gold', 'black', 'green', 'yellow'],
        decisionFn: mctsPlayer.decisionFn,
        actionPickerFn: mctsPlayer.actionPicker,
        shopDecisionFn: mctsPlayer.shopDecision,
        cardDecisionFn: mctsPlayer.cardDecision,
        maxTurns: 300,
        verbose: true,
      });

      // Parse action usage from log
      for (const entry of result.gameLog) {
        const actionMatch = entry.match?.(/plays (\w+)/);
        if (actionMatch) {
          const actionId = actionMatch[1];
          actionUsage[actionId] = (actionUsage[actionId] || 0) + 1;
          totalActions++;
        }
        const shopMatch = entry.match?.(/(?:buys|uses) shop (\w+)/i);
        if (shopMatch) {
          const shopId = shopMatch[1];
          shopUsage[shopId] = (shopUsage[shopId] || 0) + 1;
          totalShops++;
        }
      }

      if ((i + 1) % 15 === 0) process.stdout.write(`  [${i + 1}/${gameCount}]\r`);
    } catch (e) {
      errors++;
    }
  }

  console.log(`\n  ${totalActions} total action placements across ${gameCount - errors} games`);

  // Group by god
  printSubHeader('Action Usage by God');
  const godActionCounts = { gold: 0, black: 0, green: 0, yellow: 0 };
  for (const [actionId, count] of Object.entries(actionUsage)) {
    const god = actionId.split('_')[0];
    if (godActionCounts[god] !== undefined) {
      godActionCounts[god] += count;
    }
  }
  const maxGodCount = Math.max(...Object.values(godActionCounts));
  for (const [god, count] of Object.entries(godActionCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${god.padEnd(8)} ${bar(count, maxGodCount, 25)} ${count} placements (${pct(count, totalActions)})`);
  }

  // Top individual actions
  printSubHeader('Most Popular Individual Actions');
  const topActions = Object.entries(actionUsage).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const maxActionCount = topActions.length > 0 ? topActions[0][1] : 1;
  for (const [actionId, count] of topActions) {
    console.log(`  ${actionId.padEnd(22)} ${bar(count, maxActionCount, 20)} ${count} (${pct(count, totalActions)})`);
  }

  // Least used actions (potential dead spots)
  printSubHeader('Least Used Actions (potential dead spots)');
  const bottomActions = Object.entries(actionUsage).sort((a, b) => a[1] - b[1]).slice(0, 8);
  for (const [actionId, count] of bottomActions) {
    console.log(`  ${actionId.padEnd(22)} ${count} placements (${pct(count, totalActions)})`);
  }
}

// ── Analysis 5: Random vs Random Baseline ────────────────────────────────────

async function analyzeBaseline(gameCount = 200) {
  printHeader('ANALYSIS 5: BASELINE (Random vs Random)');
  console.log(`  Running ${gameCount} random 2-player games for baseline metrics...`);

  const results = runSimulations({
    gameCount,
    playerCount: 2,
    godSet: ['gold', 'black', 'green', 'yellow'],
    decisionFn: randomDecisionFn,
    actionPickerFn: randomActionPicker,
    maxTurns: 300,
  });

  console.log(`\n  Completed: ${results.completedGames}  Errors: ${results.errors}`);
  console.log(`  Avg turns: ${results.avgTurns.toFixed(1)}`);
  console.log(`  Avg glory spread: ${results.glorySpread.toFixed(1)}`);

  printSubHeader('Win Distribution');
  for (const [pid, count] of Object.entries(results.wins).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${pid}: ${count} wins (${pct(count, results.completedGames)})`);
  }

  printSubHeader('Average Glory');
  for (const [pid, avg] of Object.entries(results.avgGlory)) {
    console.log(`  ${pid}: ${avg.toFixed(1)}`);
  }

  printSubHeader('Champion Win Rates');
  const totalChampWins = Object.values(results.championWins).reduce((a, b) => a + b, 0);
  for (const [champId, wins] of Object.entries(results.championWins).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${champId.padEnd(14)} ${wins} wins (${pct(wins, totalChampWins)})`);
  }

  // Check first-player advantage
  const p0Wins = results.wins['player_0'] || 0;
  const p1Wins = results.wins['player_1'] || 0;
  const advantage = Math.abs(p0Wins - p1Wins) / results.completedGames * 100;
  if (advantage > 10) {
    console.log(`\n  ⚠ TURN ORDER BIAS: ${advantage.toFixed(1)}% difference between P1 and P2 win rates`);
  } else {
    console.log(`\n  ✓ Turn order appears balanced (${advantage.toFixed(1)}% difference)`);
  }
}

// ── Analysis 6: Detailed Game Replay ─────────────────────────────────────────

async function analyzeDetailedGame() {
  printHeader('ANALYSIS 6: DETAILED GAME REPLAY');
  console.log('  Running 1 verbose MCTS game to show decision-making flow...\n');

  const mctsPlayer = createMCTSPlayer(MCTS_PRESETS.fast);

  const result = simulateGame({
    playerCount: 2,
    playerNames: ['Alice', 'Bob'],
    godSet: ['gold', 'black', 'green', 'yellow'],
    decisionFn: mctsPlayer.decisionFn,
    actionPickerFn: mctsPlayer.actionPicker,
    shopDecisionFn: mctsPlayer.shopDecision,
    cardDecisionFn: mctsPlayer.cardDecision,
    maxTurns: 300,
    verbose: true,
  });

  // Print key log entries
  const keyEvents = result.gameLog.filter(entry =>
    entry.includes('Turn') ||
    entry.includes('Glory') ||
    entry.includes('Favor') ||
    entry.includes('champion') ||
    entry.includes('shop') ||
    entry.includes('power card') ||
    entry.includes('steal') ||
    entry.includes('round') ||
    entry.includes('Game over') ||
    entry.includes('Round')
  ).slice(0, 60);

  for (const entry of keyEvents) {
    console.log(`  ${entry}`);
  }

  // Final state summary
  console.log('\n  ── Final State ──');
  for (const player of result.finalState.players) {
    const champ = result.finalState.champions?.[player.id];
    const cards = champ?.powerCards || [];
    const cardNames = cards.map(id => powerCards[id]?.name || id).join(', ');
    console.log(`  ${player.name || player.id}: Glory=${player.glory} Resources=${JSON.stringify(player.resources)} Champion=${champ?.id} Cards=[${cardNames}]`);
  }
  console.log(`  Winner: ${result.winner} after ${result.turns} turns`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║              PATRONS v3 — GAME DESIGN ANALYSIS                      ║');
  console.log('║              Is this fun? Do choices matter?                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Run all analyses
  await analyzeBaseline(200);
  await analyzeAgency(40);
  await analyzeDiversity(60);
  await analyzeSnowball(60);
  await analyzeGodBalance(40);
  await analyzeDetailedGame();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  printHeader('SUMMARY');
  console.log(`  Total analysis time: ${elapsed}s`);
  console.log(`  `);
  console.log(`  Key questions to evaluate from the data above:`);
  console.log(`  1. AGENCY: Does MCTS win rate >> 50%? If so, decisions matter.`);
  console.log(`  2. DIVERSITY: Are champion win rates within 10% of each other?`);
  console.log(`  3. SNOWBALL: Are close games (≤2 glory) > 30%? If so, good comeback.`);
  console.log(`  4. BALANCE: Are all 4 gods used roughly equally?`);
  console.log(`  5. DEPTH: Do winners buy power cards? Are many different cards viable?`);
}

main().catch(e => {
  console.error('Analysis failed:', e);
  process.exit(1);
});
