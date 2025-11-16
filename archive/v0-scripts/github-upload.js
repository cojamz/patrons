#!/usr/bin/env node

console.log('🚀 GitHub Upload Guide for Patrons');
console.log('');
console.log('Quick steps to get your game online:');
console.log('');
console.log('1. Go to: https://github.com/cojamz/patrons');
console.log('2. Click "uploading an existing file"');
console.log('3. Drag these files:');
console.log('   - react-game.html');
console.log('   - index.html');
console.log('4. Commit message: "Deploy fixed multiplayer version"');
console.log('5. Click "Commit changes"');
console.log('');
console.log('6. Enable GitHub Pages:');
console.log('   - Go to Settings → Pages');
console.log('   - Source: Deploy from a branch');
console.log('   - Branch: main');
console.log('   - Folder: / (root)');
console.log('   - Save');
console.log('');
console.log('Your game will be live at: https://cojamz.github.io/patrons');
console.log('');

// Open the repo page
const { exec } = require('child_process');
exec('open https://github.com/cojamz/patrons');
exec('open .'); // Open current folder