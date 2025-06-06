#!/bin/bash
echo "🍺 Installing Homebrew for easy command-line tools"
echo ""
echo "Run this command in your Terminal:"
echo ""
echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
echo ""
echo "After Homebrew installs, run:"
echo "brew install gh"
echo "gh auth login"
echo ""
echo "Then come back and I'll push your code to GitHub!"
echo ""
echo "Opening Terminal for you..."

# Open Terminal
open -a Terminal .