/**
 * Patrons v3 — State Helpers
 *
 * Pure immutable state mutation functions. Every function takes state,
 * returns new state. NO mutation.
 *
 * Zero React, zero Firebase, zero dispatch. Just state in -> state out.
 */

import { ACTIONS_PER_ROUND } from './data/constants.js';
import { powerCards } from './data/powerCards.js';

// --- Glory Management ---

export function addGlory(state, playerId, amount, source) {
  return {
    ...state,
    players: state.players.map(player => {
      if (player.id !== playerId) return player;
      return {
        ...player,
        glory: player.glory + amount,
        glorySources: {
          ...player.glorySources,
          [source]: (player.glorySources[source] || 0) + amount,
        },
      };
    }),
  };
}

export function removeGlory(state, playerId, amount, source) {
  // Tome of Deeds: glory reduction immunity
  if (hasModifier(state, playerId, 'glory_reduction_immunity')) {
    return state;
  }
  return {
    ...state,
    players: state.players.map(player => {
      if (player.id !== playerId) return player;
      const newGlory = Math.max(0, player.glory - amount);
      return {
        ...player,
        glory: newGlory,
        glorySources: {
          ...player.glorySources,
          [source]: (player.glorySources[source] || 0) - amount,
        },
      };
    }),
  };
}

// --- Resource Management ---

export function addResources(state, playerId, resources) {
  // Check for doubleNextGain effect
  const player = state.players.find(p => p.id === playerId);
  const hasDouble = player?.effects?.includes('doubleNextGain');

  // Apply doubling if active
  const effectiveResources = hasDouble
    ? Object.fromEntries(Object.entries(resources).map(([c, a]) => [c, a * 2]))
    : resources;

  const gainedResources = {};
  Object.entries(effectiveResources).forEach(([color, amount]) => {
    if (amount > 0) gainedResources[color] = amount;
  });

  // Track turn resource gains
  const prevTurnGains = state.turnResourceGains || {};
  const prevPlayerGains = prevTurnGains[playerId] || {};
  const newPlayerGains = { ...prevPlayerGains };
  Object.entries(gainedResources).forEach(([color, amount]) => {
    newPlayerGains[color] = (newPlayerGains[color] || 0) + amount;
  });

  return {
    ...state,
    turnResourceGains: {
      ...prevTurnGains,
      [playerId]: newPlayerGains,
    },
    players: state.players.map(p => {
      if (p.id === playerId) {
        const newResources = { ...p.resources };
        Object.entries(effectiveResources).forEach(([color, amount]) => {
          newResources[color] = Math.max(0, (newResources[color] || 0) + amount);
        });
        // Consume the doubleNextGain effect (remove first occurrence)
        let newEffects = p.effects;
        if (hasDouble) {
          newEffects = [...(p.effects || [])];
          const idx = newEffects.indexOf('doubleNextGain');
          if (idx >= 0) newEffects.splice(idx, 1);
        }
        return {
          ...p,
          resources: newResources,
          lastGain: Object.keys(gainedResources).length > 0 ? gainedResources : p.lastGain,
          ...(hasDouble ? { effects: newEffects } : {}),
        };
      } else if (Object.keys(gainedResources).length > 0) {
        return { ...p, lastGain: gainedResources };
      }
      return p;
    }),
  };
}

export function removeResources(state, playerId, resources) {
  const negated = {};
  Object.entries(resources).forEach(([color, amount]) => {
    negated[color] = -Math.abs(amount);
  });
  // Use inline logic instead of addResources to avoid tracking negative gains
  return {
    ...state,
    players: state.players.map(player => {
      if (player.id !== playerId) return player;
      const newResources = { ...player.resources };
      Object.entries(negated).forEach(([color, amount]) => {
        newResources[color] = Math.max(0, (newResources[color] || 0) + amount);
      });
      return { ...player, resources: newResources };
    }),
  };
}

// --- Player Queries ---

export function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

export function getOtherPlayers(state, playerId) {
  return state.players.filter(p => p.id !== playerId);
}

// --- Modifier System ---

export function hasModifier(state, playerId, modifierType) {
  const champion = state.champions[playerId];
  if (!champion || !champion.powerCards) return false;

  return champion.powerCards.some(cardId => {
    const card = powerCards[cardId];
    if (!card || !card.modifiers) return false;
    return card.modifiers.some(mod => mod.type === modifierType);
  });
}

// --- Power Card Management ---

export function slotPowerCard(state, playerId, cardId) {
  const champion = state.champions[playerId];
  if (!champion) return state;

  return {
    ...state,
    champions: {
      ...state.champions,
      [playerId]: {
        ...champion,
        powerCards: [...(champion.powerCards || []), cardId],
      },
    },
  };
}

export function removePowerCard(state, playerId, cardId) {
  const champion = state.champions[playerId];
  if (!champion) return state;

  return {
    ...state,
    champions: {
      ...state.champions,
      [playerId]: {
        ...champion,
        powerCards: (champion.powerCards || []).filter(id => id !== cardId),
      },
    },
  };
}

// --- God Access Tracking ---

export function trackGodAccess(state, playerId, godColor) {
  const accessed = state.godsAccessedThisTurn || [];
  if (accessed.includes(godColor)) return state;
  return {
    ...state,
    godsAccessedThisTurn: [...accessed, godColor],
  };
}

export function canAccessGod(state, playerId, godColor) {
  const accessed = state.godsAccessedThisTurn || [];
  return accessed.includes(godColor);
}

// --- Worker Placement ---

export function placeWorker(state, actionId, playerId) {
  return {
    ...state,
    occupiedSpaces: { ...state.occupiedSpaces, [actionId]: playerId },
    workerPlacedThisTurn: true,
    turnActionsThisTurn: [...(state.turnActionsThisTurn || []), actionId],
    players: state.players.map(player => {
      if (player.id !== playerId) return player;
      return { ...player, workersLeft: player.workersLeft - 1 };
    }),
  };
}

// --- Game Initialization ---

export function createV3Player(id, name, emoji, isAI, championId, activeColors) {
  const resources = {};
  activeColors.forEach(color => {
    resources[color] = 0;
  });

  return {
    id,
    name,
    emoji,
    isAI,
    resources,
    workersLeft: ACTIONS_PER_ROUND[0],
    effects: [],
    glory: 0,
    glorySources: {},
    shopCostModifier: 0,
    lastGain: {},
    extraTurns: 0,
  };
}

export function createV3GameState({ playerCount, playerNames, godSet, gameMode }) {
  const activeColors = godSet || ['gold', 'black', 'green', 'yellow'];
  const defaultNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
  const defaultEmojis = ['🦊', '🐉', '🦅', '🐺'];

  const players = [];
  for (let i = 0; i < playerCount; i++) {
    const name = (playerNames && playerNames[i]) || defaultNames[i];
    const emoji = defaultEmojis[i];
    players.push(createV3Player(i + 1, name, emoji, false, null, activeColors));
  }

  const turnOrder = [];
  for (let i = 1; i <= playerCount; i++) {
    turnOrder.push(i);
  }

  return {
    currentPlayer: 1,
    turnDirection: 1,
    gameMode: gameMode || 'standard',
    players,
    occupiedSpaces: {},
    round: 1,
    turnOrder,
    workerPlacedThisTurn: false,
    purchaseMadeThisTurn: false,
    workersToPlace: 1,
    actionLog: [],
    gameStarted: true,
    gameOver: false,
    skippedTurns: {},
    playersOutOfWorkers: [],
    roundActions: [],
    phase: 'champion_draft',
    gods: activeColors,
    champions: {},
    eventHandlers: [],
    decisionQueue: [],
    turnResourceGains: {},
    turnActionsThisTurn: [],
    godsAccessedThisTurn: [],
    nullifiedSpaces: {},
    glory: {},
  };
}

// --- Utility ---

export function formatResources(resources) {
  return Object.entries(resources)
    .filter(([_, amount]) => amount > 0)
    .map(([color, amount]) => `${amount} ${color}`)
    .join(', ');
}

export function createResult(state, log = []) {
  return { state, log: Array.isArray(log) ? log : [log] };
}

export function createDecisionRequest(state, log = [], pendingDecision) {
  return {
    state,
    log: Array.isArray(log) ? log : [log],
    pendingDecision,
  };
}
