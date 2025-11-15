// Game constants and static data

export const PLAYER_EMOJIS = [
    // Animals
    '🦊', '🐸', '🦁', '🐼', '🦄', '🐙', '🦜', '🦋',
    '🐢', '🦉', '🐵', '🦒', '🐯', '🐨', '🦝', '🦌',
    '🐲', '🦅', '🦓', '🦘', '🦩', '🦥', '🦦', '🦭',
    '🐺', '🐻', '🐹', '🦔', '🦇', '🐴', '🦆', '🦢',
    '🦚', '🦃', '🐧', '🦐', '🦑', '🦀', '🐡', '🐠',
    '🐟', '🐬', '🦈', '🐳', '🦏', '🦛', '🐘', '🦣',

    // Objects & Symbols
    '🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎺', '🎸',
    '🚀', '🛸', '⚡', '🌟', '💎', '🔮', '🎃', '🌈',
    '🎵', '🎶', '🎼', '🥁', '🎹', '🎻', '🎷', '🎤',
    '🏆', '🥇', '🎖️', '🏅', '🎗️', '🎀', '🎁', '🎊',
    '🔔', '🔕', '📯', '🎴', '🀄', '🃏', '🎰', '🎱',

    // Nature & Space
    '🌺', '🌸', '🌼', '🌻', '🌷', '🌹', '🥀', '🌵',
    '🌲', '🌳', '🌴', '🌱', '🍄', '🍁', '🍀', '🌾',
    '🌙', '🌛', '🌜', '🌚', '🌝', '🌞', '⭐', '🌠',
    '☄️', '🌌', '🌊', '🌋', '🏔️', '🗻', '🏖️', '🏝️',

    // Fantasy & Mystical
    '👹', '👺', '🤡', '👻', '👽', '👾', '🤖', '🧙',
    '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🦸', '🦹',
    '🐉', '🦖', '🦕', '🦴', '🔥', '💥', '✨', '💫',

    // Food & Objects
    '🍕', '🍔', '🌮', '🌯', '🥙', '🍗', '🍖', '🥩',
    '🍟', '🌭', '🥓', '🍳', '🥞', '🧇', '🥐', '🥖',
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
    '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍆'
];

export const COLOR_EMOJIS = {
    red: '🔴',
    yellow: '🟡',
    blue: '🔵',
    purple: '🟣',
    gold: '🟨',
    white: '⚪',
    black: '⚫',
    silver: '🩶'
};

export const RESOURCE_TYPES = ['red', 'yellow', 'blue', 'purple', 'gold', 'white', 'black', 'silver'];

export const QUAD_NAMES = {
    'red': 'Red Quad',
    'yellow': 'Yellow Quad',
    'blue': 'Blue Quad',
    'purple': 'Purple Quad',
    'gold': 'Gold Quad',
    'white': 'White Quad',
    'black': 'Black Quad',
    'silver': 'Silver Quad'
};

export const MAX_RECONNECT_ATTEMPTS = 5;
export const INITIAL_RECONNECT_DELAY = 1000; // 1 second

/**
 * Get random emojis for players
 * @param {number} playerCount - Number of players (default 4)
 * @returns {string[]} Array of random emojis
 */
export function getRandomPlayerEmojis(playerCount = 4) {
    const shuffled = [...PLAYER_EMOJIS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, playerCount);
}
