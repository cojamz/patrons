/**
 * Patrons v3 — Champion Definitions
 *
 * Pure data. No logic. Each champion has one passive ability
 * and a trigger type the event system uses to fire it.
 *
 * Champions are selected during game setup (before round 1).
 * Each player picks one champion, which determines their passive
 * and default power card slot count.
 */

import { EVENT_TYPES, POWER_CARD_SLOTS } from './constants.js';

const champions = [
  {
    id: 'prescient',
    name: 'The Prescient',
    passive: 'Place 2 action nullifiers before each round starts. Nullified spaces cannot be used that round.',
    passiveTrigger: EVENT_TYPES.ROUND_START,
    mechanicalNotes: 'Requires UI for nullifier placement. Nullifiers are placed face-down, revealed when a player attempts that action. Places 2 nullifiers per round.',
    powerCardSlots: POWER_CARD_SLOTS,
  },
  {
    id: 'ambitious',
    name: 'The Ambitious',
    passive: '+1 power card slot (5 total instead of 4).',
    passiveTrigger: EVENT_TYPES.GAME_START,
    mechanicalNotes: 'Static modifier applied at game start. No ongoing trigger needed — just increases the slot cap by 1.',
    powerCardSlots: POWER_CARD_SLOTS + 1,
  },
  {
    id: 'fortunate',
    name: 'The Fortunate',
    passive: 'Start the game with 2 resources of any color (player chooses).',
    passiveTrigger: EVENT_TYPES.GAME_START,
    mechanicalNotes: 'One-time resource grant at game start. Requires UI for color selection.',
    powerCardSlots: POWER_CARD_SLOTS,
  },
  {
    id: 'blessed',
    name: 'The Blessed',
    passive: 'Your first power card purchase costs 2 fewer resources (any combination).',
    passiveTrigger: EVENT_TYPES.ON_POWER_CARD_PURCHASE,
    mechanicalNotes: 'Triggers once on the first power card purchase only. Reduces total cost by 2 (player chooses which resources to skip). Tracked via a "used" flag.',
    powerCardSlots: POWER_CARD_SLOTS,
  },
  {
    id: 'favored',
    name: 'The Favored',
    passive: 'When you use a shop, gain +1 of that god\'s color resource.',
    passiveTrigger: EVENT_TYPES.ON_SHOP_USE,
    mechanicalNotes: 'Triggers every time this player uses any shop. The bonus resource color matches the god whose shop was used.',
    powerCardSlots: POWER_CARD_SLOTS,
  },
  {
    id: 'deft',
    name: 'The Deft',
    passive: 'In Round 1, take two consecutive turns (go again immediately after your first turn).',
    passiveTrigger: EVENT_TYPES.ROUND_START,
    mechanicalNotes: 'At round 1 start only, grants 1 extra turn via player.extraTurns. The player finishes their normal turn, then immediately takes another before opponents go. Same worker count as everyone else.',
    powerCardSlots: POWER_CARD_SLOTS,
  },
];

export default champions;
