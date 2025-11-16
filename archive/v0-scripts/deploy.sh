#!/bin/bash
echo "🚀 Deploying Worker Placement Game..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "📦 Deploying to Netlify..."
netlify deploy --prod --dir . --open

echo "✅ Deployment complete! Your game is now live."