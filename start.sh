#!/bin/bash

echo "🚀 Starting Advanced Traffic Bot v4.2.1"
echo "========================================"

# Gunakan railway-start.sh jika di Railway
if [ "$RAILWAY_ENVIRONMENT" = "production" ] || [ -n "$RAILWAY_GIT_COMMIT_SHA" ]; then
    echo "🏗️  Detected Railway environment, using railway-start.sh"
    chmod +x railway-start.sh
    ./railway-start.sh
else
    # Local development
    export NODE_ENV=development
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
    
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🎯 Starting application in development mode..."
    node server.js
fi