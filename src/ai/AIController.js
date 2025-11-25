/**
 * AIController.js
 *
 * Orchestrates AI player turns in the game.
 * This is the main entry point for AI decision-making.
 *
 * Architecture: Pure functions that analyze game state and return decisions.
 * Never modifies state directly - returns decisions to be executed by game logic.
 */

import { AIEngine } from './AIEngine.js';

/**
 * Main function called when it's an AI player's turn
 *
 * @param {Object} gameState - Current game state
 * @param {Object} player - The AI player whose turn it is
 * @returns {Promise<Object>} Decision object with action to take
 */
export async function takeTurn(gameState, player) {
    console.log(`[AI] Player ${player.id} "${player.name}" (${player.aiDifficulty || 'medium'}) is thinking...`);

    try {
        // Longer delay so humans can see AI is "thinking"
        await delay(1500);

        // Call AIEngine to make decision
        const decision = AIEngine.evaluateAllOptions(gameState, player);
        console.log(`[AI] Player ${player.id} "${player.name}" decided:`, decision);

        return decision;

    } catch (error) {
        console.error('[AI] Error during AI turn:', error);
        // Fail gracefully - try to end turn
        return { type: 'endTurn' };
    }
}

/**
 * Helper: Artificial delay to make AI feel more natural
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a player should be controlled by AI
 */
export function isAIPlayer(player) {
    return player?.isAI === true;
}

/**
 * Get AI difficulty for a player
 */
export function getAIDifficulty(player) {
    return player?.aiDifficulty || 'medium';
}
