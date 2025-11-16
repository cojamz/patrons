// Patrons Game Logger - Drop-in debugging without breaking the game
// Add <script src="game-logger.js"></script> to react-game.html to enable

(function() {
    'use strict';
    
    // Only enable if ?debug=true in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('debug')) return;
    
    console.log('%c🎮 Patrons Debug Mode Enabled', 'color: #4ade80; font-size: 16px; font-weight: bold');
    
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.innerHTML = `
        <style>
            #debug-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                max-width: 400px;
                max-height: 300px;
                overflow-y: auto;
                z-index: 9999;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            #debug-panel.collapsed {
                max-height: 40px;
                overflow: hidden;
            }
            #debug-toggle {
                cursor: pointer;
                background: #3b82f6;
                padding: 5px 10px;
                border-radius: 4px;
                margin-bottom: 10px;
                display: inline-block;
            }
            #debug-content {
                margin-top: 10px;
            }
            .debug-entry {
                margin-bottom: 5px;
                padding: 5px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }
            .debug-action {
                color: #60a5fa;
            }
            .debug-state {
                color: #34d399;
            }
            .debug-error {
                color: #f87171;
            }
        </style>
        <div id="debug-toggle">🐛 Debug Panel</div>
        <div id="debug-content"></div>
    `;
    
    // Wait for page load
    window.addEventListener('load', () => {
        document.body.appendChild(debugPanel);
        
        const toggle = document.getElementById('debug-toggle');
        const panel = document.getElementById('debug-panel');
        toggle.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
        });
        
        // Hook into game functions
        hookGameFunctions();
    });
    
    function hookGameFunctions() {
        // Log all dispatched actions
        const originalCreateElement = React.createElement;
        React.createElement = function(...args) {
            if (args[0] === 'button' && args[1]?.onClick) {
                const originalOnClick = args[1].onClick;
                args[1].onClick = function(...clickArgs) {
                    logDebug('Button Click', args[2] || 'Unknown Button', 'action');
                    return originalOnClick.apply(this, clickArgs);
                };
            }
            return originalCreateElement.apply(this, args);
        };
        
        // Hook into window functions if they exist
        if (window.executeAction) {
            const original = window.executeAction;
            window.executeAction = function(state, action, playerId) {
                logDebug('Action', `${action} by Player ${playerId}`, 'action');
                try {
                    return original.apply(this, arguments);
                } catch (error) {
                    logDebug('Error', `${action}: ${error.message}`, 'error');
                    throw error;
                }
            };
        }
        
        // Add global debug functions
        window.debug = {
            getState: () => {
                // Try to find React fiber to get state
                const root = document.getElementById('root');
                if (root && root._reactRootContainer) {
                    const fiber = root._reactRootContainer._internalRoot.current;
                    return findGameState(fiber);
                }
                return null;
            },
            
            logState: () => {
                const state = window.debug.getState();
                console.log('Current Game State:', state);
                logDebug('State Logged', 'Check console for full state', 'state');
            },
            
            testAction: (actionName, playerId = 0) => {
                console.log(`Testing action: ${actionName} for player ${playerId}`);
                if (window.executeAction && window.debug.getState()) {
                    window.executeAction(window.debug.getState(), actionName, playerId);
                }
            },
            
            showVPBreakdown: () => {
                const state = window.debug.getState();
                if (state?.players) {
                    Object.entries(state.players).forEach(([id, player]) => {
                        console.log(`Player ${id} VP Sources:`, player.vpSources);
                    });
                }
            }
        };
        
        // Log to debug panel
        function logDebug(type, message, category = 'info') {
            const content = document.getElementById('debug-content');
            if (!content) return;
            
            const entry = document.createElement('div');
            entry.className = `debug-entry debug-${category}`;
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${type}: ${message}`;
            
            content.insertBefore(entry, content.firstChild);
            
            // Keep only last 20 entries
            while (content.children.length > 20) {
                content.removeChild(content.lastChild);
            }
        }
        
        // Helper to find game state in React fiber tree
        function findGameState(fiber) {
            if (!fiber) return null;
            
            // Check if this fiber has game state
            if (fiber.memoizedState?.gameState) {
                return fiber.memoizedState.gameState;
            }
            
            // Check hooks
            let hook = fiber.memoizedState;
            while (hook) {
                if (hook.memoizedState?.players) {
                    return hook.memoizedState;
                }
                hook = hook.next;
            }
            
            // Traverse children
            if (fiber.child) {
                const childState = findGameState(fiber.child);
                if (childState) return childState;
            }
            
            // Traverse siblings
            if (fiber.sibling) {
                const siblingState = findGameState(fiber.sibling);
                if (siblingState) return siblingState;
            }
            
            return null;
        }
        
        console.log('%cDebug functions available:', 'color: #60a5fa');
        console.log('- debug.getState() - Get current game state');
        console.log('- debug.logState() - Log full state to console');
        console.log('- debug.testAction(actionName, playerId) - Test an action');
        console.log('- debug.showVPBreakdown() - Show VP sources for all players');
    }
})();