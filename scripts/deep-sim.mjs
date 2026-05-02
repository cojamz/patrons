#!/usr/bin/env node
/**
 * Patrons v3 — Deep Instrumented Simulation
 *
 * Runs games with standard/strong MCTS and logs every decision
 * with alternatives and rollout scores. Answers:
 * - Is the AI making sensible decisions?
 * - What does a "well-played" game look like?
 * - Where is the AI blind?
 */

import { simulateGame, randomDecisionFn, randomActionPicker } from '../src/engine/v3/runner.js';
import { createMCTSPlayer, MCTS_PRESETS } from '../src/engine/v3/balanceAI.js';
import { getPlayer } from '../src/engine/v3/stateHelpers.js';
import { getAvailableActions, getActionGod, canAfford } from '../src/engine/v3/rules.js';
import { createGame, executeAction, executeShop, endTurn, buyPowerCard, resolveDecision } from '../src/engine/v3/GameEngine.js';
import {
  Phase, executeChampionDraft, executeRoundStart, executeRoundEnd,
  advanceTurn, isGameOver, resortTurnOrder,
} from '../src/engine/v3/phases.js';
import { dispatchEvent, EventType, resetHandlerFrequencies } from '../src/engine/v3/events.js';
import { canAffordShop } from '../src/engine/v3/shops/shopResolver.js';
import { powerCards } from '../src/engine/v3/data/powerCards.js';
import gods from '../src/engine/v3/data/gods.js';

// ── Instrumented MCTS that logs its reasoning ────────────────────────────────

function createInstrumentedMCTS(preset, log) {
  // Import the core functions we need by re-implementing the thin wrapper
  // with logging. We use the real createMCTSPlayer underneath but intercept.
  const realPlayer = createMCTSPlayer(preset);

  return {
    actionPicker: (state, playerId, actions) => {
      const choice = realPlayer.actionPicker(state, playerId, actions);
      const god = choice ? getActionGod(choice, state.gods) : '?';
      const actionDef = choice ? findActionDef(choice, state.gods) : null;
      const player = getPlayer(state, playerId);
      log.push({
        type: 'action',
        turn: state._turnCount || '?',
        round: state.round,
        player: playerId,
        playerName: player?.name,
        choice,
        choiceName: actionDef?.name,
        god,
        alternatives: actions.length,
        resources: { ...player?.resources },
        glory: player?.glory || 0,
        workersLeft: player?.workersLeft,
      });
      return choice;
    },
    shopDecision: (state, playerId) => {
      const choice = realPlayer.shopDecision(state, playerId);
      if (choice) {
        const player = getPlayer(state, playerId);
        log.push({
          type: 'shop',
          round: state.round,
          player: playerId,
          choice,
          resources: { ...player?.resources },
          glory: player?.glory || 0,
        });
      }
      return choice;
    },
    cardDecision: (state, playerId) => {
      const choice = realPlayer.cardDecision(state, playerId);
      if (choice) {
        const card = powerCards[choice];
        const player = getPlayer(state, playerId);
        const champ = state.champions?.[playerId];
        log.push({
          type: 'card',
          round: state.round,
          player: playerId,
          choice,
          cardName: card?.name,
          cardGod: card?.god,
          cost: card?.cost,
          currentCards: champ?.powerCards?.length || 0,
          resources: { ...player?.resources },
        });
      }
      return choice;
    },
    decisionFn: realPlayer.decisionFn,
  };
}

function findActionDef(actionId, activeGods) {
  for (const color of (activeGods || ['gold', 'black', 'green', 'yellow'])) {
    const god = gods[color];
    if (!god) continue;
    const action = god.actions.find(a => a.id === actionId);
    if (action) return action;
  }
  return null;
}

// ── Detailed Game Analysis ───────────────────────────────────────────────────

function analyzeGame(result, decisionLog) {
  const { finalState, turns, winner, gameLog } = result;
  const players = finalState.players;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    GAME SUMMARY                             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Player summary
  for (const player of players) {
    const champ = finalState.champions?.[player.id];
    const cards = champ?.powerCards || [];
    const cardNames = cards.map(id => powerCards[id]?.name || id);
    const isWinner = player.id === winner;
    const prefix = isWinner ? '★' : ' ';

    console.log(`\n${prefix} ${player.name || `Player ${player.id}`} — Glory: ${player.glory}  Champion: ${champ?.id || '?'}`);
    console.log(`  Resources: ${JSON.stringify(player.resources)}`);
    console.log(`  Power Cards (${cards.length}): ${cardNames.join(', ') || 'none'}`);

    // Glory sources
    if (player.glorySources) {
      const sources = Object.entries(player.glorySources)
        .filter(([, v]) => v !== 0)
        .sort((a, b) => b[1] - a[1]);
      if (sources.length > 0) {
        console.log(`  Glory Sources:`);
        for (const [source, amount] of sources) {
          const sign = amount > 0 ? '+' : '';
          console.log(`    ${sign}${amount} from ${source}`);
        }
      }
    }
  }

  console.log(`\n  Winner: Player ${winner} after ${turns} turns`);

  // Turn-by-turn decision log
  console.log('\n── Turn-by-Turn Decisions ─────────────────────────────────────');

  let currentRound = 0;
  let turnNum = 0;
  for (const entry of decisionLog) {
    if (entry.type === 'action') {
      if (entry.round !== currentRound) {
        currentRound = entry.round;
        console.log(`\n  ═══ ROUND ${currentRound} ═══`);
      }
      turnNum++;
      const name = entry.choiceName || entry.choice;
      const resourceStr = Object.entries(entry.resources || {})
        .filter(([, v]) => v > 0)
        .map(([c, v]) => `${v}${c[0]}`)
        .join(' ');
      console.log(`  T${String(turnNum).padStart(2)}: ${(entry.playerName || `P${entry.player}`).padEnd(8)} → ${String(name).padEnd(16)} (${entry.god}) [${resourceStr}] glory=${entry.glory} workers=${entry.workersLeft} of ${entry.alternatives} options`);
    } else if (entry.type === 'shop') {
      console.log(`       ${' '.repeat(8)}   shop: ${entry.choice}`);
    } else if (entry.type === 'card') {
      console.log(`       ${' '.repeat(8)}   card: ${entry.cardName} (${entry.cardGod}, cost: ${JSON.stringify(entry.cost)})`);
    }
  }

  // Per-round glory tracking from log
  console.log('\n── Key Events from Game Log ───────────────────────────────────');
  const keyEntries = gameLog.filter(e =>
    e.includes('Favor') ||
    e.includes('Stole') ||
    e.includes('steal') ||
    e.includes('Cash In') ||
    e.includes('Round') ||
    e.includes('round') ||
    e.includes('power card') ||
    e.includes('Aegis') ||
    e.includes('Annihilate') ||
    e.includes('Eternity') ||
    e.includes('discount')
  );
  for (const entry of keyEntries.slice(0, 50)) {
    console.log(`  ${entry}`);
  }
}

// ── Strategy Pattern Detection ───────────────────────────────────────────────

function detectStrategies(decisionLog, finalState) {
  console.log('\n── Strategy Analysis ──────────────────────────────────────────');

  for (const player of finalState.players) {
    const pid = player.id;
    const actions = decisionLog.filter(e => e.type === 'action' && e.player === pid);
    const shops = decisionLog.filter(e => e.type === 'shop' && e.player === pid);
    const cards = decisionLog.filter(e => e.type === 'card' && e.player === pid);

    // God focus
    const godCounts = {};
    for (const a of actions) {
      godCounts[a.god] = (godCounts[a.god] || 0) + 1;
    }
    const totalActions = actions.length;
    const godPcts = Object.entries(godCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([god, count]) => `${god}=${(count / totalActions * 100).toFixed(0)}%`);

    // Aggression tracking
    const stealActions = actions.filter(a =>
      a.choice?.includes('steal') || a.choice?.includes('ransack') ||
      a.choice?.includes('pickpocket') || a.choice?.includes('plunder') ||
      a.choice?.includes('tribute') || a.choice?.includes('levy') ||
      a.choice?.includes('annihilate') || a.choice?.includes('dread') ||
      a.choice?.includes('siphon')
    );

    // Repeat/copy tracking
    const repeatActions = actions.filter(a =>
      a.choice?.includes('relive') || a.choice?.includes('echo') ||
      a.choice?.includes('recall') || a.choice?.includes('rewind') ||
      a.choice?.includes('foresight') || a.choice?.includes('eternity')
    );

    // Resource hoarding
    const finalRes = player.resources || {};
    const totalRes = Object.values(finalRes).reduce((s, v) => s + Math.max(0, v), 0);
    const goldRes = finalRes.gold || 0;

    console.log(`\n  ${player.name || `Player ${pid}`} (Glory: ${player.glory}):`);
    console.log(`    God focus:    ${godPcts.join(', ')}`);
    console.log(`    Actions:      ${totalActions} total, ${stealActions.length} stealing, ${repeatActions.length} repeating`);
    console.log(`    Purchases:    ${shops.length} shops, ${cards.length} cards`);
    console.log(`    Leftover res: ${totalRes} total (${goldRes} gold)`);

    // Identify strategy archetype
    const primaryGod = Object.entries(godCounts).sort((a, b) => b[1] - a[1])[0];
    if (primaryGod) {
      const [god, count] = primaryGod;
      const pct = count / totalActions;
      if (pct > 0.5) {
        console.log(`    Archetype:    ${god.toUpperCase()} FOCUSED (${(pct * 100).toFixed(0)}% of actions)`);
      } else if (stealActions.length > totalActions * 0.3) {
        console.log(`    Archetype:    AGGRESSIVE (${stealActions.length} steal actions)`);
      } else if (repeatActions.length > totalActions * 0.25) {
        console.log(`    Archetype:    TEMPO/REPEAT (${repeatActions.length} repeats)`);
      } else {
        console.log(`    Archetype:    BALANCED`);
      }
    }
  }
}

// ── Main: Run Instrumented Games ─────────────────────────────────────────────

async function main() {
  const preset = process.argv.includes('--strong') ? MCTS_PRESETS.strong : MCTS_PRESETS.standard;
  const presetName = process.argv.includes('--strong') ? 'strong' : 'standard';
  const gameCount = parseInt(process.argv.find(a => a.startsWith('--games='))?.split('=')[1] || '3');
  const playerCount = parseInt(process.argv.find(a => a.startsWith('--players='))?.split('=')[1] || '2');
  const godsArg = process.argv.find(a => a.startsWith('--gods='));
  const godSet = godsArg ? godsArg.split('=')[1].split(',') : ['gold', 'black', 'green', 'yellow'];

  console.log(`═══════════════════════════════════════════════════════════════`);
  console.log(`  DEEP SIMULATION: ${gameCount} games, ${playerCount} players, ${presetName} MCTS`);
  console.log(`  Gods: ${godSet.join(', ')}`);
  console.log(`  (${preset.actionRollouts} action rollouts, ${preset.purchaseRollouts} purchase rollouts)`);
  console.log(`═══════════════════════════════════════════════════════════════`);

  const aggregateStats = {
    winnerGlory: [],
    loserGlory: [],
    spreads: [],
    winnerCards: [],
    winnerGodFocus: {},
    shopPurchases: 0,
    cardPurchases: 0,
    totalTurns: [],
    godUsage: {},
    glorySources: {},
  };

  for (let g = 0; g < gameCount; g++) {
    console.log(`\n${'▓'.repeat(63)}`);
    console.log(`  GAME ${g + 1} of ${gameCount}`);
    console.log(`${'▓'.repeat(63)}`);

    const decisionLog = [];
    const player = createInstrumentedMCTS(preset, decisionLog);

    const startTime = Date.now();
    const result = simulateGame({
      playerCount,
      playerNames: playerCount === 2 ? ['Alice', 'Bob'] : ['Alice', 'Bob', 'Carol', 'Dave'],
      godSet,
      decisionFn: player.decisionFn,
      actionPickerFn: player.actionPicker,
      shopDecisionFn: player.shopDecision,
      cardDecisionFn: player.cardDecision,
      maxTurns: 300,
      verbose: true,
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  (completed in ${elapsed}s)`);

    analyzeGame(result, decisionLog);
    detectStrategies(decisionLog, result.finalState);

    // Aggregate stats
    const sortedPlayers = [...result.finalState.players].sort((a, b) => b.glory - a.glory);
    aggregateStats.winnerGlory.push(sortedPlayers[0].glory);
    aggregateStats.loserGlory.push(sortedPlayers[sortedPlayers.length - 1].glory);
    aggregateStats.spreads.push(sortedPlayers[0].glory - sortedPlayers[sortedPlayers.length - 1].glory);
    aggregateStats.totalTurns.push(result.turns);

    const winnerChamp = result.finalState.champions?.[result.winner];
    aggregateStats.winnerCards.push(winnerChamp?.powerCards?.length || 0);

    aggregateStats.shopPurchases += decisionLog.filter(e => e.type === 'shop').length;
    aggregateStats.cardPurchases += decisionLog.filter(e => e.type === 'card').length;

    // Track god usage
    for (const entry of decisionLog.filter(e => e.type === 'action')) {
      aggregateStats.godUsage[entry.god] = (aggregateStats.godUsage[entry.god] || 0) + 1;
    }

    // Track glory sources
    for (const p of result.finalState.players) {
      if (p.glorySources) {
        for (const [source, amount] of Object.entries(p.glorySources)) {
          if (amount > 0) {
            aggregateStats.glorySources[source] = (aggregateStats.glorySources[source] || 0) + amount;
          }
        }
      }
    }
  }

  // Print aggregate summary
  if (gameCount > 1) {
    console.log(`\n${'═'.repeat(63)}`);
    console.log(`  AGGREGATE STATS (${gameCount} games)`);
    console.log(`${'═'.repeat(63)}`);

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

    console.log(`  Avg winner glory:  ${avg(aggregateStats.winnerGlory).toFixed(1)}`);
    console.log(`  Avg loser glory:   ${avg(aggregateStats.loserGlory).toFixed(1)}`);
    console.log(`  Avg spread:        ${avg(aggregateStats.spreads).toFixed(1)}`);
    console.log(`  Avg turns:         ${avg(aggregateStats.totalTurns).toFixed(1)}`);
    console.log(`  Avg winner cards:  ${avg(aggregateStats.winnerCards).toFixed(1)}`);
    console.log(`  Total shops bought: ${aggregateStats.shopPurchases}`);
    console.log(`  Total cards bought: ${aggregateStats.cardPurchases}`);

    console.log(`\n  God Usage:`);
    const totalActions = Object.values(aggregateStats.godUsage).reduce((a, b) => a + b, 0);
    for (const [god, count] of Object.entries(aggregateStats.godUsage).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${god.padEnd(8)} ${count} (${(count / totalActions * 100).toFixed(1)}%)`);
    }

    console.log(`\n  Glory Sources (total across all games/players):`);
    for (const [source, amount] of Object.entries(aggregateStats.glorySources).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      console.log(`    ${source.padEnd(30)} +${amount}`);
    }
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
