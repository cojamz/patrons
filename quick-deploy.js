#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Deploy Script');
console.log('📁 Files ready for deployment:');
console.log('   - react-game.html');
console.log('   - index.html');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Go to: https://app.netlify.com/drop');
console.log('2. Drag these files from Finder:');
console.log('   - react-game.html');
console.log('   - index.html');
console.log('3. Get your new URL and test!');
console.log('');
console.log('💡 Pro tip: Your files are in:', __dirname);

// Open the deploy page
const { exec } = require('child_process');
exec('open https://app.netlify.com/drop');
exec('open .');  // Open current folder in Finder