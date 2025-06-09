#!/usr/bin/env node

// Documentation generator for Patrons game
// Extracts action and shop information from react-game.html

const fs = require('fs');

console.log('📚 Generating Patrons Game Documentation...\n');

// Read the game file
const gameContent = fs.readFileSync('react-game.html', 'utf8');

// Extract game layers definition
const layersMatch = gameContent.match(/const allGameLayers = ({[\s\S]*?});/);
if (!layersMatch) {
    console.error('Could not find game layers definition!');
    process.exit(1);
}

// Parse the layers (unsafe but works for this use case)
const layersCode = layersMatch[1];
const layers = eval(`(${layersCode})`);

// Generate documentation
let doc = `# Patrons Game Reference
Generated: ${new Date().toISOString()}

## Game Layers (Quads)

`;

Object.entries(layers).forEach(([color, layer]) => {
    doc += `### ${color.charAt(0).toUpperCase() + color.slice(1)} Layer\n\n`;
    doc += `**Theme**: ${getThemeDescription(color)}\n\n`;
    
    // Document actions by round
    ['R1', 'R2', 'R3'].forEach((round, index) => {
        const actions = layer[round.toLowerCase()] || [];
        if (actions.length > 0) {
            doc += `#### Round ${index + 1} Actions\n\n`;
            actions.forEach(action => {
                const actionInfo = extractActionInfo(gameContent, action);
                doc += `- **${action}**: ${actionInfo}\n`;
            });
            doc += '\n';
        }
    });
    
    // Document shops
    doc += `#### Shops\n\n`;
    ['R1', 'R2', 'R3'].forEach((round) => {
        const shopInfo = extractShopInfo(gameContent, color, round);
        if (shopInfo) {
            doc += `- **${round}**: ${shopInfo}\n`;
        }
    });
    
    // Document victory shop
    const vpShopInfo = extractVPShopInfo(gameContent, color);
    if (vpShopInfo) {
        doc += `- **Victory**: ${vpShopInfo}\n`;
    }
    
    doc += '\n---\n\n';
});

// Add interaction matrix
doc += `## Action Interactions Matrix

| Action Type | Can Trigger | Notes |
|------------|-------------|-------|
| Red Repeat | Any action | Limited by recursion depth (5) |
| Blue Shop Benefit | Any R1 shop | Even if closed |
| Yellow Steal | Resource transfer | Target player selection |
| Purple Extra Workers | Multiple placements | In same turn |
| Shop Benefits | Various effects | Subject to shop phases |

## Shop Phase System

1. **Pre-Worker Phase**: Can buy 1 shop
2. **Worker Placement**: Shops closed for purchase
3. **Post-Worker Phase**: Can buy 1 shop
4. **Blue Exception**: Shop benefit actions bypass phases

## Debugging Commands

When running with \`?debug=true\`:
- \`debug.getState()\` - Current game state
- \`debug.logState()\` - Log full state
- \`debug.testAction(name, playerId)\` - Test action
- \`debug.showVPBreakdown()\` - VP sources

`;

// Save documentation
fs.writeFileSync('GAME_REFERENCE.md', doc);
console.log('✅ Documentation generated: GAME_REFERENCE.md');

// Helper functions
function getThemeDescription(color) {
    const themes = {
        red: 'Worker manipulation and action repetition',
        yellow: 'Resource generation and manipulation',
        blue: 'Shop control and cost modification',
        purple: 'Turn timing and extra workers',
        gold: 'Resource alchemy and conversion',
        white: 'VP manipulation and high-risk plays',
        black: 'Aggressive theft and disruption',
        silver: 'Mutual benefit and cooperation'
    };
    return themes[color] || 'Unknown theme';
}

function extractActionInfo(content, actionName) {
    // Look for action execution in executeAction function
    const actionPattern = new RegExp(`case ['"]${actionName}['"]:[\\s\\S]*?break;`);
    const match = content.match(actionPattern);
    
    if (match) {
        // Extract comments or basic logic
        const caseContent = match[0];
        if (caseContent.includes('gain') && caseContent.includes('3')) return 'Gain 3 resources';
        if (caseContent.includes('gain') && caseContent.includes('2')) return 'Gain 2 resources';
        if (caseContent.includes('steal')) return 'Steal resources from opponent';
        if (caseContent.includes('repeat')) return 'Repeat an action';
        if (caseContent.includes('swap')) return 'Swap workers or resources';
        if (caseContent.includes('skip')) return 'Skip turn(s)';
        if (caseContent.includes('workers')) return 'Place extra workers';
    }
    
    return 'See game code for details';
}

function extractShopInfo(content, color, round) {
    const shopPattern = new RegExp(`${color}:\\s*{[\\s\\S]*?${round}:\\s*{[\\s\\S]*?effect:\\s*['"]([^'"]+)['"]`);
    const match = content.match(shopPattern);
    return match ? match[1] : null;
}

function extractVPShopInfo(content, color) {
    const vpPattern = new RegExp(`victory[\\s\\S]*?${color}:\\s*{[\\s\\S]*?points:\\s*(\\d+)`);
    const match = content.match(vpPattern);
    return match ? `${match[1]} VP for resources` : null;
}