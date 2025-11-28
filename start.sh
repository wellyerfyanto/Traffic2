#!/bin/bash

# GitHub Traffic Bot - Auto-Switch Proxy System
# Start Script for Railway/Production

echo "🚀 Starting GitHub Traffic Bot v2.5.0"
echo "========================================="

# Set environment variables
export NODE_ENV=production
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Check if Chromium is available
if [ -f "$PUPPETEER_EXECUTABLE_PATH" ]; then
    echo "✅ Chromium found at: $PUPPETEER_EXECUTABLE_PATH"
else
    echo "❌ Chromium not found at: $PUPPETEER_EXECUTABLE_PATH"
    echo "🔧 Installing Chromium..."
    apt-get update && apt-get install -y chromium
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo "📦 Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm run install-deps
fi

# Create logs directory
mkdir -p logs

# Health check function
health_check() {
    echo "🔍 Performing health check..."
    for i in {1..10}; do
        if curl -f http://localhost:3000/health >/dev/null 2>&1; then
            echo "✅ Health check passed!"
            return 0
        fi
        echo "⏳ Waiting for server to start... ($i/10)"
        sleep 5
    done
    echo "❌ Health check failed!"
    return 1
}

# Start the application
echo "🎯 Starting application..."
node server.js &

# Wait for server to start
sleep 10

# Perform health check
if health_check; then
    echo "========================================="
    echo "🚀 GitHub Traffic Bot is running!"
    echo "🌐 Access: http://localhost:3000"
    echo "🔧 Health: http://localhost:3000/health"
    echo "📊 Monitor: http://localhost:3000/monitoring"
    echo "🔌 Mode: AUTO-SWITCH PROXY SYSTEM"
    echo "========================================="
    
    # Keep the script running
    wait
else
    echo "❌ Failed to start application"
    exit 1
fi