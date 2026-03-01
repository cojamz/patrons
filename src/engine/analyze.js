// Balance analysis — run many games and surface patterns.
// Usage: node --experimental-vm-modules src/engine/analyze.js

import { simulateGame } from './runner.js';
import { heuristicDecisionFn, pickAction } from './heuristicAI.js';
import { allGameLayers } from '../data/allGameLayers.js';

const GAME_COUNT = 200;
const PLAYER_COUNT = 2;

// All possible 2-color combinations from the 8 layers
const allColors = Object.keys(allGameLayers);
function getCombinations(arr, size) {
    if (size === 1) return arr.map(x => [x]);
    const combos = [];
    for (let i = 0; i <= arr.length - size; i++) {
        const rest = getCombinations(arr.slice(i + 1), size - 1);
        for (const combo of rest) {
            combos.push([arr[i], ...combo]);
        }
    }
    return combos;
}

// --- Analysis 1: Overall stats per layer combination ---
console.log('='.repeat(70));
console.log(`PATRONS BALANCE ANALYSIS — ${GAME_COUNT} games per combo, ${PLAYER_COUNT} players`);
console.log('Heuristic AI (not random)');
console.log('='.repeat(70));
console.log('');

// Basic mode combos (4 colors)
const basicCombos = getCombinations(allColors, PLAYER_COUNT);
const layerWins = {};   // color -> win count when that color is in play
const layerGames = {};  // color -> total games where that color was in play
const comboResults = [];

// Track snowball: does R1 VP leader win?
let totalGames = 0;
let r1LeaderWins = 0;
let vpSpreads = [];

// Track per-combo
for (const combo of basicCombos) {
    const gameLayers = {};
    combo.forEach(c => { gameLayers[c] = allGameLayers[c]; });

    const results = {
        combo: combo.join('+'),
        wins: new Array(PLAYER_COUNT).fill(0),
        avgVP: new Array(PLAYER_COUNT).fill(0),
        avgSpread: 0,
        r1LeaderWinRate: 0,
        avgTurns: 0,
        errors: 0
    };

    let comboR1LeaderWins = 0;
    let comboTotalVPSpread = 0;
    let comboTotalTurns = 0;
    let validGames = 0;

    for (let g = 0; g < GAME_COUNT; g++) {
        try {
            const { finalState, turns } = simulateGame({
                playerCount: PLAYER_COUNT,
                gameLayers,
                gameMode: 'basic',
                decisionFn: heuristicDecisionFn,
                actionPickerFn: pickAction,
                maxTurns: 300
            });

            if (!finalState.gameOver && finalState.round < 3) {
                results.errors++;
                continue;
            }

            validGames++;
            comboTotalTurns += turns;

            // Find winner
            const sorted = [...finalState.players].sort((a, b) => b.victoryPoints - a.victoryPoints);
            const winnerId = sorted[0].id;
            results.wins[winnerId - 1]++;

            // VP spread
            const spread = sorted[0].victoryPoints - sorted[sorted.length - 1].victoryPoints;
            comboTotalVPSpread += spread;
            vpSpreads.push(spread);

            // Avg VP per player position
            finalState.players.forEach((p, i) => {
                results.avgVP[i] += p.victoryPoints;
            });

            // Track layer wins
            combo.forEach(color => {
                layerGames[color] = (layerGames[color] || 0) + 1;
            });

            totalGames++;
        } catch (e) {
            results.errors++;
        }
    }

    if (validGames > 0) {
        results.avgSpread = (comboTotalVPSpread / validGames).toFixed(1);
        results.avgTurns = (comboTotalTurns / validGames).toFixed(0);
        results.avgVP = results.avgVP.map(vp => (vp / validGames).toFixed(1));
    }

    comboResults.push(results);
}

// --- Print combo results ---
console.log('LAYER COMBINATION RESULTS');
console.log('-'.repeat(70));
console.log(
    'Combo'.padEnd(25),
    'P1 Win%'.padEnd(10),
    'P2 Win%'.padEnd(10),
    'Avg Spread'.padEnd(12),
    'Avg VP'.padEnd(15),
    'Turns'.padEnd(8),
    'Errors'
);
console.log('-'.repeat(70));

// Sort by VP spread (highest first — most imbalanced)
comboResults.sort((a, b) => parseFloat(b.avgSpread) - parseFloat(a.avgSpread));

for (const r of comboResults) {
    const p1WinPct = ((r.wins[0] / GAME_COUNT) * 100).toFixed(0) + '%';
    const p2WinPct = ((r.wins[1] / GAME_COUNT) * 100).toFixed(0) + '%';
    console.log(
        r.combo.padEnd(25),
        p1WinPct.padEnd(10),
        p2WinPct.padEnd(10),
        r.avgSpread.toString().padEnd(12),
        `${r.avgVP[0]}/${r.avgVP[1]}`.padEnd(15),
        r.avgTurns.toString().padEnd(8),
        r.errors.toString()
    );
}

// --- Analysis 2: Per-layer aggregate stats ---
console.log('');
console.log('PER-LAYER AGGREGATE');
console.log('-'.repeat(50));

// Calculate average VP when each layer is present
const layerAvgVP = {};
for (const r of comboResults) {
    const colors = r.combo.split('+');
    const avgVP = (parseFloat(r.avgVP[0]) + parseFloat(r.avgVP[1])) / 2;
    colors.forEach(color => {
        if (!layerAvgVP[color]) layerAvgVP[color] = [];
        layerAvgVP[color].push(avgVP);
    });
}

const layerStats = Object.entries(layerAvgVP).map(([color, vpValues]) => ({
    color,
    avgVP: (vpValues.reduce((s, v) => s + v, 0) / vpValues.length).toFixed(1),
    gamesIn: vpValues.length * GAME_COUNT
}));

layerStats.sort((a, b) => parseFloat(b.avgVP) - parseFloat(a.avgVP));

console.log('Color'.padEnd(12), 'Avg VP (when present)'.padEnd(25), 'Games');
console.log('-'.repeat(50));
for (const s of layerStats) {
    console.log(s.color.padEnd(12), s.avgVP.toString().padEnd(25), s.gamesIn.toString());
}

// --- Analysis 3: VP spread distribution ---
console.log('');
console.log('VP SPREAD DISTRIBUTION');
console.log('-'.repeat(40));
if (vpSpreads.length > 0) {
    vpSpreads.sort((a, b) => a - b);
    const median = vpSpreads[Math.floor(vpSpreads.length / 2)];
    const avg = (vpSpreads.reduce((s, v) => s + v, 0) / vpSpreads.length).toFixed(1);
    const min = vpSpreads[0];
    const max = vpSpreads[vpSpreads.length - 1];
    const p90 = vpSpreads[Math.floor(vpSpreads.length * 0.9)];

    console.log(`Games analyzed: ${vpSpreads.length}`);
    console.log(`Average spread: ${avg} VP`);
    console.log(`Median spread:  ${median} VP`);
    console.log(`Min spread:     ${min} VP`);
    console.log(`Max spread:     ${max} VP`);
    console.log(`90th pctl:      ${p90} VP`);

    // Bucket distribution
    const buckets = { '0-2': 0, '3-5': 0, '6-10': 0, '11-15': 0, '16-20': 0, '21+': 0 };
    for (const s of vpSpreads) {
        if (s <= 2) buckets['0-2']++;
        else if (s <= 5) buckets['3-5']++;
        else if (s <= 10) buckets['6-10']++;
        else if (s <= 15) buckets['11-15']++;
        else if (s <= 20) buckets['16-20']++;
        else buckets['21+']++;
    }
    console.log('');
    console.log('Spread buckets:');
    for (const [range, count] of Object.entries(buckets)) {
        const pct = ((count / vpSpreads.length) * 100).toFixed(0);
        const bar = '█'.repeat(Math.round(pct / 2));
        console.log(`  ${range.padEnd(6)} ${pct.padStart(3)}% ${bar}`);
    }
}

// --- Analysis 4: VP source breakdown ---
console.log('');
console.log('VP SOURCE BREAKDOWN (averaged across all games)');
console.log('-'.repeat(50));

const vpSourceTotals = {};
let vpSourceGameCount = 0;

for (const combo of basicCombos) {
    const gameLayers = {};
    combo.forEach(c => { gameLayers[c] = allGameLayers[c]; });

    // Run a smaller sample for VP source detail
    for (let g = 0; g < 20; g++) {
        try {
            const { finalState } = simulateGame({
                playerCount: PLAYER_COUNT,
                gameLayers,
                decisionFn: heuristicDecisionFn,
                actionPickerFn: pickAction,
                maxTurns: 300
            });

            if (!finalState.gameOver) continue;
            vpSourceGameCount++;

            for (const player of finalState.players) {
                for (const [source, amount] of Object.entries(player.vpSources || {})) {
                    vpSourceTotals[source] = (vpSourceTotals[source] || 0) + amount;
                }
            }
        } catch (e) { /* skip */ }
    }
}

if (vpSourceGameCount > 0) {
    const perGame = Object.entries(vpSourceTotals)
        .map(([source, total]) => ({
            source,
            perGame: (total / vpSourceGameCount / PLAYER_COUNT).toFixed(1)
        }))
        .sort((a, b) => parseFloat(b.perGame) - parseFloat(a.perGame));

    console.log('Source'.padEnd(25), 'Avg VP/player/game');
    console.log('-'.repeat(50));
    for (const s of perGame) {
        console.log(s.source.padEnd(25), s.perGame);
    }
}

console.log('');
console.log('='.repeat(70));
console.log('Analysis complete.');
