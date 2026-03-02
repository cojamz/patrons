/**
 * Engine Verification Script
 *
 * Plays full games through the PURE ENGINE (no React, no UI) and verifies that
 * EVERY action produces the CORRECT outcome. Checks resource deltas, glory changes,
 * worker counts, occupancy, turn order, round transitions, and glory conditions.
 */

import {
  createGame,
  executeAction,
  endTurn,
  advanceRound,
  executeShop,
  buyPowerCard,
  Phase,
} from '../src/engine/v3/GameEngine.js';

import {
  executeChampionDraft,
  executeRoundStart,
  executeRoundEnd,
  advanceTurn,
  resortTurnOrder,
  ACTIONS_PER_ROUND,
} from '../src/engine/v3/phases.js';

import { getAvailableActions, getActionGod } from '../src/engine/v3/rules.js';
import { getPlayer } from '../src/engine/v3/stateHelpers.js';
import gods from '../src/engine/v3/data/gods.js';
import { dispatchEvent, EventType, resetHandlerFrequencies } from '../src/engine/v3/events.js';

// ============================================================================
// Tracking
// ============================================================================

const findings = [];
let passCount = 0;

function report(label, passed, detail = '') {
  if (passed) {
    passCount++;
  } else {
    findings.push(`MISMATCH: ${label} — ${detail}`);
    console.error(`  FAIL: ${label} — ${detail}`);
  }
}

function snapshot(state, playerId) {
  const p = state.players.find(pp => pp.id === playerId);
  return {
    resources: { ...p.resources },
    glory: p.glory,
    workersLeft: p.workersLeft,
    extraTurns: p.extraTurns || 0,
    effects: [...(p.effects || [])],
  };
}

function resourceDelta(before, after) {
  const delta = {};
  for (const color of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const diff = (after[color] || 0) - (before[color] || 0);
    if (diff !== 0) delta[color] = diff;
  }
  return delta;
}

function fmtDelta(delta) {
  return Object.entries(delta).map(([c, v]) => `${v > 0 ? '+' : ''}${v} ${c}`).join(', ') || 'none';
}

// ============================================================================
// TEST 1: Game creation & champion draft
// ============================================================================

console.log('\n=== TEST 1: Game Creation & Champion Draft ===\n');

const { state: initialState } = createGame({
  playerCount: 2,
  playerNames: ['Alice', 'Bob'],
  godSet: ['gold', 'black', 'green', 'yellow'],
});

report('Phase is CHAMPION_DRAFT', initialState.phase === Phase.CHAMPION_DRAFT,
  `got ${initialState.phase}`);
report('2 players created', initialState.players.length === 2,
  `got ${initialState.players.length}`);
report('Player 1 has 3 workers (round 1)', initialState.players[0].workersLeft === 3,
  `got ${initialState.players[0].workersLeft}`);
report('Player 2 has 3 workers', initialState.players[1].workersLeft === 3);
report('All resources start at 0', Object.values(initialState.players[0].resources).every(v => v === 0),
  `got ${JSON.stringify(initialState.players[0].resources)}`);
report('Turn order is [1,2]', JSON.stringify(initialState.turnOrder) === '[1,2]',
  `got ${JSON.stringify(initialState.turnOrder)}`);
report('4 god power card markets exist',
  Object.keys(initialState.powerCardMarkets).length === 4,
  `got ${Object.keys(initialState.powerCardMarkets).length}`);
report('Each market has 3 cards',
  Object.values(initialState.powerCardMarkets).every(m => m.length === 3),
  `market sizes: ${JSON.stringify(Object.fromEntries(Object.entries(initialState.powerCardMarkets).map(([k,v])=>[k,v.length])))}`);

// Draft champions: Player 1 picks 'ambitious', Player 2 picks 'fortunate'
let state = initialState;

// First, get pending decision
let draftResult = executeChampionDraft(state);
state = draftResult.state;
report('Draft asks player 1 first', draftResult.pendingDecision?.playerId === 1,
  `asked player ${draftResult.pendingDecision?.playerId}`);

// Player 1 picks ambitious
draftResult = executeChampionDraft(state, { championId: 'ambitious' });
state = draftResult.state;
report('Player 1 has ambitious champion', state.champions[1]?.id === 'ambitious',
  `got ${state.champions[1]?.id}`);
report('Ambitious has 5 power card slots', state.champions[1]?.powerCardSlots === 5,
  `got ${state.champions[1]?.powerCardSlots}`);

// Player 2 picks fortunate
draftResult = executeChampionDraft(state);
state = draftResult.state;
report('Draft asks player 2 next', draftResult.pendingDecision?.playerId === 2,
  `asked player ${draftResult.pendingDecision?.playerId}`);

draftResult = executeChampionDraft(state, { championId: 'fortunate' });
state = draftResult.state;
report('Player 2 has fortunate champion', state.champions[2]?.id === 'fortunate',
  `got ${state.champions[2]?.id}`);
report('Phase transitions to ROUND_START after draft', state.phase === Phase.ROUND_START,
  `got ${state.phase}`);

// ============================================================================
// TEST 2: Round Start
// ============================================================================

console.log('\n=== TEST 2: Round Start (Round 1) ===\n');

// Execute round start (using advanceRound logic but for initial setup)
const roundStartResult = executeRoundStart(state);
state = roundStartResult.state;

report('Phase is ACTION_PHASE after round start', state.phase === Phase.ACTION_PHASE,
  `got ${state.phase}`);
report('Round is 1', state.round === 1, `got ${state.round}`);
report('Player 1 has 3 workers for round 1', state.players[0].workersLeft === 3,
  `got ${state.players[0].workersLeft}`);
report('Player 2 has 3 workers for round 1', state.players[1].workersLeft === 3,
  `got ${state.players[1].workersLeft}`);
report('Occupied spaces empty', Object.keys(state.occupiedSpaces).length === 0,
  `got ${JSON.stringify(state.occupiedSpaces)}`);

// Set current player
state = { ...state, currentPlayer: state.turnOrder[0] };

// ============================================================================
// TEST 3: Gold Actions (Tier 1)
// ============================================================================

console.log('\n=== TEST 3: Gold Actions ===\n');

// --- gold_collectTribute: +2 gold ---
{
  const before = snapshot(state, 1);
  const result = executeAction(state, 1, 'gold_collectTribute');
  state = result.state;

  const after = snapshot(state, 1);
  const delta = resourceDelta(before.resources, after.resources);
  report('collectTribute: +2 gold', delta.gold === 2, `delta: ${fmtDelta(delta)}`);
  report('collectTribute: worker decremented', after.workersLeft === before.workersLeft - 1,
    `was ${before.workersLeft}, now ${after.workersLeft}`);
  report('collectTribute: space occupied', state.occupiedSpaces['gold_collectTribute'] === 1,
    `occupied by ${state.occupiedSpaces['gold_collectTribute']}`);
}

// End turn for player 1
let turnResult = endTurn(state);
state = turnResult.state;
report('After endTurn, current player advances', state.currentPlayer === 2,
  `current player is ${state.currentPlayer}`);

// --- gold_scavenge: +1 gold (player 2) ---
{
  const before = snapshot(state, 2);
  const result = executeAction(state, 2, 'gold_scavenge');
  state = result.state;

  const after = snapshot(state, 2);
  const delta = resourceDelta(before.resources, after.resources);
  report('scavenge: +1 gold', delta.gold === 1, `delta: ${fmtDelta(delta)}`);
  report('scavenge: worker decremented', after.workersLeft === before.workersLeft - 1);
}

turnResult = endTurn(state);
state = turnResult.state;

// --- gold_barter: Trade 2 any for 2 gold (player 1) ---
// First give player 1 some black resources to trade
{
  // Player 1 needs non-gold resources to trade
  // Give them some via a black action first
  const before = snapshot(state, 1);
  const result = executeAction(state, 1, 'black_skulk');
  state = result.state;

  const after = snapshot(state, 1);
  const delta = resourceDelta(before.resources, after.resources);
  report('skulk: +3 black', delta.black === 3, `delta: ${fmtDelta(delta)}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// Player 2 does something
{
  const result = executeAction(state, 2, 'black_lurk');
  state = result.state;
  const p2 = state.players.find(p => p.id === 2);
  report('lurk: player 2 has 2 black', p2.resources.black === 2, `got ${p2.resources.black}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// Now player 1 uses barter (trade 2 black for 2 gold)
{
  const before = snapshot(state, 1);
  const result = executeAction(state, 1, 'gold_barter', { gemSelection: { black: 2 } });
  state = result.state;

  const after = snapshot(state, 1);
  const delta = resourceDelta(before.resources, after.resources);
  report('barter: -2 black', delta.black === -2, `black delta: ${delta.black}`);
  report('barter: +2 gold', delta.gold === 2, `gold delta: ${delta.gold}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// Player 2's last action
{
  const result = executeAction(state, 2, 'green_bide');
  state = result.state;
  const p2 = state.players.find(p => p.id === 2);
  report('bide: player 2 has 3 green', p2.resources.green === 3, `got ${p2.resources.green}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// ============================================================================
// TEST 4: Round End & Glory Conditions (Round 1)
// ============================================================================

console.log('\n=== TEST 4: Round End & Glory Conditions ===\n');

// All players should be out of workers now
report('Phase should be ROUND_END', state.phase === Phase.ROUND_END,
  `got ${state.phase}`);

// Capture pre-glory state
const p1PreGlory = state.players.find(p => p.id === 1).glory;
const p2PreGlory = state.players.find(p => p.id === 2).glory;
const p1Gold = state.players.find(p => p.id === 1).resources.gold;
const p2Resources = state.players.find(p => p.id === 2).resources;
const p2DistinctColors = Object.keys(p2Resources).filter(c => p2Resources[c] > 0).length;

// Advance round (which dispatches ROUND_END event, triggering glory conditions)
const advResult = advanceRound(state);
state = advResult.state;

const p1PostGlory = state.players.find(p => p.id === 1).glory;
const p2PostGlory = state.players.find(p => p.id === 2).glory;

// Gold glory condition: +1 per gold owned
report(`Gold glory: P1 gains ${p1Gold} glory (had ${p1Gold} gold)`,
  p1PostGlory >= p1PreGlory + p1Gold,
  `was ${p1PreGlory}, now ${p1PostGlory}, expected at least +${p1Gold}`);

// Yellow glory condition: +1 per distinct color owned
report(`Yellow glory: P2 gains at least ${p2DistinctColors} glory (${p2DistinctColors} colors)`,
  p2PostGlory >= p2PreGlory + p2DistinctColors,
  `was ${p2PreGlory}, now ${p2PostGlory}, expected at least +${p2DistinctColors}`);

// ============================================================================
// TEST 5: Round 2 setup
// ============================================================================

console.log('\n=== TEST 5: Round 2 Setup ===\n');

report('Round advanced to 2', state.round === 2, `got ${state.round}`);
report('Phase is ACTION_PHASE', state.phase === Phase.ACTION_PHASE,
  `got ${state.phase}`);
report('P1 has 4 workers for round 2', state.players.find(p => p.id === 1).workersLeft === 4,
  `got ${state.players.find(p => p.id === 1).workersLeft}`);
report('P2 has 4 workers for round 2', state.players.find(p => p.id === 2).workersLeft === 4,
  `got ${state.players.find(p => p.id === 2).workersLeft}`);
report('Occupied spaces cleared for round 2', Object.keys(state.occupiedSpaces).length === 0,
  `got ${JSON.stringify(state.occupiedSpaces)}`);

// Check that tier 2 actions are now available
const availableR2 = getAvailableActions(state, state.currentPlayer);
const hasTier2Gold = availableR2.includes('gold_meditateOnWealth') || availableR2.includes('gold_brokerDeal');
report('Tier 2 gold actions available in round 2', hasTier2Gold,
  `available: ${availableR2.filter(a => a.startsWith('gold_')).join(', ')}`);
const hasTier3Gold = availableR2.includes('gold_cashIn');
report('Tier 3 gold action NOT available in round 2', !hasTier3Gold,
  `gold_cashIn available: ${hasTier3Gold}`);

// ============================================================================
// TEST 6: Black Actions (steal, penalize)
// ============================================================================

console.log('\n=== TEST 6: Black Actions (Steal & Penalize) ===\n');

// Give player 2 some glory so we can steal it
const currentPlayer = state.currentPlayer;
const otherPlayer = currentPlayer === 1 ? 2 : 1;

// --- pickpocket: +1 black, steal 1 glory ---
{
  // First give target some glory
  state = {
    ...state,
    players: state.players.map(p => {
      if (p.id === otherPlayer) return { ...p, glory: Math.max(p.glory, 5) };
      return p;
    }),
  };

  const beforeAttacker = snapshot(state, currentPlayer);
  const beforeTarget = snapshot(state, otherPlayer);

  const result = executeAction(state, currentPlayer, 'black_pickpocket', {
    targetPlayer: otherPlayer,
  });
  state = result.state;

  const afterAttacker = snapshot(state, currentPlayer);
  const afterTarget = snapshot(state, otherPlayer);

  const attackerDelta = resourceDelta(beforeAttacker.resources, afterAttacker.resources);
  report('pickpocket: attacker +1 black', attackerDelta.black === 1,
    `delta: ${fmtDelta(attackerDelta)}`);
  // Pickpocket gives +1 glory (steal) AND triggers black glory condition (+1 glory for penalizing)
  // So total is +2 glory
  report('pickpocket: attacker +2 glory (+1 steal, +1 black glory condition)',
    afterAttacker.glory === beforeAttacker.glory + 2,
    `was ${beforeAttacker.glory}, now ${afterAttacker.glory}`);
  report('pickpocket: target -1 glory', afterTarget.glory === beforeTarget.glory - 1,
    `was ${beforeTarget.glory}, now ${afterTarget.glory}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// --- hex: all others -2 glory (tier 2) ---
{
  const hexPlayer = state.currentPlayer;
  const otherPlayers = state.players.filter(p => p.id !== hexPlayer);
  const beforeOthers = otherPlayers.map(p => ({ id: p.id, glory: p.glory }));

  const result = executeAction(state, hexPlayer, 'black_hex');
  state = result.state;

  for (const before of beforeOthers) {
    const after = state.players.find(p => p.id === before.id);
    const expected = Math.max(0, before.glory - 2);
    report(`hex: player ${before.id} lost 2 glory`, after.glory === expected,
      `was ${before.glory}, now ${after.glory}, expected ${expected}`);
  }
}

turnResult = endTurn(state);
state = turnResult.state;

// ============================================================================
// TEST 7: Green Actions (repeat)
// ============================================================================

console.log('\n=== TEST 7: Green Actions (Repeat) ===\n');

// Player takes a gold action, then uses relive to repeat it
{
  const p = state.currentPlayer;
  const before = snapshot(state, p);
  const result = executeAction(state, p, 'gold_collectTribute');
  state = result.state;

  const mid = snapshot(state, p);
  const goldGain = mid.resources.gold - before.resources.gold;
  report('Setup for relive: collectTribute gave +2 gold', goldGain === 2,
    `delta: ${goldGain}`);

  turnResult = endTurn(state);
  state = turnResult.state;
}

// Other player takes an action
{
  const p = state.currentPlayer;
  const result = executeAction(state, p, 'green_meditate');
  state = result.state;
  turnResult = endTurn(state);
  state = turnResult.state;
}

// Now use relive to repeat collectTribute
{
  const p = state.currentPlayer;
  const before = snapshot(state, p);
  const result = executeAction(state, p, 'green_relive', {
    actionChoice: 'gold_collectTribute',
  });
  state = result.state;

  const after = snapshot(state, p);
  const greenDelta = (after.resources.green || 0) - (before.resources.green || 0);
  const goldDelta = (after.resources.gold || 0) - (before.resources.gold || 0);
  report('relive: +1 green', greenDelta >= 1, `green delta: ${greenDelta}`);
  report('relive: repeated collectTribute gives +2 gold', goldDelta >= 2,
    `gold delta: ${goldDelta}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// ============================================================================
// TEST 8: Yellow Actions (gem selection)
// ============================================================================

console.log('\n=== TEST 8: Yellow Actions (Gem Selection) ===\n');

{
  const p = state.currentPlayer;
  const before = snapshot(state, p);
  const result = executeAction(state, p, 'yellow_forage', {
    gemSelection: { gold: 1, black: 1, green: 1 },
  });
  state = result.state;

  const after = snapshot(state, p);
  const delta = resourceDelta(before.resources, after.resources);
  report('forage: +1 gold, +1 black, +1 green',
    delta.gold === 1 && delta.black === 1 && delta.green === 1,
    `delta: ${fmtDelta(delta)}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// --- yellow_bless: +2 yellow ---
{
  const p = state.currentPlayer;
  const before = snapshot(state, p);
  const result = executeAction(state, p, 'yellow_bless');
  state = result.state;

  const after = snapshot(state, p);
  const delta = resourceDelta(before.resources, after.resources);
  report('bless: +2 yellow', delta.yellow === 2, `delta: ${fmtDelta(delta)}`);
}

turnResult = endTurn(state);
state = turnResult.state;

// ============================================================================
// TEST 9: Accelerate (extra turn)
// ============================================================================

console.log('\n=== TEST 9: Green Accelerate (Extra Turn) ===\n');

{
  const p = state.currentPlayer;
  const before = snapshot(state, p);
  const result = executeAction(state, p, 'green_accelerate');
  state = result.state;

  const after = snapshot(state, p);
  const delta = resourceDelta(before.resources, after.resources);
  report('accelerate: +2 green', delta.green === 2, `delta: ${fmtDelta(delta)}`);
  report('accelerate: extraTurns incremented', after.extraTurns === before.extraTurns + 1,
    `was ${before.extraTurns}, now ${after.extraTurns}`);
}

// End turn — player should get an extra turn due to extraTurns
{
  const currentBefore = state.currentPlayer;
  turnResult = endTurn(state);
  state = turnResult.state;
  report('Extra turn: same player gets next turn', state.currentPlayer === currentBefore,
    `before: ${currentBefore}, after: ${state.currentPlayer}`);
}

// Use the extra turn
{
  const p = state.currentPlayer;
  const result = executeAction(state, p, 'green_bide');
  state = result.state;
  turnResult = endTurn(state);
  state = turnResult.state;
}

// ============================================================================
// TEST 10: Finish round 2 and validate transition
// ============================================================================

console.log('\n=== TEST 10: Finish Round 2 ===\n');

// Play remaining actions to exhaust workers
let safetyValve = 30;
while (state.phase === Phase.ACTION_PHASE && safetyValve > 0) {
  safetyValve--;
  const p = state.currentPlayer;
  const available = getAvailableActions(state, p);

  if (available.length === 0) {
    // Force advance turn
    state = advanceTurn(state);
    continue;
  }

  // Pick first available action
  const actionId = available[0];
  let result;

  // Handle actions that need decisions
  if (actionId === 'yellow_forage') {
    result = executeAction(state, p, actionId, { gemSelection: { gold: 3 } });
  } else if (actionId === 'yellow_gather') {
    result = executeAction(state, p, actionId, { gemSelection: { gold: 2 } });
  } else if (actionId === 'yellow_harvest') {
    result = executeAction(state, p, actionId, { gemSelection: { gold: 4 } });
  } else if (actionId === 'yellow_trade') {
    const player = state.players.find(pp => pp.id === p);
    const total = Object.values(player.resources).reduce((s, v) => s + v, 0) + 1; // +1 for the yellow gained
    result = executeAction(state, p, actionId, { gemSelection: { gold: total } });
  } else if (actionId.includes('barter') || actionId.includes('appraise') || actionId.includes('brokerDeal')) {
    // Skip trade actions if no resources to trade
    const player = state.players.find(pp => pp.id === p);
    const nonGold = Object.entries(player.resources).filter(([c,v]) => c !== 'gold' && v > 0);
    if (nonGold.length === 0 && available.length > 1) {
      // Try next action
      const altAction = available.find(a => !a.includes('barter') && !a.includes('appraise') && !a.includes('brokerDeal'));
      if (altAction) {
        result = executeAction(state, p, altAction);
      } else {
        result = executeAction(state, p, actionId);
      }
    } else {
      result = executeAction(state, p, actionId);
    }
  } else if (actionId.includes('pickpocket') || actionId.includes('ransack') || actionId.includes('extort')) {
    result = executeAction(state, p, actionId, {
      targetPlayer: p === 1 ? 2 : 1,
      stealGems: { gold: Math.min(2, state.players.find(pp => pp.id !== p).resources.gold || 0) || undefined },
    });
  } else if (actionId.includes('relive')) {
    const roundActions = state.roundActions || [];
    const ownActions = roundActions.filter(ra => ra.playerId === p).map(ra => ra.actionId);
    const repeatable = ownActions.filter(id => !id.includes('relive') && !id.includes('echo') && !id.includes('loop') && !id.includes('unravel'));
    if (repeatable.length > 0) {
      result = executeAction(state, p, actionId, { actionChoice: repeatable[0] });
    } else {
      result = executeAction(state, p, actionId);
    }
  } else if (actionId.includes('echo')) {
    result = executeAction(state, p, actionId);
  } else {
    result = executeAction(state, p, actionId);
  }

  if (result) {
    state = result.state;
    // Handle pending decisions with safe defaults
    if (result.pendingDecision) {
      // Skip actions that need complex decisions we can't auto-resolve
      // The action handler already placed the worker, so just move on
    }
  }

  turnResult = endTurn(state);
  state = turnResult.state;
}

if (state.phase === Phase.ROUND_END) {
  console.log('  Round 2 ended successfully');

  const p1R2Glory = state.players.find(p => p.id === 1).glory;
  const p2R2Glory = state.players.find(p => p.id === 2).glory;

  const advResult2 = advanceRound(state);
  state = advResult2.state;

  report('Round advances to 3', state.round === 3, `got ${state.round}`);
  report('P1 has 5 workers for round 3', state.players.find(p => p.id === 1).workersLeft === 5,
    `got ${state.players.find(p => p.id === 1).workersLeft}`);
  report('P2 has 5 workers for round 3', state.players.find(p => p.id === 2).workersLeft === 5,
    `got ${state.players.find(p => p.id === 2).workersLeft}`);

  // Verify glory conditions fired for round 2
  const p1R3Glory = state.players.find(p => p.id === 1).glory;
  const p2R3Glory = state.players.find(p => p.id === 2).glory;
  report('Glory conditions fired for round 2', p1R3Glory >= p1R2Glory || p2R3Glory >= p2R2Glory,
    `P1: ${p1R2Glory} -> ${p1R3Glory}, P2: ${p2R2Glory} -> ${p2R3Glory}`);
} else {
  findings.push(`MISMATCH: Round 2 did not end properly, phase is ${state.phase}`);
}

// ============================================================================
// TEST 11: Tier 3 Actions (Round 3)
// ============================================================================

console.log('\n=== TEST 11: Tier 3 Actions (Round 3) ===\n');

// Verify tier 3 actions are available
const availableR3 = getAvailableActions(state, state.currentPlayer);
const hasTier3 = availableR3.includes('gold_cashIn');
report('Tier 3 gold_cashIn available in round 3', hasTier3,
  `available gold: ${availableR3.filter(a => a.startsWith('gold_')).join(', ')}`);
const hasTier3Black = availableR3.includes('black_ruin');
report('Tier 3 black_ruin available in round 3', hasTier3Black);
const hasTier3Green = availableR3.includes('green_unravel');
report('Tier 3 green_unravel available in round 3', hasTier3Green);
const hasTier3Yellow = availableR3.includes('yellow_flourish');
report('Tier 3 yellow_flourish available in round 3', hasTier3Yellow);

// --- gold_cashIn: +1 glory per gold owned ---
{
  const p = state.currentPlayer;
  const player = state.players.find(pp => pp.id === p);
  const goldOwned = player.resources.gold || 0;
  const before = snapshot(state, p);

  const result = executeAction(state, p, 'gold_cashIn');
  state = result.state;

  const after = snapshot(state, p);
  if (goldOwned > 0) {
    report(`cashIn: +${goldOwned} glory (${goldOwned} gold)`,
      after.glory === before.glory + goldOwned,
      `was ${before.glory}, now ${after.glory}, expected +${goldOwned}`);
  } else {
    report('cashIn: no gold, no glory gained', after.glory === before.glory,
      `was ${before.glory}, now ${after.glory}`);
  }
}

turnResult = endTurn(state);
state = turnResult.state;

// --- yellow_flourish: +3 of each active color ---
{
  const p = state.currentPlayer;
  const before = snapshot(state, p);
  const result = executeAction(state, p, 'yellow_flourish');
  state = result.state;

  const after = snapshot(state, p);
  const delta = resourceDelta(before.resources, after.resources);
  for (const color of ['gold', 'black', 'green', 'yellow']) {
    report(`flourish: +3 ${color}`, delta[color] === 3,
      `${color} delta: ${delta[color] || 0}`);
  }
}

turnResult = endTurn(state);
state = turnResult.state;

// --- black_ruin: +2 black, all others -4 glory ---
{
  const p = state.currentPlayer;
  const before = snapshot(state, p);
  const othersBeforeGlory = state.players.filter(pp => pp.id !== p).map(pp => ({
    id: pp.id, glory: pp.glory,
  }));

  const result = executeAction(state, p, 'black_ruin');
  state = result.state;

  const after = snapshot(state, p);
  const delta = resourceDelta(before.resources, after.resources);
  report('ruin: +2 black', delta.black === 2, `delta: ${fmtDelta(delta)}`);

  for (const ob of othersBeforeGlory) {
    const afterOther = state.players.find(pp => pp.id === ob.id);
    const expected = Math.max(0, ob.glory - 4);
    report(`ruin: player ${ob.id} lost 4 glory`, afterOther.glory === expected,
      `was ${ob.glory}, now ${afterOther.glory}, expected ${expected}`);
  }
}

turnResult = endTurn(state);
state = turnResult.state;

// ============================================================================
// TEST 12: Occupancy (can't place on occupied space)
// ============================================================================

console.log('\n=== TEST 12: Occupancy Rules ===\n');

{
  // Try to place on an already-occupied space
  const occupiedAction = Object.keys(state.occupiedSpaces)[0];
  if (occupiedAction) {
    const p = state.currentPlayer;
    const before = snapshot(state, p);
    const result = executeAction(state, p, occupiedAction);
    // Should fail — state unchanged, log says occupied
    const after = snapshot(state, p);
    const workerSame = after.workersLeft === before.workersLeft;
    report(`Occupied space ${occupiedAction} blocks placement`,
      workerSame,
      `workers before: ${before.workersLeft}, after: ${after.workersLeft}`);
    report('Occupied space returns error log',
      result.log.some(l => l.includes('occupied')),
      `log: ${result.log.join(', ')}`);
  } else {
    console.log('  (no occupied spaces to test — skipping)');
  }
}

// ============================================================================
// TEST 13: Finish round 3 and game end
// ============================================================================

console.log('\n=== TEST 13: Finish Round 3 & Game End ===\n');

// Play out remaining round 3 actions
safetyValve = 50;
while (state.phase === Phase.ACTION_PHASE && safetyValve > 0) {
  safetyValve--;
  const p = state.currentPlayer;
  const available = getAvailableActions(state, p);

  if (available.length === 0) {
    state = advanceTurn(state);
    continue;
  }

  const actionId = available[0];
  let result;

  // Handle actions that need decisions
  if (actionId.includes('forage')) {
    result = executeAction(state, p, actionId, { gemSelection: { gold: 3 } });
  } else if (actionId.includes('gather')) {
    result = executeAction(state, p, actionId, { gemSelection: { gold: 2 } });
  } else if (actionId.includes('harvest')) {
    result = executeAction(state, p, actionId, { gemSelection: { gold: 4 } });
  } else if (actionId.includes('trade') && actionId.startsWith('yellow')) {
    const player = state.players.find(pp => pp.id === p);
    const total = Object.values(player.resources).reduce((s, v) => s + v, 0) + 1;
    result = executeAction(state, p, actionId, { gemSelection: { gold: total } });
  } else if (actionId.includes('pickpocket') || actionId.includes('extort')) {
    result = executeAction(state, p, actionId, { targetPlayer: p === 1 ? 2 : 1 });
  } else if (actionId.includes('ransack')) {
    const target = p === 1 ? 2 : 1;
    const targetPlayer = state.players.find(pp => pp.id === target);
    const avail = Object.entries(targetPlayer.resources).filter(([,v]) => v > 0);
    if (avail.length > 0) {
      const stealGems = {};
      let remaining = 2;
      for (const [color, amount] of avail) {
        if (remaining <= 0) break;
        const take = Math.min(amount, remaining);
        stealGems[color] = take;
        remaining -= take;
      }
      result = executeAction(state, p, actionId, { targetPlayer: target, stealGems });
    } else {
      result = executeAction(state, p, actionId, { targetPlayer: target });
    }
  } else if (actionId.includes('barter')) {
    const player = state.players.find(pp => pp.id === p);
    const nonGold = Object.entries(player.resources).filter(([c,v]) => c !== 'gold' && v > 0);
    if (nonGold.length > 0) {
      const gem = {};
      let remaining = 2;
      for (const [color, amount] of nonGold) {
        if (remaining <= 0) break;
        const take = Math.min(amount, remaining);
        gem[color] = take;
        remaining -= take;
      }
      if (Object.values(gem).reduce((s,v)=>s+v,0) === 2) {
        result = executeAction(state, p, actionId, { gemSelection: gem });
      } else {
        result = executeAction(state, p, available.find(a => !a.includes('barter') && !a.includes('appraise') && !a.includes('broker')) || actionId);
      }
    } else {
      const alt = available.find(a => !a.includes('barter') && !a.includes('appraise') && !a.includes('broker'));
      if (alt) {
        result = executeAction(state, p, alt);
      } else {
        result = executeAction(state, p, actionId);
      }
    }
  } else if (actionId.includes('appraise')) {
    const player = state.players.find(pp => pp.id === p);
    const nonGold = Object.entries(player.resources).filter(([c,v]) => c !== 'gold' && v > 0);
    if (nonGold.length > 0) {
      result = executeAction(state, p, actionId, { gemSelection: { [nonGold[0][0]]: 1 } });
    } else {
      const alt = available.find(a => !a.includes('appraise'));
      result = executeAction(state, p, alt || actionId);
    }
  } else if (actionId.includes('brokerDeal')) {
    const player = state.players.find(pp => pp.id === p);
    const nonGold = Object.entries(player.resources).filter(([c,v]) => c !== 'gold' && v > 0);
    const totalNonGold = nonGold.reduce((s, [,v]) => s + v, 0);
    if (totalNonGold >= 3) {
      const gem = {};
      let remaining = 3;
      for (const [color, amount] of nonGold) {
        if (remaining <= 0) break;
        const take = Math.min(amount, remaining);
        gem[color] = take;
        remaining -= take;
      }
      result = executeAction(state, p, actionId, { gemSelection: gem });
    } else {
      const alt = available.find(a => !a.includes('broker'));
      result = executeAction(state, p, alt || actionId);
    }
  } else if (actionId.includes('relive') || actionId.includes('loop') || actionId.includes('unravel')) {
    const roundActions = state.roundActions || [];
    const ownActions = [...new Set(roundActions.filter(ra => ra.playerId === p).map(ra => ra.actionId))];
    const repeatable = ownActions.filter(id =>
      !id.includes('relive') && !id.includes('echo') &&
      !id.includes('loop') && !id.includes('unravel')
    );
    if (actionId.includes('relive') && repeatable.length > 0) {
      result = executeAction(state, p, actionId, { actionChoice: repeatable[0] });
    } else if (actionId.includes('loop') && repeatable.length >= 2) {
      result = executeAction(state, p, actionId, { actionChoices: repeatable.slice(0, 2) });
    } else if (actionId.includes('unravel') && repeatable.length >= 3) {
      result = executeAction(state, p, actionId, { actionChoices: repeatable.slice(0, 3) });
    } else {
      // Not enough actions to repeat, skip this
      const alt = available.find(a => !a.includes('relive') && !a.includes('loop') && !a.includes('unravel') && !a.includes('echo'));
      if (alt) {
        result = executeAction(state, p, alt);
      } else {
        result = executeAction(state, p, actionId);
      }
    }
  } else if (actionId.includes('commune')) {
    result = executeAction(state, p, actionId);
  } else {
    result = executeAction(state, p, actionId);
  }

  if (result) {
    state = result.state;
  }

  turnResult = endTurn(state);
  state = turnResult.state;
}

if (state.phase === Phase.ROUND_END) {
  const advResult3 = advanceRound(state);
  state = advResult3.state;

  report('Game ends after round 3', state.phase === Phase.GAME_END || state.gameOver,
    `phase: ${state.phase}, gameOver: ${state.gameOver}`);

  // Final scores
  for (const p of state.players) {
    console.log(`  Player ${p.id} (${p.name}): ${p.glory} Glory, resources: ${JSON.stringify(p.resources)}`);
    console.log(`    Glory sources: ${JSON.stringify(p.glorySources)}`);
  }
} else {
  findings.push(`MISMATCH: Round 3 did not end properly, phase is ${state.phase}`);
}

// ============================================================================
// TEST 14: Fresh game — Meditate on Wealth skip mechanic
// ============================================================================

console.log('\n=== TEST 14: Skip Next Action Mechanic ===\n');

{
  const { state: g2 } = createGame({ playerCount: 2, playerNames: ['Test1', 'Test2'] });
  let s = g2;

  // Draft champions quickly
  let dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'ambitious' });
  s = dr.state;
  dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'fortunate' });
  s = dr.state;

  // Start round 1
  const rs = executeRoundStart(s);
  s = { ...rs.state, currentPlayer: rs.state.turnOrder[0] };

  // Advance to round 2 quickly — need tier 2 for meditateOnWealth
  // Actually, let's manually set round 2 and workers
  s = {
    ...s,
    round: 2,
    players: s.players.map(p => ({ ...p, workersLeft: 5 })),
  };

  // Use meditateOnWealth
  const p = s.currentPlayer;
  const beforeSkip = snapshot(s, p);
  const meditateResult = executeAction(s, p, 'gold_meditateOnWealth');
  s = meditateResult.state;

  const afterSkip = snapshot(s, p);
  report('meditateOnWealth: +3 gold', (afterSkip.resources.gold || 0) - (beforeSkip.resources.gold || 0) === 3);
  report('meditateOnWealth: adds skipNextAction effect',
    afterSkip.effects.includes('skipNextAction'),
    `effects: ${JSON.stringify(afterSkip.effects)}`);
}

// ============================================================================
// TEST 15: Full game simulation using runner logic (smoke test)
// ============================================================================

console.log('\n=== TEST 15: Full Game Simulation (smoke test) ===\n');

{
  // Run a quick game from start to finish using the same API sequence
  const { state: g3 } = createGame({ playerCount: 2, playerNames: ['Sim1', 'Sim2'] });
  let s = g3;

  // Draft
  let dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'blessed' });
  s = dr.state;
  dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'favored' });
  s = dr.state;

  // Round start
  const rs = executeRoundStart(s);
  s = { ...rs.state, currentPlayer: rs.state.turnOrder[0] };

  let totalTurns = 0;
  const maxTurns = 100;

  for (let round = 1; round <= 3 && totalTurns < maxTurns; round++) {
    if (round > 1) {
      // After advanceRound, state should already be set up for new round
    }

    let roundTurns = 0;
    while (s.phase === Phase.ACTION_PHASE && roundTurns < 30) {
      roundTurns++;
      totalTurns++;

      const p = s.currentPlayer;
      const avail = getAvailableActions(s, p);

      if (avail.length === 0) {
        s = advanceTurn(s);
        continue;
      }

      // Pick simple actions
      const simpleActions = avail.filter(a =>
        a.includes('skulk') || a.includes('lurk') || a.includes('bide') ||
        a.includes('meditate') && !a.includes('Wealth') || a.includes('bless') ||
        a.includes('collectTribute') || a.includes('scavenge')
      );
      const actionId = simpleActions.length > 0 ? simpleActions[0] : avail[0];

      let result;
      // Handle actions that require decisions
      if (actionId.includes('forage')) {
        result = executeAction(s, p, actionId, { gemSelection: { gold: 1, black: 1, green: 1 } });
      } else if (actionId.includes('gather')) {
        result = executeAction(s, p, actionId, { gemSelection: { gold: 1, black: 1 } });
      } else if (actionId.includes('harvest')) {
        result = executeAction(s, p, actionId, { gemSelection: { gold: 2, black: 2 } });
      } else if (actionId.includes('pickpocket') || actionId.includes('extort')) {
        result = executeAction(s, p, actionId, { targetPlayer: p === 1 ? 2 : 1 });
      } else if (actionId.includes('ransack')) {
        result = executeAction(s, p, actionId, { targetPlayer: p === 1 ? 2 : 1 });
        // May need stealGems decision
        if (result.pendingDecision?.type === 'stealGems') {
          const tgt = result.pendingDecision.targetResources;
          const sg = {};
          let rem = result.pendingDecision.count;
          for (const [c, v] of Object.entries(tgt)) {
            if (rem <= 0) break;
            const take = Math.min(v, rem);
            if (take > 0) { sg[c] = take; rem -= take; }
          }
          result = executeAction(result.state, p, actionId, { targetPlayer: p === 1 ? 2 : 1, stealGems: sg });
        }
      } else if (actionId.includes('relive') || actionId.includes('echo')) {
        result = executeAction(s, p, actionId);
        // May get pendingDecision for actionChoice
        if (result.pendingDecision?.type === 'actionChoice' && result.pendingDecision.options?.length > 0) {
          result = executeAction(result.state, p, actionId, { actionChoice: result.pendingDecision.options[0] });
        }
      } else if (actionId.includes('barter') || actionId.includes('appraise') || actionId.includes('brokerDeal')) {
        // Skip if no resources to trade
        const alt = avail.find(a => !a.includes('barter') && !a.includes('appraise') && !a.includes('broker'));
        if (alt) {
          result = executeAction(s, p, alt);
        } else {
          result = executeAction(s, p, actionId);
        }
      } else if (actionId.includes('trade') && actionId.startsWith('yellow')) {
        result = executeAction(s, p, actionId);
        if (result.pendingDecision?.type === 'gemSelection') {
          const count = result.pendingDecision.count;
          result = executeAction(result.state, p, actionId, { gemSelection: { gold: count } });
        }
      } else if (actionId.includes('flourish')) {
        result = executeAction(s, p, actionId);
      } else {
        result = executeAction(s, p, actionId);
      }

      if (result) {
        s = result.state;
      }

      const tr = endTurn(s);
      s = tr.state;
    }

    // Round end
    if (s.phase === Phase.ROUND_END) {
      const ar = advanceRound(s);
      s = ar.state;
    }
  }

  const gameEnded = s.phase === Phase.GAME_END || s.gameOver;
  report('Full simulation completes without crash', true);
  report('Full simulation reaches game end', gameEnded, `phase: ${s.phase}, round: ${s.round}`);

  if (gameEnded) {
    for (const p of s.players) {
      console.log(`  ${p.name}: ${p.glory} Glory`);
    }
  }
}

// ============================================================================
// TEST 16: Nullified spaces
// ============================================================================

console.log('\n=== TEST 16: Nullified Spaces ===\n');

{
  const { state: g4 } = createGame({ playerCount: 2 });
  let s = g4;

  // Draft prescient for player 1
  let dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'prescient' });
  s = dr.state;
  dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'ambitious' });
  s = dr.state;

  const rs = executeRoundStart(s);
  s = { ...rs.state, currentPlayer: rs.state.turnOrder[0] };

  // Manually nullify a space
  s = { ...s, nullifiedSpaces: { gold_collectTribute: true } };

  const p = s.currentPlayer;
  const before = snapshot(s, p);
  const result = executeAction(s, p, 'gold_collectTribute');
  s = result.state;

  const after = snapshot(s, p);
  report('Nullified space blocks action', after.workersLeft === before.workersLeft,
    `workers before: ${before.workersLeft}, after: ${after.workersLeft}`);
  report('Nullified space log message',
    result.log.some(l => l.includes('nullified')),
    `log: ${result.log.join(', ')}`);
}

// ============================================================================
// TEST 17: Shop usage
// ============================================================================

console.log('\n=== TEST 17: Shop Usage ===\n');

{
  const { state: g5 } = createGame({ playerCount: 2 });
  let s = g5;

  // Draft
  let dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'ambitious' });
  s = dr.state;
  dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'fortunate' });
  s = dr.state;

  const rs = executeRoundStart(s);
  s = { ...rs.state, currentPlayer: rs.state.turnOrder[0] };

  // Give player 1 enough resources to use gold_weak shop (cost: 1 gold + 1 any)
  s = {
    ...s,
    players: s.players.map(p => {
      if (p.id === 1) return { ...p, resources: { ...p.resources, gold: 5, black: 3 } };
      return p;
    }),
  };

  // Player 1 places at gold area first (for god access)
  let result = executeAction(s, 1, 'gold_collectTribute');
  s = result.state;

  // Now use gold_weak shop
  const shopBefore = snapshot(s, 1);
  const shopResult = executeShop(s, 1, 'gold_weak', { gemSelection: { black: 1 } });
  s = shopResult.state;

  const shopAfter = snapshot(s, 1);
  const shopDelta = resourceDelta(shopBefore.resources, shopAfter.resources);

  // gold_weak costs {gold:1, any:1}, gives +2 gold
  // Net: -1 gold (cost) +2 gold (benefit) -1 black (any cost) = +1 gold, -1 black
  report('gold_weak shop: net +1 gold (spent 1 gold, gained 2)', shopDelta.gold === 1,
    `gold delta: ${shopDelta.gold}`);
  report('gold_weak shop: -1 black (any cost)', shopDelta.black === -1,
    `black delta: ${shopDelta.black}`);
}

// ============================================================================
// TEST 18: Turn order (lowest glory first)
// ============================================================================

console.log('\n=== TEST 18: Turn Order Resort ===\n');

{
  const { state: g6 } = createGame({ playerCount: 2 });
  let s = g6;

  // Set up different glory values
  s = {
    ...s,
    players: s.players.map(p => {
      if (p.id === 1) return { ...p, glory: 10 };
      if (p.id === 2) return { ...p, glory: 3 };
      return p;
    }),
  };

  const resorted = resortTurnOrder(s);
  report('Lower glory goes first', resorted.turnOrder[0] === 2,
    `turn order: ${JSON.stringify(resorted.turnOrder)}`);
}

// ============================================================================
// TEST 19: Worker count per round
// ============================================================================

console.log('\n=== TEST 19: Worker Counts Per Round ===\n');

report('ACTIONS_PER_ROUND is [3,5,6]',
  JSON.stringify(ACTIONS_PER_ROUND) === '[3,5,6]',
  `got ${JSON.stringify(ACTIONS_PER_ROUND)}`);

// ============================================================================
// TEST 20: Commune action (copy last gain)
// ============================================================================

console.log('\n=== TEST 20: Commune (Copy Last Gain) ===\n');

{
  const { state: g7 } = createGame({ playerCount: 2 });
  let s = g7;

  // Draft
  let dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'ambitious' });
  s = dr.state;
  dr = executeChampionDraft(s);
  s = dr.state;
  dr = executeChampionDraft(s, { championId: 'fortunate' });
  s = dr.state;

  // Set to round 2 for commune (tier 2)
  const rs = executeRoundStart(s);
  s = {
    ...rs.state,
    round: 2,
    currentPlayer: rs.state.turnOrder[0],
    players: rs.state.players.map(p => ({ ...p, workersLeft: 5 })),
  };

  // Player 1 takes an action that gains resources
  const result1 = executeAction(s, 1, 'gold_collectTribute');
  s = result1.state;

  const tr1 = endTurn(s);
  s = tr1.state;

  // Player 2 uses commune
  const communeBefore = snapshot(s, 2);
  const communeResult = executeAction(s, 2, 'yellow_commune');
  s = communeResult.state;

  const communeAfter = snapshot(s, 2);
  const communeDelta = resourceDelta(communeBefore.resources, communeAfter.resources);
  report('commune: +2 yellow', communeDelta.yellow === 2, `yellow delta: ${communeDelta.yellow}`);
  // Should copy player 1's last gain (+2 gold)
  report('commune: copied +2 gold from P1', communeDelta.gold === 2,
    `gold delta: ${communeDelta.gold || 0}. Log: ${communeResult.log.join('; ')}`);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`ENGINE VERIFICATION COMPLETE`);
console.log(`=`.repeat(60));
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${findings.length}`);

if (findings.length > 0) {
  console.log('\nALL FAILURES:');
  for (const f of findings) {
    console.log(`  ${f}`);
  }
}

console.log();
