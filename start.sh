#!/bin/bash

echo "🚀 Starting Advanced Traffic Bot v4.0.0"
echo "========================================="

# Set environment
export NODE_ENV=production
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Clean cache
npm cache clean --force

# Install dependencies
echo "📦 Installing dependencies..."
npm install --omit=dev --no-optional --no-audit --no-fund

# Test Puppeteer
echo "🧪 Testing Puppeteer Full..."
node -e "
const puppeteer = require('puppeteer');
async function test() {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Puppeteer Full test PASSED');
    await browser.close();
  } catch (e) {
    console.log('❌ Puppeteer Full test FAILED:', e.message);
  }
}
test();
"

# Start application
echo "🎯 Starting application..."
node server.js