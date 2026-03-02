/**
 * Patrons v3 — Game Constants
 *
 * Pure data. No logic. Used by the engine, event system, and UI.
 */

// --- Core Game Structure ---

export const ROUNDS = 3;

export const ACTIONS_PER_ROUND = [3, 5, 6]; // indexed by round (0-based internally)

export const POWER_CARD_SLOTS = 4; // default per champion (The Ambitious gets +1)

export const CARDS_IN_DECK = 6; // power cards per god's deck

export const CARDS_DEALT_PER_GOD = 3; // face-up in the market each game

export const ACTIONS_PER_GOD = 7; // action spaces per god layer

export const SHOPS_PER_GOD = 3; // weak, strong, VP

// --- God Colors ---

export const GOD_COLORS = ['gold', 'black', 'green', 'yellow'];

// --- Resource Types ---
// Resources match the active gods in the game.
// In a 4-god game with gold/black/green/yellow, those are the 4 resource types.

export const RESOURCE_TYPES = ['gold', 'black', 'green', 'yellow'];

// --- Shop Types ---

export const SHOP_TYPES = {
  WEAK: 'weak',
  STRONG: 'strong',
  VP: 'vp',
};

// --- Action Tiers ---
// Actions are grouped by which round they unlock in.

export const ACTION_TIERS = {
  TIER_1: 1, // available from round 1 (4 actions per god)
  TIER_2: 2, // unlocks round 2 (2 actions per god)
  TIER_3: 3, // unlocks round 3 (1 action per god)
};

// --- Event Types ---
// String enums for the event-driven architecture.
// Handlers register for these events; the engine emits them.

export const EVENT_TYPES = {
  // --- Game lifecycle ---
  GAME_START: 'gameStart',
  ROUND_START: 'roundStart',
  ROUND_END: 'roundEnd',
  GAME_END: 'gameEnd',

  // --- Turn lifecycle ---
  TURN_START: 'turnStart',
  TURN_END: 'turnEnd',

  // --- Action events ---
  BEFORE_ACTION: 'beforeAction',
  ON_ACTION: 'onAction',
  AFTER_ACTION: 'afterAction',
  ACTION_REPEAT: 'actionRepeat',
  ACTION_COPY: 'actionCopy',

  // --- Resource events ---
  ON_GAIN_RESOURCE: 'onGainResource',
  ON_GAIN_GOLD: 'onGainGold',
  ON_LOSE_RESOURCE: 'onLoseResource',
  ON_RESOURCE_TRADE: 'onResourceTrade',
  ON_RESOURCE_REDISTRIBUTE: 'onResourceRedistribute',

  // --- Glory events ---
  ON_GAIN_GLORY: 'onGainGlory',
  ON_LOSE_GLORY: 'onLoseGlory',
  ON_GLORY_CONDITION: 'onGloryCondition',

  // --- Shop events ---
  BEFORE_SHOP_USE: 'beforeShopUse',
  ON_SHOP_USE: 'onShopUse',
  AFTER_SHOP_USE: 'afterShopUse',

  // --- Steal / interaction events ---
  ON_STEAL_RESOURCE: 'onStealResource',
  ON_STEAL_GLORY: 'onStealGlory',
  ON_PENALIZE_PLAYER: 'onPenalizePlayer',

  // --- Power card events ---
  ON_POWER_CARD_PURCHASE: 'onPowerCardPurchase',
  ON_POWER_CARD_SLOT: 'onPowerCardSlot',

  // --- Extra turn / timing ---
  ON_EXTRA_TURN: 'onExtraTurn',
  ON_SKIP_ACTION: 'onSkipAction',

  // --- Nullifier (The Prescient) ---
  ON_NULLIFIER_PLACED: 'onNullifierPlaced',
  ON_NULLIFIER_TRIGGERED: 'onNullifierTriggered',
};

// --- Mechanical Effect Types ---
// Categorize what an action/shop/card mechanically does, so the engine
// knows which systems to invoke. An action can have multiple effect types.

export const EFFECT_TYPES = {
  // Resource manipulation
  GAIN_RESOURCE: 'gainResource',
  TRADE_RESOURCE: 'tradeResource',
  DOUBLE_RESOURCE_GAIN: 'doubleResourceGain',
  REDISTRIBUTE_RESOURCE: 'redistributeResource',

  // Glory manipulation
  GAIN_GLORY: 'gainGlory',
  LOSE_GLORY: 'loseGlory',
  TRIGGER_GLORY_CONDITION: 'triggerGloryCondition',

  // Stealing / aggression
  STEAL_RESOURCE: 'stealResource',
  STEAL_GLORY: 'stealGlory',
  PENALIZE_ALL: 'penalizeAll',

  // Action manipulation
  REPEAT_ACTION: 'repeatAction',
  COPY_ACTION: 'copyAction',
  SKIP_NEXT_ACTION: 'skipNextAction',
  EXTRA_TURN: 'extraTurn',

  // Shop interaction
  SHOP_COST_MODIFIER: 'shopCostModifier',
  TRIGGER_SHOP: 'triggerShop',

  // Power card interaction
  POWER_CARD_PASSIVE: 'powerCardPassive',
  POWER_CARD_ON_PURCHASE: 'powerCardOnPurchase',
  POWER_CARD_ROUND_START: 'powerCardRoundStart',

  // Protection
  PROTECT_RESOURCES: 'protectResources',
  PROTECT_GLORY: 'protectGlory',

  // Wildcard / flexibility
  WILDCARD_RESOURCE: 'wildcardResource',
  IGNORE_BLOCKING: 'ignoreBlocking',
  REPEAT_FROM_UNOCCUPIED: 'repeatFromUnoccupied',
  DOUBLE_GLORY_TRIGGER: 'doubleGloryTrigger',
};

// --- Glory Condition Trigger Types ---
// When the engine should check each god's Glory condition.

export const GLORY_TRIGGERS = {
  ROUND_END: 'roundEnd',           // check at end of each round (Gold, Yellow)
  ON_STEAL_OR_PENALIZE: 'onStealOrPenalize', // check on each steal/penalize (Black)
  ON_REPEAT_OR_COPY: 'onRepeatOrCopy',       // check on each repeat/copy (Green)
};
