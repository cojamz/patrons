#!/usr/bin/env node
/**
 * Patrons v3 — Combo & Cross-God Synergy Analysis
 *
 * Runs many games and detects:
 * - Cross-god action patterns (do winners use multiple gods?)
 * - Card+action synergies (which cards amplify which actions?)
 * - Action sequences that produce big glory spikes
 * - Shop timing patterns
 * - Whether mono-god or multi-god strategies win
 */

import { simulateGame } from '../src/engine/v3/runner.js';
import { createMCTSPlayer, MCTS_PRESETS } from '../src/engine/v3/balanceAI.js';
import { getPlayer } from '../src/engine/v3/stateHelpers.js';
import { powerCards } from '../src/engine/v3/data/powerCards.js';
import gods from '../src/engine/v3/data/gods.js';
import { getActionGod } from '../src/engine/v3/rules.js';

const GAME_COUNT = parseInt(process.argv.find(a => a.startsWith('--games='))?.split('=')[1] || '20');
const PLAYER_COUNT = parseInt(process.argv.find(a => a.startsWith('--players='))?.split('=')[1] || '3');
const godsArg = process.argv.find(a => a.startsWith('--gods='));
const GOD_SET = godsArg ? godsArg.split('=')[1].split(',') : ['gold', 'black', 'green', 'yellow'];
const preset = process.argv.includes('--strong') ? MCTS_PRESETS.strong : MCTS_PRESETS.standard;

console.log(`Combo Analysis: ${GAME_COUNT} games, ${PLAYER_COUNT}p, gods=${GOD_SET.join(',')}\n`);

// ── Data Collection ──────────────────────────────────────────────────────────

const allPlayerResults = []; // { glory, isWinner, godPct, cards, glorySources, actions, shops, focusType }

const comboPairs = {}; // "cardId+actionPattern" → { count, avgGlory, wins }
const godSpreadBuckets = { mono: [], dual: [], spread: [] }; // mono=50%+, dual=two 30%+, spread=none>45%
const cardCombos = {}; // "card1+card2" → { count, avgGlory, wins }
const actionSequences = {}; // "round:action1→action2" → count among winners
const glorySpikes = []; // { player, round, turn, glorybefore, gloryAfter, action, card }

for (let g = 0; g < GAME_COUNT; g++) {
  const mctsPlayer = createMCTSPlayer(preset);

  // Instrument to capture per-turn data
  const turnLog = []; // { player, round, action, god, gloryBefore, gloryAfter, shop, card }
  let lastGlory = {};

  const result = simulateGame({
    playerCount: PLAYER_COUNT,
    godSet: GOD_SET,
    decisionFn: mctsPlayer.decisionFn,
    actionPickerFn: (state, pid, actions) => {
      const choice = mctsPlayer.actionPicker(state, pid, actions);
      const p = getPlayer(state, pid);
      lastGlory[pid] = p?.glory || 0;
      turnLog.push({
        player: pid,
        round: state.round,
        action: choice,
        god: choice ? getActionGod(choice, state.gods) : null,
        gloryBefore: p?.glory || 0,
        resources: { ...(p?.resources || {}) },
      });
      return choice;
    },
    shopDecisionFn: (state, pid) => {
      const choice = mctsPlayer.shopDecision(state, pid);
      if (choice) {
        const last = turnLog[turnLog.length - 1];
        if (last && last.player === pid) last.shop = choice;
      }
      return choice;
    },
    cardDecisionFn: (state, pid) => {
      const choice = mctsPlayer.cardDecision(state, pid);
      if (choice) {
        const last = turnLog[turnLog.length - 1];
        if (last && last.player === pid) last.card = choice;
      }
      return choice;
    },
    maxTurns: 300,
    verbose: true,
  });

  const { finalState, winner } = result;

  // Fill in gloryAfter from final state
  for (const entry of turnLog) {
    // We'll compute glory deltas from sequential entries per player
  }

  // Analyze each player
  for (const player of finalState.players) {
    const pid = player.id;
    const isWinner = pid === winner;
    const playerTurns = turnLog.filter(t => t.player === pid);
    const champ = finalState.champions?.[pid];
    const cards = champ?.powerCards || [];

    // God distribution
    const godCounts = {};
    for (const t of playerTurns) {
      if (t.god) godCounts[t.god] = (godCounts[t.god] || 0) + 1;
    }
    const total = playerTurns.length || 1;
    const godPct = {};
    for (const [god, count] of Object.entries(godCounts)) {
      godPct[god] = count / total;
    }

    // Classify focus type
    const sorted = Object.entries(godPct).sort((a, b) => b[1] - a[1]);
    let focusType;
    if (sorted[0]?.[1] >= 0.5) {
      focusType = 'mono';
    } else if (sorted.length >= 2 && sorted[0][1] >= 0.3 && sorted[1][1] >= 0.3) {
      focusType = 'dual';
    } else {
      focusType = 'spread';
    }

    const playerResult = {
      glory: player.glory,
      isWinner,
      godPct,
      godCounts,
      cards,
      glorySources: player.glorySources || {},
      focusType,
      champion: champ?.id,
      shops: playerTurns.filter(t => t.shop).map(t => t.shop),
      cardNames: cards.map(id => powerCards[id]?.name || id),
    };
    allPlayerResults.push(playerResult);

    // Track god spread buckets
    godSpreadBuckets[focusType].push({ glory: player.glory, isWinner });

    // Track card combos (pairs of cards)
    if (cards.length >= 2) {
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const key = [cards[i], cards[j]].sort().join('+');
          if (!cardCombos[key]) cardCombos[key] = { count: 0, totalGlory: 0, wins: 0 };
          cardCombos[key].count++;
          cardCombos[key].totalGlory += player.glory;
          if (isWinner) cardCombos[key].wins++;
        }
      }
    }

    // Track action sequences per round (consecutive actions by this player)
    const byRound = {};
    for (const t of playerTurns) {
      if (!byRound[t.round]) byRound[t.round] = [];
      byRound[t.round].push(t.action);
    }
    if (isWinner) {
      for (const [round, actions] of Object.entries(byRound)) {
        for (let i = 0; i < actions.length - 1; i++) {
          const key = `R${round}:${actions[i]}→${actions[i + 1]}`;
          actionSequences[key] = (actionSequences[key] || 0) + 1;
        }
      }
    }

    // Track card+god combos
    for (const cardId of cards) {
      const card = powerCards[cardId];
      const primaryGod = sorted[0]?.[0];
      if (card && primaryGod) {
        const key = `${cardId}[${card.god}] + ${primaryGod}_focus`;
        if (!comboPairs[key]) comboPairs[key] = { count: 0, totalGlory: 0, wins: 0 };
        comboPairs[key].count++;
        comboPairs[key].totalGlory += player.glory;
        if (isWinner) comboPairs[key].wins++;
      }
    }
  }

  if ((g + 1) % 5 === 0) process.stdout.write(`  [${g + 1}/${GAME_COUNT}]\r`);
}

// ── Analysis Output ──────────────────────────────────────────────────────────

function bar(value, max, width = 20) {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// 1. Mono vs Multi-God Strategy
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  1. MONO vs MULTI-GOD STRATEGIES');
console.log('═══════════════════════════════════════════════════════════════');

for (const [type, results] of Object.entries(godSpreadBuckets)) {
  if (results.length === 0) continue;
  const avgGlory = results.reduce((s, r) => s + r.glory, 0) / results.length;
  const winRate = results.filter(r => r.isWinner).length / results.length;
  const label = type === 'mono' ? 'MONO (50%+ one god)' : type === 'dual' ? 'DUAL (two gods 30%+)' : 'SPREAD (balanced)';
  console.log(`  ${label.padEnd(25)} n=${String(results.length).padStart(3)}  avgGlory=${avgGlory.toFixed(1).padStart(6)}  winRate=${(winRate * 100).toFixed(1)}%`);
}

// 2. Winning God Combinations
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  2. GOD FOCUS OF WINNERS vs LOSERS');
console.log('═══════════════════════════════════════════════════════════════');

const winners = allPlayerResults.filter(r => r.isWinner);
const losers = allPlayerResults.filter(r => !r.isWinner);

console.log('\n  Winners (avg god distribution):');
const winnerGodAvg = {};
for (const god of GOD_SET) {
  winnerGodAvg[god] = winners.reduce((s, r) => s + (r.godPct[god] || 0), 0) / winners.length;
}
for (const [god, pct] of Object.entries(winnerGodAvg).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${god.padEnd(8)} ${bar(pct, 0.5)} ${(pct * 100).toFixed(1)}%`);
}

console.log('\n  Losers (avg god distribution):');
const loserGodAvg = {};
for (const god of GOD_SET) {
  loserGodAvg[god] = losers.reduce((s, r) => s + (r.godPct[god] || 0), 0) / losers.length;
}
for (const [god, pct] of Object.entries(loserGodAvg).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${god.padEnd(8)} ${bar(pct, 0.5)} ${(pct * 100).toFixed(1)}%`);
}

// 3. Best Card Combos
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  3. POWER CARD COMBOS (pairs seen 2+ times)');
console.log('═══════════════════════════════════════════════════════════════');

const goodCombos = Object.entries(cardCombos)
  .filter(([, v]) => v.count >= 2)
  .sort((a, b) => (b[1].totalGlory / b[1].count) - (a[1].totalGlory / a[1].count));

if (goodCombos.length === 0) {
  console.log('  No card pairs seen 2+ times (need more games)');
} else {
  for (const [key, data] of goodCombos.slice(0, 15)) {
    const [c1, c2] = key.split('+');
    const n1 = powerCards[c1]?.name || c1;
    const n2 = powerCards[c2]?.name || c2;
    const avgG = data.totalGlory / data.count;
    console.log(`  ${n1} + ${n2}`);
    console.log(`    seen=${data.count}  avgGlory=${avgG.toFixed(1)}  wins=${data.wins}`);
  }
}

// 4. Card + God Focus Synergies
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  4. CARD + GOD FOCUS SYNERGIES (seen 2+ times)');
console.log('═══════════════════════════════════════════════════════════════');

const goodSynergies = Object.entries(comboPairs)
  .filter(([, v]) => v.count >= 2)
  .sort((a, b) => (b[1].totalGlory / b[1].count) - (a[1].totalGlory / a[1].count));

for (const [key, data] of goodSynergies.slice(0, 15)) {
  const avgG = data.totalGlory / data.count;
  console.log(`  ${key.padEnd(45)} n=${data.count}  avgGlory=${avgG.toFixed(1)}  wins=${data.wins}`);
}

// 5. Winning Action Sequences
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  5. WINNING ACTION SEQUENCES (most common among winners)');
console.log('═══════════════════════════════════════════════════════════════');

const topSequences = Object.entries(actionSequences)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

for (const [seq, count] of topSequences) {
  console.log(`  ${seq.padEnd(50)} ${count}x`);
}

// 6. Glory Source Diversity
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  6. GLORY SOURCE DIVERSITY');
console.log('═══════════════════════════════════════════════════════════════');

console.log('\n  Winners — how many glory sources contribute 10+%?');
const winnerSourceDiversity = [];
for (const w of winners) {
  const sources = Object.entries(w.glorySources).filter(([, v]) => v > 0);
  const totalGlory = sources.reduce((s, [, v]) => s + v, 0);
  const significantSources = sources.filter(([, v]) => v >= totalGlory * 0.1).length;
  winnerSourceDiversity.push(significantSources);
}
const avgDiv = winnerSourceDiversity.reduce((a, b) => a + b, 0) / winnerSourceDiversity.length;
const divBuckets = { 1: 0, 2: 0, 3: 0, '4+': 0 };
for (const d of winnerSourceDiversity) {
  if (d >= 4) divBuckets['4+']++;
  else divBuckets[d]++;
}
console.log(`  Avg significant sources: ${avgDiv.toFixed(1)}`);
for (const [bucket, count] of Object.entries(divBuckets)) {
  console.log(`    ${bucket} sources: ${count} winners (${(count / winners.length * 100).toFixed(0)}%)`);
}

// 7. Cross-god vs Same-god card purchases
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  7. CARD GOD vs PLAYER FOCUS (do winners buy off-color cards?)');
console.log('═══════════════════════════════════════════════════════════════');

let sameGod = 0, crossGod = 0, sameGodWin = 0, crossGodWin = 0;
for (const r of allPlayerResults) {
  const primaryGod = Object.entries(r.godPct).sort((a, b) => b[1] - a[1])[0]?.[0];
  for (const cardId of r.cards) {
    const card = powerCards[cardId];
    if (!card) continue;
    if (card.god === primaryGod) {
      sameGod++;
      if (r.isWinner) sameGodWin++;
    } else {
      crossGod++;
      if (r.isWinner) crossGodWin++;
    }
  }
}
console.log(`  Same-god cards:  ${sameGod} purchased, ${sameGodWin} by winners (${sameGod > 0 ? (sameGodWin / sameGod * 100).toFixed(0) : 0}% win rate)`);
console.log(`  Cross-god cards: ${crossGod} purchased, ${crossGodWin} by winners (${crossGod > 0 ? (crossGodWin / crossGod * 100).toFixed(0) : 0}% win rate)`);

// 8. Specific emergent combos detected
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  8. NOTABLE GAME STORIES');
console.log('═══════════════════════════════════════════════════════════════');

// Find the highest-glory winners and describe their strategy
const topWinners = [...winners].sort((a, b) => b.glory - a.glory).slice(0, 5);
for (const w of topWinners) {
  const godFocus = Object.entries(w.godPct).sort((a, b) => b[1] - a[1]);
  const topSources = Object.entries(w.glorySources).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
  console.log(`\n  Glory ${w.glory} (${w.champion}) — ${w.focusType}`);
  console.log(`    Gods: ${godFocus.map(([g, p]) => `${g}=${(p * 100).toFixed(0)}%`).join(', ')}`);
  console.log(`    Cards: ${w.cardNames.join(', ') || 'none'}`);
  console.log(`    Glory from: ${topSources.map(([s, v]) => `${s}(+${v})`).join(', ')}`);
}

console.log('\n  Done.');
