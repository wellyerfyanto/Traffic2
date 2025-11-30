#!/bin/bash

echo "🚀 Starting Advanced Traffic Bot v4.3.0 - Puppeteer 24+ Optimized"
echo "=================================================================="

# Set environment
export NODE_ENV=production
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Clean cache
npm cache clean --force

# Install dengan legacy peer deps untuk menghindari conflict
echo "📦 Installing dependencies dengan Puppeteer 24+..."
npm install --omit=dev --no-optional --no-audit --no-fund --legacy-peer-deps

# Test Chromium availability
echo "🔍 Testing Chromium availability..."
if [ -f "/usr/bin/chromium-browser" ]; then
    echo "✅ Chromium found: /usr/bin/chromium-browser"
else
    echo "❌ Chromium not found at /usr/bin/chromium-browser"
    # Fallback: cari Chromium di path lain
    CHROMIUM_PATH=$(which chromium-browser || which chromium)
    if [ -n "$CHROMIUM_PATH" ]; then
        echo "✅ Chromium found at: $CHROMIUM_PATH"
        export PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH
    else
        echo "⚠️  Chromium not found, Puppeteer mungkin akan error"
    fi
fi

# Test Puppeteer dengan versi terbaru
echo "🧪 Testing Puppeteer 24+ dengan system Chromium..."
node -e "
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function test() {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
    });
    console.log('✅ Puppeteer 24+ Extra + Stealth test PASSED');
    const version = await browser.version();
    console.log('🌐 Browser version:', version);
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.log('❌ Puppeteer test FAILED:', e.message);
    process.exit(1);
  }
}
test();
"

# Start application
echo "🎯 Starting application dengan Puppeteer 24+ optimized settings..."
node server.js